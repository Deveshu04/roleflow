import { randomUUID } from "crypto";
import { UserFacingError } from "../ai";
import { jobWithDetails } from "../jobs/details";
import { searchJobs } from "../jobs/search";
import { tailorForJob } from "../resume/service";
import { getProfile, getResumeVersion, listRuns } from "../store";
import type { Job, JobSource } from "../types";
import { agentContext, linkedInSignedIn } from "./browser";
import { hasActiveRun, replyToRun, startApplication, waitForRunEnd } from "./runner";

export type AutopilotInput = {
  query: string;
  location: string;
  limit: number;
  minFit: number;
  sources: { linkedin: boolean; web: boolean };
  easyApplyOnly: boolean;
  tailor: boolean;
  autoSubmit: boolean;
};

export type AutopilotItem = {
  jobId: string;
  title: string;
  company: string;
  location: string;
  source: JobSource;
  url: string;
  fit?: number;
  state: "queued" | "preparing" | "tailoring" | "applying" | "submitted" | "skipped" | "failed" | "stopped";
  runId?: string;
  note?: string;
};

export type AutopilotState = {
  id: string;
  status: "searching" | "running" | "done" | "stopped" | "failed";
  input: AutopilotInput;
  items: AutopilotItem[];
  currentRunId?: string;
  log: { at: string; label: string }[];
  error?: string;
  createdAt: string;
  updatedAt: string;
};

type Holder = { state?: AutopilotState; stopping?: boolean };
// On globalThis to survive dev-server reloads.
const holder = ((globalThis as { __roleflowAutopilot?: Holder }).__roleflowAutopilot ??= {});

export const autopilotState = () => holder.state ?? null;
const isActive = () => holder.state?.status === "searching" || holder.state?.status === "running";

function note(label: string) {
  const s = holder.state!;
  s.log.push({ at: new Date().toISOString(), label });
  s.updatedAt = new Date().toISOString();
}

function update(item: AutopilotItem, patch: Partial<AutopilotItem>) {
  Object.assign(item, patch);
  holder.state!.updatedAt = new Date().toISOString();
}

async function pickJobs(input: AutopilotInput, signedIn: boolean) {
  const easyApplyOnly = input.sources.linkedin && input.easyApplyOnly && signedIn;
  note(
    `Searching ${[input.sources.linkedin && (easyApplyOnly ? "LinkedIn (Easy Apply)" : "LinkedIn"), input.sources.web && "company career sites"]
      .filter(Boolean)
      .join(" and ")} for “${input.query}”${input.location ? ` in ${input.location}` : ""}`,
  );
  const { jobs, errors } = await searchJobs({
    query: input.query,
    location: input.location,
    sources: input.sources,
    linkedin: { postedWithin: "month", easyApplyOnly },
  });
  for (const e of errors) note(e);

  // Skip jobs that already have a finished or in-flight run.
  const runs = await listRuns();
  const done = new Set(runs.filter((r) => r.status !== "failed" && r.status !== "cancelled").map((r) => r.jobId));
  const fresh = jobs.filter((j) => !done.has(j.id));
  const ranked = fresh.filter((j) => (j.quickFit ?? 0) >= input.minFit).sort((a, b) => (b.quickFit ?? 0) - (a.quickFit ?? 0));
  note(`Found ${jobs.length} roles; ${ranked.length} new ones scored ${input.minFit}%+ fit. Applying to the top ${Math.min(input.limit, ranked.length)}.`);
  return ranked.slice(0, input.limit);
}

async function applyTo(item: AutopilotItem, input: AutopilotInput, originalId: string) {
  update(item, { state: "preparing" });
  const job: Job | undefined = await jobWithDetails(item.jobId);
  if (!job) throw new UserFacingError("Job could not be loaded");

  let versionId = originalId;
  if (input.tailor && job.description) {
    update(item, { state: "tailoring" });
    note(`Tailoring your resume for ${job.company}`);
    versionId = (await tailorForJob(job)).version.id;
  }
  const version = await getResumeVersion(versionId);
  if (!version) throw new UserFacingError("Resume version missing");

  if (holder.stopping) return;
  update(item, { state: "applying" });
  note(`Applying to ${job.title} at ${job.company}`);
  const run = await startApplication(job, version, input.autoSubmit);
  update(item, { runId: run.id });
  holder.state!.currentRunId = run.id;

  const ended = await waitForRunEnd(run.id);
  const status = ended?.status;
  if (status === "submitted") update(item, { state: "submitted", note: ended?.outcome });
  else if (status === "skipped") update(item, { state: "skipped", note: ended?.outcome });
  else if (status === "cancelled") update(item, { state: holder.stopping ? "stopped" : "skipped", note: "You stopped this application" });
  else update(item, { state: "failed", note: ended?.outcome || "The agent couldn't finish" });
  note(`${job.company}: ${item.state}${item.note ? ` — ${item.note}` : ""}`);
}

async function pipeline() {
  const s = holder.state!;
  const profile = await getProfile();
  try {
    // Open the browser first so the LinkedIn check is live.
    if (s.input.sources.linkedin) await agentContext().catch(() => undefined);
    const picked = await pickJobs(s.input, await linkedInSignedIn());
    s.items = picked.map((j) => ({
      jobId: j.id,
      title: j.title,
      company: j.company,
      location: j.location,
      source: j.source,
      url: j.url,
      fit: j.quickFit,
      state: "queued",
    }));
    if (!s.items.length) {
      s.status = "done";
      s.error = "No new roles met your minimum fit. Try a broader title, another location or a lower minimum fit.";
      return;
    }
    s.status = "running";
    for (const item of s.items) {
      if (holder.stopping) break;
      try {
        await applyTo(item, s.input, profile.originalResumeId!);
      } catch (err) {
        update(item, { state: "failed", note: err instanceof UserFacingError ? err.message : "Unexpected error" });
        note(`${item.company}: failed before the agent started`);
      }
    }
    for (const item of s.items) if (item.state === "queued") update(item, { state: "stopped" });
    s.status = holder.stopping ? "stopped" : "done";
    note(holder.stopping ? "Autopilot stopped" : `Autopilot finished: ${s.items.filter((i) => i.state === "submitted").length} submitted`);
  } catch (err) {
    s.status = "failed";
    s.error = err instanceof UserFacingError ? err.message : "Autopilot hit an unexpected error.";
    note(s.error);
  } finally {
    s.currentRunId = undefined;
    holder.stopping = false;
    s.updatedAt = new Date().toISOString();
  }
}

export async function startAutopilot(input: AutopilotInput) {
  if (isActive()) throw new UserFacingError("Autopilot is already running.");
  if (hasActiveRun()) throw new UserFacingError("Finish or stop the application that's in progress first.");
  const profile = await getProfile();
  if (!profile.resume || !profile.originalResumeId) throw new UserFacingError("Upload your resume first.");
  if (!input.query.trim()) throw new UserFacingError("Describe the role you want.");
  if (!input.sources.linkedin && !input.sources.web) throw new UserFacingError("Pick at least one source.");

  const now = new Date().toISOString();
  holder.stopping = false;
  holder.state = { id: randomUUID(), status: "searching", input, items: [], log: [], createdAt: now, updatedAt: now };
  void pipeline();
  return holder.state;
}

export function stopAutopilot() {
  if (!isActive()) return holder.state ?? null;
  holder.stopping = true;
  const runId = holder.state?.currentRunId;
  if (runId) {
    try {
      replyToRun(runId, { type: "cancel" });
    } catch {
      /* run already ended */
    }
  }
  note("Stopping after the current step…");
  return holder.state!;
}

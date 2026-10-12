import { randomUUID } from "crypto";
import type { Page } from "playwright";
import { openai, UserFacingError } from "../ai";
import { config } from "../config";
import { resumeToText } from "../resume/text";
import { getProfile, resumeFilePath, saveProfile, saveRun } from "../store";
import type { ApplicationRun, Job, PendingRequest, Profile, ResumeVersion, RunEvent, RunStatus } from "../types";
import { ActionError, clickElement, DECLINE, demographicBlock, elementLabel, fillField, invalidFields, isSubmitLike, uploadFile } from "./actions";
import { agentContext } from "./browser";
import { AGENT_INSTRUCTIONS, AGENT_TOOLS } from "./prompts";
import { isPublicHttpTarget } from "../url-safety";
import { formatSnapshot, takeSnapshot, type Snapshot } from "./snapshot";

type UserReply = { type: "answer"; answer: string } | { type: "continue" } | { type: "approve" } | { type: "cancel" };

type Ctl = {
  run: ApplicationRun;
  page: Page | null;
  screenshot: Buffer | null;
  approved: boolean;
  submitClicked: boolean;
  cancelled: boolean;
  abort: AbortController;
  reply?: (r: UserReply) => void;
  files: { resume: string; cover_letter?: string };
  context: string;
  history: string[];
  /** Fill attempts per field+value, to stop retry loops. */
  attempts?: Map<string, number>;
  declineDemographics?: boolean;
};

type Registry = { runs: Map<string, Ctl>; pages: Set<Page> };
const registry = ((globalThis as { __roleflowRuns?: Registry }).__roleflowRuns ??= { runs: new Map(), pages: new Set() });

const ACTIVE: RunStatus[] = ["running", "needs_input", "blocked", "awaiting_approval"];
class Cancelled extends Error {}

export const liveRun = (id: string) => registry.runs.get(id)?.run;
export const liveScreenshot = (id: string) => registry.runs.get(id)?.screenshot ?? null;
export const isLive = (id: string) => {
  const r = registry.runs.get(id)?.run;
  return Boolean(r && ACTIVE.includes(r.status));
};
const activeCtl = () => [...registry.runs.values()].find((c) => ACTIVE.includes(c.run.status));
export const hasActiveRun = () => Boolean(activeCtl());

export async function waitForRunEnd(id: string) {
  for (;;) {
    const run = registry.runs.get(id)?.run;
    if (!run || !ACTIVE.includes(run.status)) return run;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

function persist(ctl: Ctl) {
  ctl.run.updatedAt = new Date().toISOString();
  void saveRun(ctl.run).catch(() => {});
}

function log(ctl: Ctl, kind: RunEvent["kind"], label: string, detail?: string) {
  ctl.run.events.push({ at: new Date().toISOString(), kind, label, detail });
  persist(ctl);
}

function setStatus(ctl: Ctl, status: RunStatus, pending: PendingRequest | null = null) {
  ctl.run.status = status;
  ctl.run.pending = pending;
  persist(ctl);
}

function candidateContext(job: Job, profile: Profile, version: ResumeVersion) {
  const r = profile.resume!;
  const [first, ...rest] = r.name.trim().split(/\s+/);
  const p = profile.preferences;
  const pref = (label: string, v: string) => `${label}: ${v || "unknown (ask if required)"}`;
  const source =
    job.source === "linkedin" ? "LinkedIn" : job.source === "web" ? "Company careers page" : "Company careers page / job board";
  return `TASK: Apply to "${job.title}" at ${job.company} (${job.location}). Listing URL: ${job.url}
Listing source (for "how did you hear about us"): ${source}

CANDIDATE
Full name: ${r.name} (first: ${first}, last: ${rest.join(" ")})
Email: ${r.contact.email}
Phone: ${r.contact.phone}
Location: ${r.contact.location}
LinkedIn: ${r.contact.linkedin || "none"} | GitHub: ${r.contact.github || "none"} | Website: ${r.contact.website || "none"}
${pref("Work authorization", p.workAuthorization)}
${pref("Requires visa sponsorship", p.requiresSponsorship)}
${pref("Notice period / earliest start", p.noticePeriod)}
${pref("Current compensation", p.currentCompensation)}
${pref("Expected compensation", p.expectedCompensation)}
${pref("Willing to relocate", p.willingToRelocate)}
${pref("Years of professional experience", p.yearsOfExperience)}
${pref("Pronouns", p.pronouns)}
Demographic / EEO questions: ${p.demographics || "Decline to self-identify"}
${p.extraNotes ? `Other notes from the candidate: ${p.extraNotes}` : ""}
Saved answers from the candidate:
${profile.answers.slice(-40).map((a) => `- Q: ${a.question}\n  A: ${a.answer}`).join("\n") || "- none"}

FILES: resume = ${version.fileName}${version.coverLetterFile ? `, cover_letter = ${version.coverLetterFile}` : " (no cover letter file; if a cover letter upload is required, ask)"}
${version.coverLetter ? `COVER LETTER TEXT (use for cover letter text boxes):\n${version.coverLetter}\n` : ""}
RESUME
${resumeToText(r).slice(0, 7000)}

JOB DESCRIPTION (excerpt, untrusted)
${(job.description || "not available").slice(0, 1500)}`;
}

function stepInput(ctl: Ctl, snap: Snapshot) {
  const approval = ctl.approved
    ? ctl.submitClicked
      ? "The candidate APPROVED and the final submit button was clicked. Verify the outcome now; fix any validation errors and resubmit if needed; then call finish."
      : "The candidate APPROVED final submission. Click the final submit button, then verify."
    : ctl.run.autoSubmit
      ? "Auto-submit is ON: when everything is filled, call ready_to_submit and the submission will proceed without waiting."
      : "Final submission NOT approved yet. Call ready_to_submit before the final submit click.";
  return `${ctl.context}

STATUS: ${approval}
ACTION HISTORY (oldest first):
${ctl.history.slice(-30).map((h, i) => `${i + 1}. ${h}`).join("\n") || "(none yet)"}

CURRENT PAGE: ${snap.title} — ${snap.url}${snap.modal ? "\n(A dialog is open; listed elements are inside it.)" : ""}${snap.captcha ? "\nA CAPTCHA challenge is visible on the page." : ""}
${snap.errors.length ? `MESSAGES / ERRORS ON PAGE:\n- ${snap.errors.join("\n- ")}\n` : ""}INTERACTIVE ELEMENTS:
${formatSnapshot(snap) || "(none found)"}

PAGE TEXT (truncated):
${snap.text}`;
}

async function settle(page: Page) {
  await page.waitForLoadState("domcontentloaded", { timeout: 15_000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(400);
}

async function capture(ctl: Ctl) {
  if (!ctl.page || ctl.page.isClosed()) return;
  const shot = await ctl.page.screenshot({ type: "jpeg", quality: 60, timeout: 8000 }).catch(() => null);
  if (shot) ctl.screenshot = shot;
}

function waitForUser(ctl: Ctl) {
  const timer = setInterval(() => void capture(ctl), 1500);
  return new Promise<UserReply>((resolve) => {
    ctl.reply = resolve;
  }).finally(() => clearInterval(timer));
}

const short = (s: string, n = 70) => (s.length > n ? `${s.slice(0, n)}…` : s);

async function perform(ctl: Ctl, snap: Snapshot, name: string, args: Record<string, unknown>): Promise<"next" | "stop" | "end"> {
  const page = ctl.page!;
  switch (name) {
    case "fill_fields": {
      const fields = (args.fields as { id: string; value: string }[]) || [];
      const done: string[] = [];
      const failed: string[] = [];
      ctl.attempts ??= new Map();
      for (const f of fields) {
        if (ctl.cancelled) throw new Cancelled();
        const blocked = ctl.declineDemographics !== false ? demographicBlock(snap, f.id, f.value) : null;
        if (blocked) {
          ctl.history.push(`fill [${f.id}] ${blocked}`);
          continue;
        }
        const key = `${elementLabel(snap, f.id)}|${f.value}`;
        const tries = (ctl.attempts.get(key) ?? 0) + 1;
        ctl.attempts.set(key, tries);
        if (tries > 3) {
          ctl.history.push(
            `fill [${f.id}] SKIPPED: already tried this value 3 times and it does not stick. Stop retrying; ask the candidate to set this field in the browser with request_user_action(kind="other").`,
          );
          continue;
        }
        try {
          const msg = await fillField(snap, f.id, f.value);
          done.push(`${short(elementLabel(snap, f.id), 60)} → ${short(f.value, 60)}`);
          ctl.history.push(`fill [${f.id}] ok: ${msg}`);
        } catch (err) {
          const reason = err instanceof ActionError ? err.message : `failed (${short(String((err as Error).message), 140)})`;
          failed.push(`${short(elementLabel(snap, f.id), 60)}: ${reason}`);
          ctl.history.push(`fill [${f.id}] FAILED: ${reason}`);
        }
      }
      if (done.length) log(ctl, "action", `Filled ${done.length} field${done.length > 1 ? "s" : ""}`, done.join("\n"));
      if (failed.length) log(ctl, "warning", `${failed.length} field${failed.length > 1 ? "s need" : " needs"} another try`, failed.join("\n"));
      return "next";
    }
    case "click": {
      const id = String(args.id);
      const label = elementLabel(snap, id);
      if (isSubmitLike(label) && !ctl.approved) {
        ctl.history.push(`click [${id}] BLOCKED: "${label}" looks like the final submit. Call ready_to_submit first.`);
        return "stop";
      }
      if (isSubmitLike(label)) {
        const invalid = await invalidFields(snap, id);
        if (invalid.length) {
          ctl.history.push(`click [${id}] NOT DONE: the form still has empty or invalid required fields: ${invalid.join("; ")}. Fix them first.`);
          return "stop";
        }
      }
      const { message } = await clickElement(snap, id);
      if (isSubmitLike(label)) ctl.submitClicked = true;
      ctl.history.push(`click [${id}] ok: ${message}${args.purpose ? ` (${args.purpose})` : ""}`);
      log(ctl, "action", `Clicked "${short(label, 50)}"`, args.purpose ? String(args.purpose) : undefined);
      await page.waitForTimeout(1200);
      return "stop";
    }
    case "upload_file": {
      const which = args.file === "cover_letter" ? "cover_letter" : "resume";
      const file = ctl.files[which];
      if (!file) {
        ctl.history.push(`upload_file FAILED: no ${which} file is available`);
        return "next";
      }
      const msg = await uploadFile(page, snap, String(args.id), file);
      ctl.history.push(`upload_file [${args.id}] ok: ${msg}`);
      log(ctl, "action", which === "resume" ? "Uploaded resume" : "Uploaded cover letter", file.split(/[\\/]/).pop());
      await page.waitForTimeout(1500);
      return "next";
    }
    case "navigate": {
      const url = String(args.url);
      if (!(await isPublicHttpTarget(url))) {
        ctl.history.push(`navigate BLOCKED: only public http(s) pages may be opened (${url.slice(0, 80)})`);
        return "stop";
      }
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
      ctl.history.push(`navigate ok: ${url}`);
      log(ctl, "action", `Opened ${new URL(url).host}`);
      return "stop";
    }
    case "press_key": {
      await page.keyboard.press(String(args.key));
      ctl.history.push(`press_key ${args.key} ok`);
      return "stop";
    }
    case "wait": {
      await page.waitForTimeout(Math.min(Number(args.seconds) || 1, 10) * 1000);
      ctl.history.push(`waited ${args.seconds}s`);
      return "stop";
    }
    case "ask_user": {
      const question = String(args.question);
      const fields = ((args.field_ids as string[]) || []).map((id) => elementLabel(snap, id));
      setStatus(ctl, "needs_input", { type: "question", question, fields });
      log(ctl, "user", "Needs your input", question);
      const reply = await waitForUser(ctl);
      if (reply.type !== "answer") throw new Cancelled();
      const profile = await getProfile();
      profile.answers.push({ question, answer: reply.answer, savedAt: new Date().toISOString() });
      await saveProfile(profile);
      ctl.history.push(`ask_user → candidate answered: "${reply.answer}" (to: ${question})`);
      ctl.context += `\n- Q: ${question}\n  A: ${reply.answer}`;
      log(ctl, "info", "You answered", reply.answer);
      setStatus(ctl, "running");
      return "stop";
    }
    case "request_user_action": {
      const message = String(args.message);
      setStatus(ctl, "blocked", { type: "user_action", kind: String(args.kind), message });
      log(ctl, "user", `Waiting for you in the browser (${args.kind})`, message);
      await page.bringToFront().catch(() => {});
      const reply = await waitForUser(ctl);
      if (reply.type === "cancel") throw new Cancelled();
      ctl.history.push(`request_user_action(${args.kind}) → candidate says it is done; re-check the page`);
      log(ctl, "info", "You finished the step in the browser");
      setStatus(ctl, "running");
      return "stop";
    }
    case "ready_to_submit": {
      const submitId = String(args.submit_id);
      const summary = String(args.summary);
      const unresolved = (args.unresolved as string[]) || [];
      const invalid = await invalidFields(snap, submitId).catch(() => [] as string[]);
      if (invalid.length) {
        // The browser would reject the form, so don't ask for approval yet.
        ctl.history.push(`ready_to_submit REJECTED: these required fields are empty or invalid: ${invalid.join("; ")}. Fill them (or ask the candidate) first.`);
        log(ctl, "warning", "Form isn't complete yet", invalid.join("\n"));
        return "stop";
      }
      if (!ctl.approved) {
        if (ctl.run.autoSubmit) {
          log(ctl, "info", "Form complete — auto-submit is on", summary);
        } else {
          setStatus(ctl, "awaiting_approval", { type: "approval", summary, unresolved });
          log(ctl, "user", "Ready for your review", summary);
          await page.bringToFront().catch(() => {});
          const reply = await waitForUser(ctl);
          if (reply.type !== "approve") throw new Cancelled();
          log(ctl, "info", "You approved the submission");
          setStatus(ctl, "running");
        }
        ctl.approved = true;
      }
      try {
        await clickElement(snap, submitId);
      } catch {
        ctl.history.push(`ready_to_submit: approved, but submit button [${submitId}] was not found — click the final submit button now`);
        return "stop";
      }
      ctl.submitClicked = true;
      ctl.history.push(`ready_to_submit → approved; clicked final submit [${submitId}]. Verify the result.`);
      log(ctl, "action", "Clicked submit", elementLabel(snap, submitId));
      await page.waitForTimeout(3000);
      return "stop";
    }
    case "finish": {
      const outcome = String(args.outcome);
      const message = String(args.message);
      if (outcome === "submitted") {
        if (!ctl.submitClicked) {
          ctl.history.push("finish(submitted) REJECTED: the final submit button has not been clicked in this run.");
          return "stop";
        }
        ctl.run.outcome = message;
        log(ctl, "success", "Application submitted", message);
        setStatus(ctl, "submitted");
      } else if (outcome === "already_applied" || outcome === "closed") {
        ctl.run.outcome = message;
        log(ctl, "info", outcome === "closed" ? "Job is closed" : "Already applied", message);
        setStatus(ctl, "skipped");
      } else {
        ctl.run.outcome = message;
        log(ctl, "error", "Agent could not finish", message);
        setStatus(ctl, "failed");
      }
      return "end";
    }
    default:
      ctl.history.push(`unknown tool ${name}`);
      return "next";
  }
}

async function execute(ctl: Ctl, applyUrl: string) {
  const ctx = await agentContext();
  for (const old of registry.pages) if (!old.isClosed()) await old.close().catch(() => {});
  registry.pages.clear();

  const onPage = async (p: Page) => {
    const opener = await p.opener().catch(() => null);
    if (opener && opener === ctl.page) {
      ctl.page = p;
      registry.pages.add(p);
      await p.waitForLoadState("domcontentloaded").catch(() => {});
      log(ctl, "action", `Continued in a new tab`, p.url());
      ctl.history.push(`a new tab opened (${p.url()}); you are now on it`);
    }
  };
  ctx.on("page", onPage);
  try {
    const page = await ctx.newPage();
    ctl.page = page;
    registry.pages.add(page);
    await page.bringToFront().catch(() => {});
    if (!(await isPublicHttpTarget(applyUrl))) throw new UserFacingError("This job's apply link isn't a public web address.");
    log(ctl, "action", `Opening ${new URL(applyUrl).host}`, applyUrl);
    await page.goto(applyUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });

    let silent = 0;
    for (let step = 0; step < config.maxAgentSteps(); step++) {
      if (ctl.cancelled) throw new Cancelled();
      if (!ctl.page || ctl.page.isClosed()) {
        const open = [...registry.pages].filter((p) => !p.isClosed());
        if (!open.length) throw new UserFacingError("The application tab was closed.");
        ctl.page = open[open.length - 1];
      }
      await settle(ctl.page);
      const snap = await takeSnapshot(ctl.page);
      await capture(ctl);
      ctl.run.currentUrl = snap.url;
      ctl.run.steps = step + 1;

      const content: ({ type: "input_text"; text: string } | { type: "input_image"; image_url: string; detail: "low" })[] = [
        { type: "input_text", text: stepInput(ctl, snap) },
      ];
      if (ctl.screenshot)
        content.push({ type: "input_image", image_url: `data:image/jpeg;base64,${ctl.screenshot.toString("base64")}`, detail: "low" });

      const res = await openai().responses.create(
        {
          model: config.agentModel(),
          reasoning: { effort: "low" },
          store: false,
          instructions: AGENT_INSTRUCTIONS,
          tools: AGENT_TOOLS,
          parallel_tool_calls: true,
          input: [{ role: "user", content }],
        },
        { signal: ctl.abort.signal },
      );
      ctl.run.usage.inputTokens += res.usage?.input_tokens ?? 0;
      ctl.run.usage.outputTokens += res.usage?.output_tokens ?? 0;
      ctl.run.usage.modelCalls += 1;
      if (ctl.run.usage.inputTokens > config.maxRunTokens())
        throw new UserFacingError(
          `Stopped after ${ctl.run.usage.inputTokens.toLocaleString()} tokens to protect your credits. The tab is still open: finish manually, or fix the blocking field and run again.`,
        );

      const calls = res.output.filter((o) => o.type === "function_call");
      if (!calls.length) {
        if (++silent >= 3) throw new UserFacingError("The agent stopped making progress on this page.");
        ctl.history.push("(no tool call returned — you must act through tools)");
        continue;
      }
      silent = 0;
      for (const call of calls) {
        if (ctl.cancelled) throw new Cancelled();
        let args: Record<string, unknown>;
        try {
          args = JSON.parse(call.arguments);
        } catch {
          ctl.history.push(`${call.name}: arguments were not valid JSON`);
          continue;
        }
        let next: "next" | "stop" | "end";
        try {
          next = await perform(ctl, snap, call.name, args);
        } catch (err) {
          if (err instanceof Cancelled) throw err;
          const reason = err instanceof ActionError ? err.message : short(String((err as Error).message), 200);
          ctl.history.push(`${call.name}(${short(JSON.stringify(args), 120)}) FAILED: ${reason}`);
          log(ctl, "warning", `Retrying after a problem with ${call.name.replace("_", " ")}`, reason);
          next = "stop";
        }
        if (next === "end") return;
        if (next === "stop") break;
      }
      persist(ctl);
    }
    throw new UserFacingError("Reached the step limit before the application was finished.");
  } finally {
    ctx.off("page", onPage);
  }
}

export async function startApplication(job: Job, version: ResumeVersion, autoSubmit: boolean) {
  if (activeCtl()) throw new UserFacingError("Another application is in progress. Finish or stop it first.");
  const profile = await getProfile();
  if (!profile.resume) throw new UserFacingError("Upload your resume first.");
  const now = new Date().toISOString();
  const run: ApplicationRun = {
    id: randomUUID(),
    jobId: job.id,
    job: { title: job.title, company: job.company, location: job.location, url: job.url, source: job.source },
    resumeVersionId: version.id,
    autoSubmit,
    status: "running",
    pending: null,
    currentUrl: job.applyUrl,
    steps: 0,
    events: [],
    usage: { inputTokens: 0, outputTokens: 0, modelCalls: 0 },
    createdAt: now,
    updatedAt: now,
  };
  const ctl: Ctl = {
    run,
    page: null,
    screenshot: null,
    approved: false,
    submitClicked: false,
    cancelled: false,
    abort: new AbortController(),
    files: {
      resume: resumeFilePath(version.fileName),
      cover_letter: version.coverLetterFile ? resumeFilePath(version.coverLetterFile) : undefined,
    },
    context: candidateContext(job, profile, version),
    history: [],
    attempts: new Map(),
    declineDemographics: !profile.preferences.demographics.trim() || DECLINE.test(profile.preferences.demographics),
  };
  registry.runs.set(run.id, ctl);
  log(ctl, "info", `Starting application with ${version.label}`);

  void execute(ctl, job.applyUrl)
    .catch((err) => {
      if (err instanceof Cancelled || ctl.cancelled) {
        log(ctl, "info", "Stopped", ctl.submitClicked ? "The submit button had already been clicked." : "Nothing was submitted. The tab stays open if you want to finish manually.");
        setStatus(ctl, "cancelled");
        return;
      }
      const message = err instanceof UserFacingError ? err.message : "The browser agent hit an unexpected error.";
      ctl.run.outcome = message;
      log(ctl, "error", "Run failed", err instanceof UserFacingError ? undefined : short(String((err as Error)?.message), 300));
      setStatus(ctl, "failed");
    })
    .finally(() => void capture(ctl));
  return run;
}

export function replyToRun(id: string, reply: UserReply) {
  const ctl = registry.runs.get(id);
  if (!ctl || !ACTIVE.includes(ctl.run.status)) throw new UserFacingError("This application is no longer running.");
  if (reply.type === "cancel") {
    ctl.cancelled = true;
    ctl.abort.abort();
  }
  const resolve = ctl.reply;
  ctl.reply = undefined;
  resolve?.(reply);
}

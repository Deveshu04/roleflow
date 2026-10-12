import { badRequest, route } from "@/lib/api";
import { isLive, liveRun, startApplication } from "@/lib/agent/runner";
import { jobWithDetails } from "@/lib/jobs/details";
import { getProfile, getResumeVersion, listRuns } from "@/lib/store";

const ACTIVE = ["running", "needs_input", "blocked", "awaiting_approval"];

export const GET = route(async () => {
  const runs = (await listRuns()).map((r) => {
    const live = liveRun(r.id);
    if (live) return live;
    // Active runs don't survive a server restart.
    return ACTIVE.includes(r.status) && !isLive(r.id) ? { ...r, status: "failed" as const, pending: null, outcome: "Interrupted because the app restarted." } : r;
  });
  return Response.json({ applications: runs });
});

export const POST = route(async (req: Request) => {
  const { jobId, resumeVersionId, autoSubmit } = (await req.json()) as { jobId?: string; resumeVersionId?: string; autoSubmit?: boolean };
  const job = jobId ? await jobWithDetails(jobId) : undefined;
  if (!job) return badRequest("Job not found.", 404);
  const profile = await getProfile();
  const version = await getResumeVersion(resumeVersionId || profile.originalResumeId || "");
  if (!version) return badRequest("Upload your resume first.");
  const run = await startApplication(job, version, Boolean(autoSubmit));
  return Response.json({ run });
}, "Couldn't start the browser agent. Is Chrome installed?");

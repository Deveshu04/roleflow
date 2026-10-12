import { badRequest, route } from "@/lib/api";
import { jobWithDetails } from "@/lib/jobs/details";
import { tailorForJob } from "@/lib/resume/service";

export const POST = route(async (_req: Request, ctx: RouteContext<"/api/jobs/[id]/tailor">) => {
  const job = await jobWithDetails((await ctx.params).id);
  if (!job) return badRequest("Job not found.", 404);
  const { version, gaps } = await tailorForJob(job);
  return Response.json({ version, gaps });
}, "Resume tailoring failed. Please retry.");

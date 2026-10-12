import { badRequest, route } from "@/lib/api";
import { jobWithDetails } from "@/lib/jobs/details";
import { analyzeMatch } from "@/lib/jobs/match";
import { getProfile } from "@/lib/store";

export const POST = route(async (_req: Request, ctx: RouteContext<"/api/jobs/[id]/match">) => {
  const job = await jobWithDetails((await ctx.params).id);
  if (!job) return badRequest("Job not found.", 404);
  const profile = await getProfile();
  if (!profile.resume) return badRequest("Upload your resume first.");
  return Response.json({ match: await analyzeMatch(job, profile) });
}, "Match analysis failed. Please retry.");

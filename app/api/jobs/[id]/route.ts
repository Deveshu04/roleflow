import { badRequest, route } from "@/lib/api";
import { jobWithDetails } from "@/lib/jobs/details";

export const GET = route(async (_req: Request, ctx: RouteContext<"/api/jobs/[id]">) => {
  const job = await jobWithDetails((await ctx.params).id);
  return job ? Response.json({ job }) : badRequest("Job not found.", 404);
}, "We couldn't load that job's details.");

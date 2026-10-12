import { badRequest, route } from "@/lib/api";
import { liveRun } from "@/lib/agent/runner";
import { listRuns } from "@/lib/store";

export const GET = route(async (_req: Request, ctx: RouteContext<"/api/applications/[id]">) => {
  const id = (await ctx.params).id;
  const run = liveRun(id) ?? (await listRuns()).find((r) => r.id === id);
  return run ? Response.json({ run }) : badRequest("Application not found.", 404);
});

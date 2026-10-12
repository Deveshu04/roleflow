import { badRequest, route } from "@/lib/api";
import { liveRun, replyToRun } from "@/lib/agent/runner";

export const POST = route(async (req: Request, ctx: RouteContext<"/api/applications/[id]/reply">) => {
  const id = (await ctx.params).id;
  const body = (await req.json()) as { type?: string; answer?: string };
  if (body.type === "answer") {
    if (!body.answer?.trim()) return badRequest("Type an answer first.");
    replyToRun(id, { type: "answer", answer: body.answer.trim() });
  } else if (body.type === "continue" || body.type === "approve" || body.type === "cancel") {
    replyToRun(id, { type: body.type });
  } else return badRequest("Unknown action.");
  return Response.json({ run: liveRun(id) });
});

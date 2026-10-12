import { liveScreenshot } from "@/lib/agent/runner";

export async function GET(_req: Request, ctx: RouteContext<"/api/applications/[id]/screen">) {
  const shot = liveScreenshot((await ctx.params).id);
  if (!shot) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(shot), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "no-store" } });
}

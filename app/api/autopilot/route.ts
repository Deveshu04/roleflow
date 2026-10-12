import { badRequest, route } from "@/lib/api";
import { autopilotState, startAutopilot, stopAutopilot, type AutopilotInput } from "@/lib/agent/autopilot";

export const GET = route(async () => Response.json({ autopilot: autopilotState() }));

export const POST = route(async (req: Request) => {
  const body = (await req.json()) as { action?: string } & Partial<AutopilotInput>;
  if (body.action === "stop") return Response.json({ autopilot: stopAutopilot() });
  if (body.action !== "start") return badRequest("Unknown action.");
  const autopilot = await startAutopilot({
    query: body.query?.trim() || "",
    location: body.location?.trim() || "",
    limit: Math.min(Math.max(Number(body.limit) || 3, 1), 10),
    minFit: Math.min(Math.max(Number(body.minFit ?? 65) || 0, 0), 95),
    sources: body.sources ?? { linkedin: true, web: true },
    easyApplyOnly: body.easyApplyOnly ?? true,
    tailor: body.tailor ?? true,
    autoSubmit: Boolean(body.autoSubmit),
  });
  return Response.json({ autopilot });
}, "Couldn't start autopilot.");

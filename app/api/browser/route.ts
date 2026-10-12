import { badRequest, route } from "@/lib/api";
import { agentContext, closeAgentBrowser, isAgentBrowserOpen, linkedInSignedIn } from "@/lib/agent/browser";

export const GET = route(async () =>
  Response.json({ open: isAgentBrowserOpen(), linkedin: await linkedInSignedIn() }),
);

export const POST = route(async (req: Request) => {
  const { action } = (await req.json()) as { action?: string };
  if (action === "linkedin-login") {
    const ctx = await agentContext();
    const page = await ctx.newPage();
    await page.goto("https://www.linkedin.com/login", { waitUntil: "domcontentloaded" });
    await page.bringToFront();
    return Response.json({ open: true, linkedin: await linkedInSignedIn() });
  }
  if (action === "close") {
    await closeAgentBrowser();
    return Response.json({ open: false, linkedin: false });
  }
  return badRequest("Unknown action.");
}, "Couldn't open the browser. Is Chrome installed?");

import { badRequest, route } from "@/lib/api";
import { importJobFromUrl } from "@/lib/jobs/ats";
import { saveJobs } from "@/lib/store";

export const POST = route(async (req: Request) => {
  const { url } = (await req.json()) as { url?: string };
  if (!url?.trim()) return badRequest("Paste a job link.");
  const [job] = await saveJobs([await importJobFromUrl(url)]);
  return Response.json({ job });
}, "We couldn't load that job link.");

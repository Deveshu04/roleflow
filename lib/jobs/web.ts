import { webSearch } from "../ai";
import type { Job } from "../types";
import { fetchAtsJob } from "./ats";

const ATS_URL = /https?:\/\/(?:job-boards(?:\.eu)?\.greenhouse\.io|boards\.greenhouse\.io|jobs(?:\.eu)?\.lever\.co|jobs\.ashbyhq\.com)\/[^\s"'<>)\]]+/g;

// Web search finds ATS postings; each is verified via the ATS API so closed roles drop out.
export async function searchWeb(query: string, location: string, limit = 12) {
  const text = await webSearch(
    `You find currently open job postings on applicant tracking systems.
Only return direct posting URLs on job-boards.greenhouse.io, boards.greenhouse.io, jobs.lever.co or jobs.ashbyhq.com.
Prefer postings published recently. Output one URL per line and nothing else.`,
    `Role: ${query}\nLocation preference: ${location || "any"}\nFind up to ${limit + 4} distinct postings.`,
  );
  const urls = [...new Set((text.match(ATS_URL) || []).map((u) => u.replace(/[.,;]+$/, "").replace(/\/application$|\/apply$/, "")))];
  const settled = await Promise.allSettled(urls.slice(0, limit + 4).map((u) => fetchAtsJob(u)));
  const jobs = settled
    .filter((r): r is PromiseFulfilledResult<Job | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((j): j is Job => Boolean(j?.title));
  return jobs.slice(0, limit);
}

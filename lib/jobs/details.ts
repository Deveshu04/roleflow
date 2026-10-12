import { getJob, saveJobs } from "../store";
import type { Job } from "../types";
import { fetchAtsJob, importJobFromUrl } from "./ats";
import { linkedInDetails } from "./linkedin";

export async function jobWithDetails(id: string): Promise<Job | undefined> {
  const job = await getJob(id);
  if (!job || job.description) return job;
  let full: Job | null = null;
  if (job.source === "linkedin") full = await linkedInDetails(job);
  else if (job.source === "web") full = await importJobFromUrl(job.url);
  else full = await fetchAtsJob(job.url);
  if (!full) return job;
  const [saved] = await saveJobs([{ ...job, ...full, id: job.id, quickFit: job.quickFit, quickFitReason: job.quickFitReason }]);
  return saved;
}

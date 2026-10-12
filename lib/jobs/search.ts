import { getProfile, saveJobs } from "../store";
import type { Job } from "../types";
import { searchLinkedIn, type LinkedInFilters } from "./linkedin";
import { quickFit } from "./match";
import { searchWeb } from "./web";

export type SearchInput = {
  query: string;
  location: string;
  sources: { linkedin: boolean; web: boolean };
  linkedin?: LinkedInFilters;
};

export async function searchJobs(input: SearchInput) {
  const errors: string[] = [];
  const tasks: Promise<Job[]>[] = [];
  if (input.sources.linkedin)
    tasks.push(
      searchLinkedIn(input.query, input.location, input.linkedin).catch((e) => {
        errors.push(`LinkedIn: ${e instanceof Error && e.message.startsWith("429") ? "rate limited, try again in a minute" : "search failed"}`);
        return [];
      }),
    );
  if (input.sources.web)
    tasks.push(
      searchWeb(input.query, input.location).catch(() => {
        errors.push("Web search failed");
        return [];
      }),
    );
  const found = (await Promise.all(tasks)).flat();
  const unique = found.filter((j, i) => found.findIndex((k) => k.id === j.id) === i);
  const ranked = await quickFit(unique, await getProfile());
  const saved = await saveJobs(ranked);
  return { jobs: saved, errors };
}

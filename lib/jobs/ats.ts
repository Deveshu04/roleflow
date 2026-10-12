import { createHash } from "crypto";
import { parse } from "node-html-parser";
import { z } from "zod";
import { GROUNDING_RULES, structured, UserFacingError } from "../ai";
import { isPublicHttpUrl } from "../url-safety";
import type { Job } from "../types";
import { fetchJson, fetchText, htmlToText } from "./http";

const now = () => new Date().toISOString();

type GreenhouseJob = {
  id: number;
  title: string;
  company_name?: string;
  location?: { name: string };
  absolute_url: string;
  content?: string;
  first_published?: string;
  updated_at?: string;
};
type LeverJob = {
  id: string;
  text: string;
  categories?: { location?: string; commitment?: string; team?: string };
  hostedUrl: string;
  applyUrl: string;
  descriptionPlain?: string;
  lists?: { text: string; content: string }[];
  additionalPlain?: string;
  createdAt?: number;
};
type AshbyJob = {
  id: string;
  title: string;
  location?: string;
  employmentType?: string;
  jobUrl: string;
  applyUrl: string;
  descriptionPlain?: string;
  publishedAt?: string;
  isRemote?: boolean;
};

const titleCase = (slug: string) => slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

async function greenhouse(board: string, id: string): Promise<Job> {
  const j = await fetchJson<GreenhouseJob>(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs/${id}`);
  // The hosted board page always includes the application form.
  const hosted = `https://job-boards.greenhouse.io/${board}/jobs/${id}`;
  return {
    id: `gh-${board}-${id}`,
    source: "greenhouse",
    title: j.title,
    company: j.company_name || titleCase(board),
    location: j.location?.name || "",
    url: hosted,
    applyUrl: hosted,
    postedAt: j.first_published || j.updated_at,
    description: j.content ? htmlToText(j.content) : "",
    fetchedAt: now(),
  };
}

async function lever(company: string, id: string, eu: boolean): Promise<Job> {
  const host = eu ? "api.eu.lever.co" : "api.lever.co";
  const j = await fetchJson<LeverJob>(`https://${host}/v0/postings/${company}/${id}`);
  const lists = (j.lists || []).map((l) => `${l.text}\n${htmlToText(l.content)}`).join("\n\n");
  return {
    id: `lv-${company}-${id}`,
    source: "lever",
    title: j.text,
    company: titleCase(company),
    location: j.categories?.location || "",
    url: j.hostedUrl,
    applyUrl: j.applyUrl,
    employmentType: j.categories?.commitment,
    postedAt: j.createdAt ? new Date(j.createdAt).toISOString() : undefined,
    description: [j.descriptionPlain, lists, j.additionalPlain].filter(Boolean).join("\n\n"),
    fetchedAt: now(),
  };
}

async function ashby(org: string, id: string): Promise<Job> {
  const board = await fetchJson<{ jobs: AshbyJob[] }>(`https://api.ashbyhq.com/posting-api/job-board/${org}`);
  const j = board.jobs.find((x) => x.id === id);
  if (!j) throw new UserFacingError("That Ashby posting is no longer open.");
  return {
    id: `ab-${org}-${id}`,
    source: "ashby",
    title: j.title,
    company: titleCase(org),
    location: [j.location, j.isRemote ? "Remote" : ""].filter(Boolean).join(" · "),
    url: j.jobUrl,
    applyUrl: j.applyUrl,
    employmentType: j.employmentType,
    postedAt: j.publishedAt,
    description: j.descriptionPlain || "",
    fetchedAt: now(),
  };
}

export async function fetchAtsJob(rawUrl: string): Promise<Job | null> {
  const url = new URL(rawUrl);
  const parts = url.pathname.split("/").filter(Boolean);
  if (/(^|\.)greenhouse\.io$/.test(url.hostname)) {
    const embedded = url.searchParams.get("for") && url.searchParams.get("token");
    if (embedded) return greenhouse(url.searchParams.get("for")!, url.searchParams.get("token")!);
    const at = parts.indexOf("jobs");
    if (at > 0 && parts[at + 1]) return greenhouse(parts[at - 1], parts[at + 1].replace(/\D.*$/, ""));
  }
  if (/(^|\.)lever\.co$/.test(url.hostname) && parts.length >= 2)
    return lever(parts[0], parts[1], url.hostname.includes(".eu."));
  if (url.hostname === "jobs.ashbyhq.com" && parts.length >= 2) return ashby(parts[0], parts[1]);
  return null;
}

const extracted = z.object({
  is_job_posting: z.boolean(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  description: z.string().describe("The full job description text: responsibilities, requirements, benefits"),
});

// ATS API first, then schema.org JobPosting data, then LLM extraction.
export async function importJobFromUrl(rawUrl: string): Promise<Job> {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new UserFacingError("That doesn't look like a valid link.");
  }
  if (!isPublicHttpUrl(url.toString())) throw new UserFacingError("Only public http(s) job links can be loaded.");
  const li = url.hostname.endsWith("linkedin.com") && (url.pathname.match(/jobs\/view\/(?:[^/]*-)?(\d+)/) || [null, url.searchParams.get("currentJobId")]);
  if (li && li[1]) {
    const { linkedInDetails } = await import("./linkedin");
    return linkedInDetails({
      id: `li-${li[1]}`,
      source: "linkedin",
      title: "",
      company: "",
      location: "",
      url: `https://www.linkedin.com/jobs/view/${li[1]}/`,
      applyUrl: `https://www.linkedin.com/jobs/view/${li[1]}/`,
      fetchedAt: now(),
    });
  }

  const ats = await fetchAtsJob(url.toString());
  if (ats) return ats;

  const id = `web-${createHash("sha1").update(url.toString()).digest("hex").slice(0, 12)}`;
  const base: Job = { id, source: "web", title: "", company: url.hostname.replace(/^www\./, ""), location: "", url: url.toString(), applyUrl: url.toString(), fetchedAt: now() };
  let html = "";
  try {
    html = await fetchText(url.toString());
  } catch {
    // Some sites block server-side fetches; the agent can still open them.
    return { ...base, title: "Job posting", description: "" };
  }
  const root = parse(html);
  for (const script of root.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const data = JSON.parse(script.textContent);
      const posting = [data, ...(data["@graph"] || [])].flat().find((d) => d?.["@type"] === "JobPosting");
      if (posting) {
        const loc = [posting.jobLocation].flat()[0]?.address;
        return {
          ...base,
          title: posting.title || "",
          company: posting.hiringOrganization?.name || base.company,
          location: [loc?.addressLocality, loc?.addressRegion, loc?.addressCountry?.name ?? loc?.addressCountry].filter(Boolean).join(", ") || (posting.jobLocationType === "TELECOMMUTE" ? "Remote" : ""),
          description: htmlToText(posting.description || ""),
          postedAt: posting.datePosted,
          employmentType: [posting.employmentType].flat().join(", ") || undefined,
        };
      }
    } catch {
      /* ignore malformed JSON-LD */
    }
  }
  const text = htmlToText(root.querySelector("main")?.innerHTML || root.querySelector("body")?.innerHTML || html).slice(0, 20000);
  const out = await structured({
    schema: extracted,
    name: "job_posting",
    instructions: `Extract the job posting from this web page text. ${GROUNDING_RULES}`,
    input: `URL: ${url}\nPAGE TITLE: ${root.querySelector("title")?.textContent ?? ""}\n\n${text}`,
  });
  if (!out.is_job_posting) throw new UserFacingError("That page doesn't look like a job posting.");
  return { ...base, title: out.title, company: out.company || base.company, location: out.location, description: out.description };
}

import { parse } from "node-html-parser";
import type { Job } from "../types";
import { fetchText, FetchError, htmlToText } from "./http";

const BASE = "https://www.linkedin.com/jobs-guest/jobs/api";

export type LinkedInFilters = {
  postedWithin?: "day" | "week" | "month" | "any";
  remote?: boolean;
  easyApplyOnly?: boolean;
};

const TPR = { day: "r86400", week: "r604800", month: "r2592000", any: "" };

// LinkedIn's public, signed-out job search.
export async function searchLinkedIn(keywords: string, location: string, filters: LinkedInFilters = {}, pages = 2) {
  const jobs: Job[] = [];
  for (let page = 0; page < pages; page++) {
    const params = new URLSearchParams({ keywords, location, start: String(page * 10) });
    const tpr = TPR[filters.postedWithin ?? "month"];
    if (tpr) params.set("f_TPR", tpr);
    if (filters.remote) params.set("f_WT", "2");
    if (filters.easyApplyOnly) params.set("f_AL", "true");
    let html: string;
    try {
      html = await fetchText(`${BASE}/seeMoreJobPostings/search?${params}`);
    } catch (err) {
      if (err instanceof FetchError && err.status === 429 && jobs.length) break;
      throw err;
    }
    const root = parse(html);
    const cards = root.querySelectorAll("[data-entity-urn]");
    if (!cards.length) break;
    for (const card of cards) {
      const id = card.getAttribute("data-entity-urn")?.split(":").pop();
      if (!id || jobs.some((j) => j.id === `li-${id}`)) continue;
      const text = (sel: string) => card.querySelector(sel)?.textContent.replace(/\s+/g, " ").trim() ?? "";
      jobs.push({
        id: `li-${id}`,
        source: "linkedin",
        title: text(".base-search-card__title"),
        company: text(".base-search-card__subtitle"),
        location: text(".job-search-card__location"),
        url: `https://www.linkedin.com/jobs/view/${id}/`,
        applyUrl: `https://www.linkedin.com/jobs/view/${id}/`,
        postedAt: card.querySelector("time")?.getAttribute("datetime"),
        fetchedAt: new Date().toISOString(),
      });
    }
    if (cards.length < 10) break;
  }
  return jobs;
}

export async function linkedInDetails(job: Job): Promise<Job> {
  const id = job.id.replace(/^li-/, "");
  const root = parse(await fetchText(`${BASE}/jobPosting/${id}`));
  const markup = root.querySelector(".show-more-less-html__markup, .description__text");
  const criteria: Record<string, string> = {};
  for (const item of root.querySelectorAll(".description__job-criteria-item")) {
    const k = item.querySelector(".description__job-criteria-subheader")?.textContent.trim();
    const v = item.querySelector(".description__job-criteria-text")?.textContent.trim();
    if (k && v) criteria[k.toLowerCase()] = v;
  }
  const offsite = root.toString().includes("offsite-apply-icon");
  const clean = (sel: string) => root.querySelector(sel)?.textContent.replace(/\s+/g, " ").trim();
  return {
    ...job,
    title: job.title || clean(".top-card-layout__title") || "",
    company: job.company || clean(".topcard__org-name-link") || "",
    location: job.location || clean(".topcard__flavor--bullet") || "",
    description: markup ? htmlToText(markup.innerHTML) : job.description,
    seniority: criteria["seniority level"],
    employmentType: criteria["employment type"],
    applyNote: offsite
      ? "Applies on the company's website (LinkedIn sign-in needed to reveal the link)"
      : "LinkedIn Easy Apply (requires LinkedIn sign-in in the agent browser)",
  };
}

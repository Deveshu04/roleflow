import { z } from "zod";
import { GROUNDING_RULES, structured } from "../ai";
import type { Job, Match, Profile, ResumeData } from "../types";

const matchSchema = z.object({
  match_score: z.number().int().min(0).max(100),
  summary: z.string().describe("Two sentences on overall fit"),
  matching_evidence: z.array(z.string()).describe("Concrete resume facts that satisfy job requirements"),
  missing_requirements: z.array(z.string()).describe("Requirements the resume does not show"),
  questions_for_user: z.array(z.string()).describe("Things to confirm before applying, e.g. unlisted experience"),
});

export function resumeDigest(r: ResumeData) {
  return [
    `${r.name} — ${r.headline}`,
    r.summary,
    `Skills: ${r.skills.flatMap((g) => g.items).join(", ")}`,
    ...r.experience.map((e) => `${e.title} @ ${e.company} (${e.start}–${e.end}): ${e.bullets.join(" ")}`),
    ...r.projects.map((p) => `Project ${p.name} [${p.tech.join(", ")}]: ${p.bullets.join(" ")}`),
    ...r.education.map((e) => `${e.degree} ${e.field}, ${e.school} (${e.end})`),
  ]
    .filter(Boolean)
    .join("\n");
}

export async function analyzeMatch(job: Job, profile: Profile): Promise<Match> {
  return structured({
    schema: matchSchema,
    name: "match",
    instructions: `You assess how well a candidate fits a job. Be candid and specific; do not inflate the score.
Score guide: 85+ meets nearly all must-haves; 70-84 meets most; 50-69 partial; below 50 weak.
${GROUNDING_RULES}`,
    input: `JOB: ${job.title} at ${job.company} (${job.location})
${(job.description || "No description available.").slice(0, 12000)}

CANDIDATE
${resumeDigest(profile.resume!)}
Years of experience (self-reported): ${profile.preferences.yearsOfExperience || "not stated"}`,
  });
}

const quickSchema = z.object({
  results: z.array(z.object({ id: z.string(), score: z.number().int().min(0).max(100), reason: z.string() })),
});

// One call ranks the whole result list.
export async function quickFit(jobs: Job[], profile: Profile) {
  if (!profile.resume || !jobs.length) return jobs;
  const out = await structured({
    schema: quickSchema,
    name: "quick_fit",
    effort: "none",
    instructions: `Estimate fit (0-100) of each job for the candidate from title, company, location and any description snippet. Reason: max 14 words. ${GROUNDING_RULES}`,
    input: `CANDIDATE\n${resumeDigest(profile.resume).slice(0, 4000)}\n\nJOBS\n${jobs
      .map((j) => `${j.id} | ${j.title} | ${j.company} | ${j.location} | ${(j.description || "").slice(0, 300).replace(/\s+/g, " ")}`)
      .join("\n")}`,
  }).catch(() => ({ results: [] }));
  return jobs
    .map((j) => {
      const r = out.results.find((x) => x.id === j.id);
      return r ? { ...j, quickFit: r.score, quickFitReason: r.reason } : j;
    })
    .sort((a, b) => (b.quickFit ?? -1) - (a.quickFit ?? -1));
}

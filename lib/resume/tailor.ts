import { GROUNDING_RULES, structured } from "../ai";
import type { Job, ResumeChange, ResumeData } from "../types";
import { tailorSchema } from "./schema";

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#.]/g, "");

// The model rewrites; code restores facts (identity, employers, dates, education) and drops untraceable skills.
export async function tailorResume(base: ResumeData, resumeText: string, job: Job) {
  const out = await structured({
    schema: tailorSchema,
    name: "tailored_resume",
    effort: "medium",
    instructions: `You tailor a candidate's resume to one specific job.
${GROUNDING_RULES}
Allowed edits:
- Rewrite the summary/headline to foreground experience relevant to this job.
- Reorder sections' items and bullets so the most relevant come first; rephrase bullets to use the job's terminology where it truthfully describes the same work.
- Reorder and regroup skills; drop clearly irrelevant ones. Only list skills that appear in the original resume.
- Trim weak or irrelevant bullets to keep the resume to roughly one page of content.
Not allowed: adding employers, roles, dates, degrees, certifications, metrics, tools or responsibilities that are not in the original. Keep employer names, job titles, dates and schools exactly as written.`,
    input: `JOB
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Description:
${(job.description || "").slice(0, 12000)}

ORIGINAL RESUME (structured JSON)
${JSON.stringify(base)}

ORIGINAL RESUME (raw text, for fact checking)
${resumeText.slice(0, 15000)}`,
  });

  const resume = out.resume;
  const changes: ResumeChange[] = [...out.changes];

  resume.name = base.name;
  resume.contact = base.contact;

  // Only roles from the original, with their original titles and dates.
  resume.experience = resume.experience
    .map((e) => {
      const orig = base.experience.find((o) => norm(o.company) === norm(e.company) && norm(o.title) === norm(e.title))
        ?? base.experience.find((o) => norm(o.company) === norm(e.company));
      return orig ? { ...e, title: orig.title, company: orig.company, start: orig.start, end: orig.end, location: orig.location } : null;
    })
    .filter((e): e is ResumeData["experience"][number] => e !== null);
  for (const orig of base.experience)
    if (!resume.experience.some((e) => norm(e.company) === norm(orig.company) && norm(e.title) === norm(orig.title)))
      resume.experience.push(orig);

  resume.education = base.education;
  resume.certifications = base.certifications;

  // Skills must appear in the original text.
  const source = norm(resumeText + JSON.stringify(base.skills));
  const dropped: string[] = [];
  resume.skills = resume.skills
    .map((g) => ({
      category: g.category,
      items: g.items.filter((s) => {
        const ok = source.includes(norm(s));
        if (!ok) dropped.push(s);
        return ok;
      }),
    }))
    .filter((g) => g.items.length);
  if (dropped.length)
    changes.push({
      section: "Skills",
      change: `Removed ${dropped.join(", ")}`,
      reason: "Guardrail: not found in your original resume",
    });

  return { resume, changes, coverLetter: out.cover_letter, gaps: out.gaps };
}

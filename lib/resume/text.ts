import type { ResumeData } from "../types";

export function resumeToText(r: ResumeData) {
  const lines = [
    r.name,
    r.headline,
    [r.contact.email, r.contact.phone, r.contact.location].filter(Boolean).join(" | "),
    [r.contact.linkedin, r.contact.github, r.contact.website].filter(Boolean).join(" | "),
    r.summary && `SUMMARY: ${r.summary}`,
    r.skills.length && `SKILLS: ${r.skills.map((g) => `${g.category}: ${g.items.join(", ")}`).join("; ")}`,
    "EXPERIENCE:",
    ...r.experience.map((e) => `- ${e.title}, ${e.company}, ${e.location} (${e.start} – ${e.end})\n${e.bullets.map((b) => `  • ${b}`).join("\n")}`),
    r.projects.length ? "PROJECTS:" : "",
    ...r.projects.map((p) => `- ${p.name} [${p.tech.join(", ")}] ${p.link}\n${p.bullets.map((b) => `  • ${b}`).join("\n")}`),
    "EDUCATION:",
    ...r.education.map((e) => `- ${e.degree} ${e.field}, ${e.school} (${e.start} – ${e.end}) ${e.details.join("; ")}`),
    r.certifications.length ? `CERTIFICATIONS: ${r.certifications.join("; ")}` : "",
    r.achievements.length ? `ACHIEVEMENTS: ${r.achievements.join("; ")}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

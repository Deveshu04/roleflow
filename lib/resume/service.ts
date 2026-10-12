import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { UserFacingError } from "../ai";
import { addResumeVersion, getProfile, resumeFilePath, saveProfile } from "../store";
import type { Job, ResumeVersion } from "../types";
import { extractResumeText, structureResume } from "./parse";
import { renderCoverLetterPdf, renderResumePdf } from "./render";
import { tailorResume } from "./tailor";

const MAX_BYTES = 8 * 1024 * 1024;
const safe = (s: string) => s.replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "Resume";

export async function uploadResume(buffer: Buffer, fileName: string, mimeType: string) {
  if (buffer.length > MAX_BYTES) throw new UserFacingError("That file is larger than 8 MB.");
  const text = await extractResumeText(buffer, fileName);
  const resume = await structureResume(text);

  const id = randomUUID();
  const ext = path.extname(fileName).toLowerCase();
  // Employers see this file name, so it stays clean; the folder makes it unique.
  const stored = `${id}/${safe(resume.name || path.basename(fileName, ext))}_Resume${ext}`;
  await fs.mkdir(path.dirname(resumeFilePath(stored)), { recursive: true });
  await fs.writeFile(resumeFilePath(stored), buffer);

  const version: ResumeVersion = {
    id,
    kind: "original",
    label: `Your resume (${fileName})`,
    fileName: stored,
    mimeType,
    createdAt: new Date().toISOString(),
  };
  await addResumeVersion(version);

  const profile = await getProfile();
  profile.resume = resume;
  profile.resumeText = text;
  profile.originalResumeId = id;
  await saveProfile(profile);
  return { profile, version };
}

export async function tailorForJob(job: Job) {
  const profile = await getProfile();
  if (!profile.resume) throw new UserFacingError("Upload your resume first.");
  if (!job.description) throw new UserFacingError("This job has no description to tailor against.");

  const out = await tailorResume(profile.resume, profile.resumeText, job);
  const id = randomUUID();
  const base = `${safe(profile.resume.name)}_Resume`;
  const fileName = `${id}/${base}.pdf`;
  const coverLetterFile = `${id}/${safe(profile.resume.name)}_Cover_Letter.pdf`;
  await renderResumePdf(out.resume, resumeFilePath(fileName));
  await renderCoverLetterPdf(out.resume, out.coverLetter, resumeFilePath(coverLetterFile));

  const version: ResumeVersion = {
    id,
    kind: "tailored",
    jobId: job.id,
    label: `Tailored for ${job.company} — ${job.title}`,
    fileName,
    mimeType: "application/pdf",
    createdAt: new Date().toISOString(),
    changes: out.changes,
    coverLetter: out.coverLetter,
    coverLetterFile,
  };
  await addResumeVersion(version);
  return { version, gaps: out.gaps, resume: out.resume };
}

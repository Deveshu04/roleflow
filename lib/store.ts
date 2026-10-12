import { promises as fs } from "fs";
import path from "path";
import { dataPath } from "./config";
import type { ApplicationRun, Job, Preferences, Profile, ResumeVersion } from "./types";

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(dataPath(file), "utf8")) as T;
  } catch {
    return fallback;
  }
}

// Per-file write queue so concurrent requests never interleave partial JSON.
const writeQueues = new Map<string, Promise<unknown>>();
async function writeJson(file: string, value: unknown) {
  const target = dataPath(file);
  const prev = writeQueues.get(target) ?? Promise.resolve();
  const next = prev.then(async () => {
    await fs.mkdir(path.dirname(target), { recursive: true });
    const tmp = `${target}.${process.pid}.tmp`;
    const body = JSON.stringify(value, null, 2);
    await fs.writeFile(tmp, body);
    // Windows refuses the rename while the file is being read.
    await fs.rename(tmp, target).catch(async () => {
      await fs.writeFile(target, body);
      await fs.rm(tmp, { force: true });
    });
  });
  writeQueues.set(target, next.catch(() => {}));
  return next;
}

export const emptyPreferences: Preferences = {
  workAuthorization: "",
  requiresSponsorship: "",
  noticePeriod: "",
  currentCompensation: "",
  expectedCompensation: "",
  willingToRelocate: "",
  yearsOfExperience: "",
  pronouns: "",
  demographics: "Decline to self-identify",
  extraNotes: "",
};

export async function getProfile(): Promise<Profile> {
  const p = await readJson<Partial<Profile>>("profile.json", {});
  return {
    resume: p.resume ?? null,
    resumeText: p.resumeText ?? "",
    originalResumeId: p.originalResumeId ?? null,
    baseResumeId: p.baseResumeId ?? null,
    preferences: { ...emptyPreferences, ...p.preferences },
    answers: p.answers ?? [],
    updatedAt: p.updatedAt ?? new Date(0).toISOString(),
  };
}

export async function saveProfile(profile: Profile) {
  profile.updatedAt = new Date().toISOString();
  await writeJson("profile.json", profile);
  return profile;
}

export async function listResumeVersions() {
  return readJson<ResumeVersion[]>("resume-versions.json", []);
}
export async function getResumeVersion(id: string) {
  return (await listResumeVersions()).find((v) => v.id === id);
}
export async function addResumeVersion(version: ResumeVersion) {
  const all = await listResumeVersions();
  await writeJson("resume-versions.json", [version, ...all.filter((v) => v.id !== version.id)]);
  return version;
}
export const resumeFilePath = (fileName: string) => dataPath("resumes", fileName);

export async function getJobs() {
  return readJson<Record<string, Job>>("jobs.json", {});
}
export async function getJob(id: string) {
  return (await getJobs())[id];
}
export async function saveJobs(jobs: Job[]) {
  const all = await getJobs();
  for (const job of jobs) all[job.id] = { ...all[job.id], ...job };
  await writeJson("jobs.json", all);
  return jobs.map((j) => all[j.id]);
}

export async function listRuns() {
  return readJson<ApplicationRun[]>("application-runs.json", []);
}
let runsLock: Promise<unknown> = Promise.resolve();
export function saveRun(run: ApplicationRun) {
  const task = runsLock.then(async () => {
    const all = await listRuns();
    const at = all.findIndex((r) => r.id === run.id);
    if (at >= 0) all[at] = run;
    else all.unshift(run);
    await writeJson("application-runs.json", all);
    return run;
  });
  runsLock = task.catch(() => {});
  return task;
}

export type ResumeData = {
  name: string;
  headline: string;
  contact: {
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
    website: string;
  };
  summary: string;
  skills: { category: string; items: string[] }[];
  experience: {
    title: string;
    company: string;
    location: string;
    start: string;
    end: string;
    bullets: string[];
  }[];
  projects: { name: string; tech: string[]; link: string; bullets: string[] }[];
  education: {
    school: string;
    degree: string;
    field: string;
    start: string;
    end: string;
    details: string[];
  }[];
  certifications: string[];
  achievements: string[];
};

/** Facts forms ask for that a resume usually lacks. */
export type Preferences = {
  workAuthorization: string;
  requiresSponsorship: string;
  noticePeriod: string;
  currentCompensation: string;
  expectedCompensation: string;
  willingToRelocate: string;
  yearsOfExperience: string;
  pronouns: string;
  demographics: string;
  extraNotes: string;
};

export type SavedAnswer = { question: string; answer: string; savedAt: string };

export type ResumeVersion = {
  id: string;
  kind: "original" | "base" | "tailored";
  jobId?: string;
  label: string;
  fileName: string;
  mimeType: string;
  createdAt: string;
  changes?: ResumeChange[];
  coverLetter?: string;
  coverLetterFile?: string;
};

export type ResumeChange = { section: string; change: string; reason: string };

export type Profile = {
  resume: ResumeData | null;
  resumeText: string;
  originalResumeId: string | null;
  baseResumeId: string | null;
  preferences: Preferences;
  answers: SavedAnswer[];
  updatedAt: string;
};

export type JobSource = "linkedin" | "greenhouse" | "lever" | "ashby" | "web";

export type Job = {
  id: string;
  source: JobSource;
  title: string;
  company: string;
  location: string;
  url: string;
  applyUrl: string;
  postedAt?: string;
  description?: string;
  employmentType?: string;
  seniority?: string;
  applyNote?: string;
  quickFit?: number;
  quickFitReason?: string;
  fetchedAt: string;
};

export type Match = {
  match_score: number;
  summary: string;
  matching_evidence: string[];
  missing_requirements: string[];
  questions_for_user: string[];
};

export type RunStatus =
  | "running"
  | "needs_input"
  | "blocked"
  | "awaiting_approval"
  | "submitted"
  | "skipped"
  | "failed"
  | "cancelled";

export type RunEvent = {
  at: string;
  kind: "info" | "action" | "thought" | "warning" | "error" | "user" | "success";
  label: string;
  detail?: string;
};

export type PendingRequest =
  | { type: "question"; question: string; fields: string[] }
  | { type: "user_action"; kind: string; message: string }
  | { type: "approval"; summary: string; unresolved: string[] };

export type ApplicationRun = {
  id: string;
  jobId: string;
  job: Pick<Job, "title" | "company" | "location" | "url" | "source">;
  resumeVersionId: string;
  autoSubmit: boolean;
  status: RunStatus;
  pending: PendingRequest | null;
  currentUrl: string;
  steps: number;
  events: RunEvent[];
  outcome?: string;
  usage: { inputTokens: number; outputTokens: number; modelCalls: number };
  createdAt: string;
  updatedAt: string;
};

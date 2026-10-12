import { staticFile } from "remotion";

// Screenshots captured at 2x from a sandboxed Roleflow instance (fictional candidate "Aarav Mehta").
export const ui = {
  searchEmpty: { src: staticFile("ui/search-empty.jpg"), width: 1680, height: 880 },
  searchTyped: { src: staticFile("ui/search-typed.jpg"), width: 1680, height: 880 },
  searchLoading: { src: staticFile("ui/search-loading.jpg"), width: 1680, height: 880 },
  results: { src: staticFile("ui/results.jpg"), width: 1240, height: 1800 },
  match: { src: staticFile("ui/match.jpg"), width: 1128, height: 2480 },
  resume: { src: staticFile("ui/resume.jpg"), width: 1308, height: 1480 },
  coverLetter: { src: staticFile("ui/cover-letter.jpg"), width: 1308, height: 1480 },
  agentReview: { src: staticFile("ui/agent-review.jpg"), width: 2352, height: 1960 },
  autopilot: { src: staticFile("ui/autopilot.jpg"), width: 1536, height: 1028 },
  // Frames from the agent's own browser tab (1280x860), in the order the run produced them.
  live: [staticFile("ui/live-0.jpg"), staticFile("ui/live-1.jpg"), staticFile("ui/live-2.jpg")],
};

export const heroVideo = staticFile("hero.mp4");
export const heroStill = staticFile("hero-poster.jpg");

export const jobUrl = "job-boards.greenhouse.io/vmlenterprisesolutions/jobs/8675374002";

// Real output of the tailoring step for this job (section, change, reason).
export const tailorChanges = [
  {
    section: "Headline",
    change: "Added a targeted AI/ML headline emphasizing NLP, RAG, recommendations, MLOps, and AWS.",
    reason: "The role centers on AI/ML engineering, GenAI prototyping, deployment, and cloud delivery.",
  },
  {
    section: "Skills",
    change: "Regrouped skills into AI/ML & GenAI, MLOps/Cloud/APIs, and Languages/Data; retained only original resume skills.",
    reason: "This makes relevant AI, cloud, containerization, and API experience easier for recruiters to find.",
  },
  {
    section: "Experience",
    change: "Reordered Zeta Retail Analytics bullets to lead with RAG prototyping, production model serving, and ML pipeline automation.",
    reason: "The job prioritizes rapid GenAI proof points, deployable systems, reusable delivery practices, and production engineering.",
  },
];

export type RunEventKind = "info" | "action" | "warning" | "user";

// The agent run's timeline, as recorded (labels lightly shortened to fit).
export const runEvents: { at: number; kind: RunEventKind; label: string; detail?: string; height: number }[] = [
  {
    at: 8,
    kind: "info",
    label: "Starting application",
    detail: "with Tailored for VML/WPP Enterprise Solutions — AI/ML Engineer",
    height: 128,
  },
  { at: 32, kind: "action", label: "Opening job-boards.greenhouse.io", height: 60 },
  {
    at: 96,
    kind: "action",
    label: "Filled 13 fields",
    detail: "First Name → Aarav · Last Name → Mehta · Email → aarav.mehta@example.com · Country → India · Phone → +91 98450 12345 …",
    height: 128,
  },
  {
    at: 184,
    kind: "warning",
    label: "1 field needs another try",
    detail: "Notice period: no option matched “30 days”. Options shown: Immediately Available | 1 Month | 2 Months …",
    height: 128,
  },
  { at: 222, kind: "action", label: "Filled 1 field", detail: "What is your current notice period? → 1 Month", height: 96 },
  { at: 256, kind: "action", label: "Uploaded resume", detail: "Aarav_Mehta_Resume.pdf", height: 96 },
  { at: 274, kind: "action", label: "Uploaded cover letter", detail: "Aarav_Mehta_Cover_Letter.pdf", height: 96 },
  {
    at: 306,
    kind: "user",
    label: "Ready for your review",
    detail:
      "Filled Aarav Mehta's application with name, email, phone (+91), LinkedIn, GitHub as portfolio link, resume and cover letter uploads …",
    height: 128,
  },
];

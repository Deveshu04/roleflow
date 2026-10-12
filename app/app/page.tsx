"use client";
import { CheckCircle2, Linkedin, LoaderCircle, Rocket, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { AutopilotState } from "@/lib/agent/autopilot";
import type { ApplicationRun, Job, Profile, ResumeVersion } from "@/lib/types";
import { api, errorText } from "./_components/api";
import { AutopilotPanel } from "./_components/AutopilotPanel";
import { History } from "./_components/History";
import { JobList } from "./_components/JobList";
import { JobPanel } from "./_components/JobPanel";
import { ResumePanel } from "./_components/ResumePanel";
import { RunPanel } from "./_components/RunPanel";
import { SearchPanel } from "./_components/SearchPanel";
import { Card, Eyebrow, Logo, Notice } from "./_components/ui";

type ProfileResponse = { profile: Profile; versions: ResumeVersion[]; openai: { configured: boolean; model: string; agentModel: string } };
const ACTIVE = ["running", "needs_input", "blocked", "awaiting_approval"];
const DETAIL_LABELS: [keyof Profile["preferences"], string][] = [
  ["workAuthorization", "work authorization"],
  ["requiresSponsorship", "sponsorship"],
  ["noticePeriod", "notice period"],
  ["expectedCompensation", "expected salary"],
];

export default function Workspace() {
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searched, setSearched] = useState("");
  const [searchErrors, setSearchErrors] = useState<string[]>([]);
  const [selected, setSelected] = useState<Job | null>(null);
  const [runs, setRuns] = useState<ApplicationRun[]>([]);
  const [shownRun, setShownRun] = useState<ApplicationRun | null>(null);
  const [browser, setBrowser] = useState({ open: false, linkedin: false });
  const [connecting, setConnecting] = useState(false);
  const [notice, setNotice] = useState("");
  const [mode, setMode] = useState<"search" | "autopilot">("search");
  const [autopilot, setAutopilot] = useState<AutopilotState | null>(null);

  const loadProfile = useCallback(async () => setData(await api<ProfileResponse>("/api/profile")), []);
  const loadRuns = useCallback(async () => {
    const { applications } = await api<{ applications: ApplicationRun[] }>("/api/applications");
    setRuns(applications);
    return applications;
  }, []);

  useEffect(() => {
    loadProfile().catch((err) => setNotice(errorText(err)));
    loadRuns()
      .then((all) => {
        const live = all.find((r) => ACTIVE.includes(r.status));
        if (live) setShownRun(live);
      })
      .catch(() => {});
    api<typeof browser>("/api/browser").then(setBrowser).catch(() => {});
    api<{ autopilot: AutopilotState | null }>("/api/autopilot")
      .then(({ autopilot: a }) => {
        setAutopilot(a);
        if (a && (a.status === "searching" || a.status === "running")) setMode("autopilot");
      })
      .catch(() => {});
  }, [loadProfile, loadRuns]);

  const autopilotActive = autopilot?.status === "searching" || autopilot?.status === "running";
  const autopilotRunId = autopilot?.currentRunId;
  useEffect(() => {
    if (!autopilotActive) return;
    const t = setInterval(() => {
      api<{ autopilot: AutopilotState | null }>("/api/autopilot")
        .then(({ autopilot: a }) => {
          setAutopilot(a);
          if (a && !(a.status === "searching" || a.status === "running")) void loadRuns();
        })
        .catch(() => {});
    }, 2000);
    return () => clearInterval(t);
  }, [autopilotActive, loadRuns]);
  useEffect(() => {
    if (!autopilotRunId) return;
    api<{ run: ApplicationRun }>(`/api/applications/${autopilotRunId}`)
      .then(({ run }) => {
        setShownRun(run);
        setRuns((all) => [run, ...all.filter((r) => r.id !== run.id)]);
        void loadProfile();
      })
      .catch(() => {});
  }, [autopilotRunId, loadProfile]);

  // Poll until the LinkedIn session cookie appears.
  useEffect(() => {
    if (!browser.open || browser.linkedin) return;
    const t = setInterval(() => api<typeof browser>("/api/browser").then(setBrowser).catch(() => {}), 3000);
    return () => clearInterval(t);
  }, [browser.open, browser.linkedin]);

  const connectLinkedIn = async () => {
    setConnecting(true);
    try {
      setBrowser(await api<typeof browser>("/api/browser", { json: { action: "linkedin-login" } }));
      setNotice("A Chrome window opened on LinkedIn. Sign in there yourself — Roleflow never sees your password. This page updates once you're signed in.");
    } catch (err) {
      setNotice(errorText(err));
    } finally {
      setConnecting(false);
    }
  };

  const start = async (jobId: string, resumeVersionId: string, autoSubmit: boolean) => {
    const { run } = await api<{ run: ApplicationRun }>("/api/applications", { json: { jobId, resumeVersionId, autoSubmit } });
    setShownRun(run);
    setRuns((all) => [run, ...all]);
    setBrowser((b) => ({ ...b, open: true }));
    setTimeout(() => document.getElementById("agent")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };

  const onRunUpdate = useCallback((run: ApplicationRun) => {
    setRuns((all) => all.map((r) => (r.id === run.id ? run : r)));
  }, []);

  const profile = data?.profile ?? null;
  const hasResume = Boolean(profile?.resume);
  const agentBusy = runs.some((r) => ACTIVE.includes(r.status)) || autopilotActive;
  const missingDetails = [
    ...(profile?.resume && !profile.resume.contact.location ? ["current location"] : []),
    ...DETAIL_LABELS.filter(([k]) => profile && !profile.preferences[k]).map(([, label]) => label),
  ];

  return (
    <main className="mx-auto max-w-[1240px] px-4 pb-20 pt-5 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-white"><Logo /></span>
          Roleflow
        </Link>
        <nav className="hidden items-center gap-1 text-sm text-muted md:flex" aria-label="Workspace">
          {[["search", "Find jobs"], ["resume", "Resume"], ["jobs", "Apply"], ["history", "History"]].map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={() => id === "search" && setMode("search")} className="rounded-lg px-3 py-1.5 hover:bg-black/[.04] hover:text-ink">{label}</a>
          ))}
          <button onClick={() => { setMode("autopilot"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="rounded-lg px-3 py-1.5 font-medium text-accent hover:bg-soft">Autopilot</button>
        </nav>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium ${data?.openai.configured ? "bg-soft text-accent-dark" : "bg-danger-soft text-danger"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${data?.openai.configured ? "bg-accent" : "bg-danger"}`} />
            {data ? (data.openai.configured ? `OpenAI · ${data.openai.agentModel}` : "OpenAI key missing") : "Connecting…"}
          </span>
          {browser.linkedin ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-soft px-3 py-1.5 font-medium text-accent-dark">
              <CheckCircle2 size={13} /> LinkedIn connected
            </span>
          ) : (
            <button onClick={connectLinkedIn} disabled={connecting} className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-white px-3 py-1.5 font-medium hover:border-accent hover:text-accent disabled:opacity-60">
              {connecting ? <LoaderCircle size={13} className="animate-spin" /> : <Linkedin size={13} />} Connect LinkedIn
            </button>
          )}
        </div>
      </header>

      {data && !data.openai.configured && (
        <div className="mt-5"><Notice tone="error">Set OPENAI_API_KEY in .env.local and restart the dev server — resume parsing, matching, tailoring and the browser agent all use it.</Notice></div>
      )}
      {notice && <div className="mt-5"><Notice>{notice}</Notice></div>}

      <div className="mt-8 flex justify-center">
        <div role="tablist" aria-label="How to run the agent" className="inline-flex rounded-2xl border border-line-strong bg-white p-1 text-sm">
          {([["search", "Search & pick jobs", Search], ["autopilot", "Autopilot — run from start", Rocket]] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              role="tab"
              aria-selected={mode === key}
              onClick={() => setMode(key)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold transition ${mode === key ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      {mode === "autopilot" ? (
        <AutopilotPanel
          state={autopilot}
          defaultLocation={profile?.resume?.contact.location ?? ""}
          linkedInSignedIn={browser.linkedin}
          readiness={{ resume: hasResume, missingDetails }}
          onChange={setAutopilot}
        />
      ) : (
      <SearchPanel
        defaultLocation={profile?.resume?.contact.location ?? ""}
        onResults={(found, errors, q) => {
          setJobs(found);
          setSearchErrors(errors);
          setSearched(q);
          setSelected(found[0] ?? null);
          setTimeout(() => document.getElementById("jobs")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
        }}
        onImported={(job) => {
          setJobs((all) => [job, ...all.filter((j) => j.id !== job.id)]);
          setSearched((s) => s || "Imported link");
          setSelected(job);
          setTimeout(() => document.getElementById("jobs")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
        }}
      />
      )}

      <ResumePanel profile={profile} versions={data?.versions ?? []} onChange={loadProfile} />

      {shownRun && (
        <div className="mt-6">
          <RunPanel
            key={shownRun.id}
            initial={shownRun}
            onUpdate={onRunUpdate}
            canRestart={!agentBusy}
            onRestart={(r) => start(r.jobId, r.resumeVersionId, r.autoSubmit)}
          />
        </div>
      )}

      <section id="jobs" className="mt-6 grid scroll-mt-6 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.95fr)]">
        <div>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <Eyebrow>Live results</Eyebrow>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">{searched ? `“${searched}”` : "Search to see live jobs"}</h2>
            </div>
            {jobs.length > 0 && <span className="text-sm text-muted">{jobs.length} roles</span>}
          </div>
          {searchErrors.length > 0 && <div className="mb-3"><Notice tone="warn">{searchErrors.join(" · ")}</Notice></div>}
          {jobs.length ? (
            <JobList jobs={jobs} selectedId={selected?.id} onSelect={setSelected} />
          ) : (
            <Card className="text-center">
              <p className="text-sm text-muted">
                {searched ? "No open roles matched. Try a broader title or another location." : "Results from LinkedIn and company career sites will appear here, ranked against your resume."}
              </p>
            </Card>
          )}
        </div>
        <div>
          {selected ? (
            <JobPanel
              key={selected.id}
              job={selected}
              hasResume={hasResume}
              versions={data?.versions ?? []}
              originalId={profile?.originalResumeId ?? null}
              agentBusy={agentBusy}
              linkedInSignedIn={browser.linkedin}
              onVersionsChanged={loadProfile}
              onStart={start}
            />
          ) : (
            <Card className="lg:sticky lg:top-5">
              <Eyebrow>How it works</Eyebrow>
              <ol className="mt-3 grid gap-3 text-sm text-muted">
                <li><strong className="text-ink">1. Upload your resume.</strong> Parsed into structured facts the agent is allowed to use.</li>
                <li><strong className="text-ink">2. Search or paste a link.</strong> Live listings from LinkedIn, Greenhouse, Lever and Ashby.</li>
                <li><strong className="text-ink">3. Tailor.</strong> A job-specific PDF resume and cover letter, without invented experience.</li>
                <li><strong className="text-ink">4. Run the agent.</strong> It fills the real form in Chrome, asks you what it doesn&apos;t know, and waits for your approval to submit.</li>
              </ol>
            </Card>
          )}
        </div>
      </section>

      <div className="mt-6">
        <History
          runs={runs}
          selectedId={shownRun?.id}
          onOpen={(r) => {
            setShownRun(r);
            setTimeout(() => document.getElementById("agent")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
          }}
        />
      </div>
    </main>
  );
}

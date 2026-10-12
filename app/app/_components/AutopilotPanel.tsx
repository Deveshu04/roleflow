"use client";
import { CheckCircle2, CircleAlert, MapPin, Play, Rocket, Square } from "lucide-react";
import { useState } from "react";
import type { AutopilotState } from "@/lib/agent/autopilot";
import { api, errorText } from "./api";
import { Button, Field, inputCls, Notice, SourceBadge } from "./ui";

const ITEM_TEXT: Record<AutopilotState["items"][number]["state"], string> = {
  queued: "Queued",
  preparing: "Loading job",
  tailoring: "Tailoring resume",
  applying: "Agent applying",
  submitted: "Submitted",
  skipped: "Skipped",
  failed: "Failed",
  stopped: "Not started",
};
const ITEM_TONE: Record<AutopilotState["items"][number]["state"], string> = {
  queued: "bg-paper text-muted",
  preparing: "bg-soft text-accent-dark",
  tailoring: "bg-soft text-accent-dark",
  applying: "bg-soft text-accent-dark",
  submitted: "bg-accent text-white",
  skipped: "bg-paper text-muted",
  failed: "bg-danger-soft text-danger",
  stopped: "bg-paper text-muted",
};

const chip = (on: boolean) =>
  `rounded-full border px-3 py-1.5 text-sm transition disabled:opacity-50 ${on ? "border-accent bg-soft text-accent-dark" : "border-line-strong bg-white text-muted hover:border-accent"}`;

export function AutopilotPanel({
  state,
  defaultLocation,
  linkedInSignedIn,
  readiness,
  onChange,
}: {
  state: AutopilotState | null;
  defaultLocation: string;
  linkedInSignedIn: boolean;
  readiness: { resume: boolean; missingDetails: string[] };
  onChange: (s: AutopilotState | null) => void;
}) {
  const [query, setQuery] = useState(state?.input.query ?? "");
  const [location, setLocation] = useState<string | null>(state?.input.location ?? null);
  const [limit, setLimit] = useState(state?.input.limit ?? 3);
  const [minFit, setMinFit] = useState(state?.input.minFit ?? 65);
  const [sources, setSources] = useState(state?.input.sources ?? { linkedin: true, web: true });
  const [easyApplyOnly, setEasyApplyOnly] = useState(state?.input.easyApplyOnly ?? true);
  const [tailor, setTailor] = useState(state?.input.tailor ?? true);
  const [autoSubmit, setAutoSubmit] = useState(state?.input.autoSubmit ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const running = state?.status === "searching" || state?.status === "running";
  const loc = location ?? defaultLocation;

  const start = async () => {
    setBusy(true);
    setError("");
    try {
      const { autopilot } = await api<{ autopilot: AutopilotState }>("/api/autopilot", {
        json: { action: "start", query, location: loc, limit, minFit, sources, easyApplyOnly, tailor, autoSubmit },
      });
      onChange(autopilot);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    setBusy(true);
    try {
      onChange((await api<{ autopilot: AutopilotState }>("/api/autopilot", { json: { action: "stop" } })).autopilot);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const submitted = state?.items.filter((i) => i.state === "submitted").length ?? 0;

  return (
    <section id="autopilot" className="enter mx-auto max-w-3xl scroll-mt-6 py-10 sm:py-14">
      <div className="text-center">
        <p className="text-[11px] font-bold uppercase tracking-[.16em] text-accent">Autopilot</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          Run the agent from <span className="serif text-[1.08em] text-muted">start</span> to submit.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] text-muted">
          It searches live jobs, picks the best matches for your resume, tailors your resume for each one and applies one by one in Chrome. It
          still stops to ask you questions{autoSubmit ? "" : " and for your approval before every submission"}.
        </p>
      </div>

      <div className="mt-8 rounded-3xl border border-line-strong bg-white p-5 text-left sm:p-6">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
          <Field label="Role">
            <input value={query} onChange={(e) => setQuery(e.target.value)} disabled={running} className={inputCls} placeholder="e.g. Data scientist, machine learning engineer" />
          </Field>
          <Field label="Location">
            <span className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
              <input value={loc} onChange={(e) => setLocation(e.target.value)} disabled={running} className={`${inputCls} pl-9`} placeholder="City, country or Remote" />
            </span>
          </Field>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="How many applications">
            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} disabled={running} className={inputCls}>
              {[1, 2, 3, 5, 8, 10].map((n) => (
                <option key={n} value={n}>{n} job{n > 1 ? "s" : ""}</option>
              ))}
            </select>
          </Field>
          <Field label="Only jobs with fit of at least">
            <select value={minFit} onChange={(e) => setMinFit(Number(e.target.value))} disabled={running} className={inputCls}>
              {[50, 60, 65, 70, 75, 80].map((n) => (
                <option key={n} value={n}>{n}%</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" disabled={running} className={chip(sources.linkedin)} aria-pressed={sources.linkedin} onClick={() => setSources({ ...sources, linkedin: !sources.linkedin })}>
            LinkedIn
          </button>
          {sources.linkedin && (
            <button type="button" disabled={running} className={chip(easyApplyOnly)} aria-pressed={easyApplyOnly} onClick={() => setEasyApplyOnly(!easyApplyOnly)} title="Only LinkedIn jobs that use Easy Apply (needs your LinkedIn session in the agent's browser)">
              Easy Apply only
            </button>
          )}
          <button type="button" disabled={running} className={chip(sources.web)} aria-pressed={sources.web} onClick={() => setSources({ ...sources, web: !sources.web })}>
            Company sites (Greenhouse · Lever · Ashby)
          </button>
        </div>

        <div className="mt-4 grid gap-2 text-sm">
          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" checked={tailor} disabled={running} onChange={(e) => setTailor(e.target.checked)} />
            <span>Tailor my resume and cover letter for each job <span className="text-muted">(about 30s per job)</span></span>
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" checked={autoSubmit} disabled={running} onChange={(e) => setAutoSubmit(e.target.checked)} />
            <span>
              Submit automatically without asking me
              <span className="block text-xs text-muted">Off: the agent fills each form and waits for you to approve the final click.</span>
            </span>
          </label>
        </div>

        <ul className="mt-5 grid gap-1.5 rounded-2xl bg-paper px-4 py-3 text-sm">
          <li className="flex items-center gap-2">
            {readiness.resume ? <CheckCircle2 size={15} className="text-accent" /> : <CircleAlert size={15} className="text-danger" />}
            {readiness.resume ? "Resume uploaded" : "Upload your resume below first"}
          </li>
          <li className="flex items-center gap-2">
            {sources.linkedin && !linkedInSignedIn ? <CircleAlert size={15} className="text-warn" /> : <CheckCircle2 size={15} className="text-accent" />}
            {sources.linkedin ? (linkedInSignedIn ? "LinkedIn connected" : "LinkedIn session not confirmed — click Connect LinkedIn (top right) to check, or the agent will pause for you to sign in") : "LinkedIn not used"}
          </li>
          <li className="flex items-start gap-2">
            {readiness.missingDetails.length ? <CircleAlert size={15} className="mt-0.5 shrink-0 text-warn" /> : <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-accent" />}
            {readiness.missingDetails.length
              ? `Missing details (the agent will stop to ask): ${readiness.missingDetails.join(", ")}`
              : "Application details filled"}
          </li>
        </ul>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {running ? (
            <Button variant="danger" onClick={stop} busy={busy}>
              <Square size={14} /> Stop autopilot
            </Button>
          ) : (
            <Button onClick={start} busy={busy} disabled={!readiness.resume || !query.trim()} className="px-5 py-3">
              <Rocket size={16} /> Start autopilot
            </Button>
          )}
          {state && (
            <span className="text-sm text-muted">
              {state.status === "searching" && "Searching and ranking jobs…"}
              {state.status === "running" && `Working through ${state.items.length} job${state.items.length > 1 ? "s" : ""} · ${submitted} submitted`}
              {state.status === "done" && `Finished · ${submitted} of ${state.items.length} submitted`}
              {state.status === "stopped" && `Stopped · ${submitted} submitted`}
              {state.status === "failed" && "Autopilot failed"}
            </span>
          )}
        </div>
        {error && <div className="mt-4"><Notice tone="error">{error}</Notice></div>}
        {state?.error && <div className="mt-4"><Notice tone={state.status === "failed" ? "error" : "warn"}>{state.error}</Notice></div>}
      </div>

      {state && state.items.length > 0 && (
        <ol className="mt-5 grid gap-2">
          {state.items.map((item, i) => (
            <li key={item.jobId} className="enter flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-line bg-card px-4 py-3 text-sm">
              <span className="w-5 text-muted">{i + 1}.</span>
              <span className="min-w-0 flex-1">
                <a href={item.url} target="_blank" rel="noreferrer" className="block truncate font-medium hover:text-accent">{item.title}</a>
                <span className="flex items-center gap-2 text-xs text-muted">
                  {item.company} · {item.location} <SourceBadge source={item.source} />
                  {item.fit !== undefined && <span>{item.fit}% fit</span>}
                </span>
                {item.note && <span className="mt-0.5 block text-xs text-muted">{item.note}</span>}
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${ITEM_TONE[item.state]}`}>
                {["preparing", "tailoring", "applying"].includes(item.state) && <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />}
                {ITEM_TEXT[item.state]}
              </span>
            </li>
          ))}
        </ol>
      )}

      {state && state.log.length > 0 && (
        <details className="mt-3 text-sm text-muted">
          <summary className="cursor-pointer select-none">Autopilot log ({state.log.length})</summary>
          <ul className="mt-2 grid gap-1">
            {state.log.map((l, i) => (
              <li key={i}>
                <span className="text-[#a3a29c]">{new Date(l.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span> {l.label}
              </li>
            ))}
          </ul>
        </details>
      )}

      {!running && !state && (
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
          <Play size={12} /> Tip: fill “Application details” below first so the agent rarely needs to stop.
        </p>
      )}
    </section>
  );
}

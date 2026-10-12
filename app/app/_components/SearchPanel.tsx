"use client";
import { ArrowRight, Link2, MapPin, SlidersHorizontal, Sparkles } from "lucide-react";
import { useState } from "react";
import type { Job } from "@/lib/types";
import { api, errorText } from "./api";
import { Button, inputCls, Notice } from "./ui";

type Sources = { linkedin: boolean; web: boolean };
type Posted = "day" | "week" | "month" | "any";

const EXAMPLES = ["Machine learning engineer", "Backend engineer (Python)", "Data analyst", "Frontend developer React"];
const chip = (on: boolean) =>
  `rounded-full border px-3 py-1.5 text-sm transition ${on ? "border-accent bg-soft text-accent-dark" : "border-line-strong bg-white text-muted hover:border-accent"}`;

export function SearchPanel({
  defaultLocation,
  onResults,
  onImported,
}: {
  defaultLocation: string;
  onResults: (jobs: Job[], errors: string[], query: string) => void;
  onImported: (job: Job) => void;
}) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState<string | null>(null);
  const [sources, setSources] = useState<Sources>({ linkedin: true, web: true });
  const [more, setMore] = useState(false);
  const [posted, setPosted] = useState<Posted>("month");
  const [remote, setRemote] = useState(false);
  const [easyApply, setEasyApply] = useState(false);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const loc = location ?? defaultLocation;

  const search = async (q = query) => {
    if (!q.trim()) return;
    setBusy(true);
    setError("");
    try {
      const out = await api<{ jobs: Job[]; errors: string[] }>("/api/jobs/search", {
        json: { query: q, location: loc, sources, linkedin: { postedWithin: posted, remote, easyApplyOnly: easyApply } },
      });
      onResults(out.jobs, out.errors, q);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const importLink = async () => {
    if (!link.trim()) return;
    setImporting(true);
    setError("");
    try {
      const { job } = await api<{ job: Job }>("/api/jobs/import", { json: { url: link } });
      setLink("");
      onImported(job);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setImporting(false);
    }
  };

  return (
    <section id="search" className="enter mx-auto max-w-3xl scroll-mt-6 py-10 text-center sm:py-14">
      <p className="text-[11px] font-bold uppercase tracking-[.16em] text-accent">Live job search</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
        Find roles worth <span className="serif text-[1.08em] text-muted">applying</span> to.
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-[15px] text-muted">
        Searches LinkedIn&apos;s public listings and company career sites on Greenhouse, Lever and Ashby, then ranks them against your resume.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
        className="mt-8 rounded-3xl border border-line-strong bg-white p-2.5 text-left shadow-[0_1px_0_rgba(0,0,0,.03)]"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Sparkles className="ml-2 h-5 w-5 shrink-0 text-accent" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="What kind of role are you looking for?"
              placeholder="What kind of role are you looking for?"
              className="min-w-0 flex-1 border-0 bg-transparent px-1 py-3 text-base outline-none sm:text-lg"
            />
          </div>
          <div className="flex items-center gap-2 border-t border-line pt-2 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
            <MapPin className="h-4 w-4 shrink-0 text-muted" aria-hidden />
            <input
              value={loc}
              onChange={(e) => setLocation(e.target.value)}
              aria-label="Location"
              placeholder="Location"
              className="w-full min-w-0 border-0 bg-transparent py-2 text-sm outline-none sm:w-36"
            />
            <Button type="submit" busy={busy} disabled={!query.trim()} className="shrink-0 rounded-2xl px-3.5 py-3" aria-label="Search jobs">
              {!busy && <ArrowRight size={18} />}
            </Button>
          </div>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <button type="button" className={chip(sources.linkedin)} aria-pressed={sources.linkedin} onClick={() => setSources({ ...sources, linkedin: !sources.linkedin })}>
          LinkedIn
        </button>
        <button type="button" className={chip(sources.web)} aria-pressed={sources.web} onClick={() => setSources({ ...sources, web: !sources.web })}>
          Company sites (Greenhouse · Lever · Ashby)
        </button>
        <button type="button" className={chip(more)} aria-expanded={more} onClick={() => setMore(!more)}>
          <SlidersHorizontal className="mr-1 inline h-3.5 w-3.5" aria-hidden />
          Filters
        </button>
      </div>

      {more && (
        <div className="mx-auto mt-3 flex max-w-2xl flex-wrap items-center justify-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-sm">
          <label className="flex items-center gap-2">
            Posted
            <select value={posted} onChange={(e) => setPosted(e.target.value as Posted)} className="rounded-lg border border-line-strong bg-white px-2 py-1">
              <option value="day">Past 24 hours</option>
              <option value="week">Past week</option>
              <option value="month">Past month</option>
              <option value="any">Any time</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={remote} onChange={(e) => setRemote(e.target.checked)} /> Remote only (LinkedIn)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={easyApply} onChange={(e) => setEasyApply(e.target.checked)} /> Easy Apply only (LinkedIn)
          </label>
        </div>
      )}

      {!busy && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((x) => (
            <button
              key={x}
              type="button"
              onClick={() => {
                setQuery(x);
                void search(x);
              }}
              className="rounded-full px-3 py-1 text-xs text-muted underline-offset-4 hover:text-accent hover:underline"
            >
              {x}
            </button>
          ))}
        </div>
      )}
      {busy && (
        <p className="mt-5 text-sm text-accent" role="status">
          Searching {[sources.linkedin && "LinkedIn", sources.web && "company career sites"].filter(Boolean).join(" and ")} — this takes 10–30 seconds…
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void importLink();
        }}
        className="mx-auto mt-6 flex max-w-xl items-center gap-2"
      >
        <div className="relative min-w-0 flex-1">
          <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input value={link} onChange={(e) => setLink(e.target.value)} aria-label="Paste a job link" placeholder="…or paste any job link" className={`${inputCls} pl-9`} />
        </div>
        <Button type="submit" variant="secondary" busy={importing} disabled={!link.trim()}>
          Load
        </Button>
      </form>

      {error && <div className="mx-auto mt-4 max-w-xl text-left"><Notice tone="error">{error}</Notice></div>}
    </section>
  );
}

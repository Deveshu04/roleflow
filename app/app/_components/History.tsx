"use client";
import { ArrowUpRight } from "lucide-react";
import type { ApplicationRun } from "@/lib/types";
import { STATUS_TEXT } from "./RunPanel";
import { Card, Eyebrow, SourceBadge } from "./ui";

const TONE: Record<ApplicationRun["status"], string> = {
  running: "bg-soft text-accent-dark",
  needs_input: "bg-warn-soft text-warn",
  blocked: "bg-warn-soft text-warn",
  awaiting_approval: "bg-warn-soft text-warn",
  submitted: "bg-accent text-white",
  skipped: "bg-paper text-muted",
  failed: "bg-danger-soft text-danger",
  cancelled: "bg-paper text-muted",
};

export function History({ runs, selectedId, onOpen }: { runs: ApplicationRun[]; selectedId?: string; onOpen: (run: ApplicationRun) => void }) {
  const submitted = runs.filter((r) => r.status === "submitted").length;
  return (
    <Card id="history">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <Eyebrow>History</Eyebrow>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Applications</h2>
        </div>
        <p className="text-sm text-muted">
          {submitted} submitted · {runs.length} run{runs.length === 1 ? "" : "s"}
        </p>
      </div>
      {runs.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-paper px-4 py-6 text-center text-sm text-muted">No applications yet. Pick a job and run the agent.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {runs.map((r) => (
            <li key={r.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => onOpen(r)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen(r))}
                className={`flex w-full cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 rounded-xl px-2 py-3 text-left transition hover:bg-paper ${selectedId === r.id ? "bg-paper" : ""}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{r.job.title}</span>
                  <span className="flex items-center gap-2 text-sm text-muted">
                    {r.job.company} <SourceBadge source={r.job.source} />
                  </span>
                </span>
                <span className="text-xs text-muted">{new Date(r.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TONE[r.status]}`}>{STATUS_TEXT[r.status]}</span>
                <a href={r.job.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-muted hover:text-accent" aria-label="Open job listing">
                  <ArrowUpRight size={16} />
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

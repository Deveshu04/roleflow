"use client";
import { ArrowUpRight, Building2, MapPin } from "lucide-react";
import type { Job } from "@/lib/types";
import { timeAgo } from "./api";
import { SourceBadge } from "./ui";

export function fitTone(score?: number) {
  if (score === undefined) return "bg-paper text-muted";
  if (score >= 75) return "bg-soft text-accent-dark";
  if (score >= 55) return "bg-warn-soft text-warn";
  return "bg-[#f1efea] text-muted";
}

export function JobList({ jobs, selectedId, onSelect }: { jobs: Job[]; selectedId?: string; onSelect: (job: Job) => void }) {
  return (
    <ul className="grid gap-2.5">
      {jobs.map((job) => (
        <li key={job.id}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => onSelect(job)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(job))}
            className={`enter block w-full cursor-pointer rounded-2xl border p-4 text-left transition hover:border-line-strong ${selectedId === job.id ? "border-accent bg-[#f6f9f7] shadow-[inset_3px_0_0_var(--accent)]" : "border-line bg-card"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold leading-snug tracking-tight">{job.title}</h3>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                  <span className="inline-flex items-center gap-1"><Building2 size={13} aria-hidden />{job.company}</span>
                  {job.location && <span className="inline-flex items-center gap-1"><MapPin size={13} aria-hidden />{job.location}</span>}
                </p>
              </div>
              {job.quickFit !== undefined && (
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${fitTone(job.quickFit)}`} title="Quick fit from title, seniority and location. Open the job for a full match analysis.">
                  {job.quickFit}% fit
                </span>
              )}
            </div>
            {job.quickFitReason && <p className="mt-2.5 text-sm text-[#4c4b46]">{job.quickFitReason}</p>}
            <div className="mt-3 flex items-center gap-2 text-xs text-muted">
              <SourceBadge source={job.source} />
              {job.postedAt && <span>{timeAgo(job.postedAt)}</span>}
              <a
                href={job.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="ml-auto inline-flex items-center gap-0.5 hover:text-accent"
              >
                Original <ArrowUpRight size={13} aria-hidden />
              </a>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

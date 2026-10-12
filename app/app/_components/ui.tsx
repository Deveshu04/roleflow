import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-dark border border-accent",
  secondary: "bg-card text-ink border border-line-strong hover:border-accent hover:text-accent-dark",
  ghost: "text-muted hover:text-ink hover:bg-black/[.04] border border-transparent",
  danger: "bg-card text-danger border border-line-strong hover:border-danger",
};

export function Button({
  variant = "primary",
  busy,
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; busy?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || busy}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${className}`}
    >
      {busy && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function Card({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`scroll-mt-6 rounded-3xl border border-line bg-card p-5 sm:p-6 ${className}`}>
      {children}
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-bold uppercase tracking-[.16em] text-accent">{children}</p>;
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "error"; children: ReactNode }) {
  const cls =
    tone === "error"
      ? "border-[#efcfc8] bg-danger-soft text-danger"
      : tone === "warn"
        ? "border-[#ecdcb5] bg-warn-soft text-warn"
        : "border-[#d6e3dc] bg-soft text-accent-dark";
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-2xl border px-4 py-3 text-sm ${cls}`}>
      {children}
    </p>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-ink">
      {label}
      {children}
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm font-normal text-ink placeholder:text-[#a3a29c] outline-none transition focus:border-accent";

export function Spinner({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-accent" role="status">
      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> {label}
    </span>
  );
}

export function Logo() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
      <g transform="rotate(-30 12 12)">
        <circle cx="7.3" cy="3.2" r="1.45" />
        <rect x="5.5" y="4.7" width="3.6" height="14.6" rx="1.8" />
        <rect x="14.9" y="4.7" width="3.6" height="14.6" rx="1.8" />
        <circle cx="16.7" cy="20.8" r="1.45" />
      </g>
    </svg>
  );
}

const SOURCE_LABEL: Record<string, string> = {
  linkedin: "LinkedIn",
  greenhouse: "Greenhouse",
  lever: "Lever",
  ashby: "Ashby",
  web: "Web",
};
export function SourceBadge({ source }: { source: string }) {
  return (
    <span className="rounded-full border border-line bg-paper px-2 py-0.5 text-[11px] font-semibold text-muted">
      {SOURCE_LABEL[source] ?? source}
    </span>
  );
}

"use client";
import { ChevronDown, Download, FileText, Github, Linkedin, Mail, MapPin, Phone, Upload } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import type { Preferences, Profile, ResumeData, ResumeVersion } from "@/lib/types";
import { api, errorText } from "./api";
import { Button, Card, Eyebrow, Field, inputCls, Notice, Spinner } from "./ui";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

type Contact = ResumeData["contact"];
const CONTACT_FIELDS: { key: keyof Contact; label: string; placeholder: string }[] = [
  { key: "location", label: "Current location", placeholder: "e.g. Bengaluru, Karnataka, India" },
  { key: "phone", label: "Phone (with country code)", placeholder: "e.g. +91 98765 43210" },
  { key: "linkedin", label: "LinkedIn profile URL", placeholder: "https://www.linkedin.com/in/…" },
  { key: "website", label: "Portfolio / website", placeholder: "Optional" },
];

const PREF_FIELDS: { key: keyof Preferences; label: string; placeholder: string; long?: boolean }[] = [
  { key: "workAuthorization", label: "Work authorization", placeholder: "e.g. Indian citizen, authorized to work in India" },
  { key: "requiresSponsorship", label: "Needs visa sponsorship?", placeholder: "Yes / No" },
  { key: "yearsOfExperience", label: "Years of experience", placeholder: "e.g. 2" },
  { key: "noticePeriod", label: "Notice period / start date", placeholder: "e.g. 30 days" },
  { key: "currentCompensation", label: "Current compensation", placeholder: "e.g. 12 LPA" },
  { key: "expectedCompensation", label: "Expected compensation", placeholder: "e.g. 18 LPA" },
  { key: "willingToRelocate", label: "Willing to relocate?", placeholder: "Yes / No / Within India" },
  { key: "pronouns", label: "Pronouns (optional)", placeholder: "Leave blank to skip" },
  { key: "demographics", label: "EEO / demographic questions", placeholder: "Decline to self-identify" },
  { key: "extraNotes", label: "Anything else the agent should know", placeholder: "e.g. Prefer hybrid roles; available for interviews after 6pm", long: true },
];

export function ResumePanel({
  profile,
  versions,
  onChange,
}: {
  profile: Profile | null;
  versions: ResumeVersion[];
  onChange: () => Promise<void>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [drag, setDrag] = useState(false);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const resume = profile?.resume;
  const draft = prefs ?? profile?.preferences ?? null;
  const contactDraft = contact ?? resume?.contact ?? null;

  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("resume", file);
      await api("/api/resume", { method: "POST", body });
      await onChange();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    void upload(e.dataTransfer.files[0]);
  };

  const savePrefs = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await api("/api/profile", { method: "PUT", json: { preferences: draft, contact: contactDraft ?? undefined } });
      await onChange();
      setPrefs(null);
      setContact(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  const missing = draft
    ? [...(["workAuthorization", "requiresSponsorship", "noticePeriod", "expectedCompensation"] as const).filter((k) => !draft[k]), ...(contactDraft?.location ? [] : ["location"])]
    : [];

  return (
    <Card id="resume" className="enter">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Eyebrow>Your resume</Eyebrow>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">
            {resume ? resume.name : <>Start with your <span className="serif text-[1.15em] text-muted">resume</span></>}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {resume
              ? resume.headline || "Parsed with OpenAI. The agent only uses facts from here and your application details."
              : "Upload a PDF or DOCX. It's parsed with OpenAI and used to match, tailor and fill applications."}
          </p>
        </div>
        {resume && (
          <Button variant="secondary" onClick={() => input.current?.click()} busy={uploading}>
            <Upload size={15} /> Replace
          </Button>
        )}
      </div>

      <input ref={input} type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => void upload(e.target.files?.[0])} />

      {!resume && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          className={`mt-4 grid place-items-center rounded-2xl border border-dashed px-4 py-9 text-center transition ${drag ? "border-accent bg-soft" : "border-line-strong bg-paper"}`}
        >
          {uploading ? (
            <Spinner label="Reading your resume…" />
          ) : (
            <>
              <FileText className="text-accent" />
              <p className="mt-2 text-sm font-medium">Drop your resume here</p>
              <p className="text-xs text-muted">PDF or DOCX, up to 8 MB</p>
              <Button className="mt-3" onClick={() => input.current?.click()}>
                <Upload size={15} /> Choose file
              </Button>
            </>
          )}
        </div>
      )}

      {error && <div className="mt-4"><Notice tone="error">{error}</Notice></div>}

      {resume && (
        <>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            {resume.contact.email && <span className="inline-flex items-center gap-1.5"><Mail size={14} />{resume.contact.email}</span>}
            {resume.contact.phone && <span className="inline-flex items-center gap-1.5"><Phone size={14} />{resume.contact.phone}</span>}
            {resume.contact.location && <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{resume.contact.location}</span>}
            {resume.contact.linkedin && <a className="inline-flex items-center gap-1.5 hover:text-accent" href={resume.contact.linkedin} target="_blank" rel="noreferrer"><Linkedin size={14} />LinkedIn</a>}
            {resume.contact.github && <a className="inline-flex items-center gap-1.5 hover:text-accent" href={resume.contact.github} target="_blank" rel="noreferrer"><Github size={14} />GitHub</a>}
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {resume.skills.flatMap((g) => g.items).slice(0, 18).map((s) => (
              <span key={s} className="rounded-full bg-soft px-2.5 py-1 text-xs font-medium text-accent-dark">{s}</span>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            {plural(resume.experience.length, "role", "roles")} · {plural(resume.projects.length, "project", "projects")} ·{" "}
            {plural(resume.education.length, "education entry", "education entries")} parsed
          </p>

          {missing.length > 0 && !open && (
            <div className="mt-4">
              <Notice tone="warn">
                Add your application details (location, work authorization, notice period, salary) so the agent doesn&apos;t have to stop and ask.
              </Notice>
            </div>
          )}

          <button
            onClick={() => setOpen(!open)}
            className="mt-4 flex w-full items-center justify-between rounded-xl border border-line px-4 py-3 text-left text-sm font-semibold hover:border-line-strong"
            aria-expanded={open}
          >
            Application details the agent may use
            <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
          </button>
          {open && draft && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {contactDraft &&
                CONTACT_FIELDS.map((f) => (
                  <Field key={f.key} label={f.label}>
                    <input className={inputCls} placeholder={f.placeholder} value={contactDraft[f.key]} onChange={(e) => setContact({ ...contactDraft, [f.key]: e.target.value })} />
                  </Field>
                ))}
              {PREF_FIELDS.map((f) => (
                <div key={f.key} className={f.long ? "sm:col-span-2" : ""}>
                  <Field label={f.label}>
                    {f.long ? (
                      <textarea rows={2} className={inputCls} placeholder={f.placeholder} value={draft[f.key]} onChange={(e) => setPrefs({ ...draft, [f.key]: e.target.value })} />
                    ) : (
                      <input className={inputCls} placeholder={f.placeholder} value={draft[f.key]} onChange={(e) => setPrefs({ ...draft, [f.key]: e.target.value })} />
                    )}
                  </Field>
                </div>
              ))}
              <div className="flex items-center gap-3 sm:col-span-2">
                <Button onClick={savePrefs} busy={saving} disabled={!prefs && !contact}>Save details</Button>
                {saved && <span className="text-sm text-accent">Saved</span>}
              </div>
              {profile!.answers.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="mt-2 text-sm font-semibold">Answers you gave the agent</p>
                  <ul className="mt-2 grid gap-2">
                    {profile!.answers.slice(-6).reverse().map((a) => (
                      <li key={a.savedAt} className="rounded-xl bg-paper px-3 py-2 text-xs text-muted">
                        <span className="font-medium text-ink">{a.question}</span>
                        <br />
                        {a.answer}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {versions.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-semibold">Resume versions</p>
              <ul className="mt-2 grid gap-2">
                {versions.slice(0, 6).map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{v.label}</span>
                      <span className="text-xs text-muted">
                        {v.kind === "tailored" ? "Tailored PDF + cover letter" : "Original upload"} · {new Date(v.createdAt).toLocaleDateString()}
                      </span>
                    </span>
                    <a href={`/api/resume/${v.id}?download`} className="shrink-0 rounded-lg p-2 text-muted hover:bg-paper hover:text-accent" aria-label={`Download ${v.label}`}>
                      <Download size={16} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

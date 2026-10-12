import mammoth from "mammoth";
import { extractLinks, extractText, getDocumentProxy } from "unpdf";
import { GROUNDING_RULES, structured, UserFacingError } from "../ai";
import type { ResumeData } from "../types";
import { resumeSchema } from "./schema";

export async function extractResumeText(buffer: Buffer, fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    // Hyperlinks (LinkedIn, GitHub, portfolio) are often hidden behind link text.
    const { links } = await extractLinks(pdf).catch(() => ({ links: [] as string[] }));
    const unique = [...new Set(links.filter((l) => /^https?:|^mailto:/i.test(l)))];
    return unique.length ? `${text}\n\nHyperlinks in document:\n${unique.join("\n")}` : text;
  }
  if (lower.endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }
  throw new UserFacingError("Please upload a PDF or DOCX resume.");
}

// PDF text keeps visual line wraps.
function unwrap<T>(value: T): T {
  if (typeof value === "string") return value.replace(/\s*\n\s*/g, " ").trim() as T;
  if (Array.isArray(value)) return value.map(unwrap) as T;
  if (value && typeof value === "object")
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, unwrap(v)])) as T;
  return value;
}

export async function structureResume(text: string): Promise<ResumeData> {
  if (text.replace(/\s/g, "").length < 200)
    throw new UserFacingError(
      "We couldn't read enough text from that file. If it's a scanned PDF, export a text-based PDF or DOCX instead.",
    );
  const resume = await structured({
    schema: resumeSchema,
    name: "resume",
    instructions: `You convert resume text into structured JSON exactly as written.
${GROUNDING_RULES}
- Copy wording faithfully; do not improve, summarise or add bullets. Use "" or [] when a field is absent.
- Dates stay in the resume's own format (e.g. "Jun 2023", "Present").
- If the resume has no summary section, leave summary empty.`,
    input: text.slice(0, 30000),
  });
  return unwrap(resume);
}

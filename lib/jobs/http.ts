import { parse } from "node-html-parser";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

export class FetchError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function fetchText(url: string, init: RequestInit = {}) {
  const res = await fetch(url, {
    ...init,
    headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9", ...init.headers },
    signal: init.signal ?? AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  if (!res.ok) throw new FetchError(`${res.status} from ${new URL(url).host}`, res.status);
  return res.text();
}

export async function fetchJson<T>(url: string) {
  return JSON.parse(await fetchText(url, { headers: { Accept: "application/json" } })) as T;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'", nbsp: " " };
export const decodeEntities = (s: string) =>
  s
    .replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (_, e: string) => ENTITIES[e])
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCharCode(parseInt(n, 16)));

export function htmlToText(html: string) {
  const root = parse(html.includes("&lt;") && !html.includes("<p") ? decodeEntities(html) : html);
  root.querySelectorAll("script,style,noscript").forEach((n) => n.remove());
  root.querySelectorAll("li").forEach((li) => li.insertAdjacentHTML("afterbegin", "• "));
  root.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  root.querySelectorAll("p,div,li,h1,h2,h3,h4,h5,h6,ul,ol,tr,section").forEach((n) => n.insertAdjacentHTML("afterend", "\n"));
  return decodeEntities(root.textContent)
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

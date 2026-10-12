import type { Frame, Locator, Page } from "playwright";
import { frameForId, type SnapElement, type Snapshot } from "./snapshot";

export class ActionError extends Error {}

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export function optionScore(option: string, wanted: string) {
  const o = norm(option);
  const w = norm(wanted);
  if (!o || !w) return 0;
  if (o === w) return 100;
  if (o.startsWith(w) || w.startsWith(o)) return 85;
  if (o.includes(w) || w.includes(o)) return 70;
  const ot = [...new Set(o.split(" "))];
  const wt = w.split(" ");
  // Abbreviations count as matches ("ind" ~ "india").
  const same = (a: string, b: string) => a === b || (Math.min(a.length, b.length) >= 3 && (a.startsWith(b) || b.startsWith(a)));
  const overlap = wt.filter((t) => ot.some((x) => same(x, t))).length;
  return Math.round((overlap / Math.max(ot.length, wt.length)) * 60);
}

function element(snap: Snapshot, id: string) {
  const el = snap.elements.find((e) => e.id === id);
  const frame = frameForId(snap, id);
  if (!el || !frame) throw new ActionError(`element ${id} is not on the current page`);
  return { el, frame, loc: frame.locator(`[data-ja="${id}"]`).first() };
}

const describe = (el: SnapElement) => `"${(el.group ? `${el.group} → ` : "") + (el.label || el.context || el.id)}"`.slice(0, 120);

async function robustClick(loc: Locator) {
  try {
    await loc.click({ timeout: 5000 });
  } catch {
    try {
      await loc.scrollIntoViewIfNeeded({ timeout: 2000 });
      await loc.click({ timeout: 3000, force: true });
    } catch {
      await loc.evaluate((node: HTMLElement) => node.click());
    }
  }
}

async function visibleOptions(frame: Frame) {
  return frame.evaluate(() => {
    const seen = new Set<Element>();
    const out: { index: number; text: string }[] = [];
    const all = Array.from(
      document.querySelectorAll(
        '[role="option"], [id*="-option-"], .select__option, ul[role="listbox"] li, .pac-item, .dropdown-location, [class*="dropdown-results"] > *, [class*="suggestion-item"], [class*="suggestion"] li, [class*="autocomplete"] li, [class*="typeahead"] li',
      ),
    );
    document.querySelectorAll("[data-ja-opt]").forEach((n) => n.removeAttribute("data-ja-opt"));
    const visible = all.filter((node) => {
      if (seen.has(node)) return false;
      seen.add(node);
      const r = node.getBoundingClientRect();
      const s = getComputedStyle(node);
      return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && Boolean((node as HTMLElement).innerText?.trim());
    });
    // Innermost matches only, so a list container isn't treated as an option.
    visible
      .filter((node) => !visible.some((other) => other !== node && node.contains(other)))
      .forEach((node) => {
        node.setAttribute("data-ja-opt", String(out.length));
        out.push({ index: out.length, text: (node as HTMLElement).innerText.replace(/\s+/g, " ").trim().slice(0, 120) });
      });
    return out;
  });
}

async function waitForOptions(frame: Frame, ms: number) {
  for (let waited = 0; waited < ms; waited += 300) {
    await frame.page().waitForTimeout(300);
    const options = await visibleOptions(frame);
    if (options.length) return options;
  }
  return [];
}

const bestOption = (options: { index: number; text: string }[], value: string) =>
  options.map((o) => ({ ...o, score: optionScore(o.text, value) })).sort((a, b) => b.score - a.score)[0];

async function pickFromCombobox(frame: Frame, loc: Locator, value: string, el: SnapElement) {
  await robustClick(loc);
  const editable = await loc.evaluate((n) => n instanceof HTMLInputElement || (n as HTMLElement).isContentEditable).catch(() => false);
  let options: { index: number; text: string }[];
  if (editable) {
    await loc.fill("").catch(() => {});
    await loc.pressSequentially(value.slice(0, 60), { delay: 25 });
    options = await waitForOptions(frame, 2700);
  } else options = await waitForOptions(frame, 1500);

  let best = options.length ? bestOption(options, value) : undefined;
  if ((!best || best.score < 40) && editable) {
    // Typed text may not filter well; list every option instead.
    await loc.fill("").catch(() => {});
    const all = await waitForOptions(frame, 1500);
    if (all.length) {
      options = all;
      best = bestOption(all, value);
    }
  }
  if (!options.length && editable) {
    // Free-text combobox: keep the typed value.
    await loc.pressSequentially(value.slice(0, 60), { delay: 15 });
    await loc.press("Tab").catch(() => {});
    return `typed "${value}" into ${describe(el)} (no dropdown options appeared — verify it stuck)`;
  }
  if (!best || best.score < 40) {
    await loc.press("Escape").catch(() => {});
    throw new ActionError(
      `no option in ${describe(el)} matched "${value}". Options shown: ${options.map((o) => o.text).slice(0, 30).join(" | ") || "none"}`,
    );
  }
  await robustClick(frame.locator(`[data-ja-opt="${best.index}"]`).first());
  return `chose "${best.text}" in ${describe(el)}`;
}

async function pickNewSuggestion(frame: Frame, before: Set<string>, value: string, ms: number) {
  for (let waited = 0; waited < ms; waited += 300) {
    await frame.page().waitForTimeout(300);
    const fresh = (await visibleOptions(frame)).filter((o) => !before.has(o.text));
    if (!fresh.length) continue;
    const best = bestOption(fresh, value);
    if (best.score >= 40) {
      await robustClick(frame.locator(`[data-ja-opt="${best.index}"]`).first());
      return best.text;
    }
  }
  return null;
}

const readValue = (loc: Locator) =>
  loc
    .evaluate((n) => (n instanceof HTMLInputElement || n instanceof HTMLTextAreaElement ? n.value : (n as HTMLElement).innerText))
    .catch(() => "");

async function fillText(frame: Frame, loc: Locator, value: string, el: SnapElement) {
  const before = new Set((await visibleOptions(frame)).map((o) => o.text));
  const plainText = el.kind === "input" && (!el.type || el.type === "text" || el.type === "search");
  try {
    await loc.fill(value, { timeout: 5000 });
  } catch {
    await robustClick(loc);
    await frame.page().keyboard.press("Control+A");
    await frame.page().keyboard.type(value, { delay: 5 });
  }
  if (plainText) {
    // Type-aheads (e.g. Lever's location) only keep a picked suggestion.
    const picked = await pickNewSuggestion(frame, before, value, 900);
    if (picked) return `chose suggestion "${picked}" for ${describe(el)}`;
  }
  await loc.evaluate((n: HTMLElement) => n.blur()).catch(() => {});
  await frame.page().waitForTimeout(250);
  if ((await readValue(loc)).trim() || !value.trim()) return `filled ${describe(el)}`;

  if (plainText) {
    // Cleared on blur: retype with real key presses, then try the city alone.
    for (const attempt of [...new Set([value, value.split(",")[0].trim()])]) {
      await robustClick(loc);
      await loc.fill("").catch(() => {});
      await loc.pressSequentially(attempt.slice(0, 40), { delay: 40 });
      const picked = await pickNewSuggestion(frame, before, value, 2500);
      if (picked) return `chose suggestion "${picked}" for ${describe(el)}`;
    }
    await loc.press("Escape").catch(() => {});
  }
  throw new ActionError(`${describe(el)} did not keep "${value}" — it likely needs an option picked from its suggestions or a different format`);
}

async function selectNative(loc: Locator, value: string, el: SnapElement) {
  const options = await loc.evaluate((n: HTMLSelectElement) => Array.from(n.options).map((o) => ({ text: o.text.trim(), value: o.value })));
  const best = options
    .filter((o) => o.value !== "" || o.text)
    .map((o) => ({ ...o, score: Math.max(optionScore(o.text, value), optionScore(o.value, value)) }))
    .sort((a, b) => b.score - a.score)[0];
  if (!best || best.score < 40)
    throw new ActionError(`no option in ${describe(el)} matched "${value}". Options: ${options.map((o) => o.text).slice(0, 30).join(" | ")}`);
  await loc.selectOption({ value: best.value }, { timeout: 5000 });
  return `selected "${best.text}" in ${describe(el)}`;
}

async function setToggle(loc: Locator, want: boolean, el: SnapElement) {
  const read = () => loc.evaluate((n) => (n instanceof HTMLInputElement ? n.checked : n.getAttribute("aria-checked") === "true"));
  if ((await read()) !== want) {
    try {
      await loc.setChecked(want, { timeout: 3000, force: true });
    } catch {
      /* fall through to a DOM click */
    }
    if ((await read()) !== want) await loc.evaluate((n: HTMLElement) => n.click());
    if ((await read()) !== want) {
      // Visually hidden input: click its label.
      await loc.evaluate((n: HTMLInputElement) => (n.labels?.[0] as HTMLElement | undefined)?.click());
    }
  }
  const ok = (await read()) === want;
  if (!ok) throw new ActionError(`could not ${want ? "check" : "uncheck"} ${describe(el)}`);
  return `${want ? "checked" : "unchecked"} ${describe(el)}`;
}

export async function fillField(snap: Snapshot, id: string, value: string) {
  const { el, frame, loc } = element(snap, id);
  switch (el.kind) {
    case "select":
      return selectNative(loc, value, el);
    case "combobox":
      return pickFromCombobox(frame, loc, value, el);
    case "checkbox":
      return setToggle(loc, /^(true|yes|checked|on|1|agree|accept)/i.test(value.trim()), el);
    case "radio":
      return setToggle(loc, true, el);
    case "option":
    case "button":
    case "link":
      await robustClick(loc);
      return `clicked ${describe(el)}`;
    case "file":
      throw new ActionError("use upload_file for file inputs");
    default:
      return fillText(frame, loc, value, el);
  }
}

export async function clickElement(snap: Snapshot, id: string) {
  const { el, loc } = element(snap, id);
  await robustClick(loc);
  return { el, message: `clicked ${describe(el)}` };
}

export async function uploadFile(page: Page, snap: Snapshot, id: string, filePath: string) {
  const { el, loc } = element(snap, id);
  if (el.kind === "file") {
    await loc.setInputFiles(filePath, { timeout: 8000 });
  } else {
    const [chooser] = await Promise.all([page.waitForEvent("filechooser", { timeout: 6000 }), robustClick(loc)]);
    await chooser.setFiles(filePath);
  }
  return `uploaded file into ${describe(el)}`;
}

export const elementLabel = (snap: Snapshot, id: string) => {
  const el = snap.elements.find((e) => e.id === id);
  return el ? el.label || el.context || el.id : id;
};

export const isSubmitLike = (label: string) => /\bsubmit\b|send application|finish application/i.test(label);

// Uses the browser's own constraint validation.
export async function invalidFields(snap: Snapshot, submitId: string) {
  const { loc } = element(snap, submitId);
  return loc
    .evaluate((btn: HTMLElement) => {
      const form = (btn as HTMLButtonElement).form || btn.closest("form");
      if (!form) return [] as string[];
      const names = Array.from(form.querySelectorAll(":invalid"))
        .filter((x) => x.tagName !== "FORM" && x.tagName !== "FIELDSET")
        .map((x) => {
          const e = x as HTMLInputElement;
          const toggle = e.type === "radio" || e.type === "checkbox";
          // Prefer the visible question over internal names like "cards[…][field0]".
          let label = toggle ? "" : e.labels?.[0]?.innerText || e.getAttribute("aria-label") || "";
          if (!label) label = e.closest("fieldset")?.querySelector("legend")?.textContent || "";
          for (let p = e.parentElement, i = 0; !label && p && i < 4; p = p.parentElement, i++) {
            const text = (p as HTMLElement).innerText?.split("\n").find((line) => line.trim().length > 2);
            if (text && p.querySelectorAll("input,select,textarea").length <= (toggle ? 12 : 1)) label = text;
          }
          return (label || e.name || "a field").replace(/\s+/g, " ").trim().slice(0, 80);
        });
      return [...new Set(names)].slice(0, 12);
    })
    .catch(() => [] as string[]);
}

const DEMOGRAPHIC =
  /\b(gender|sex|race|racial|ethnic\w*|hispanic|latin[oax]|veteran|disabilit\w*|age|sexual orientation|transgender|lgbt\w*|asian|white|black|african|caucasian|native|pacific islander|indigenous|male|female|non-binary|woman|man)\b|\b\d{2}\s*(?:-|–|to)\s*\d{2}\b|\b\d{2}\s*(?:or|and)\s*(?:younger|older|over|under|above)\b/i;
export const DECLINE = /decline|prefer not|don.?t wish|do not wish|not to (?:say|answer|disclose|identify)|rather not|choose not/i;

// Enforces "decline to self-identify" so the model can't guess race, gender, age, etc.
export function demographicBlock(snap: Snapshot, id: string, value: string) {
  const el = snap.elements.find((e) => e.id === id);
  if (!el) return null;
  let chosen: string;
  if (el.kind === "checkbox") {
    if (!/^(true|yes|checked|on|1)/i.test(value.trim())) return null;
    chosen = el.label;
  } else if (el.kind === "radio" || el.kind === "option") chosen = el.label;
  else if (el.kind === "select" || el.kind === "combobox") chosen = value;
  else return null;
  const question = `${el.group ?? ""} ${el.label} ${el.context ?? ""}`;
  if (!DEMOGRAPHIC.test(question) || DECLINE.test(chosen)) return null;
  return `BLOCKED: ${describe(el)} is a demographic question and the candidate declines to self-identify. Pick a decline / prefer-not-to-say option if one exists; otherwise leave it blank.`;
}

import type { Frame, Page } from "playwright";

export type SnapElement = {
  id: string;
  kind: string;
  label: string;
  type?: string;
  required?: boolean;
  value?: string;
  checked?: boolean;
  options?: string[];
  moreOptions?: number;
  group?: string;
  context?: string;
  invalid?: boolean;
  disabled?: boolean;
  files?: string[];
  accept?: string;
  href?: string;
};

type FrameSnap = { url: string; title: string; elements: SnapElement[]; errors: string[]; text: string; modal: boolean };

export type Snapshot = {
  url: string;
  title: string;
  elements: SnapElement[];
  errors: string[];
  text: string;
  modal: boolean;
  captcha: boolean;
  frames: Map<string, Frame>;
};

// Plain-JS string: it runs inside the page, so it can't rely on compiler-injected helpers.
const SNAPSHOT_SCRIPT = String.raw`(function (opts) {
  var prefix = opts.prefix, doc = document, counter = 0;
  function txt(s, n) { s = (s || '').replace(/\s+/g, ' ').trim(); return n && s.length > n ? s.slice(0, n) + '…' : s; }
  function visible(el) {
    if (!el || !el.isConnected) return false;
    var s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') return false;
    var r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  }
  function byIds(ids) { return ids.split(/\s+/).map(function (id) { var e = doc.getElementById(id); return e ? (e.innerText || e.textContent || '') : ''; }).join(' '); }
  function labelOf(el) {
    var a = el.getAttribute('aria-label'); if (a && a.trim()) return txt(a, 180);
    var lb = el.getAttribute('aria-labelledby'); if (lb) { var t = txt(byIds(lb), 180); if (t) return t; }
    if (el.labels && el.labels.length) { var t2 = txt(Array.prototype.map.call(el.labels, function (x) { return x.innerText || x.textContent; }).join(' '), 180); if (t2) return t2; }
    var wrap = el.closest('label'); if (wrap) { var t3 = txt(wrap.innerText, 180); if (t3) return t3; }
    var tag = el.tagName;
    if (tag === 'BUTTON' || tag === 'A' || el.getAttribute('role') === 'button' || el.getAttribute('role') === 'option' || el.getAttribute('role') === 'link' || el.getAttribute('role') === 'tab' || el.getAttribute('role') === 'menuitem') {
      var t4 = txt(el.innerText || el.textContent, 120); if (t4) return t4;
    }
    if (el.placeholder) return txt(el.placeholder, 120);
    if (el.title) return txt(el.title, 120);
    if (tag === 'INPUT' && el.value && /^(submit|button)$/i.test(el.type)) return txt(el.value, 80);
    return '';
  }
  function groupOf(el) {
    var fs = el.closest('fieldset'); if (fs) { var lg = fs.querySelector('legend'); if (lg) { var t = txt(lg.innerText || lg.textContent, 220); if (t) return t; } }
    var g = el.closest('[role=radiogroup],[role=group]');
    if (g) { var gl = g.getAttribute('aria-label') || (g.getAttribute('aria-labelledby') ? byIds(g.getAttribute('aria-labelledby')) : ''); if (gl) return txt(gl, 220); }
    // No fieldset/ARIA group: use the leading text of the nearest container of options.
    var sel = el.tagName === 'INPUT' ? 'input[type=' + el.type + ']' : '[role=' + el.getAttribute('role') + ']';
    var a = el.parentElement;
    for (var i = 0; i < 6 && a && a !== doc.body; i++, a = a.parentElement) {
      if (a.querySelectorAll(sel).length > 1) {
        for (var c = a.firstElementChild; c; c = c.nextElementSibling) {
          if (c.querySelector(sel) || c.matches(sel)) break;
          var q = txt(c.innerText, 220); if (q) return q;
        }
        var prev = a.previousElementSibling; if (prev) { var pq = txt(prev.innerText, 220); if (pq) return pq; }
        break;
      }
    }
    return '';
  }
  function contextOf(el) {
    var p = el.parentElement;
    for (var i = 0; i < 4 && p; i++, p = p.parentElement) { var t = txt(p.innerText, 160); if (t.length > 2) return t; }
    return '';
  }
  var modals = Array.prototype.filter.call(doc.querySelectorAll('[role=dialog][aria-modal=true],dialog[open],.artdeco-modal,[role=alertdialog]'), function (d) {
    if (!visible(d)) return false; var r = d.getBoundingClientRect(); return r.width > 260 && r.height > 160 && d.querySelector('input,select,textarea,button');
  });
  var root = modals.length ? modals[modals.length - 1] : doc.body;
  if (!root) return { url: location.href, title: doc.title, elements: [], errors: [], text: '', modal: false };
  var SEL = 'input:not([type=hidden]),textarea,select,button,a[href],[role=button],[role=link],[role=combobox],[role=option],[role=checkbox],[role=radio],[role=switch],[role=textbox],[role=menuitem],[role=tab],[contenteditable=""],[contenteditable=true],summary';
  (function clear(r) {
    Array.prototype.forEach.call(r.querySelectorAll('[data-ja]'), function (e) { e.removeAttribute('data-ja'); });
    Array.prototype.forEach.call(r.querySelectorAll('*'), function (e) { if (e.shadowRoot) clear(e.shadowRoot); });
  })(doc);
  var nodes = [];
  (function collect(r) {
    Array.prototype.forEach.call(r.querySelectorAll(SEL), function (e) { nodes.push(e); });
    Array.prototype.forEach.call(r.querySelectorAll('*'), function (e) { if (e.shadowRoot) collect(e.shadowRoot); });
  })(root);
  var KEY = /apply|next|continue|submit|review|sign|log ?in|accept|cookie|agree|upload|resume|attach|save|close|dismiss|got it/i;
  var out = [], links = [];
  nodes.forEach(function (el) {
    var tag = el.tagName.toLowerCase(), type = (el.getAttribute('type') || '').toLowerCase(), role = (el.getAttribute('role') || '').toLowerCase();
    var kind;
    if (tag === 'select') kind = 'select';
    else if (tag === 'textarea') kind = 'textarea';
    else if (tag === 'input') kind = type === 'file' ? 'file' : type === 'checkbox' ? 'checkbox' : type === 'radio' ? 'radio' : (role === 'combobox' || el.getAttribute('aria-autocomplete') || el.getAttribute('list')) ? 'combobox' : /^(submit|button|reset|image)$/.test(type) ? 'button' : 'input';
    else if (role === 'combobox') kind = 'combobox';
    else if (role === 'checkbox' || role === 'switch') kind = 'checkbox';
    else if (role === 'radio') kind = 'radio';
    else if (role === 'option') kind = 'option';
    else if (role === 'textbox' || el.isContentEditable) kind = 'textbox';
    else if (tag === 'a' || role === 'link') kind = 'link';
    else kind = 'button';
    var hiddenControl = kind === 'file' || ((kind === 'checkbox' || kind === 'radio') && tag === 'input');
    if (!visible(el)) {
      if (!hiddenControl) return;
      if (kind !== 'file') {
        var lbls = el.labels ? Array.prototype.slice.call(el.labels) : [];
        if (!lbls.some(visible) && !visible(el.parentElement)) return;
      }
    }
    var label = labelOf(el);
    if ((kind === 'link' || kind === 'button') && !label) return;
    var item = { kind: kind, label: label };
    if (kind === 'input' && type && type !== 'text') item.type = type;
    if (el.required || el.getAttribute('aria-required') === 'true' || /\*\s*$/.test(label)) item.required = true;
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') item.disabled = true;
    if (el.getAttribute('aria-invalid') === 'true') item.invalid = true;
    if (kind === 'input' || kind === 'textarea' || kind === 'combobox') { if (el.value) item.value = txt(el.value, 100); }
    if (kind === 'textbox') { var tv = txt(el.innerText, 100); if (tv) item.value = tv; }
    if (kind === 'combobox' && !item.value) { var c = contextOf(el); if (c && c !== label) item.context = c; }
    if (kind === 'select') {
      var opts2 = Array.prototype.map.call(el.options, function (o) { return txt(o.text, 70); });
      item.options = opts2.slice(0, 60); if (opts2.length > 60) item.moreOptions = opts2.length - 60;
      var sel = el.options[el.selectedIndex]; if (sel && sel.value) item.value = txt(sel.text, 70);
    }
    if (kind === 'checkbox' || kind === 'radio') {
      item.checked = tag === 'input' ? el.checked : el.getAttribute('aria-checked') === 'true';
      var g = groupOf(el); if (g && g !== label) item.group = g;
    }
    if (kind === 'option' && el.getAttribute('aria-selected') === 'true') item.checked = true;
    if (kind === 'file') { item.accept = el.getAttribute('accept') || ''; item.files = Array.prototype.map.call(el.files || [], function (f) { return f.name; }); if (!label) { var cx = contextOf(el); if (cx) item.label = cx; } }
    if (kind === 'input' || kind === 'textarea' || kind === 'select') { if (!label) { var cx2 = contextOf(el); if (cx2) item.context = cx2; } }
    if (kind === 'link') { var h = el.getAttribute('href') || ''; if (h && h.indexOf('javascript:') !== 0) item.href = h.length > 90 ? h.slice(0, 90) + '…' : h; }
    item.el = el;
    if (kind === 'link') links.push(item); else out.push(item);
  });
  var keepLinks = links.length <= 40 ? links : links.filter(function (l) { return KEY.test(l.label) || l.el.closest('form,main,[role=dialog]'); }).slice(0, 40);
  var all = out.concat(keepLinks);
  all.sort(function (a, b) { var p = a.el.compareDocumentPosition(b.el); return p & 4 ? -1 : p & 2 ? 1 : 0; });
  all = all.slice(0, opts.max);
  all.forEach(function (item) { item.id = prefix + (++counter); item.el.setAttribute('data-ja', item.id); delete item.el; });
  var errors = [];
  Array.prototype.forEach.call(root.querySelectorAll('[role=alert],[aria-live=assertive],.error,.errors,[class*=error-message],[class*=field-error],[class*="error_"],[id*=error]'), function (e) {
    if (errors.length < 12 && visible(e)) { var t = txt(e.innerText, 160); if (t && errors.indexOf(t) < 0) errors.push(t); }
  });
  return { url: location.href, title: doc.title, elements: all, errors: errors, text: txt(root.innerText, opts.textLimit), modal: root !== doc.body };
})`;

export async function takeSnapshot(page: Page, textLimit = 3500): Promise<Snapshot> {
  const frames = new Map<string, Frame>();
  const snap: Snapshot = { url: page.url(), title: "", elements: [], errors: [], text: "", modal: false, captcha: false, frames };
  let index = 0;
  for (const frame of page.frames()) {
    const isMain = frame === page.mainFrame();
    const furl = frame.url();
    if (!isMain) {
      if (/recaptcha\/api2\/bframe|hcaptcha\.com|challenges\.cloudflare\.com/.test(furl)) {
        // Challenge frames are often preloaded full-screen but hidden.
        const shown = await frame
          .frameElement()
          .then((h) =>
            h.evaluate((el: Element) => {
              const r = el.getBoundingClientRect();
              const visible = el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
              return visible && r.width > 200 && r.height > 200 && r.bottom > 0 && r.top < innerHeight;
            }),
          )
          .catch(() => false);
        if (shown) snap.captcha = true;
        continue;
      }
      if (!furl || furl === "about:blank" || /recaptcha|hcaptcha|doubleclick|googletagmanager|facebook\.com\/tr/.test(furl)) continue;
      const box = await frame.frameElement().then((h) => h.boundingBox()).catch(() => null);
      if (!box || box.width < 120 || box.height < 80) continue;
    }
    const prefix = isMain ? "" : `f${++index}-`;
    let result: FrameSnap;
    try {
      result = await frame.evaluate(`${SNAPSHOT_SCRIPT}(${JSON.stringify({ prefix, max: isMain ? 260 : 200, textLimit: isMain ? textLimit : 2500 })})`);
    } catch {
      continue;
    }
    frames.set(prefix, frame);
    if (isMain) {
      snap.title = result.title;
      snap.text = result.text;
      snap.modal = result.modal;
    } else if (result.elements.length) {
      snap.text += `\n\n[Embedded frame ${prefix} ${new URL(result.url).host}]\n${result.text}`;
    }
    snap.elements.push(...result.elements);
    snap.errors.push(...result.errors);
  }
  return snap;
}

export function frameForId(snap: Snapshot, id: string) {
  const m = id.match(/^(f\d+-)/);
  return snap.frames.get(m ? m[1] : "") ?? null;
}

export function formatSnapshot(snap: Snapshot) {
  const lines = snap.elements.map((e) => {
    const bits = [`[${e.id}] ${e.kind}${e.type ? `(${e.type})` : ""}`];
    if (e.group) bits.push(`group="${e.group}"`);
    bits.push(`"${e.label || "(no label)"}"`);
    if (e.context) bits.push(`near="${e.context}"`);
    if (e.required) bits.push("required");
    if (e.disabled) bits.push("disabled");
    if (e.invalid) bits.push("INVALID");
    if (e.checked !== undefined) bits.push(e.checked ? "checked" : "unchecked");
    if (e.value) bits.push(`value="${e.value}"`);
    if (e.files) bits.push(e.files.length ? `attached=${e.files.join(",")}` : "no file attached");
    if (e.accept) bits.push(`accept=${e.accept}`);
    if (e.options) bits.push(`options=[${e.options.join(" | ")}${e.moreOptions ? ` | …${e.moreOptions} more` : ""}]`);
    if (e.href) bits.push(`href=${e.href}`);
    return bits.join(" ");
  });
  return lines.join("\n");
}

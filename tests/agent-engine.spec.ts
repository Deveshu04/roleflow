import { expect, test } from "@playwright/test";
import { mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { demographicBlock, fillField, invalidFields, isSubmitLike, uploadFile } from "../lib/agent/actions";
import { formatSnapshot, takeSnapshot } from "../lib/agent/snapshot";

// Agent form engine against fixtures modelled on Greenhouse, Lever and Ashby (no OpenAI calls).
const FORM = `<!doctype html><html><body>
<form>
  <label for="fn">First name *</label><input id="fn" required>
  <label>Email <input type="email" name="email"></label>
  <label for="country">Country</label>
  <select id="country"><option value="">Select…</option><option value="in">India</option><option value="us">United States</option></select>
  <fieldset><legend>Do you need visa sponsorship?</legend>
    <label><input type="radio" name="visa" value="yes"> Yes</label><label><input type="radio" name="visa" value="no"> No</label></fieldset>
  <div><div>Are you open to on-site work?</div>
    <div><label><input type="radio" name="onsite" value="y"> Yes</label><label><input type="radio" name="onsite" value="n"> No</label></div></div>
  <label><input type="checkbox" id="consent" style="position:absolute;opacity:0"> I agree to the privacy policy</label>
  <div><span id="cv-l">Resume/CV</span><input type="file" id="cv" aria-labelledby="cv-l" style="display:none"></div>
  <label for="city">City</label><input id="city" role="combobox" aria-autocomplete="list">
  <ul role="listbox" id="city-list" style="display:none"></ul>
  <button type="button">Submit application</button>
</form>
<script>
  const cities = ["Bengaluru, Karnataka, India", "Mumbai, Maharashtra, India", "Bengkulu, Indonesia"];
  const city = document.getElementById("city"), list = document.getElementById("city-list");
  city.addEventListener("input", () => {
    const v = city.value.toLowerCase();
    list.innerHTML = "";
    cities.filter((c) => c.toLowerCase().includes(v)).forEach((c) => {
      const li = document.createElement("li");
      li.setAttribute("role", "option");
      li.textContent = c;
      li.onclick = () => { city.value = c; list.style.display = "none"; };
      list.appendChild(li);
    });
    list.style.display = list.children.length ? "block" : "none";
  });
</script></body></html>`;

test("snapshot labels form controls the way the agent sees them", async ({ page }) => {
  await page.setContent(FORM);
  const snap = await takeSnapshot(page);
  const text = formatSnapshot(snap);
  expect(text).toMatch(/input "First name \*" required/);
  expect(text).toMatch(/select "Country" options=\[Select… \| India \| United States\]/);
  expect(text).toMatch(/radio group="Do you need visa sponsorship\?" "Yes"/);
  expect(text).toMatch(/radio group="Are you open to on-site work\?" "Yes"/);
  expect(text).toMatch(/checkbox "I agree to the privacy policy" unchecked/);
  expect(text).toMatch(/file "Resume\/CV" no file attached/);
  expect(text).toMatch(/combobox "City"/);
  expect(text).toMatch(/button "Submit application"/);
});

test("fills text, select, radio, hidden checkbox, autocomplete and file inputs", async ({ page }) => {
  await page.setContent(FORM);
  const snap = await takeSnapshot(page);
  const id = (pattern: RegExp) => snap.elements.find((e) => pattern.test(`${e.group ?? ""} ${e.label}`))!.id;

  await fillField(snap, id(/First name/), "Aarav");
  await fillField(snap, id(/^ Email/), "aarav@example.com");
  await fillField(snap, id(/Country/), "india");
  await fillField(snap, id(/visa sponsorship\? No/), "No");
  await fillField(snap, id(/privacy policy/), "true");
  expect(await fillField(snap, id(/City/), "Bengaluru")).toContain("Bengaluru, Karnataka, India");

  const dir = mkdtempSync(path.join(tmpdir(), "roleflow-"));
  const file = path.join(dir, "Aarav_Resume.pdf");
  writeFileSync(file, "%PDF-1.4 test");
  await uploadFile(page, snap, id(/Resume\/CV/), file);

  await expect(page.locator("#fn")).toHaveValue("Aarav");
  await expect(page.locator("input[name=email]")).toHaveValue("aarav@example.com");
  await expect(page.locator("#country")).toHaveValue("in");
  await expect(page.locator("input[name=visa][value=no]")).toBeChecked();
  await expect(page.locator("#consent")).toBeChecked();
  await expect(page.locator("#city")).toHaveValue("Bengaluru, Karnataka, India");
  expect(await page.locator("#cv").evaluate((n: HTMLInputElement) => n.files?.[0]?.name)).toBe("Aarav_Resume.pdf");
});

test("unmatched dropdown values fail loudly instead of guessing", async ({ page }) => {
  await page.setContent(FORM);
  const snap = await takeSnapshot(page);
  const country = snap.elements.find((e) => e.label === "Country")!.id;
  await expect(fillField(snap, country, "Atlantis")).rejects.toThrow(/no option .* matched "Atlantis"/);
});

test("final submit buttons are recognised for the approval gate", () => {
  expect(isSubmitLike("Submit application")).toBe(true);
  expect(isSubmitLike("Send application")).toBe(true);
  expect(isSubmitLike("Apply for this job")).toBe(false);
  expect(isSubmitLike("Next")).toBe(false);
});

// Lever's location field clears typed text on blur unless a suggestion is clicked.
const LEVER_LOCATION = `<!doctype html><html><body><form>
  <label><div>Current location <span>✱</span></div>
    <input class="location-input" id="loc" type="text" name="location" required>
    <div class="dropdown-container" style="display:none"><div class="dropdown-results"></div></div></label>
  <fieldset><legend>Race (voluntary)</legend>
    <label><input type="checkbox" name="race" value="asian"> Asian</label>
    <label><input type="checkbox" name="race" value="decline"> Decline to self-identify</label></fieldset>
  <label for="gender">Gender</label><select id="gender"><option value=""></option><option>Male</option><option>Female</option><option>Prefer not to say</option></select>
  <button type="submit">Submit application</button>
</form><script>
  const input = document.getElementById("loc"), box = document.querySelector(".dropdown-container"), results = document.querySelector(".dropdown-results");
  let picked = false;
  input.addEventListener("keyup", () => {
    picked = false;
    results.innerHTML = "";
    if (input.value.length < 2) return void (box.style.display = "none");
    ["Delhi, New Delhi, Delhi, IND", "Delhi, IND", "Delhi, OH, USA"].filter((c) => c.toLowerCase().startsWith(input.value.toLowerCase().slice(0, 3))).forEach((c) => {
      const d = document.createElement("div");
      d.className = "dropdown-location";
      d.textContent = c;
      d.addEventListener("mousedown", () => { input.value = c; picked = true; box.style.display = "none"; });
      results.appendChild(d);
    });
    box.style.display = results.children.length ? "flex" : "none";
  });
  input.addEventListener("blur", () => setTimeout(() => { if (!picked) input.value = ""; box.style.display = "none"; }, 100));
</script></body></html>`;

test("type-ahead fields get a suggestion picked instead of silently clearing", async ({ page }) => {
  await page.setContent(LEVER_LOCATION);
  const snap = await takeSnapshot(page);
  const loc = snap.elements.find((e) => /Current location/.test(e.label))!.id;
  expect(await fillField(snap, loc, "Delhi, India")).toMatch(/chose suggestion "Delhi, IND"/);
  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await page.waitForTimeout(300);
  await expect(page.locator("#loc")).toHaveValue("Delhi, IND");
});

test("submit is held back while required fields are empty", async ({ page }) => {
  await page.setContent(LEVER_LOCATION);
  const snap = await takeSnapshot(page);
  const submit = snap.elements.find((e) => e.label === "Submit application")!.id;
  expect(await invalidFields(snap, submit)).toEqual(["Current location ✱"]);
});

test("demographic answers are blocked unless they decline", async ({ page }) => {
  await page.setContent(LEVER_LOCATION);
  const snap = await takeSnapshot(page);
  const id = (label: string) => snap.elements.find((e) => e.label === label)!.id;
  expect(demographicBlock(snap, id("Asian"), "true")).toMatch(/BLOCKED/);
  expect(demographicBlock(snap, id("Asian"), "false")).toBeNull();
  expect(demographicBlock(snap, id("Decline to self-identify"), "true")).toBeNull();
  expect(demographicBlock(snap, id("Gender"), "Male")).toMatch(/BLOCKED/);
  expect(demographicBlock(snap, id("Gender"), "Prefer not to say")).toBeNull();
  expect(demographicBlock(snap, id("Current location ✱"), "Delhi")).toBeNull();
});

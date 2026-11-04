// Phase A step 2c: conflict (two visitors, same slot), receipt expiry, cancel with wrong then right code,
// slot freed afterwards, and a receipt lost by reload. Disposable audit DB only.
// Codes live only in memory; logs are redacted; receipt/cancel screenshots are masked.
import { writeFileSync } from "node:fs";
import { launch, url, settle, ensureDir, OUT } from "./audit-lib.mjs";

const A = await launch("kiosk"); // visitor A (will hit the conflict)
const B = await launch("kiosk"); // visitor B (books first)
const dir = `${OUT}/journeys/${A.ctx.label}`;
ensureDir(dir);
const CODEISH = /\b(?=[A-Za-z0-9_-]*\d)(?=[A-Za-z0-9_-]*[A-Za-z])[A-Za-z0-9_-]{8,}\b|\b\d{6,}\b/g;
const redact = (s) => (s || "").replace(CODEISH, "[REDACTED]");
const out = [];
const say = (k, v) => { out.push({ k, v }); console.log(`${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`); };

async function shot(page, name, mask = true) {
  await settle(page, 250);
  const opts = { path: `${dir}/B3-${name}.png` };
  if (mask) {
    await page.evaluate((src) => {
      const re = new RegExp(src, "g");
      document.querySelectorAll("main *").forEach((el) => {
        const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.nodeValue).join(" ");
        if (re.test(own)) el.setAttribute("data-audit-mask", "1");
        re.lastIndex = 0;
      });
      document.querySelectorAll("main input").forEach((el) => el.setAttribute("data-audit-mask", "1"));
    }, CODEISH.source);
    opts.mask = [page.locator("[data-audit-mask]")];
    opts.maskColor = "#444444";
  }
  await page.screenshot(opts);
}
const mainText = async (page) => redact(await page.evaluate(() => (document.querySelector("main")?.innerText ?? "").replace(/\s+/g, " ")));
const roleInfo = (page) => page.evaluate(() => ({ alerts: [...document.querySelectorAll('[role="alert"],[role="status"],[aria-live]')].map((e) => ({ role: e.getAttribute("role"), live: e.getAttribute("aria-live"), t: (e.innerText || "").replace(/\s+/g, " ").slice(0, 160) })) }));

async function toConfirm(page, slot) {
  await page.goto(url("/booking", "de"));
  await settle(page, 300);
  const box = page.getByRole("combobox").first();
  const opt = (await box.locator("option").allInnerTexts()).find((o) => /K1-120/.test(o));
  await box.selectOption({ label: opt });
  await settle(page, 500);
  await page.getByRole("button", { name: new RegExp("^" + slot) }).tap();
  await page.getByRole("button", { name: /Weiter zur Bestätigung/ }).tap();
  await page.getByRole("button", { name: /Demo-Reservierung bestätigen/ }).waitFor({ state: "attached" });
}
const finalConfirm = (page) => page.getByRole("button", { name: /Demo-Reservierung bestätigen/ });
const codes = async (page) => page.evaluate(() => {
  const val = (label) => { const el = [...document.querySelectorAll("main *")].find((e) => e.children.length === 0 && e.textContent.trim() === label); return el?.parentElement ? el.parentElement.innerText.replace(label, "").trim() : null; };
  return { number: val("Buchungsnummer"), code: val("Stornierungscode") };
});

// 1) A reaches the confirm step for 17:00, B books 17:00 completely first
await toConfirm(A.page, "17:00");
await toConfirm(B.page, "17:00");
await finalConfirm(B.page).scrollIntoViewIfNeeded();
say("confirm button in viewport before scroll (A)?", await A.page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => /Demo-Reservierung bestätigen/.test(x.innerText)); const r = b.getBoundingClientRect(); return { top: Math.round(r.top), vh: innerHeight, inViewport: r.bottom <= innerHeight && r.top >= 0 }; }));
await finalConfirm(B.page).tap();
await B.page.getByText(/Reservierung gespeichert/).waitFor({ timeout: 8000 });
const bc = await codes(B.page); // kept in memory only
say("B receipt shown; codes captured in memory?", !!(bc.number && bc.code));
await shot(B.page, "conflict-B-receipt");

// 2) A now confirms the same slot: conflict
await finalConfirm(A.page).scrollIntoViewIfNeeded();
await finalConfirm(A.page).tap();
await A.page.waitForTimeout(1500);
await shot(A.page, "conflict-A-after-confirm");
say("A after conflicting confirm: text", (await mainText(A.page)).slice(0, 700));
say("A live regions", await roleInfo(A.page));
const vis = await A.page.evaluate(() => { const e = [...document.querySelectorAll("main *")].find((x) => /belegt|vergeben|nicht mehr|Konflikt|already|taken/i.test(x.innerText || "") && x.children.length === 0); if (!e) return null; const r = e.getBoundingClientRect(); return { top: Math.round(r.top + scrollY), scrollY: Math.round(scrollY), vh: innerHeight, inViewport: r.top >= 0 && r.bottom <= innerHeight, text: e.innerText.slice(0, 120) }; });
say("A conflict message position", vis);
say("A 17:00 slot still offered?", await A.page.getByRole("button", { name: /^17:00/ }).count());

// 3) B: receipt expiry (60 s) without pressing Done
await B.page.waitForTimeout(62000);
await shot(B.page, "conflict-B-after-expiry");
say("B after receipt expiry: text", (await mainText(B.page)).slice(0, 500));

// 4) cancel via visible controls: wrong code first, then the right one
const cancel = async (page, number, code) => {
  await page.goto(url("/booking/cancel", "de"));
  await settle(page, 300);
  const inputs = page.locator("main input");
  await inputs.nth(0).tap(); await page.keyboard.type(number, { delay: 25 });
  await inputs.nth(1).tap(); await page.keyboard.type(code, { delay: 25 });
  await page.getByRole("button", { name: /Stornierung bestätigen/ }).tap();
  await page.waitForTimeout(1200);
};
await cancel(B.page, bc.number, "WRONG-CODE-0000");
await shot(B.page, "cancel-wrong-code");
say("cancel with wrong code: text", (await mainText(B.page)).slice(0, 400));
say("cancel wrong-code live regions", await roleInfo(B.page));
await cancel(B.page, bc.number, bc.code);
await shot(B.page, "cancel-success");
say("cancel with right code: text", (await mainText(B.page)).slice(0, 400));
say("cancel success live regions", await roleInfo(B.page));

// 5) is the slot free again?
await toConfirm(B.page, "17:00").catch((e) => say("17:00 not selectable after cancel", String(e).slice(0, 120)));
say("17:00 bookable again after cancel", (await B.page.getByRole("button", { name: /Demo-Reservierung bestätigen/ }).count()) > 0);

// 6) lost receipt: book 18:00, reload immediately
await toConfirm(A.page, "18:00");
await finalConfirm(A.page).scrollIntoViewIfNeeded();
await finalConfirm(A.page).tap();
await A.page.getByText(/Reservierung gespeichert/).waitFor({ timeout: 8000 });
await A.page.reload();
await settle(A.page, 400);
await shot(A.page, "receipt-lost-after-reload");
say("after reload at receipt: text", (await mainText(A.page)).slice(0, 300));
say("18:00 still offered after own booking?", await A.page.getByRole("button", { name: /^18:00/ }).count());

writeFileSync(`${dir}/_booking-conflict-cancel.json`, JSON.stringify(out, null, 1));
await A.browser.close(); await B.browser.close();

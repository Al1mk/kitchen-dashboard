// Phase A step 2d: English booking flow, leave-guard at the receipt (nav tap, browser Back, language switch),
// well-formed but wrong cancellation code. Disposable audit DB only. Codes only in memory, output redacted.
import { writeFileSync } from "node:fs";
import { launch, url, settle, ensureDir, OUT } from "./audit-lib.mjs";

const { browser, page, ctx } = await launch("kiosk");
const dir = `${OUT}/journeys/${ctx.label}`;
ensureDir(dir);
const CODEISH = /\b(?=[A-Za-z0-9_-]*\d)(?=[A-Za-z0-9_-]*[A-Za-z])[A-Za-z0-9_-]{8,}\b|\b\d{6,}\b/g;
const redact = (s) => (s || "").replace(CODEISH, "[REDACTED]");
const out = [];
const say = (k, v) => { out.push({ k, v }); console.log(`${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`); };
const text = async () => redact(await page.evaluate(() => (document.querySelector("main")?.innerText ?? "").replace(/\s+/g, " ")));
async function shot(name) {
  await settle(page, 250);
  await page.evaluate((src) => {
    const re = new RegExp(src, "g");
    document.querySelectorAll("main *").forEach((el) => {
      const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.nodeValue).join(" ");
      if (re.test(own)) el.setAttribute("data-audit-mask", "1");
      re.lastIndex = 0;
    });
    document.querySelectorAll("main input").forEach((el) => { if (el.type !== "date") el.setAttribute("data-audit-mask", "1"); });
  }, CODEISH.source);
  await page.screenshot({ path: `${dir}/B4-${name}.png`, mask: [page.locator("[data-audit-mask]")], maskColor: "#444444" });
}

// EN booking up to receipt
await page.goto(url("/booking", "en"));
await settle(page, 300);
const box = page.getByRole("combobox").first();
const opt = (await box.locator("option").allInnerTexts()).find((o) => /K1-125/.test(o));
await box.selectOption({ label: opt });
await settle(page, 500);
const slotBtns = await page.locator("main button").allInnerTexts();
const slot = slotBtns.filter((t) => /^\d{2}:\d{2}$/.test(t.trim())).at(-3);
say("EN slot chosen (3rd from last)", slot);
await page.getByRole("button", { name: new RegExp("^" + slot) }).tap();
await page.getByRole("button", { name: /Review booking/ }).tap();
await shot("en-confirm-step");
say("EN confirm step text (tail)", (await text()).slice(-420));
await page.getByRole("button", { name: /Confirm demo booking|Confirm booking|Confirm/i }).last().scrollIntoViewIfNeeded();
await page.getByRole("button", { name: /Confirm demo booking|Confirm booking|Confirm/i }).last().tap();
await page.getByText(/Booking saved|Reservation saved|saved/i).first().waitFor({ timeout: 8000 });
await shot("en-receipt");
say("EN receipt text", await text());
const sh = await page.evaluate(() => {
  const val = (label) => { const el = [...document.querySelectorAll("main *")].find((e) => e.children.length === 0 && e.textContent.trim() === label); return el?.parentElement ? el.parentElement.innerText.replace(label, "").trim() : null; };
  return { number: val("Booking ID") ?? val("Booking number"), code: val("Cancellation code") };
});
say("EN codes captured in memory", !!(sh.number && sh.code));
const shape = (s) => s.replace(/[A-Z]/g, "A").replace(/[a-z]/g, "a").replace(/[0-9]/g, "9");
say("code shape (class pattern only)", { numberShape: shape(sh.number), codeShape: shape(sh.code), codeLen: sh.code.length });

// leave-guard: tap a nav link while the receipt is showing
await page.getByRole("navigation").first().getByRole("link", { name: "Home", exact: true }).tap();
await page.waitForTimeout(800);
await shot("en-leave-guard-after-nav-tap");
say("after tapping Home at receipt: url", await page.evaluate(() => location.pathname + location.search));
say("dialog/guard text", await page.evaluate(() => [...document.querySelectorAll('[role="dialog"],[role="alertdialog"],dialog')].map((d) => ({ role: d.getAttribute("role") || d.tagName, open: d.open ?? null, visible: d.getBoundingClientRect().width > 0, t: (d.innerText || "").replace(/\s+/g, " ").slice(0, 300) }))));
say("main text after nav tap", (await text()).slice(0, 360));
const stay = page.getByRole("button", { name: /Stay|Hierbleiben/ });
say("Stay button visible", await stay.isVisible().catch(() => false));
if (await stay.isVisible().catch(() => false)) {
  const b = await stay.boundingBox();
  say("Stay button size", b && { w: Math.round(b.width), h: Math.round(b.height) });
  const leave = page.getByRole("button", { name: /Leave anyway|Trotzdem verlassen/ });
  const lb = await leave.boundingBox();
  say("Leave button size", lb && { w: Math.round(lb.width), h: Math.round(lb.height) });
  say("focus after guard opens", await page.evaluate(() => document.activeElement?.innerText?.slice(0, 40)));
  await stay.tap();
  await page.waitForTimeout(400);
  say("after Stay: receipt still shown?", /saved/i.test(await text()));
}
// language switch at receipt
await page.getByRole("link", { name: "Deutsch", exact: true }).tap();
await page.waitForTimeout(800);
say("after language switch at receipt: url", await page.evaluate(() => location.pathname + location.search));
say("after language switch text", (await text()).slice(0, 300));
await shot("en-lang-switch-at-receipt");
// browser Back at receipt
await page.goto(url("/booking", "en"));
say("Back test skipped separately (fresh form)", true);

// well-formed but wrong code
await page.goto(url("/booking/cancel", "en"));
await settle(page, 300);
const wrong = sh.code.split("").map((c) => (/[0-9]/.test(c) ? String((+c + 1) % 10) : /[A-Z]/.test(c) ? String.fromCharCode(((c.charCodeAt(0) - 65 + 1) % 26) + 65) : /[a-z]/.test(c) ? String.fromCharCode(((c.charCodeAt(0) - 97 + 1) % 26) + 97) : c)).join("");
const inputs = page.locator("main input");
await inputs.nth(0).tap(); await page.keyboard.type(sh.number, { delay: 20 });
await inputs.nth(1).tap(); await page.keyboard.type(wrong, { delay: 20 });
await page.getByRole("button", { name: /Confirm cancellation/ }).tap();
await page.waitForTimeout(1200);
await shot("en-cancel-wellformed-wrong");
say("well-formed wrong code result", (await text()).slice(0, 300));
// right code now (cleanup of my booking)
await inputs.nth(1).fill(sh.code);
await page.getByRole("button", { name: /Confirm cancellation/ }).tap();
await page.waitForTimeout(1200);
say("right code result", (await text()).slice(0, 200));
await shot("en-cancel-success");

writeFileSync(`${dir}/_booking-guard-en.json`, JSON.stringify(out, null, 1));
await browser.close();

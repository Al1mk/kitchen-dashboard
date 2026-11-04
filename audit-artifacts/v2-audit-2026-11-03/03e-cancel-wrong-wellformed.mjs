// Phase A step 2f: cancellation with (a) wrong code of valid length, (b) wrong booking ID, (c) correct pair.
// Disposable audit DB only. Codes live in memory; output redacted; screenshots masked.
import { writeFileSync } from "node:fs";
import { launch, url, settle, ensureDir, OUT } from "./audit-lib.mjs";

const { browser, page, ctx } = await launch("kiosk");
const dir = `${OUT}/journeys/${ctx.label}`; ensureDir(dir);
const CODEISH = /\b(?=[A-Za-z0-9_-]*\d)(?=[A-Za-z0-9_-]*[A-Za-z])[A-Za-z0-9_-]{8,}\b|\b\d{6,}\b/g;
const out = [];
const say = (k, v) => { out.push({ k, v }); console.log(`${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`); };
const mainText = async () => (await page.evaluate(() => (document.querySelector("main")?.innerText ?? "").replace(/\s+/g, " "))).replace(CODEISH, "[REDACTED]");
const shot = async (name) => { await page.screenshot({ path: `${dir}/B6-${name}.png`, mask: [page.locator("main input")], maskColor: "#444444" }); };

await page.goto(url("/booking", "de")); await settle(page, 300);
const box = page.getByRole("combobox").first();
await box.selectOption({ label: (await box.locator("option").allInnerTexts()).find((o) => o.includes("K1-306")) });
await settle(page, 500);
const slots = (await page.locator("main button").allInnerTexts()).map((t) => t.trim()).filter((t) => /^\d{2}:\d{2}$/.test(t));
await page.getByRole("button", { name: new RegExp("^" + slots.at(-4) + "$") }).tap();
await page.getByRole("button", { name: /Weiter zur Bestätigung/ }).tap();
const c = page.getByRole("button", { name: /Demo-Reservierung bestätigen/ });
await c.scrollIntoViewIfNeeded(); await c.tap();
await page.getByText(/Reservierung gespeichert/).waitFor({ timeout: 8000 });
const sh = await page.evaluate(() => {
  const val = (label) => { const el = [...document.querySelectorAll("main *")].find((e) => e.children.length === 0 && e.textContent.trim() === label); return el?.parentElement ? el.parentElement.innerText.replace(label, "").trim() : null; };
  return { number: val("Buchungsnummer"), code: val("Stornierungscode") };
});
const swapMid = (s) => { const i = Math.floor(s.length / 2); const alt = /[0-9]/.test(s[i]) ? (s[i] === "7" ? "3" : "7") : /[a-z]/.test(s[i]) ? (s[i] === "q" ? "k" : "q") : /[A-Z]/.test(s[i]) ? (s[i] === "Q" ? "K" : "Q") : "a"; return s.slice(0, i) + alt + s.slice(i + 1); };

async function cancel(number, code, name) {
  await page.goto(url("/booking/cancel", "de")); await settle(page, 300);
  const inputs = page.locator("main input");
  await inputs.nth(0).fill(number); await inputs.nth(1).fill(code);
  await page.getByRole("button", { name: /Stornierung bestätigen/ }).tap();
  await page.waitForTimeout(1300);
  say(name, await mainText());
  await shot(name.replace(/\W+/g, "-").toLowerCase());
}
await cancel(sh.number, swapMid(sh.code), "(a) wrong code, same length, one char changed");
await cancel(swapMid(sh.number), sh.code, "(b) wrong booking id, one char changed");
await cancel(sh.number, sh.code, "(c) correct pair");
say("(d) after cancel: 'Reservierung stornieren' page has a way home?", await page.evaluate(() => [...document.querySelectorAll("main a,main button")].map((e) => e.innerText.trim())));
writeFileSync(`${dir}/_cancel-wrong-wellformed.json`, JSON.stringify(out, null, 1));
await browser.close();

// Phase A step 2b: reserve a free slot through visible controls up to the receipt.
// Disposable audit DB only. Booking number / cancellation code are NEVER printed or kept:
//  - console output passes through redact()
//  - screenshots of the receipt are masked
// node 03a-booking-flow.mjs [de|en] <slotHHMM>
import { writeFileSync } from "node:fs";
import { launch, url, settle, ensureDir, OUT } from "./audit-lib.mjs";

const lang = process.argv[2] ?? "de";
const slot = process.argv[3] ?? "16:00";
const L = lang === "en"
  ? { next: /Review booking/i, room: /K1-120/, }
  : { next: /Weiter zur Bestätigung/i, room: /K1-120/ };
const { browser, page, ctx } = await launch("kiosk");
const dir = `${OUT}/journeys/${ctx.label}`;
ensureDir(dir);

const CODEISH = /\b(?=[A-Za-z0-9_-]*\d)(?=[A-Za-z0-9_-]*[A-Za-z])[A-Za-z0-9_-]{8,}\b|\b\d{6,}\b/g;
const redact = (s) => (s || "").replace(CODEISH, "[REDACTED]");
const tap = (loc) => loc.tap({ timeout: 8000 });
const log = [];
async function snap(name, mask = false) {
  await settle(page, 300);
  const opts = { path: `${dir}/B2-${lang}-${name}.png` };
  if (mask) {
    await page.evaluate((src) => {
      const re = new RegExp(src, "g");
      document.querySelectorAll("main *").forEach((el) => {
        const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.nodeValue).join(" ");
        if (re.test(own)) el.setAttribute("data-audit-mask", "1");
        re.lastIndex = 0;
      });
    }, CODEISH.source);
    opts.mask = [page.locator("[data-audit-mask]")];
    opts.maskColor = "#444444";
  }
  await page.screenshot(opts);
  const info = await page.evaluate(() => ({
    url: location.pathname + location.search, vh: innerHeight, docH: document.documentElement.scrollHeight, scrollY: Math.round(scrollY),
    text: (document.querySelector("main")?.innerText ?? "").replace(/\s+/g, " ").slice(0, 900),
    buttons: [...document.querySelectorAll("main button, main a[href]")].filter((e) => e.getBoundingClientRect().width > 0).map((e) => { const r = e.getBoundingClientRect(); return { t: (e.innerText || "").replace(/\s+/g, " ").trim().slice(0, 50), w: Math.round(r.width), h: Math.round(r.height), y: Math.round(r.y + scrollY), inView: r.bottom <= innerHeight && r.top >= 0 }; }),
  }));
  info.text = redact(info.text);
  log.push({ name, ...info });
  console.log(`\n## ${name}  ${info.url}  scrollY=${info.scrollY} docH=${info.docH}\n   text: ${info.text.slice(0, 600)}\n   buttons: ${JSON.stringify(info.buttons.filter((b) => !/^\d{2}:\d{2}/.test(b.t)))}`);
}

await page.goto(url("/booking", lang));
await settle(page, 400);
const box = page.getByRole("combobox").first();
const opt = (await box.locator("option").allInnerTexts()).find((o) => L.room.test(o));
await box.selectOption({ label: opt });
await settle(page, 600);
await tap(page.getByRole("button", { name: new RegExp("^" + slot) }));
await snap("slot-chosen");
await tap(page.getByRole("button", { name: L.next }));
await snap("confirm-step");
// the final confirm button name is discovered from the page, then tapped
const confirmBtn = page.getByRole("button", { name: /verbindlich|bestätigen|reservieren|confirm|book|Reservierung/i }).filter({ hasNotText: L.next });
console.log("confirm candidates:", redact((await confirmBtn.allInnerTexts()).join(" | ")));
await tap(confirmBtn.first());
await page.waitForTimeout(1200);
await snap("receipt-t0", true);
await page.waitForTimeout(15000);
await snap("receipt-t15", true);
writeFileSync(`${dir}/_booking-flow-${lang}.json`, JSON.stringify(log, null, 1));
await browser.close();

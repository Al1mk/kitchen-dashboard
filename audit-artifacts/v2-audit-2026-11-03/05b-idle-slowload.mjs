/* eslint-disable @typescript-eslint/no-unused-vars -- audit scratch variables; scripts are kept as they were executed */
// Phase A step 4b (split from 05 after the background run was killed): raw touch behaviour via CDP (swipe-scroll, map drag/zoom buttons), Back at the receipt with
// realistic history, idle behaviour, and a slow first load. Nominal kiosk context; disposable DB only.
import { writeFileSync } from "node:fs";
import { launch, url, settle, ensureDir, OUT } from "./audit-lib.mjs";

const out = [];
const say = (k, v) => { out.push({ k, v }); console.log(`${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`); };
const CODEISH = /\b(?=[A-Za-z0-9_-]*\d)(?=[A-Za-z0-9_-]*[A-Za-z])[A-Za-z0-9_-]{8,}\b|\b\d{6,}\b/g;
const redact = (s) => (s || "").replace(CODEISH, "[REDACTED]");

async function swipe(cdp, x, y1, y2, ms = 280, steps = 14) {
  const pt = (yy) => [{ x, y: yy, id: 1 }];
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: pt(y1) });
  for (let i = 1; i <= steps; i++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: pt(y1 + ((y2 - y1) * i) / steps) });
    await new Promise((r) => setTimeout(r, ms / steps));
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}
async function drag(cdp, x1, y1, x2, y2, steps = 12) {
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x1, y: y1, id: 1 }] });
  for (let i = 1; i <= steps; i++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x1 + ((x2 - x1) * i) / steps, y: y1 + ((y2 - y1) * i) / steps, id: 1 }] });
    await new Promise((r) => setTimeout(r, 20));
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

// ---- T3: idle behaviour: does anything reset a half-used page after 95 s without input?
{
  const { browser, page } = await launch("kiosk");
  await page.goto(url("/rooms", "de", "suche=Zagel&datum=2026-11-04")); await settle(page, 600);
  await page.waitForTimeout(95000);
  say("T3 idle 95 s on /rooms?suche=Zagel&datum=2026-11-04: url", await page.evaluate(() => location.pathname + location.search));
  say("T3 field value after idle", await page.evaluate(() => document.querySelector("#room-search")?.value));
  await browser.close();
}

// ---- T4: slow first load: rooms API delayed 4 s -> what does the page show meanwhile?
{
  const { browser, page, ctx } = await launch("kiosk");
  const dir = `${OUT}/journeys/${ctx.label}`;
  await page.route("**/api/public/rooms", async (r) => { await new Promise((x) => setTimeout(x, 4000)); return r.continue(); });
  await page.goto(url("/rooms", "de"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${dir}/T4-rooms-slow-load-t900.png` });
  say("T4 /rooms during 4 s API delay: main text", (await page.evaluate(() => document.querySelector("main")?.innerText ?? "")).replace(/\s+/g, " ").slice(0, 300));
  say("T4 live regions", await page.evaluate(() => [...document.querySelectorAll('[role="status"],[aria-live],[aria-busy="true"]')].map((e) => ({ role: e.getAttribute("role"), busy: e.getAttribute("aria-busy"), t: (e.innerText || "").slice(0, 80) }))));
  await browser.close();
}
writeFileSync(`${OUT}/journeys/kiosk-nominal-1080x1920/_touch-history-idle.json`, JSON.stringify(out, null, 1));

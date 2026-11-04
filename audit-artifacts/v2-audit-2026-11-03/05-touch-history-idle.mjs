/* eslint-disable @typescript-eslint/no-unused-vars -- audit scratch variables; scripts are kept as they were executed */
// Phase A step 4: raw touch behaviour via CDP (swipe-scroll, map drag/zoom buttons), Back at the receipt with
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

// ---- T1: touch swipe scroll on /rooms (long list) and on /map (page + map image)
{
  const { browser, context, page, ctx } = await launch("kiosk");
  const dir = `${OUT}/journeys/${ctx.label}`; ensureDir(dir);
  const cdp = await context.newCDPSession(page);
  await page.goto(url("/rooms", "de")); await settle(page, 500);
  const y0 = await page.evaluate(() => scrollY);
  await swipe(cdp, 540, 1500, 400);
  await page.waitForTimeout(600);
  const y1 = await page.evaluate(() => scrollY);
  say("T1 /rooms one swipe (1100 px finger travel): scrollY", { before: y0, after: y1 });
  say("T1 /rooms docH", await page.evaluate(() => document.documentElement.scrollHeight));
  await page.screenshot({ path: `${dir}/T1-rooms-after-swipe.png` });

  await page.goto(url("/map", "de")); await settle(page, 700);
  const mapBox = await page.evaluate(() => { const i = document.querySelector("main img, main svg, main [class*=plan]"); const r = i?.getBoundingClientRect(); return r && { x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height), tag: i.tagName, touchAction: getComputedStyle(i).touchAction }; });
  say("T1 map image box", mapBox);
  // touch swipe that starts ON the map image: does the page scroll, or is the gesture captured?
  const sy0 = await page.evaluate(() => scrollY);
  await swipe(cdp, 540, 1100, 500);
  await page.waitForTimeout(600);
  say("T1 swipe starting on map image: page scrollY", { before: sy0, after: await page.evaluate(() => scrollY) });
  await page.evaluate(() => window.scrollTo(0, 0));
  // zoom in with the + button (touch tap), then drag the plan
  await page.getByRole("button", { name: /Zoom in|Vergrößern|^\+$/ }).tap().catch(() => {});
  await page.getByRole("button", { name: /Zoom in|Vergrößern|^\+$/ }).tap().catch(() => {});
  await page.waitForTimeout(400);
  const before = await page.evaluate(() => { const i = document.querySelector("main img"); const c = i?.closest("[style*=transform],[class*=zoom],div"); return { img: i && i.getBoundingClientRect().toJSON(), tf: i && getComputedStyle(i).transform, parentTf: i?.parentElement && getComputedStyle(i.parentElement).transform, scrollerLeft: i?.parentElement?.scrollLeft, scrollerTop: i?.parentElement?.scrollTop }; });
  await page.screenshot({ path: `${dir}/T1-map-zoomed-before-drag.png` });
  await drag(cdp, 700, 1000, 300, 1000);
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => { const i = document.querySelector("main img"); return { img: i && i.getBoundingClientRect().toJSON(), tf: i && getComputedStyle(i).transform, parentTf: i?.parentElement && getComputedStyle(i.parentElement).transform, scrollerLeft: i?.parentElement?.scrollLeft, scrollerTop: i?.parentElement?.scrollTop }; });
  say("T1 map after 2x zoom-in: before-drag state", before);
  say("T1 map after drag left 400px: state", after);
  await page.screenshot({ path: `${dir}/T1-map-zoomed-after-drag.png` });
  say("T1 map zoom-in button state after 2 taps", await page.evaluate(() => [...document.querySelectorAll("main button")].filter((b) => /^[−+]$|Zoom/.test((b.getAttribute("aria-label") || b.innerText).trim())).map((b) => ({ n: b.getAttribute("aria-label") || b.innerText, dis: b.disabled }))));
  await browser.close();
}

// ---- T2: Back at the receipt with realistic history: Home -> nav Raumbuchung -> book -> receipt -> Back
{
  const { browser, page, ctx } = await launch("kiosk");
  const dir = `${OUT}/journeys/${ctx.label}`;
  await page.goto(url("/", "de")); await settle(page, 300);
  await page.getByRole("navigation").first().getByRole("link", { name: "Raumbuchung", exact: true }).tap();
  await settle(page, 400);
  const box = page.getByRole("combobox").first();
  const opt = (await box.locator("option").allInnerTexts()).find((o) => o.includes("K1-206"));
  await box.selectOption({ label: opt }); await settle(page, 500);
  const slots = (await page.locator("main button").allInnerTexts()).map((t) => t.trim()).filter((t) => /^\d{2}:\d{2}$/.test(t));
  await page.getByRole("button", { name: new RegExp("^" + slots.at(-2) + "$") }).tap();
  await page.getByRole("button", { name: /Weiter zur Bestätigung/ }).tap();
  const c = page.getByRole("button", { name: /Demo-Reservierung bestätigen/ });
  await c.scrollIntoViewIfNeeded(); await c.tap();
  await page.getByText(/Reservierung gespeichert/).waitFor({ timeout: 8000 });
  say("T2 history length at receipt", await page.evaluate(() => history.length));
  await page.goBack(); await page.waitForTimeout(900);
  say("T2 receipt -> Back: url", await page.evaluate(() => location.pathname + location.search));
  say("T2 receipt -> Back: text", redact((await page.evaluate(() => document.querySelector("main")?.innerText ?? "")).replace(/\s+/g, " ")).slice(0, 160));
  await page.goForward(); await page.waitForTimeout(900);
  say("T2 Forward after Back: receipt visible again?", /gespeichert/i.test(await page.evaluate(() => document.querySelector("main")?.innerText ?? "")));
  await browser.close();
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

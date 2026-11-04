// Phase A step 3b: is the clipped notice list on /display reachable by touch, and is there any cue?
// Re-creates 6 published notices in the DISPOSABLE audit DB (test support), then probes scroll containers.
import { readFileSync, writeFileSync } from "node:fs";
import { request as pwRequest } from "@playwright/test";
import { launch, url, settle, ensureDir, OUT, BASE } from "./audit-lib.mjs";

const pw = readFileSync(`${process.env.AUDIT_INSTALL}/audit.pw`, "utf8").trim();
const api = await pwRequest.newContext({ baseURL: BASE });
const origin = { Origin: BASE };
const lg = await api.post("/api/auth/login", { headers: origin, data: { username: "audit-admin", password: pw } });
console.log("login status", lg.status());
const lorem = "Dies ist ein längerer Beispieltext für die Audit-Datenbank, damit wir sehen, wie viele Zeilen eine Mitteilung einnimmt. ";
for (let i = 1; i <= 6; i++) {
  const r = await api.post("/api/admin/announcements", { headers: origin, data: { title: `Audit-Mitteilung ${i}`, body: lorem.repeat(i % 3 + 1), category: i % 2 ? "general" : "event", pinned: i === 1, startsAt: "", endsAt: "" } });
  const j = await r.json().catch(() => ({})); const id = j.id ?? j.announcement?.id; const pr = id ? await api.post(`/api/admin/announcements/${id}/publish`, { headers: origin, data: {} }) : null;
  console.log("create", r.status(), "publish", pr?.status(), id ? "" : JSON.stringify(j).slice(0, 160));
}
const { browser, context, page, ctx } = await launch("kiosk");
const dir = `${OUT}/journeys/${ctx.label}`; ensureDir(dir);
const cdp = await context.newCDPSession(page);
await page.goto(url("/display", "de")); await settle(page, 800);
const info = await page.evaluate(() => {
  const els = [...document.querySelectorAll("*")].filter((e) => { const cs = getComputedStyle(e); return /(auto|scroll|hidden)/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 2; });
  return els.map((e) => ({ tag: e.tagName.toLowerCase(), cls: String(e.className).slice(0, 70), overflowY: getComputedStyle(e).overflowY, scrollH: e.scrollHeight, clientH: e.clientHeight, scrollTop: e.scrollTop, scrollbarWidth: e.offsetWidth - e.clientWidth, scrollbarCSS: getComputedStyle(e).scrollbarWidth }));
});
console.log("clipping/scrolling containers:", JSON.stringify(info, null, 1));
const hasCue = await page.evaluate(() => /mehr|weiter|scroll|nach unten|more|swipe/i.test(document.body.innerText));
console.log("visible text hints about more content?", hasCue, "| htmlOverflow:", await page.evaluate(() => [getComputedStyle(document.documentElement).overflowY, getComputedStyle(document.body).overflowY]));
async function swipe(x, y1, y2) {
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: y1, id: 1 }] });
  for (let i = 1; i <= 14; i++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y1 + ((y2 - y1) * i) / 14, id: 1 }] }); await new Promise((r) => setTimeout(r, 20)); }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}
const st = () => page.evaluate(() => ({ win: Math.round(scrollY), inner: [...document.querySelectorAll("*")].filter((e) => e.scrollHeight > e.clientHeight + 2 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)).map((e) => Math.round(e.scrollTop)) }));
console.log("before swipe", JSON.stringify(await st()));
await swipe(540, 1500, 500); await page.waitForTimeout(700);
console.log("after touch swipe up on notice area", JSON.stringify(await st()));
await page.screenshot({ path: `${dir}/D3-display-after-swipe.png` });
// mouse wheel / keyboard as comparison
await page.mouse.move(540, 1200); await page.mouse.wheel(0, 800); await page.waitForTimeout(500);
console.log("after wheel", JSON.stringify(await st()));
await page.keyboard.press("End"); await page.waitForTimeout(500);
console.log("after End key", JSON.stringify(await st()));
await page.screenshot({ path: `${dir}/D3-display-after-wheel-end.png` });
writeFileSync(`${dir}/_display-scroll-probe.json`, JSON.stringify({ info, hasCue }, null, 1));
await browser.close(); await api.dispose();

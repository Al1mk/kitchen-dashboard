// Phase A step 5: 2x crop of the 1OG plan and pairwise overlap of the room markers (nominal kiosk context).
import { chromium } from "@playwright/test";
const OUT = process.env.AUDIT_OUT;
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2, hasTouch: true, locale: "de-DE", timezoneId: "Europe/Berlin" });
const p = await ctx.newPage();
await p.goto("http://127.0.0.1:3400/map"); await p.waitForTimeout(1800);
await p.screenshot({ path: `${OUT}/journeys/kiosk-nominal-1080x1920/M1-map-plan-crop-dpr2.png`, clip: { x: 176, y: 833, width: 728, height: 355 } });
// overlaps between marker buttons
const ov = await p.evaluate(() => {
  const bs = [...document.querySelectorAll("main button")].filter((b) => /^K1-\d{3}/.test((b.innerText || "").trim()) && b.getBoundingClientRect().width < 80);
  const rs = bs.map((b) => ({ t: b.innerText.trim(), r: b.getBoundingClientRect() }));
  const pairs = [];
  for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
    const a = rs[i].r, c = rs[j].r;
    const w = Math.min(a.right, c.right) - Math.max(a.left, c.left), h = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
    if (w > 0 && h > 0) pairs.push([rs[i].t, rs[j].t, Math.round(w), Math.round(h)]);
  }
  return { markers: rs.length, overlappingPairs: pairs };
});
console.log(JSON.stringify(ov));
await b.close();

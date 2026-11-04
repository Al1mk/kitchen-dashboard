// Phase B support: which CSS media features match in the nominal kiosk emulation vs a plain desktop context?
// Shows that pointer:coarse cannot be assumed for the real Elo screen (emulation sets it only because hasTouch is true).
import { chromium } from "@playwright/test";
const b = await chromium.launch({ headless: true });
for (const [label, opts] of [["kiosk emulation (hasTouch true)", { viewport: { width: 1080, height: 1920 }, hasTouch: true }], ["same viewport, no touch (what a Mac without working touch reports)", { viewport: { width: 1080, height: 1920 }, hasTouch: false }]]) {
  const c = await b.newContext(opts); const p = await c.newPage(); await p.goto("http://127.0.0.1:3400/");
  console.log(label, JSON.stringify(await p.evaluate(() => Object.fromEntries(["(pointer: coarse)", "(any-pointer: coarse)", "(hover: none)", "(orientation: portrait)", "(min-width: 1000px)"].map((q) => [q, matchMedia(q).matches])))));
  await c.close();
}
await b.close();

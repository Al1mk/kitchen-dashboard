/* eslint-disable @typescript-eslint/no-unused-vars -- audit scratch variables; scripts are kept as they were executed */
// Phase A step 2b (discovery only): open the booking form, choose a room, inspect the free-slot grid.
// Stops BEFORE any booking is submitted. Output is redacted: no codes are printed.
import { launch, url, settle, ensureDir, OUT, measure } from "./audit-lib.mjs";

const lang = process.argv[2] ?? "de";
const { browser, page, ctx } = await launch("kiosk");
const dir = `${OUT}/journeys/${ctx.label}`;
ensureDir(dir);
await page.goto(url("/booking", lang));
await settle(page, 400);

const roomBox = page.getByRole("combobox").first();
const options = await roomBox.locator("option").allInnerTexts();
console.log("room options:", options.length, "| first 3:", options.slice(0, 3));
const target = options.find((o) => /K1-120/.test(o));
await roomBox.selectOption({ label: target });
await settle(page, 700);
await page.screenshot({ path: `${dir}/B1-${lang}-room-chosen.png` });

const info = await page.evaluate(() => {
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  const main = document.querySelector("main");
  const btns = [...main.querySelectorAll("button")].map((b) => { const r = b.getBoundingClientRect(); return { t: clean(b.innerText), w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y + scrollY), dis: b.disabled, pressed: b.getAttribute("aria-pressed") }; });
  return { text: clean(main.innerText).slice(0, 900), btns, docH: document.documentElement.scrollHeight, vh: innerHeight, inputs: [...main.querySelectorAll("input,select")].map((i) => ({ tag: i.tagName, type: i.type, id: i.id, val: i.value, name: i.labels?.[0]?.innerText?.slice(0, 40) })) };
});
console.log("main text:", info.text);
console.log("inputs:", JSON.stringify(info.inputs));
console.log("docH/vh:", info.docH, info.vh);
console.log("buttons:", info.btns.length);
const slots = info.btns.filter((b) => /^\d{2}:\d{2}/.test(b.t));
console.log("slot buttons:", slots.length, "sizes:", [...new Set(slots.map((s) => s.w + "x" + s.h))].join(", "), "| first/last:", slots[0]?.t, slots.at(-1)?.t);
console.log("other buttons:", JSON.stringify(info.btns.filter((b) => !/^\d{2}:\d{2}/.test(b.t))));
await page.screenshot({ path: `${dir}/B1-${lang}-room-chosen-full.png`, fullPage: true });
await browser.close();

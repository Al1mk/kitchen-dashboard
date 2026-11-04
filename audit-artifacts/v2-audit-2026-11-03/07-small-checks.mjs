/* eslint-disable @typescript-eslint/no-unused-vars -- audit scratch variables; scripts are kept as they were executed */
// Phase A step 6: small measurement gaps closed before freezing the report.
import { writeFileSync } from "node:fs";
import { launch, url, settle, ROUTES, OUT } from "./audit-lib.mjs";

const { browser, page } = await launch("kiosk");
const res = { titles: [], htmlLang: [], placeholder: [], ariaCurrent: [], logoTap: null, headingsDisplay: null };

for (const lang of ["de", "en"]) {
  for (const [name, path] of ROUTES) {
    await page.goto(url(path, lang)); await settle(page, 250);
    res.titles.push(`${lang} ${path}: ${await page.title()}`);
    res.htmlLang.push(`${lang} ${path}: ${await page.evaluate(() => document.documentElement.lang)}`);
    res.ariaCurrent.push(`${lang} ${path}: ${await page.evaluate(() => [...document.querySelectorAll('nav [aria-current]')].map((e) => e.innerText.trim() + "=" + e.getAttribute("aria-current")).join(",") || "none")}`);
  }
}
// placeholder contrast
for (const [path, sel] of [["/rooms", "#room-search"], ["/map", 'main input[type="search"], main input[type="text"]'], ["/booking/cancel", "main input"]]) {
  await page.goto(url(path, "de")); await settle(page, 300);
  const r = await page.evaluate((s) => {
    const el = document.querySelector(s); if (!el) return null;
    const cs = getComputedStyle(el, "::placeholder"), bg = getComputedStyle(el).backgroundColor;
    const cvs = document.createElement("canvas"); cvs.width = cvs.height = 1; const g = cvs.getContext("2d", { willReadFrequently: true });
    const rgb = (c) => { g.clearRect(0, 0, 1, 1); g.fillStyle = "#000"; g.fillStyle = c; g.fillRect(0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
    const L = ([r, g2, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g2) + 0.0722 * f(b); };
    const fg = rgb(cs.color), b = rgb(bg); const fgOver = fg.slice(0, 3).map((v, k) => v * fg[3] + b[k] * (1 - fg[3]));
    const l1 = L(fgOver), l2 = L(b); return { placeholder: el.getAttribute("placeholder"), color: cs.color, opacity: cs.opacity, bg, ratio: Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100, fs: getComputedStyle(el).fontSize };
  }, sel);
  res.placeholder.push({ path, ...r });
}
// disabled primary button contrast on /booking
await page.goto(url("/booking", "de")); await settle(page, 300);
res.disabledPrimary = await page.evaluate(() => {
  const b = [...document.querySelectorAll("main button")].find((x) => /Weiter zur Bestätigung/.test(x.innerText)); if (!b) return null;
  const cs = getComputedStyle(b);
  const cvs = document.createElement("canvas"); cvs.width = cvs.height = 1; const g = cvs.getContext("2d", { willReadFrequently: true });
  const rgb = (c) => { g.clearRect(0, 0, 1, 1); g.fillStyle = "#000"; g.fillStyle = c; g.fillRect(0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const fg = rgb(cs.color), bg = rgb(cs.backgroundColor), op = parseFloat(cs.opacity);
  const mix = (a, c, t) => a.map((v, k) => v * t + c[k] * (1 - t));
  const page = [246, 244, 242];
  const bgE = mix(bg.slice(0, 3), page, bg[3] * op), fgE = mix(mix(fg.slice(0, 3), bg.slice(0, 3), fg[3]), page, op);
  const L = ([r, g2, b2]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g2) + 0.0722 * f(b2); };
  const l1 = L(fgE), l2 = L(bgE);
  return { disabled: b.disabled, opacity: op, ratio: Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100 };
});
// logo tap: does it navigate?
await page.goto(url("/map", "de")); await settle(page, 300);
const before = page.url();
await page.locator("header img").first().tap().catch((e) => res.logoTapErr = String(e).slice(0, 100));
await page.waitForTimeout(700);
res.logoTap = { before: before.replace(/^https?:\/\/[^/]+/, ""), after: page.url().replace(/^https?:\/\/[^/]+/, ""), isLink: await page.evaluate(() => !!document.querySelector("header img")?.closest("a")) };
console.log(JSON.stringify(res, null, 1));
writeFileSync(`${OUT}/journeys/kiosk-nominal-1080x1920/_small-checks.json`, JSON.stringify(res, null, 1));
await browser.close();

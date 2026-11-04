// Phase B addendum checks (run AFTER the Phase-A freeze, after reading the known feedback). Browser facts only.
import { writeFileSync } from "node:fs";
import { launch, url, settle, OUT } from "./audit-lib.mjs";
const { browser, page } = await launch("kiosk");
const res = {};
await page.goto(url("/schedule", "de", "raum=lcc-demo-room-k1-120")); await settle(page, 500);
res.scheduleRoomLinks = await page.evaluate(() => [...document.querySelectorAll("main a, main button")].map((e) => e.innerText.replace(/\s+/g, " ").trim()).filter(Boolean));
res.scheduleRoomH = await page.evaluate(() => [...document.querySelectorAll("main h1,main h2")].map((h) => h.innerText));
for (const lang of ["de", "en"]) {
  await page.goto(url("/", lang)); await settle(page, 300);
  res[`langWrapper_${lang}`] = await page.evaluate(() => ({ html: document.documentElement.lang, wrapper: document.querySelector("body div[lang]")?.getAttribute("lang") }));
}
for (const p of ["/", "/map", "/display"]) {
  await page.goto(url(p, "de")); await settle(page, 700);
  res[`images_${p}`] = await page.evaluate(() => [...document.images].filter((i) => i.getBoundingClientRect().width > 0).map((i) => ({ src: i.getAttribute("src")?.slice(0, 40), natural: `${i.naturalWidth}x${i.naturalHeight}`, shown: `${Math.round(i.getBoundingClientRect().width)}x${Math.round(i.getBoundingClientRect().height)}`, ratio: Math.round((i.naturalWidth / i.getBoundingClientRect().width) * 100) / 100 })));
}
console.log(JSON.stringify(res, null, 1));
writeFileSync(`${OUT}/journeys/kiosk-nominal-1080x1920/_addendum-checks.json`, JSON.stringify(res, null, 1));
await browser.close();

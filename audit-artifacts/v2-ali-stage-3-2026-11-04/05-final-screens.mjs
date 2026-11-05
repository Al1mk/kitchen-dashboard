// Stage 3 final screens (5 Nov 2026): the finished public pages in DE and EN, as screenshots I actually open, plus the
// first keyboard stops of each page. After state only; synthetic data; /display answers are a route stub.
//
//   AUDIT_BASE=http://127.0.0.1:3412 node 05-final-screens.mjs
//
// NOMINAL emulation in headless Chromium against an isolated copy with a disposable database. Not the physical Elo screen,
// not a screen-reader session, not a usability test. No tracing, video or HAR; nothing is typed into a credential field and
// no booking is made.
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BASE, CONTEXTS, dirs, launchBrowser, openContext, settle } from "../v2-ali-stage-1-2026-11-03/stage1-lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(process.env.STAGE3_OUT ?? resolve(here, "../../docs/evidence/v2-ali-stage-3-2026-11-04"), "final-screens");
const PAGES = [["home", "/"], ["newcomers", "/newcomers"], ["map", "/map"], ["rooms", "/rooms"], ["schedule", "/schedule"], ["booking", "/booking"], ["booking-cancel", "/booking/cancel"], ["display", "/display"]];
const notice = (i) => ({
  id: `stage3-final-${i}`, title: `Beispielmitteilung ${i}`, body: `Synthetischer Text ${i}. Nur zur Darstellung; keine echte Mitteilung.`,
  category: ["general", "event", "important"][i % 3], pinned: i === 1, publishedAt: "2031-05-14T08:00:00.000Z", endsAt: null,
  titleEn: `Sample notice ${i}`, bodyEn: `Synthetic text ${i}. For display only; not a real notice.`,
});

const browser = await launchBrowser();
const record = [];
for (const ctx of ["kiosk-touch-1080x1920", "sens-540x960"]) {
  const context = await openContext(browser, ctx);
  const page = await context.newPage();
  await page.route("**/api/public/announcements", (route) =>
    route.fulfill({ json: { serverTime: "2031-05-14T09:30:00.000Z", announcements: [1, 2, 3, 4].map(notice) } }),
  );
  for (const lang of ["de", "en"]) {
    for (const [name, path] of PAGES) {
      await page.goto(BASE + path + (lang === "en" ? "?lang=en" : ""), { waitUntil: "domcontentloaded" });
      await settle(page, 900);
      await page.evaluate(() => window.scrollTo(0, 0));
      const dir = dirs(OUT, ctx);
      // the board clock is masked so two runs of the same page look the same
      const mask = name === "display" ? [page.locator('[aria-label="Uhrzeit"], [aria-label="Time"]')] : [];
      await page.screenshot({ path: `${dir}/${name}-${lang}.png`, mask, maskColor: "#888888" });
      // the first keyboard stops (Tab from a blurred start), as the browser reports them
      await page.evaluate(() => document.activeElement?.blur?.());
      const stops = [];
      for (let i = 0; i < 6; i++) {
        await page.keyboard.press("Tab");
        stops.push(await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          return (el.getAttribute("aria-label") || el.innerText || el.querySelector("img")?.alt || el.tagName).trim().replace(/\s+/g, " ").slice(0, 48);
        }));
      }
      record.push({ ctx, lang, page: name, firstSixTabStops: stops });
    }
  }
  await context.close();
}
await browser.close();
writeFileSync(`${dirs(OUT)}/tab-stops.json`, JSON.stringify({ note: "after state only; synthetic data; context notes come from stage1-lib.mjs", contexts: Object.fromEntries(["kiosk-touch-1080x1920", "sens-540x960"].map((k) => [k, CONTEXTS[k].note])), records: record }, null, 1));
console.log("done", record.length, "page records ->", OUT);

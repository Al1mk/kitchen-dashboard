// Phase A step 1: visit every public route in DE and EN, capture viewport + full-page screenshots,
// measure the rendered DOM and walk the keyboard focus order. No clicks, no form input.
// node 01-capture-routes.mjs kiosk laptop kioskSens zoom200
import { writeFileSync } from "node:fs";
import { launch, ROUTES, url, settle, measure, tabWalk, summarise, ensureDir, OUT, CONTEXTS } from "./audit-lib.mjs";

const wanted = process.argv.slice(2).length ? process.argv.slice(2) : ["kiosk", "laptop"];
const index = [];

for (const key of wanted) {
  if (!CONTEXTS[key]) throw new Error("unknown context " + key);
  const { browser, page, events, ctx } = await launch(key);
  const dir = `${OUT}/phaseA/${ctx.label}`;
  ensureDir(dir);
  for (const lang of ["de", "en"]) {
    for (const [name, path] of ROUTES) {
      const before = { c: events.console.length, p: events.pageerror.length, f: events.requestfailed.length, b: events.badresponse.length };
      const t0 = Date.now();
      const resp = await page.goto(url(path, lang), { waitUntil: "domcontentloaded" });
      const { stillLoading } = await settle(page, 900);
      const loadMs = Date.now() - t0;
      const base = `${dir}/${name}-${lang}`;
      await page.screenshot({ path: `${base}.viewport.png` });
      await page.screenshot({ path: `${base}.full.png`, fullPage: true });
      const m = await page.evaluate(measure);
      const tabs = await tabWalk(page, 40);
      const aria = await page.locator("body").ariaSnapshot().catch((e) => "ARIA snapshot failed: " + e.message);
      writeFileSync(`${base}.aria.txt`, aria);
      const rec = {
        context: ctx.label, route: path, lang, status: resp?.status(), finalUrl: page.url().replace(/^https?:\/\/[^/]+/, ""), loadMs, stillLoadingAfter8s: stillLoading,
        summary: summarise(m), measure: m, tabStops: tabs,
        newEvents: {
          console: events.console.slice(before.c), pageerror: events.pageerror.slice(before.p),
          requestfailed: events.requestfailed.slice(before.f), badresponse: events.badresponse.slice(before.b),
        },
      };
      writeFileSync(`${base}.json`, JSON.stringify(rec, null, 1));
      index.push({ ctx: ctx.label, route: path, lang, status: rec.status, finalUrl: rec.finalUrl, ...rec.summary, tabStops: tabs.length, errs: rec.newEvents.console.length + rec.newEvents.pageerror.length + rec.newEvents.badresponse.length });
      console.log(`${ctx.label} ${lang} ${path} ${rec.status} screens=${rec.summary.screens} targets=${rec.summary.targets} <44=${rec.summary.targetsMin44fail} minFs=${rec.summary.textMinFs} lowC=${rec.summary.lowContrastCount} tabs=${tabs.length} errs=${index.at(-1).errs}`);
    }
  }
  writeFileSync(`${dir}/_events.json`, JSON.stringify(events, null, 1));
  await browser.close();
}
writeFileSync(`${OUT}/phaseA/_index-${wanted.join("+")}.json`, JSON.stringify(index, null, 1));

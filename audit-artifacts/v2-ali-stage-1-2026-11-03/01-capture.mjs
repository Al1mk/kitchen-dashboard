// Stage 1 capture (3 Nov 2026): screenshots + geometry for the public pages, V1 "before" and V2 "after".
//
//   AUDIT_BASE=http://127.0.0.1:3401 node 01-capture.mjs before
//   AUDIT_BASE=http://127.0.0.1:3402 node 01-capture.mjs after
//
// Same script, same contexts, same data for both labels, so before/after are comparable.
// Everything is NOMINAL emulation in headless Chromium against an isolated copy with a disposable
// database. It does not measure the physical Elo screen, reach or touch hardware, and it is not a
// usability test. No tracing/video/HAR. Receipt and cancel-form credentials are masked.
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BASE, CONTEXTS, ROUTES, clearanceAtBottom, dirs, dockGeometry, focusWalk, launchBrowser, measure, openContext, settle, summarise } from "./stage1-lib.mjs";

const label = process.argv[2];
if (!["before", "after"].includes(label)) throw new Error("usage: 01-capture.mjs before|after");
const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(process.env.STAGE1_OUT ?? resolve(here, "../../docs/evidence/v2-ali-stage-1-2026-11-03"), label);
const only = process.env.STAGE1_CONTEXTS?.split(",");
const LANGS = ["de", "en"];
const withLang = (path, lang, extra = "") => {
  const q = [extra, lang === "en" ? "lang=en" : ""].filter(Boolean).join("&");
  return BASE + path + (q ? (path.includes("?") ? "&" : "?") + q : "");
};
const berlinDate = (days) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date(Date.now() + days * 86_400_000));

const index = [];
let bookingSeq = 0;

async function pageRecord(page, ctx, name, lang, extra = {}) {
  const geo = await page.evaluate(dockGeometry);
  const m = await page.evaluate(measure);
  const clear = await page.evaluate(clearanceAtBottom);
  const focus = await focusWalk(page);
  const small = m.targets.filter((t) => Math.min(t.w, t.h) < 44).slice(0, 12).map((t) => `${t.tag}:${t.name.slice(0, 24)} ${t.w}x${t.h}`);
  const record = {
    ctx, name, lang, url: page.url().replace(BASE, ""), label, htmlLang: m.htmlLang, title: m.title,
    summary: summarise(m), headings: m.headings.slice(0, 4), textSizeHist: m.text.sizeHist, smallTargets: small, geo, clear, focus, ...extra,
  };
  dirs(OUT, "data", ctx);
  writeFileSync(`${OUT}/data/${ctx}/${name}-${lang}.json`, JSON.stringify(record, null, 1));
  index.push({ ctx, name, lang, dockShare: geo.dock?.shareOfViewport ?? null, rootFontPx: geo.layout.rootFontPx, h1Px: geo.layout.h1Px, contentWidth: geo.layout.contentWidth, navCount: geo.navCount, links: geo.linkCount, rows: geo.rows.map((r) => r.count).join("+"), pinned: geo.pinned?.position ?? null, hOverflow: record.summary.hOverflow, clearOfDock: clear.clearOfDock, focusCovered: focus.coveredByDock.length, minTargetH: record.summary.minTargetH, textMinFs: record.summary.textMinFs });
  return record;
}

async function shot(page, ctx, name, lang, opts = {}) {
  const d = dirs(OUT, "screens", ctx);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${d}/${name}-${lang}.png`, ...opts });
}

async function capture(browser, ctx) {
  const context = await openContext(browser, ctx);
  const page = await context.newPage();
  const isKioskTouch = ctx === "kiosk-touch-1080x1920";
  const isPointer = ctx === "kiosk-pointer-1080x1920";
  const subset = isPointer ? ["home", "rooms", "booking", "display"] : null;
  for (const lang of LANGS) {
    for (const [name, path] of ROUTES) {
      if (subset && !subset.includes(name)) continue;
      await page.goto(withLang(path, lang), { waitUntil: "domcontentloaded" });
      await settle(page);
      await shot(page, ctx, name, lang);
      if (isKioskTouch) await shot(page, ctx, `${name}.FULL`, lang, { fullPage: true });
      await pageRecord(page, ctx, name, lang);
    }
  }

  if (!(isKioskTouch || isPointer || ctx === "sens-1080x1700" || ctx === "sens-540x960" || ctx === "phone-390x844")) {
    await context.close();
    return;
  }

  // --- states that sit near the bottom of the page -------------------------------------------
  const rooms = await (await context.request.get(`${BASE}/api/public/rooms`)).json();
  const list = rooms.rooms ?? rooms;
  const room = list.find((r) => r.reservable && r.id.startsWith("lcc-demo-room")) ?? list.find((r) => r.reservable) ?? list[0];
  for (const lang of LANGS) {
    const de = lang === "de";
    // search results with class hits (bottom of a long page)
    if (!isPointer) {
      await page.goto(withLang("/rooms", lang, "suche=zagel"), { waitUntil: "domcontentloaded" });
      await settle(page);
      await shot(page, ctx, "rooms-search-zagel", lang);
      await pageRecord(page, ctx, "rooms-search-zagel", lang);
    }
    // booking: review step (confirm button position) and masked receipt
    // Every flow really books a slot on the disposable server, so each one gets its own day (+2 … +13; the policy window is 14 days).
    const bookingDay = berlinDate(2 + (bookingSeq++ % 12));
    await page.goto(withLang("/booking", lang, `raum=${encodeURIComponent(room.id)}&datum=${bookingDay}`), { waitUntil: "domcontentloaded" });
    await settle(page);
    // The slot grid arrives with the availability fetch, possibly after networkidle: wait for it (10:00 exists two days ahead).
    const slot = page.getByRole("button", { name: "10:00", exact: true });
    await slot.waitFor({ timeout: 20000 });
    await slot.click();
    await page.getByRole("button", { name: de ? "Weiter zur Bestätigung" : "Review booking" }).click();
    await page.waitForTimeout(600);
    await shot(page, ctx, "booking-review", lang);
    const confirm = page.getByRole("button", { name: de ? "Demo-Reservierung bestätigen" : "Confirm demo booking" });
    const box = await confirm.boundingBox();
    const geo = await page.evaluate(dockGeometry);
    await pageRecord(page, ctx, "booking-review", lang, {
      confirmButton: box ? { top: Math.round(box.y), bottom: Math.round(box.y + box.height), inViewport: box.y >= 0 && box.y + box.height <= page.viewportSize().height } : null,
      dockTopAtCapture: geo.pinned?.top ?? null,
    });
    if (lang === "de" || isKioskTouch) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await confirm.click();
      await page.getByTestId("booking-receipt").waitFor();
      await page.waitForTimeout(400);
      const masks = [page.getByTestId("receipt-id"), page.getByTestId("receipt-code")];
      const d = dirs(OUT, "screens", ctx);
      await page.screenshot({ path: `${d}/booking-receipt-${lang}.png`, mask: masks });
      const g = await page.evaluate(dockGeometry);
      const done = await page.getByRole("button", { name: de ? "Fertig" : "Done" }).boundingBox();
      const rec = { ctx, name: "booking-receipt", lang, label, geo: { vw: g.vw, vh: g.vh, pinned: g.pinned, navCount: g.navCount }, doneButton: done ? { top: Math.round(done.y), bottom: Math.round(done.y + done.height) } : null };
      writeFileSync(`${dirs(OUT, "data", ctx)}/booking-receipt-${lang}.json`, JSON.stringify(rec, null, 1));
    }
    // cancel form: inputs masked (no values are typed in this capture)
    await page.goto(withLang("/booking/cancel", lang), { waitUntil: "domcontentloaded" });
    await settle(page);
    await shot(page, ctx, "cancel-form", lang, { mask: [page.locator("input")] });
  }

  // --- announcement board states (answers are synthetic; nothing is written to the database) -----
  const notice = (i, long) => ({
    id: `synthetic-${i}`, title: `Beispielmitteilung ${i}${long ? " mit längerem Titel für den Zeilenumbruch" : ""}`,
    body: `Synthetischer Text für Mitteilung ${i}. ${"Dies ist Füllinhalt zum Prüfen des Überlaufs. ".repeat(long ? 5 : 2)}`,
    category: ["general", "event", "important"][i % 3], pinned: i === 1, publishedAt: new Date().toISOString(), endsAt: null,
    titleEn: `Sample notice ${i}`, bodyEn: `Synthetic text for notice ${i}. ${"This is filler to check overflow. ".repeat(long ? 5 : 2)}`,
  });
  const answers = {
    many: { serverTime: new Date().toISOString(), announcements: Array.from({ length: 8 }, (_, i) => notice(i + 1, i % 2 === 0)) },
    empty: { serverTime: new Date().toISOString(), announcements: [] },
  };
  for (const lang of LANGS) {
    for (const state of ["many", "empty", "error", "loading"]) {
      const p2 = await context.newPage();
      await p2.route("**/api/public/announcements", async (route) => {
        if (state === "error") return route.abort();
        if (state === "loading") return new Promise(() => {});
        return route.fulfill({ json: answers[state] });
      });
      await p2.goto(withLang("/display", lang), { waitUntil: "domcontentloaded" });
      await p2.waitForTimeout(state === "error" ? 1500 : 900);
      const d = dirs(OUT, "screens", ctx);
      await p2.screenshot({ path: `${d}/display-${state}-${lang}.png` });
      const geo = await p2.evaluate(dockGeometry);
      const list = await p2.evaluate(() => {
        const cards = [...document.querySelectorAll("article")];
        if (!cards.length) return null;
        const box = cards[0].parentElement;
        box.scrollTop = box.scrollHeight;
        const last = cards[cards.length - 1].getBoundingClientRect();
        const b = box.getBoundingClientRect();
        return { cards: cards.length, scrollable: box.scrollHeight > box.clientHeight, clipped: cards.filter((c) => c.scrollHeight > c.clientHeight + 1).length, lastReachable: last.bottom <= b.bottom + 1, listBottom: Math.round(b.bottom) };
      });
      const nav = geo.navBox;
      const rec = { ctx, name: `display-${state}`, lang, label, geo: { vw: geo.vw, vh: geo.vh, rows: geo.rows.map((r) => r.count), lang: { found: geo.lang.found, gap: geo.lang.gapBetween, centreYRatio: geo.lang.centreYRatio }, navTop: nav?.top ?? null, navBottom: nav?.bottom ?? null, frameCentre: geo.frameCentre, rowCentres: geo.rows.map((r) => r.centre) }, list, listAboveNav: list && nav ? list.listBottom <= nav.top + 1 : null };
      writeFileSync(`${dirs(OUT, "data", ctx)}/display-${state}-${lang}.json`, JSON.stringify(rec, null, 1));
      await p2.close();
    }
  }
  await context.close();
}

const browser = await launchBrowser();
const version = browser.version();
for (const ctx of Object.keys(CONTEXTS)) {
  if (only && !only.includes(ctx)) continue;
  console.log("capture", label, ctx);
  await capture(browser, ctx);
}
await browser.close();
writeFileSync(`${dirs(OUT, "data")}/_index.json`, JSON.stringify({ label, base: BASE.replace(/:\d+$/, ":<port>"), chromium: version, contexts: Object.fromEntries(Object.entries(CONTEXTS).map(([k, v]) => [k, v.note])), pages: index }, null, 1));
console.log("done", label, index.length, "page records ->", OUT);

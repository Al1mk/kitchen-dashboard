// Stage 2 capture (4 Nov 2026): screenshots + geometry for Home, Newcomers and Rooms, "before" (Stage 1 working
// tree) and "after" (Stage 2 working tree).
//
//   AUDIT_BASE=http://127.0.0.1:3411 node 01-capture.mjs before
//   AUDIT_BASE=http://127.0.0.1:3412 node 01-capture.mjs after
//
// Same script, contexts, languages and synthetic data for both labels, so before/after are comparable.
// NOMINAL emulation in headless Chromium against an isolated copy with a disposable database. It does not
// measure the physical Elo screen, reach or touch hardware, and it is not a usability test. No tracing,
// video or HAR; no booking is made and nothing is typed into a credential field.
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BASE, CONTEXTS, clearanceAtBottom, dirs, dockGeometry, launchBrowser, measure, openContext, settle, summarise } from "../v2-ali-stage-1-2026-11-03/stage1-lib.mjs";

const label = process.argv[2];
if (!["before", "after"].includes(label)) throw new Error("usage: 01-capture.mjs before|after");
const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(process.env.STAGE2_OUT ?? resolve(here, "../../docs/evidence/v2-ali-stage-2-2026-11-04"), label);
const LANGS = ["de", "en"];
const withLang = (path, lang, extra = "") => {
  const q = [extra, lang === "en" ? "lang=en" : ""].filter(Boolean).join("&");
  return BASE + path + (q ? (path.includes("?") ? "&" : "?") + q : "");
};

// In-page: what Stage 2 changes, read the same way in both versions (selectors that do not exist in V1 give null/0).
function stage2Metrics() {
  const round = (n) => Math.round(n * 10) / 10;
  const box = (el) => { const r = el.getBoundingClientRect(); return { x: round(r.x), y: round(r.y + scrollY), w: round(r.width), h: round(r.height) }; };
  const dock = document.querySelector("[data-public-dock]");
  const dockFixed = dock && getComputedStyle(dock).position === "fixed" ? dock.getBoundingClientRect().top : null;
  const vh = innerHeight;
  const doc = document.documentElement;
  const out = { vh, docHeight: doc.scrollHeight, screens: round(doc.scrollHeight / vh), hOverflow: doc.scrollWidth > doc.clientWidth + 1 };

  // Home: the six destination cards ("home-card" in Stage 2; the V1 cards are the links inside <main> <ul>)
  const homeCards = [...document.querySelectorAll('[data-testid="home-card"]')];
  const v1Cards = homeCards.length ? [] : [...document.querySelectorAll("main ul > li > a")];
  const cards = homeCards.length ? homeCards : v1Cards;
  if (cards.length && location.pathname === "/") {
    const boxes = cards.map(box);
    out.home = {
      kind: homeCards.length ? "stage2" : "v1", cards: cards.length, columns: new Set(boxes.map((b) => b.x)).size,
      minW: Math.min(...boxes.map((b) => b.w)), minH: Math.min(...boxes.map((b) => b.h)), maxH: Math.max(...boxes.map((b) => b.h)),
      pictograms: cards.filter((c) => c.querySelector("svg")).length,
      lastBottomViewportAtEnd: null,
    };
  }
  // Newcomers
  const nc = [...document.querySelectorAll("main article")];
  if (nc.length && location.pathname === "/newcomers") {
    const boxes = nc.map(box);
    const note = document.querySelector('[data-testid="prototype-marker"]') ?? document.querySelector('main [role="note"]');
    out.newcomers = {
      cards: nc.length, columns: new Set(boxes.map((b) => b.x)).size, minH: Math.min(...boxes.map((b) => b.h)),
      helpFullWidth: boxes.length === 5 ? Math.abs(boxes[4].w - (boxes[1].x + boxes[1].w - boxes[0].x)) < 1 : null,
      pictograms: nc.filter((c) => c.querySelector("svg")).length,
      noteKind: note ? (note.getAttribute("role") === "note" ? "coloured block (V1)" : "compact marker") : "none",
      noteHeight: note ? round(note.getBoundingClientRect().height) : null, noteFontPx: note ? parseFloat(getComputedStyle(note).fontSize) : null,
      noteBackground: note ? getComputedStyle(note).backgroundColor : null,
    };
  }
  // Rooms
  const roomCards = [...document.querySelectorAll("article[data-room-id]")];
  if (location.pathname === "/rooms" && roomCards.length) {
    const tops = roomCards.map((c) => c.getBoundingClientRect().top + scrollY);
    const pitches = tops.slice(1).map((t, i) => t - tops[i]).filter((d) => d > 0 && d < 700).sort((a, b) => a - b);
    const bar = document.querySelector('[data-testid="floor-jump"]');
    const heads = [...document.querySelectorAll('[id^="stock-"]')];
    out.rooms = {
      cards: roomCards.length, medianPitch: pitches.length ? pitches[Math.floor(pitches.length / 2)] : null,
      firstCardH: round(roomCards[0].getBoundingClientRect().height),
      actionsInOneRow: roomCards.filter((c) => new Set([...c.querySelectorAll("a")].map((a) => Math.round(a.getBoundingClientRect().top))).size === 1).length,
      chips: bar ? [...bar.querySelectorAll("button")].map((b) => ({ t: b.textContent.trim(), h: round(b.getBoundingClientRect().height) })) : [],
      chipBar: bar ? { sticky: getComputedStyle(bar).position === "sticky", h: round(bar.getBoundingClientRect().height) } : null,
      floorHeadings: heads.length,
    };
  }
  // Search groups
  const sr = document.querySelector('[data-testid="search-rooms"]');
  const sc = document.querySelector('[data-testid="search-classes"]');
  if (sr || sc) {
    const noRoom = [...document.querySelectorAll("[role=status]")].find((n) => /Kein Raum passt|No room matches/.test(n.textContent));
    out.search = {
      first: sr && sc ? (sc.compareDocumentPosition(sr) & Node.DOCUMENT_POSITION_FOLLOWING ? "classes" : "rooms") : sr ? "rooms" : "classes",
      classMatches: document.querySelectorAll('[data-testid="class-match"]').length,
      noRoomMessage: noRoom ? noRoom.textContent.trim().slice(0, 90) : null,
      noRoomAboveClasses: noRoom && sc ? noRoom.getBoundingClientRect().top < sc.getBoundingClientRect().top : null,
      scopeSentence: sc ? /nur für diesen Tag|this one day only/.test(sc.textContent) : false,
      classesHeadingTop: sc ? round(sc.getBoundingClientRect().top + scrollY) : null,
    };
  }
  out.dockTop = dockFixed;
  return out;
}

const index = [];

async function record(page, ctx, name, lang, extra = {}) {
  const geo = await page.evaluate(dockGeometry);
  const m = await page.evaluate(measure);
  const clear = await page.evaluate(clearanceAtBottom);
  const s2 = await page.evaluate(stage2Metrics);
  const r = { ctx, name, lang, label, url: page.url().replace(BASE, ""), summary: summarise(m), textMinFs: m.text.sizeHist ? Math.min(...Object.keys(m.text.sizeHist).map(Number)) : null, clear, stage2: s2, dock: geo.dock, ...extra };
  dirs(OUT, "data", ctx);
  writeFileSync(`${OUT}/data/${ctx}/${name}-${lang}.json`, JSON.stringify(r, null, 1));
  index.push({ ctx, name, lang, screens: s2.screens, hOverflow: s2.hOverflow, clearOfDock: clear.clearOfDock, minTargetH: r.summary.minTargetH, textMinFs: r.textMinFs, home: s2.home ?? null, newcomers: s2.newcomers ?? null, rooms: s2.rooms ? { ...s2.rooms, chips: s2.rooms.chips.length } : null, search: s2.search ?? null });
}

async function shot(page, ctx, name, lang, opts = {}) {
  const d = dirs(OUT, "screens", ctx);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${d}/${name}-${lang}.png`, ...opts });
}

async function capture(browser, ctx) {
  const context = await openContext(browser, ctx);
  const page = await context.newPage();
  const full = ctx === "kiosk-touch-1080x1920";
  for (const lang of LANGS) {
    for (const [name, path, extra] of [
      ["home", "/", ""],
      ["newcomers", "/newcomers", ""],
      ["rooms", "/rooms", ""],
      ["rooms-search-hci", "/rooms", "suche=HCI"],
      ["rooms-search-k1-120", "/rooms", "suche=K1-120"],
    ]) {
      await page.goto(withLang(path, lang, extra), { waitUntil: "domcontentloaded" });
      await settle(page, 900);
      await shot(page, ctx, name, lang);
      if (full && !name.startsWith("rooms-search")) await shot(page, ctx, `${name}.FULL`, lang, { fullPage: true });
      await record(page, ctx, name, lang);
    }

    // Floor chips (Stage 2 only): tap the second floor's chip, then capture where the page landed.
    await page.goto(withLang("/rooms", lang), { waitUntil: "domcontentloaded" });
    await settle(page, 700);
    const jump = page.locator('[data-testid="floor-jump"] button');
    if (await jump.count()) {
      await jump.nth(1).click();
      await page.waitForTimeout(1200);
      const d = dirs(OUT, "screens", ctx);
      await page.screenshot({ path: `${d}/rooms-after-floor-chip-${lang}.png` });
      const landed = await page.evaluate(() => {
        const bar = document.querySelector('[data-testid="floor-jump"]');
        const h = document.activeElement;
        return { focusedId: h?.id ?? null, headingTop: Math.round(h?.getBoundingClientRect().top ?? -1), barBottom: Math.round(bar.getBoundingClientRect().bottom), barSticky: getComputedStyle(bar).position === "sticky", urlHasHash: location.hash !== "" };
      });
      writeFileSync(`${dirs(OUT, "data", ctx)}/rooms-floor-chip-${lang}.json`, JSON.stringify({ ctx, lang, label, landed }, null, 1));
    }
  }
  await context.close();
}

const browser = await launchBrowser();
const version = browser.version();
const wanted = (process.env.STAGE2_CONTEXTS ?? "kiosk-touch-1080x1920,kiosk-pointer-1080x1920,sens-1080x1700,sens-540x960,laptop-1440x900,phone-390x844").split(",");
for (const ctx of wanted) {
  if (!CONTEXTS[ctx]) continue;
  console.log("capture", label, ctx);
  await capture(browser, ctx);
}
await browser.close();
writeFileSync(`${dirs(OUT, "data")}/_index.json`, JSON.stringify({ label, base: BASE.replace(/:\d+$/, ":<port>"), chromium: version, contexts: Object.fromEntries(wanted.map((k) => [k, CONTEXTS[k]?.note])), pages: index }, null, 1));
console.log("done", label, index.length, "page records ->", OUT);

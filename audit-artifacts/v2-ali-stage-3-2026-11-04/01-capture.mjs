// Stage 3 capture (4 Nov 2026): matched "before" and "after" (Stage 3 working tree)
// The original capture JSON is not commit-stamped; see the evidence README for its provenance limit.
// screenshots + measurements for the shared accessibility items (AL-05, docs/contracts.md C14).
//
//   AUDIT_BASE=http://127.0.0.1:3411 node 01-capture.mjs before
//   AUDIT_BASE=http://127.0.0.1:3412 node 01-capture.mjs after
//
// Same script, contexts, languages and synthetic data for both labels. NOMINAL emulation in headless Chromium against an
// isolated copy with a disposable database: not the physical Elo screen, not a screen-reader session, not a usability
// test. No tracing, video or HAR; nothing is typed into a credential field; /display answers are synthetic (route stub).
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BASE, CONTEXTS, dirs, launchBrowser, openContext, settle } from "../v2-ali-stage-1-2026-11-03/stage1-lib.mjs";

const label = process.argv[2];
if (!["before", "after"].includes(label)) throw new Error("usage: 01-capture.mjs before|after");
const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(process.env.STAGE3_OUT ?? resolve(here, "../../docs/evidence/v2-ali-stage-3-2026-11-04"), label);
const LANGS = ["de", "en"];
const KIOSK_CONTEXTS = new Set(["kiosk-touch-1080x1920", "kiosk-pointer-1080x1920", "sens-540x960", "sens-1080x1700"]);
const withLang = (path, lang, extra = "") => {
  const q = [extra, lang === "en" ? "lang=en" : ""].filter(Boolean).join("&");
  return BASE + path + (q ? (path.includes("?") ? "&" : "?") + q : "");
};
const sha =(buf) => createHash("sha256").update(buf).digest("hex").slice(0, 16);

const notice = (i) => ({
  id: `stage3-${i}`, title: `Beispielmitteilung ${i}`, body: `Synthetischer Text ${i}. Nur zur Darstellung; keine echte Mitteilung.`,
  category: ["general", "event", "important"][i % 3], pinned: i === 1, publishedAt: "2031-05-14T08:00:00.000Z", endsAt: null,
  titleEn: `Sample notice ${i}`, bodyEn: `Synthetic text ${i}. For display only; not a real notice.`,
});
const stubBoard = (page) =>
  page.route("**/api/public/announcements", (route) =>
    route.fulfill({ json: { serverTime: "2031-05-14T09:30:00.000Z", announcements: [1, 2, 3, 4].map(notice) } }),
  );

// ---- in-page readings (identical for both versions) -------------------------------------------------
function readFocus() {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const r = el.getBoundingClientRect();
  const name = (el.getAttribute("aria-label") || el.innerText || el.querySelector("img")?.alt || el.textContent || "").trim().replace(/\s+/g, " ");
  const bar = document.querySelector('[data-testid="floor-jump"]');
  const barBox = bar && getComputedStyle(bar).position === "sticky" ? bar.getBoundingClientRect() : null;
  const dock = document.querySelector("[data-public-dock]");
  const dockBox = dock && getComputedStyle(dock).position === "fixed" ? dock.getBoundingClientRect() : null;
  return {
    tag: el.tagName, id: el.id || null, name: name.slice(0, 80), href: el.getAttribute("href"),
    top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.height),
    inViewport: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth,
    barBottom: barBox ? Math.round(barBox.bottom) : null, dockTop: dockBox ? Math.round(dockBox.top) : null,
    underBar: barBox ? r.top < barBox.bottom - 0.5 && !bar.contains(el) : false,
    underDock: dockBox ? r.bottom > dockBox.top + 0.5 && !dock.contains(el) : false,
  };
}
function readPage() {
  const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter((h) => h.getBoundingClientRect().height > 0)
    .map((h) => [Number(h.tagName[1]), h.textContent.trim().replace(/\s+/g, " ").slice(0, 60)]);
  const skip = [...document.querySelectorAll("a")].find((a) => /Zum Inhalt springen|Skip to main content/.test(a.textContent));
  const logo = [...document.querySelectorAll("a")].find((a) => a.querySelector("img[src*=logo]"));
  return {
    htmlLang: document.documentElement.lang,
    wrapperLang: document.querySelector("[data-public-shell], [data-testid=display-board]")?.closest("[lang]")?.getAttribute("lang") ?? null,
    title: document.title,
    h1Count: headings.filter(([l]) => l === 1).length,
    headings: headings.slice(0, 10),
    skipLink: skip ? { text: skip.textContent.trim(), href: skip.getAttribute("href") } : null,
    logoLink: logo ? { href: logo.getAttribute("href"), alt: logo.querySelector("img").alt } : null,
    mainId: document.querySelector("main")?.id || null,
  };
}
function placeholderContrast() {
  const input = document.querySelector("input[placeholder]");
  if (!input) return null;
  const g = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  g.canvas.width = g.canvas.height = 1;
  const rgba = (css) => { g.clearRect(0, 0, 1, 1); g.fillStyle = "#000"; g.fillStyle = css; g.fillRect(0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const lum = ([r, gg, b]) => { const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)); return 0.2126 * f(r) + 0.7152 * f(gg) + 0.0722 * f(b); };
  const bgc = rgba(getComputedStyle(input).backgroundColor);
  const bg = bgc.slice(0, 3);
  const s = getComputedStyle(input, "::placeholder");
  const fgRaw = rgba(s.color);
  const a = fgRaw[3] * parseFloat(s.opacity || "1");
  const fg = fgRaw.slice(0, 3).map((v, k) => Math.round(v * a + bg[k] * (1 - a)));
  const [l1, l2] = [lum(fg), lum(bg)];
  return { placeholder: input.placeholder, ratio: Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100, fg, bg };
}

/** Links (name + target) of the whole page as the browser's accessibility tree reports them. */
function parseLinks(snapshot) {
  const lines = snapshot.split("\n");
  const links = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*- link "(.*)":?\s*$/);
    if (!m) continue;
    links.push({ name: m[1].replace(/\\"/g, '"'), href: lines[i + 1]?.match(/^\s*- \/url: (.*)$/)?.[1] ?? "" });
  }
  return links;
}
/** Same name, different target: what makes a link list ambiguous (WCAG 2.4.4 context). */
function ambiguousNames(links) {
  const byName = new Map();
  for (const l of links) byName.set(l.name, [...(byName.get(l.name) ?? []), l.href]);
  return [...byName].filter(([, hrefs]) => new Set(hrefs).size > 1).map(([name, hrefs]) => ({ name, targets: new Set(hrefs).size, occurrences: hrefs.length }));
}

const index = [];
const save =(ctx, name, lang, data) => {
  const d = dirs(OUT, "data", ctx);
  writeFileSync(`${d}/${name}-${lang}.json`, JSON.stringify({ ctx, name, lang, label, ...data }, null, 1));
  index.push({ ctx, name, lang });
};
const shot = async (page, ctx, name, lang, opts = {}) => {
  const d = dirs(OUT, "screens", ctx);
  await page.screenshot({ path: `${d}/${name}-${lang}.png`, ...opts });
};

async function capture(browser, ctx) {
  const context = await openContext(browser, ctx);
  const page = await context.newPage();
  const kiosk = KIOSK_CONTEXTS.has(ctx);
  const hero = ctx === "kiosk-touch-1080x1920" || ctx === "sens-540x960" || ctx === "laptop-1440x900";
  await stubBoard(page);
  for (const lang of LANGS) {
    // 1. First tab stop and what the page says about itself, on every public page.
    for (const [name, path] of [["home", "/"], ["newcomers", "/newcomers"], ["map", "/map"], ["rooms", "/rooms"], ["schedule", "/schedule"], ["booking", "/booking"], ["booking-cancel", "/booking/cancel"], ["display", "/display"]]) {
      await page.goto(withLang(path, lang), { waitUntil: "domcontentloaded" });
      await settle(page, 700);
      const info = await page.evaluate(readPage);
      const links = parseLinks(await page.locator("body").ariaSnapshot());
      info.linkCount = links.length;
      info.ambiguousLinkNames = ambiguousNames(links).sort((a, b) => b.occurrences - a.occurrences).slice(0, 6);
      await page.evaluate(() => { window.scrollTo(0, 0); document.activeElement?.blur?.(); });
      await page.keyboard.press("Tab");
      const first = await page.evaluate(readFocus);
      let afterSkip = null;
      if (first && /Zum Inhalt springen|Skip to main content/.test(first.name)) {
        if (hero && name === "home") await shot(page, ctx, "home-first-tab-stop", lang);
        await page.keyboard.press("Enter");
        afterSkip = await page.evaluate(readFocus);
        await page.keyboard.press("Tab");
        const next = await page.evaluate(readFocus);
        afterSkip = { ...afterSkip, nextTab: next ? { tag: next.tag, name: next.name } : null, urlHash: new URL(page.url()).hash };
      } else if (hero && name === "home") {
        await shot(page, ctx, "home-first-tab-stop", lang);
      }
      save(ctx, `page-${name}`, lang, { page: info, firstTabStop: first, afterSkipActivation: afterSkip });
    }

    // 2. Rooms: link names, placeholder contrast, and keyboard focus against the pinned chip bar.
    await page.goto(withLang("/rooms", lang), { waitUntil: "domcontentloaded" });
    await settle(page, 900);
    const linkSnap = await page.getByTestId("room-directory").ariaSnapshot();
    const names = [...linkSnap.matchAll(/^\s*- link "(.*)":?\s*$/gm)].map((m) => m[1]);
    const dups = names.filter((n, i) => names.indexOf(n) !== i);
    const firstCard = await page.locator("article[data-room-id]").first().ariaSnapshot();
    const contrast = await page.evaluate(placeholderContrast);
    if (hero) {
      const box = await page.locator("#room-search").boundingBox();
      if (box) await shot(page, ctx, "rooms-search-placeholder", lang, { clip: { x: 0, y: Math.max(0, box.y - 60), width: Math.min(box.x * 2 + box.width, 1080), height: box.height + 120 } });
    }
    let scenario = null;
    if (kiosk) {
      const cards = page.locator("article[data-room-id]");
      const target = cards.nth(25).getByRole("link").first();
      const before = cards.nth(24).getByRole("link").last();
      await target.focus();
      const y = await before.evaluate((e) => e.getBoundingClientRect().top);
      await page.evaluate((dy) => window.scrollBy(0, dy), y - 30);
      await page.keyboard.press("Shift+Tab");
      await page.waitForTimeout(250);
      scenario = await page.evaluate(readFocus);
      if (hero) await shot(page, ctx, "rooms-shift-tab-under-chip-bar", lang);
    }
    save(ctx, "rooms-a11y", lang, {
      roomLinkCount: names.length, duplicateLinkNames: dups.length, distinctLinkNames: new Set(names).size,
      firstCardLinks: firstCard.split("\n").filter((l) => /link /.test(l)).map((l) => l.trim()),
      placeholder: contrast, shiftTabScenario: scenario,
    });

    // 3. Class-result link names (search for a lecturer in the demo data).
    await page.goto(withLang("/rooms", lang, "suche=HCI"), { waitUntil: "domcontentloaded" });
    await settle(page, 1200);
    const classSnap = await page.getByTestId("search-classes").ariaSnapshot().catch(() => "");
    save(ctx, "rooms-class-links", lang, { links: [...classSnap.matchAll(/^\s*- link "(.*)":?\s*$/gm)].map((m) => m[1]) });

    // 4. /display: heading outline and a masked screenshot (the clock is masked; the data is synthetic).
    await page.goto(withLang("/display", lang), { waitUntil: "domcontentloaded" });
    await settle(page, 1000);
    const clock = page.locator('[aria-label="Uhrzeit"], [aria-label="Time"]');
    const png = await page.screenshot({ mask: [clock], maskColor: "#888888" });
    const d = dirs(OUT, "screens", ctx);
    if (hero) writeFileSync(`${d}/display-${lang}.png`, png);
    const sizes = await page.evaluate(() => {
      const fs = (el) => (el ? parseFloat(getComputedStyle(el).fontSize) : null);
      return { sectionHeading: fs(document.querySelector("main h1, main h2")), cardTitle: fs(document.querySelector("article h2, article h3")) };
    });
    save(ctx, "display-board", lang, { pngSha256: sha(png), sizes });
  }
  await context.close();
}

const browser = await launchBrowser();
const version = browser.version();
const wanted = (process.env.STAGE3_CONTEXTS ?? "kiosk-touch-1080x1920,kiosk-pointer-1080x1920,sens-540x960,laptop-1440x900,phone-390x844").split(",");
for (const ctx of wanted) {
  if (!CONTEXTS[ctx]) continue;
  console.log("capture", label, ctx);
  await capture(browser, ctx);
}
await browser.close();
writeFileSync(`${dirs(OUT, "data")}/_index.json`, JSON.stringify({ label, base: BASE.replace(/:\d+$/, ":<port>"), chromium: version, contexts: Object.fromEntries(wanted.map((k) => [k, CONTEXTS[k]?.note])), records: index }, null, 1));
console.log("done", label, index.length, "records ->", OUT);

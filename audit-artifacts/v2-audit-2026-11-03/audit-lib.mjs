// V2 audit helper (3 Nov 2026). Audit tooling only: not product code, not part of the test suite.
// Runs against an ISOLATED audit copy on localhost (default port 3400) with a disposable DB.
// Usage: AUDIT_BASE=http://127.0.0.1:3400 AUDIT_OUT=/some/dir node <script>.mjs
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

export const BASE = process.env.AUDIT_BASE ?? "http://127.0.0.1:3400";
export const OUT = process.env.AUDIT_OUT ?? "./audit-out";

if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(BASE)) {
  throw new Error("Refusing to audit anything but a localhost audit server: " + BASE);
}
if (/:(3000)$/.test(BASE)) {
  throw new Error("Port 3000 is the manual server port; audit uses a separate port.");
}

// Emulation settings. All are NOMINAL simulations, not measurements of the physical Elo screen.
export const CONTEXTS = {
  kiosk: {
    label: "kiosk-nominal-1080x1920",
    note: "Nominal portrait kiosk simulation: Chromium viewport 1080x1920 CSS px, DPR 1, touch enabled, isMobile false",
    options: { viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1, hasTouch: true, isMobile: false, locale: "de-DE", timezoneId: "Europe/Berlin" },
  },
  kioskSens: {
    label: "kiosk-sensitivity-1080x1700",
    note: "Sensitivity check ONLY: 1080x1700 assumes ~220 CSS px lost to macOS menu bar + browser chrome. Unmeasured assumption.",
    options: { viewport: { width: 1080, height: 1700 }, deviceScaleFactor: 1, hasTouch: true, isMobile: false, locale: "de-DE", timezoneId: "Europe/Berlin" },
  },
  zoom200: {
    label: "zoom200-sensitivity-540x960",
    note: "Sensitivity check ONLY: 540x960 CSS px = what a 200% browser zoom on a 1080x1920 output would give. Unmeasured assumption.",
    options: { viewport: { width: 540, height: 960 }, deviceScaleFactor: 2, hasTouch: true, isMobile: false, locale: "de-DE", timezoneId: "Europe/Berlin" },
  },
  laptop: {
    label: "laptop-1440x900",
    note: "Ordinary laptop-sized desktop view, mouse + keyboard, DPR 1",
    options: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, hasTouch: false, isMobile: false, locale: "de-DE", timezoneId: "Europe/Berlin" },
  },
};

export const ROUTES = [
  ["home", "/"],
  ["newcomers", "/newcomers"],
  ["map", "/map"],
  ["rooms", "/rooms"],
  ["schedule", "/schedule"],
  ["booking", "/booking"],
  ["booking-cancel", "/booking/cancel"],
  ["display", "/display"],
];

export function url(path, lang = "de", extra = "") {
  const q = [];
  if (lang === "en") q.push("lang=en");
  if (extra) q.push(extra);
  return BASE + path + (q.length ? (path.includes("?") ? "&" : "?") + q.join("&") : "");
}

export async function launch(ctxKey) {
  const c = CONTEXTS[ctxKey];
  const browser = await chromium.launch({ headless: true });
  // No tracing, video or HAR: they could capture credentials/cancellation codes.
  const context = await browser.newContext({ ...c.options, recordVideo: undefined });
  const page = await context.newPage();
  const events = { console: [], pageerror: [], requestfailed: [], badresponse: [] };
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") events.console.push({ type: m.type(), text: m.text().slice(0, 240), at: page.url().replace(BASE, "") });
  });
  page.on("pageerror", (e) => events.pageerror.push({ text: String(e).slice(0, 240), at: page.url().replace(BASE, "") }));
  page.on("requestfailed", (r) => events.requestfailed.push({ url: r.url().replace(BASE, "").slice(0, 120), why: r.failure()?.errorText }));
  page.on("response", (r) => {
    if (r.status() >= 400) events.badresponse.push({ url: r.url().replace(BASE, "").slice(0, 120), status: r.status() });
  });
  return { browser, context, page, events, ctx: c };
}

export function ensureDir(d) {
  mkdirSync(d, { recursive: true });
}

// Wait until the page has left its loading markers (best effort; records if it timed out).
export async function settle(page, ms = 700) {
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
  const stillLoading = await page
    .waitForFunction(() => !/(wird geladen|lädt|laden…|loading…|^\s*laden)/i.test(document.body.innerText), null, { timeout: 8000 })
    .then(() => false)
    .catch(() => true);
  await page.waitForTimeout(ms);
  return { stillLoading };
}

// In-page measurement. Pure DOM reading; does not mutate the page.
export function measure() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const cvs = document.createElement("canvas");
  cvs.width = cvs.height = 1;
  const g = cvs.getContext("2d", { willReadFrequently: true });
  const rgba = (css) => {
    g.clearRect(0, 0, 1, 1);
    g.fillStyle = "#000";
    g.fillStyle = css;
    g.fillRect(0, 0, 1, 1);
    const d = g.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  const lum = ([r, gg, b]) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(gg) + 0.0722 * f(b);
  };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const visible = (el) => {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && parseFloat(cs.opacity) > 0;
  };
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  const accName = (el) =>
    clean(el.getAttribute("aria-label") || (el.getAttribute("aria-labelledby") && document.getElementById(el.getAttribute("aria-labelledby"))?.innerText) || el.innerText || el.value || el.getAttribute("placeholder") || el.getAttribute("title") || el.querySelector("img[alt]")?.getAttribute("alt") || "").slice(0, 70);

  // 1) interactive targets
  const sel = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=link],[role=tab],[role=checkbox],[role=radio],[tabindex]:not([tabindex="-1"])';
  const targets = [...document.querySelectorAll(sel)].filter(visible).map((el, i) => {
    const r = el.getBoundingClientRect();
    return {
      i, tag: el.tagName.toLowerCase(), type: el.getAttribute("type") || undefined, name: accName(el),
      href: el.getAttribute("href")?.slice(0, 90), x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10,
      inFirstViewport: r.top < vh && r.bottom > 0, disabled: !!el.disabled || el.getAttribute("aria-disabled") === "true",
    };
  });
  // nearest-neighbour gap between targets
  for (const t of targets) {
    let best = Infinity;
    for (const u of targets) {
      if (u === t) continue;
      const dx = Math.max(0, Math.max(t.x - (u.x + u.w), u.x - (t.x + t.w)));
      const dy = Math.max(0, Math.max(t.y - (u.y + u.h), u.y - (t.y + t.h)));
      const d = Math.hypot(dx, dy);
      if (d < best) best = d;
    }
    t.nearestGap = best === Infinity ? null : Math.round(best * 10) / 10;
  }

  // 2) text census + contrast
  const textEls = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (!clean(n.nodeValue)) continue;
    const el = n.parentElement;
    if (!el || seen.has(el) || !visible(el) || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(el.tagName)) continue;
    seen.add(el);
    const cs = getComputedStyle(el);
    const fs = parseFloat(cs.fontSize);
    // effective background: composite ancestor backgrounds over white
    let bg = [255, 255, 255], layers = [], hasImg = false;
    for (let a = el; a; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.backgroundImage && s.backgroundImage !== "none") hasImg = true;
      const c = rgba(s.backgroundColor);
      if (c[3] > 0) layers.push(c);
      if (c[3] >= 1) break;
    }
    for (const c of layers.reverse()) bg = bg.map((v, k) => Math.round(c[k] * c[3] + v * (1 - c[3])));
    const fg = rgba(cs.color);
    const fgOver = fg.slice(0, 3).map((v, k) => Math.round(v * fg[3] + bg[k] * (1 - fg[3])));
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const large = fs >= 24 || (fs >= 18.66 && bold);
    const r = el.getBoundingClientRect();
    textEls.push({
      text: clean(n.nodeValue).slice(0, 50), tag: el.tagName.toLowerCase(), fs: Math.round(fs * 10) / 10, weight: cs.fontWeight,
      contrast: Math.round(ratio(fgOver, bg) * 100) / 100, large, hasBgImage: hasImg, y: Math.round(r.y + scrollY),
      fg: fgOver.join(","), bg: bg.join(","),
    });
  }
  const sizeHist = {};
  for (const t of textEls) sizeHist[t.fs] = (sizeHist[t.fs] || 0) + 1;

  // 3) overflow / scroll
  const doc = document.documentElement;
  const overflowers = [...document.querySelectorAll("body *")]
    .filter(visible)
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ r }) => r.right > vw + 1 || r.left < -1)
    .slice(0, 6)
    .map(({ el, r }) => ({ tag: el.tagName.toLowerCase(), cls: String(el.className).slice(0, 60), left: Math.round(r.left), right: Math.round(r.right) }));

  // 4) fixed / sticky elements
  const pinned = [...document.querySelectorAll("body *")].filter((el) => {
    const p = getComputedStyle(el).position;
    return (p === "fixed" || p === "sticky") && visible(el);
  }).map((el) => { const r = el.getBoundingClientRect(); return { tag: el.tagName.toLowerCase(), pos: getComputedStyle(el).position, y: Math.round(r.y), h: Math.round(r.height), w: Math.round(r.width), text: clean(el.innerText).slice(0, 40) }; });

  // 5) structure
  const headings = [...document.querySelectorAll("h1,h2,h3,h4")].filter(visible).map((h) => ({ l: h.tagName, t: clean(h.innerText).slice(0, 70), fs: parseFloat(getComputedStyle(h).fontSize), y: Math.round(h.getBoundingClientRect().y + scrollY) }));
  const unlabeled = [...document.querySelectorAll("input:not([type=hidden]),select,textarea")].filter(visible).filter((el) => !(el.labels && el.labels.length) && !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby")).map((el) => el.outerHTML.slice(0, 90));
  const nameless = targets.filter((t) => !t.name).map((t) => ({ tag: t.tag, href: t.href, x: t.x, y: t.y, w: t.w, h: t.h }));
  const imgs = [...document.querySelectorAll("img")].filter(visible).map((im) => ({ src: (im.getAttribute("src") || "").slice(0, 60), alt: im.getAttribute("alt"), w: Math.round(im.getBoundingClientRect().width), h: Math.round(im.getBoundingClientRect().height) }));
  const homeLinks = targets.filter((t) => t.tag === "a" && /^\/(\?lang=en)?$/.test(t.href || ""));

  return {
    viewport: { vw, vh, dpr: window.devicePixelRatio }, htmlLang: doc.lang, title: document.title,
    scroll: { scrollWidth: doc.scrollWidth, scrollHeight: doc.scrollHeight, screens: Math.round((doc.scrollHeight / vh) * 100) / 100, hOverflow: doc.scrollWidth > vw + 1 },
    landmarks: { header: !!document.querySelector("header"), nav: document.querySelectorAll("nav").length, main: !!document.querySelector("main"), footer: !!document.querySelector("footer"), skipLink: !!document.querySelector('a[href^="#"]') },
    headings, targets, nameless, unlabeled, imgs, homeLinks, pinned, overflowers,
    text: { count: textEls.length, sizeHist, items: textEls },
  };
}

// Keyboard walk: Tab N times, record focus target + focus indicator + whether it sits inside the viewport.
export async function tabWalk(page, n = 30) {
  await page.evaluate(() => { document.activeElement?.blur?.(); window.scrollTo(0, 0); });
  const stops = [];
  for (let i = 0; i < n; i++) {
    await page.keyboard.press("Tab");
    const s = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
      return {
        tag: el.tagName.toLowerCase(), name: clean(el.getAttribute("aria-label") || el.innerText || el.value || el.getAttribute("placeholder") || "").slice(0, 50),
        outline: `${cs.outlineStyle} ${cs.outlineWidth}`, shadow: cs.boxShadow === "none" ? "none" : "yes", ring: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0 || cs.boxShadow !== "none",
        inViewport: r.top >= 0 && r.bottom <= innerHeight, y: Math.round(r.y), h: Math.round(r.height),
      };
    });
    if (!s) break;
    stops.push(s);
    if (i > 2 && stops[0] && s.name === stops[0].name && s.tag === stops[0].tag) break; // wrapped around
  }
  return stops;
}

export function summarise(m) {
  const T = m.targets;
  const small44 = T.filter((t) => Math.min(t.w, t.h) < 44);
  const small24 = T.filter((t) => Math.min(t.w, t.h) < 24);
  const tight = T.filter((t) => t.nearestGap !== null && t.nearestGap < 8);
  const lowContrast = m.text.items.filter((t) => !t.hasBgImage && t.contrast < (t.large ? 3 : 4.5));
  const minFs = Math.min(...m.text.items.map((t) => t.fs));
  const lt14 = m.text.items.filter((t) => t.fs < 14), lt16 = m.text.items.filter((t) => t.fs < 16);
  return {
    targets: T.length, targetsMin44fail: small44.length, targetsMin24fail: small24.length, targetsGapLt8: tight.length,
    minTargetH: Math.min(...T.map((t) => t.h)), minTargetW: Math.min(...T.map((t) => t.w)),
    textMinFs: minFs, textLt14: lt14.length, textLt16: lt16.length, textTotal: m.text.count,
    lowContrastCount: lowContrast.length, screens: m.scroll.screens, hOverflow: m.scroll.hOverflow,
    homeLinks: m.homeLinks.length, h1: m.headings.filter((h) => h.l === "H1").length,
  };
}

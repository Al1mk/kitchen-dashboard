// Stage 1 (3 Nov 2026) measurement helpers — tooling only, not product code.
// Built on the V2 audit library (DOM measurement, text census). Targets an ISOLATED copy on
// localhost; AUDIT_BASE must be set (the audit library refuses non-localhost and port 3000).
// All contexts are NOMINAL emulations. They are not measurements of the physical Elo screen.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

export { measure, summarise, settle, ensureDir } from "../v2-audit-2026-11-03/audit-lib.mjs";
export { BASE } from "../v2-audit-2026-11-03/audit-lib.mjs";

const common = { locale: "de-DE", timezoneId: "Europe/Berlin", isMobile: false };

export const CONTEXTS = {
  "kiosk-touch-1080x1920": {
    note: "Nominal portrait kiosk, DPR 1, touch emulation ON (so (pointer: coarse) is true only because of the emulation)",
    options: { ...common, viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1, hasTouch: true },
  },
  "kiosk-pointer-1080x1920": {
    note: "Same viewport, touch OFF = pointer-fine portrait. The kiosk layout must not depend on pointer type",
    options: { ...common, viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1, hasTouch: false },
  },
  "sens-1080x1700": {
    note: "Sensitivity ONLY: assumes ~220 CSS px lost to menu bar + browser chrome (unmeasured)",
    options: { ...common, viewport: { width: 1080, height: 1700 }, deviceScaleFactor: 1, hasTouch: true },
  },
  "sens-540x960": {
    note: "Sensitivity ONLY: what 200 % browser zoom on a 1080x1920 output would report (unmeasured assumption)",
    options: { ...common, viewport: { width: 540, height: 960 }, deviceScaleFactor: 2, hasTouch: true },
  },
  "laptop-1440x900": {
    note: "Ordinary laptop, mouse + keyboard",
    options: { ...common, viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, hasTouch: false },
  },
  "phone-390x844": {
    note: "Ordinary phone emulation (isMobile, touch, DPR 2)",
    options: { ...common, isMobile: true, viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true },
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

export async function openContext(browser, key) {
  // No tracing, video or HAR: receipt and cancel pages show credentials.
  return browser.newContext({ ...CONTEXTS[key].options, recordVideo: undefined });
}

export async function launchBrowser() {
  return chromium.launch({ headless: true });
}

export function dirs(base, ...parts) {
  const d = [base, ...parts].join("/");
  mkdirSync(d, { recursive: true });
  return d;
}

// In-page: geometry of the public navigation, language switch and whatever pins them to the screen.
export function dockGeometry() {
  const round = (n) => Math.round(n * 10) / 10;
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none";
  };
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return { x: round(r.x), y: round(r.y), w: round(r.width), h: round(r.height), top: round(r.top), bottom: round(r.bottom), left: round(r.left), right: round(r.right) };
  };
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const navs = [...document.querySelectorAll("nav")].filter(visible);
  const nav = navs[0] ?? null;
  const board = document.querySelector('[data-testid="display-board"]');
  const frame = board ? rect(board) : { left: 0, right: vw, w: vw };
  const links = nav
    ? [...nav.querySelectorAll("a")].filter(visible).map((a) => ({ name: clean(a.innerText), href: a.getAttribute("href"), current: a.getAttribute("aria-current"), ...rect(a) }))
    : [];
  // rows: cluster by top edge
  const rows = [];
  for (const l of links) {
    const row = rows.find((r) => Math.abs(r.top - l.top) <= 4);
    if (row) row.items.push(l);
    else rows.push({ top: l.top, items: [l] });
  }
  rows.sort((a, b) => a.top - b.top);
  const rowInfo = rows.map((r) => {
    const items = r.items.sort((a, b) => a.left - b.left);
    const left = Math.min(...items.map((i) => i.left));
    const right = Math.max(...items.map((i) => i.right));
    const gaps = items.slice(1).map((it, k) => round(it.left - items[k].right));
    return { count: items.length, top: r.top, left, right, centre: round((left + right) / 2), minH: Math.min(...items.map((i) => i.h)), minW: Math.min(...items.map((i) => i.w)), minGap: gaps.length ? Math.min(...gaps) : null, names: items.map((i) => i.name) };
  });
  const vGap = rowInfo.length > 1 ? round(rowInfo[1].top - (rowInfo[0].top + rowInfo[0].minH)) : null;
  // language switch
  const group = [...document.querySelectorAll('[role="group"]')].find((g) => /^(Sprache|Language)$/.test(g.getAttribute("aria-label") || "") && visible(g));
  const langLinks = group ? [...group.querySelectorAll("a")].filter(visible).map((a) => ({ name: clean(a.innerText), current: a.getAttribute("aria-current"), href: a.getAttribute("href"), ...rect(a) })) : [];
  const langGap = langLinks.length === 2 ? round(langLinks[1].left - langLinks[0].right) : null;
  // the element that pins the navigation to the screen, if any
  let pinned = null;
  for (let el = nav ?? group; el && el !== document.body; el = el.parentElement) {
    const p = getComputedStyle(el).position;
    if (p === "fixed" || p === "sticky") { pinned = { position: p, tag: el.tagName.toLowerCase(), ...rect(el) }; break; }
  }
  const root = getComputedStyle(document.documentElement);
  const dockEl = document.querySelector("[data-public-dock]");
  const dockStyle = dockEl ? getComputedStyle(dockEl) : null;
  const dockRect = dockEl && dockStyle && dockStyle.display !== "contents" ? rect(dockEl) : null;
  const px = (el) => (el ? parseFloat(getComputedStyle(el).fontSize) : null);
  const mainEl = document.querySelector("main");
  const h1El = document.querySelector("h1");
  const para = mainEl ? [...mainEl.querySelectorAll("p")].find((n) => n.getBoundingClientRect().height > 0) : null;
  return {
    dock: dockRect ? { position: dockStyle.position, ...dockRect, shareOfViewport: Math.round((dockRect.h / vh) * 1000) / 1000 } : null,
    layout: { rootFontPx: px(document.documentElement), h1Px: px(h1El), firstParagraphPx: px(para), mainWidth: mainEl ? round(mainEl.getBoundingClientRect().width) : null, contentWidth: mainEl ? round(mainEl.clientWidth - parseFloat(getComputedStyle(mainEl).paddingLeft) - parseFloat(getComputedStyle(mainEl).paddingRight)) : null },
    vw, vh,
    frameCentre: round((frame.left + frame.right) / 2),
    navCount: navs.length,
    linkCount: links.length,
    links,
    rows: rowInfo,
    rowVerticalGap: vGap,
    navBox: nav ? rect(nav) : null,
    navCentreYRatio: nav ? round((rect(nav).y + rect(nav).h / 2) / vh) : null,
    lang: { found: !!group, box: group ? rect(group) : null, gapBetween: langGap, links: langLinks, centreYRatio: group ? round((rect(group).y + rect(group).h / 2) / vh) : null },
    pinned,
    cssVars: { dockH: root.getPropertyValue("--public-dock-h").trim() || null, scrollPaddingBottom: root.scrollPaddingBottom, fontSize: root.fontSize },
    media: {
      portraitMinW520: matchMedia("(orientation: portrait) and (min-width: 520px)").matches,
      coarse: matchMedia("(pointer: coarse)").matches,
      hoverNone: matchMedia("(hover: none)").matches,
    },
  };
}

// In-page: is the end of the document reachable above the pinned navigation?
export function clearanceAtBottom() {
  const round = (n) => Math.round(n * 10) / 10;
  const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden"; };
  window.scrollTo(0, document.documentElement.scrollHeight);
  const nav = [...document.querySelectorAll("nav")].find(visible) ?? null;
  let pin = null;
  for (let el = nav; el && el !== document.body; el = el.parentElement) {
    const p = getComputedStyle(el).position;
    if (p === "fixed" || p === "sticky") { pin = el; break; }
  }
  const dockTop = pin ? pin.getBoundingClientRect().top : null;
  const footer = document.querySelector("footer");
  const main = document.querySelector("main");
  const bottoms = main ? [...main.querySelectorAll("*")].filter(visible).map((e) => e.getBoundingClientRect().bottom) : [];
  const lastContentBottom = bottoms.length ? Math.max(...bottoms) : null;
  const footerBottom = footer && visible(footer) ? footer.getBoundingClientRect().bottom : null;
  const lowest = Math.max(lastContentBottom ?? 0, footerBottom ?? 0);
  return {
    scrollY: round(scrollY), docHeight: document.documentElement.scrollHeight,
    dockTop: dockTop === null ? null : round(dockTop), lastContentBottom: lastContentBottom === null ? null : round(lastContentBottom),
    footerBottom: footerBottom === null ? null : round(footerBottom), lowestBottom: round(lowest),
    clearOfDock: dockTop === null ? true : lowest <= dockTop + 0.5,
    clearance: dockTop === null ? null : round(dockTop - lowest),
  };
}

// Tab through the page; report every focused element that is hidden behind the pinned navigation or outside the viewport.
export async function focusWalk(page, max = 70) {
  await page.evaluate(() => { document.activeElement?.blur?.(); window.scrollTo(0, 0); });
  const stops = [];
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    const s = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const clean = (t) => (t || "").replace(/\s+/g, " ").trim();
      const r = el.getBoundingClientRect();
      let pin = null;
      const nav = [...document.querySelectorAll("nav")].find((n) => n.getBoundingClientRect().height > 0);
      for (let e = nav; e && e !== document.body; e = e.parentElement) {
        const p = getComputedStyle(e).position;
        if (p === "fixed" || p === "sticky") { pin = e; break; }
      }
      const inDock = !!(pin && pin.contains(el));
      const d = pin ? pin.getBoundingClientRect() : null;
      const covered = !!(d && !inDock && r.bottom > d.top && r.top < d.bottom);
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(), name: clean(el.getAttribute("aria-label") || el.innerText || el.value || el.getAttribute("placeholder")).slice(0, 40),
        top: Math.round(r.top), bottom: Math.round(r.bottom), inDock, covered,
        outsideViewport: r.top < 0 || r.bottom > innerHeight,
        ring: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0,
      };
    });
    if (!s) break;
    stops.push(s);
    if (i > 2 && stops[0] && s.name === stops[0].name && s.tag === stops[0].tag) break;
  }
  return {
    stops: stops.length,
    coveredByDock: stops.filter((s) => s.covered).map((s) => `${s.tag}:${s.name}`),
    outsideViewport: stops.filter((s) => s.outsideViewport && !s.inDock).map((s) => `${s.tag}:${s.name}`),
    withoutRing: stops.filter((s) => !s.ring).map((s) => `${s.tag}:${s.name}`),
  };
}

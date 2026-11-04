import { randomBytes } from "node:crypto";
import { expect, test, type Browser, type BrowserContext, type Page, type Route } from "@playwright/test";
import { publicHref, type Lang } from "../../src/lib/i18n/public.ts";
import { loginViaApi, loginViaUi, sampleInput } from "./helpers.ts";

// V2 Stage 1 (AL-02): portrait-kiosk bottom navigation dock and public kiosk scale.
//
// The kiosk layout is chosen by viewport and orientation (portrait, at least 520 CSS px wide), NOT by
// pointer type: every geometry check runs with touch emulation on and with a pointer-fine portrait
// context. All contexts are nominal emulations in headless Chromium. They are not measurements of the
// physical Elo screen, of reach or of touch hardware, and not a usability test.
// Sizes asserted here (56 px tiles, 8 px gaps, 22 px body text at 1080 px) are provisional design
// choices pending the physical measurement (V2-P0), not standards.

test.use({ trace: "off", video: "off", screenshot: "off" });

type Viewport = { name: string; width: number; height: number; hasTouch: boolean; dpr: number; isMobile?: boolean };
const KIOSK: Viewport[] = [
  { name: "1080x1920 touch", width: 1080, height: 1920, hasTouch: true, dpr: 1 },
  { name: "1080x1920 pointer-fine", width: 1080, height: 1920, hasTouch: false, dpr: 1 },
  { name: "1080x1700 (assumed chrome loss)", width: 1080, height: 1700, hasTouch: true, dpr: 1 },
  { name: "540x960 (assumed 200 % zoom)", width: 540, height: 960, hasTouch: true, dpr: 2 },
];
const ORDINARY: Viewport[] = [
  { name: "laptop 1440x900", width: 1440, height: 900, hasTouch: false, dpr: 1 },
  { name: "phone 390x844", width: 390, height: 844, hasTouch: true, dpr: 2, isMobile: true },
];
const SHELL_ROUTES = ["/", "/newcomers", "/map", "/rooms", "/schedule", "/booking", "/booking/cancel"];
const ALL_ROUTES = [...SHELL_ROUTES, "/display"];
const LANGS: Lang[] = ["de", "en"];
const NAV_NAME: Record<Lang, string> = { de: "Campus-Informationen", en: "Campus information" };
const EXPECTED_PATHS = ["/", "/newcomers", "/map", "/rooms", "/schedule", "/booking", "/display"];

async function newPage(browser: Browser, v: Viewport): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    viewport: { width: v.width, height: v.height },
    deviceScaleFactor: v.dpr,
    hasTouch: v.hasTouch,
    isMobile: v.isMobile ?? false,
  });
  return { context, page: await context.newPage() };
}

async function open(page: Page, route: string, lang: Lang) {
  const [path, query] = route.split("?");
  await page.goto(publicHref(path, lang) + (query ? (lang === "en" ? "&" : "?") + query : ""));
  await expect(page.getByRole("navigation", { name: NAV_NAME[lang] })).toBeVisible();
  await page.waitForLoadState("networkidle");
}

type Geometry = {
  vw: number;
  vh: number;
  frameCentre: number;
  frameWidth: number;
  navCount: number;
  links: { name: string; href: string | null; current: string | null; cue: boolean }[];
  rows: { count: number; centre: number; minHeight: number; minGap: number | null; top: number }[];
  rowGap: number | null;
  pinned: { position: string; top: number; bottom: number; height: number } | null;
  /** The [data-public-dock] element, or null while it is `display: contents` (ordinary layouts). */
  dock: { position: string; top: number; bottom: number; height: number } | null;
  navTop: number;
  lang: { top: number; bottom: number; gap: number | null; links: { current: string | null; cue: boolean }[] } | null;
  overflowX: boolean;
  rootFontSize: number;
  dockToken: number | null;
  scrollPaddingBottom: number;
};

/** Pure DOM reading of the public navigation, the language switch and what pins them to the screen. */
async function geometry(page: Page): Promise<Geometry> {
  return page.evaluate(() => {
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none";
    };
    // A cue that is not colour: an inset/outer shadow bar, a thick bottom border or an underline.
    const cue = (el: Element) => {
      const cs = getComputedStyle(el);
      return cs.boxShadow !== "none" || parseFloat(cs.borderBottomWidth) >= 3 || cs.textDecorationLine.includes("underline");
    };
    const clean = (s: string) => s.replace(/\s+/g, " ").trim();
    const nav = [...document.querySelectorAll('nav[aria-label="Campus-Informationen"], nav[aria-label="Campus information"]')].find(visible) ?? null;
    const board = document.querySelector('[data-testid="display-board"]');
    const frame = board ? board.getBoundingClientRect() : { left: 0, right: document.documentElement.clientWidth };
    const dockEl = document.querySelector("[data-public-dock]");
    const dockStyle = dockEl ? getComputedStyle(dockEl) : null;
    const dockRect = dockEl && dockStyle && dockStyle.display !== "contents" ? dockEl.getBoundingClientRect() : null;
    const anchors = nav ? [...nav.querySelectorAll("a")].filter(visible) : [];
    const rects = anchors.map((a) => ({ a, r: a.getBoundingClientRect() }));
    const rows: { top: number; items: typeof rects }[] = [];
    for (const item of rects) {
      const row = rows.find((x) => Math.abs(x.top - item.r.top) <= 4);
      if (row) row.items.push(item);
      else rows.push({ top: item.r.top, items: [item] });
    }
    rows.sort((x, y) => x.top - y.top);
    const rowInfo = rows.map((row) => {
      const items = [...row.items].sort((x, y) => x.r.left - y.r.left);
      const gaps = items.slice(1).map((it, k) => it.r.left - items[k].r.right);
      return {
        count: items.length,
        centre: (Math.min(...items.map((i) => i.r.left)) + Math.max(...items.map((i) => i.r.right))) / 2,
        minHeight: Math.min(...items.map((i) => i.r.height)),
        minGap: gaps.length ? Math.min(...gaps) : null,
        top: row.top,
      };
    });
    const group = [...document.querySelectorAll('[role="group"]')].find((g) => /^(Sprache|Language)$/.test(g.getAttribute("aria-label") ?? "") && visible(g));
    const langAnchors = group ? [...group.querySelectorAll("a")].filter(visible) : [];
    let pinned: { position: string; top: number; bottom: number; height: number } | null = null;
    for (let el: Element | null = nav; el && el !== document.body; el = el.parentElement) {
      const position = getComputedStyle(el).position;
      if (position === "fixed" || position === "sticky") {
        const r = el.getBoundingClientRect();
        pinned = { position, top: r.top, bottom: r.bottom, height: r.height };
        break;
      }
    }
    let dockToken: number | null = null;
    const probe = document.createElement("div");
    probe.style.cssText = "position:absolute;visibility:hidden;width:1px;height:var(--public-dock-h, 0px)";
    document.body.appendChild(probe);
    const h = probe.getBoundingClientRect().height;
    probe.remove();
    if (h > 0) dockToken = h;
    const root = getComputedStyle(document.documentElement);
    return {
      vw: document.documentElement.clientWidth,
      vh: window.innerHeight,
      frameCentre: (frame.left + frame.right) / 2,
      frameWidth: frame.right - frame.left,
      navCount: [...document.querySelectorAll('nav[aria-label="Campus-Informationen"], nav[aria-label="Campus information"]')].filter(visible).length,
      links: anchors.map((a) => ({ name: clean(a.textContent ?? ""), href: a.getAttribute("href"), current: a.getAttribute("aria-current"), cue: cue(a) })),
      rows: rowInfo,
      rowGap: rowInfo.length > 1 ? rowInfo[1].top - (rowInfo[0].top + rowInfo[0].minHeight) : null,
      pinned,
      dock: dockRect && dockStyle ? { position: dockStyle.position, top: dockRect.top, bottom: dockRect.bottom, height: dockRect.height } : null,
      navTop: nav ? nav.getBoundingClientRect().top : -1,
      lang: group
        ? {
            top: group.getBoundingClientRect().top,
            bottom: group.getBoundingClientRect().bottom,
            gap: langAnchors.length === 2 ? langAnchors[1].getBoundingClientRect().left - langAnchors[0].getBoundingClientRect().right : null,
            links: langAnchors.map((a) => ({ current: a.getAttribute("aria-current"), cue: cue(a) })),
          }
        : null,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      rootFontSize: parseFloat(root.fontSize),
      dockToken,
      scrollPaddingBottom: parseFloat(root.scrollPaddingBottom) || 0,
    };
  });
}

for (const v of KIOSK) {
  test(`kiosk ${v.name}: one navigation, seven destinations, 4 + 3 centred at the bottom, language switch lowered`, async ({ browser }) => {
    test.setTimeout(180_000);
    const { context, page } = await newPage(browser, v);
    for (const lang of LANGS) {
      for (const route of ALL_ROUTES) {
        await open(page, route, lang);
        const where = `${v.name} ${lang} ${route}`;
        const g = await geometry(page);
        expect(g.navCount, `${where}: exactly one visible navigation`).toBe(1);
        expect(g.links.map((l) => l.href), `${where}: seven destinations keep the language`).toEqual(EXPECTED_PATHS.map((p) => publicHref(p, lang)));
        expect(g.rows.map((r) => r.count), `${where}: first row four, second row three`).toEqual([4, 3]);
        // The centre of each row is the centre of the viewport/container, not a hardcoded 540 px.
        for (const row of g.rows) expect(Math.abs(row.centre - g.frameCentre), `${where}: row centred on ${g.frameCentre}`).toBeLessThanOrEqual(2);
        // The shell sizes in rem (≥ 56 px tiles, ≥ 8 px gaps). The announcement board sizes in container
        // units like the rest of the board, so its minimum is proportional to the frame width (7 cqw ≈ 6.5 %).
        const board = route === "/display";
        const minTile = board ? g.frameWidth * 0.065 : 56;
        const minGap = board ? g.frameWidth * 0.012 : 8;
        for (const row of g.rows) {
          expect(row.minHeight, `${where}: tile height`).toBeGreaterThanOrEqual(minTile);
          expect(row.minGap ?? 99, `${where}: gap between tiles`).toBeGreaterThanOrEqual(minGap);
        }
        expect(g.rowGap, `${where}: gap between the two rows`).toBeGreaterThanOrEqual(minGap);
        // Lower area: one dock holds the language switch and the navigation, against the bottom edge.
        expect(g.dock, `${where}: dock present`).not.toBeNull();
        expect(g.dock!.position, `${where}: dock is ${board ? "in the board frame" : "fixed to the screen"}`).toBe(board ? "static" : "fixed");
        expect(g.dock!.bottom, `${where}: dock reaches the bottom edge`).toBeGreaterThanOrEqual(g.vh - 2);
        expect(g.dock!.top, `${where}: dock in the lower area`).toBeGreaterThan(g.vh * 0.7);
        expect(g.navTop, `${where}: navigation inside the dock`).toBeGreaterThanOrEqual(g.dock!.top);
        expect(g.lang, `${where}: language switch present`).not.toBeNull();
        expect(g.lang!.top, `${where}: language switch lowered into the dock`).toBeGreaterThanOrEqual(g.dock!.top);
        expect(g.lang!.bottom, `${where}: language switch above the navigation`).toBeLessThanOrEqual(g.navTop + 1);
        expect(g.lang!.gap ?? 0, `${where}: gap between the language buttons`).toBeGreaterThanOrEqual(board ? g.frameWidth * 0.014 : 8);
        expect(g.overflowX, `${where}: no horizontal overflow`).toBe(false);
      }
    }
    await context.close();
  });
}

for (const v of ORDINARY) {
  test(`ordinary ${v.name}: navigation and language switch stay in the page header, nothing is pinned`, async ({ browser }) => {
    test.setTimeout(120_000);
    const { context, page } = await newPage(browser, v);
    for (const lang of LANGS) {
      for (const route of SHELL_ROUTES) {
        await open(page, route, lang);
        const g = await geometry(page);
        const where = `${v.name} ${lang} ${route}`;
        expect(g.navCount, where).toBe(1);
        expect(g.links.length, `${where}: seven destinations`).toBe(7);
        expect(g.pinned, `${where}: navigation is not pinned`).toBeNull();
        expect(g.dock, `${where}: the dock wrapper generates no box`).toBeNull();
        expect(g.navTop, `${where}: navigation in the header`).toBeLessThan(260);
        expect(g.lang?.top ?? 9999, `${where}: language switch in the header`).toBeLessThan(220);
        expect(g.dockToken, `${where}: no dock reservation`).toBeNull();
        expect(g.scrollPaddingBottom, `${where}: no scroll padding`).toBe(0);
        expect(g.rootFontSize, `${where}: ordinary root size`).toBe(16);
        expect(g.overflowX, `${where}: no horizontal overflow`).toBe(false);
      }
    }
    await context.close();
  });
}

test("the kiosk scale is scoped: public pages at 1080 px grow, the admin keeps the ordinary scale", async ({ browser }) => {
  const { context, page } = await newPage(browser, KIOSK[0]);
  await open(page, "/", "de");
  const g = await geometry(page);
  expect(g.rootFontSize, "public page root size at 1080 px").toBeGreaterThanOrEqual(20);
  const intro = await page.locator("main p").first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(intro, "intro text at 1080 px").toBeGreaterThanOrEqual(22);
  const h1 = await page.locator("h1").first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(h1, "H1 at 1080 px").toBeGreaterThanOrEqual(44);
  const column = await page.locator("main").evaluate((el) => el.getBoundingClientRect().width);
  expect(column, "content column uses more of the 1080 px width").toBeGreaterThanOrEqual(880);
  await page.goto("/admin/login");
  expect(await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize)), "admin root size is unchanged").toBe(16);
  await context.close();

  const ordinary = await newPage(browser, ORDINARY[0]);
  await open(ordinary.page, "/", "de");
  expect((await ordinary.page.locator("main p").first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize)))).toBeLessThanOrEqual(18.5);
  expect(await ordinary.page.locator("main").evaluate((el) => el.getBoundingClientRect().width), "laptop column is unchanged").toBeLessThanOrEqual(770);
  await ordinary.context.close();
});

test("the active destination and language are marked by more than colour", async ({ browser }) => {
  const { context, page } = await newPage(browser, KIOSK[0]);
  for (const route of ["/rooms", "/booking", "/display"]) {
    await open(page, route, "de");
    const g = await geometry(page);
    const active = g.links.filter((l) => l.current === "page");
    expect(active, `${route}: one active destination`).toHaveLength(1);
    expect(active[0].cue, `${route}: active destination has a non-colour cue`).toBe(true);
    expect(g.links.filter((l) => l.current !== "page" && l.cue), `${route}: idle destinations have none`).toHaveLength(0);
    const current = g.lang!.links.filter((l) => l.current === "true");
    expect(current, `${route}: one active language`).toHaveLength(1);
    expect(current[0].cue, `${route}: active language has a non-colour cue`).toBe(true);
    expect(g.lang!.links.filter((l) => l.current !== "true" && l.cue)).toHaveLength(0);
  }
  await context.close();
});

for (const v of [KIOSK[0], KIOSK[2], KIOSK[3]]) {
  test(`kiosk ${v.name}: the end of every page is reachable above the dock and the dock height is reserved`, async ({ browser }) => {
    test.setTimeout(180_000);
    const { context, page } = await newPage(browser, v);
    for (const lang of LANGS) {
      for (const route of SHELL_ROUTES) {
        await open(page, route, lang);
        const where = `${v.name} ${lang} ${route}`;
        // DockHeightSync publishes the measured height after hydration.
        await expect
          .poll(async () => {
            const now = await geometry(page);
            return now.dock && now.dockToken !== null ? Math.abs(now.dockToken - now.dock.height) : 999;
          }, { message: `${where}: --public-dock-h equals the measured dock height` })
          .toBeLessThanOrEqual(1);
        const g = await geometry(page);
        expect(g.dock!.position, `${where}: dock fixed`).toBe("fixed");
        expect(g.scrollPaddingBottom, `${where}: scroll-padding-bottom covers the dock`).toBeGreaterThanOrEqual(g.dock!.height - 1);
        const end = await page.evaluate(() => {
          window.scrollTo(0, document.documentElement.scrollHeight);
          const visible = (el: Element) => el.getBoundingClientRect().height > 0;
          const main = document.querySelector("main")!;
          const footer = document.querySelector("footer");
          const nav = [...document.querySelectorAll('nav[aria-label="Campus-Informationen"], nav[aria-label="Campus information"]')].find(visible)!;
          let dock: Element = nav;
          for (let el: Element | null = nav; el && el !== document.body; el = el.parentElement) if (getComputedStyle(el).position === "fixed") dock = el;
          const lowest = Math.max(...[...main.querySelectorAll("*")].filter(visible).map((e) => e.getBoundingClientRect().bottom), footer ? footer.getBoundingClientRect().bottom : 0);
          return { lowest, dockTop: dock.getBoundingClientRect().top };
        });
        expect(end.lowest, `${where}: last content and footer end above the dock`).toBeLessThanOrEqual(end.dockTop + 0.5);
      }
    }
    await context.close();
  });
}

/** What the focused element is, and whether the dock covers (part of) it. */
const focusProbe = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const nav = [...document.querySelectorAll('nav[aria-label="Campus-Informationen"], nav[aria-label="Campus information"]')].find((n) => n.getBoundingClientRect().height > 0);
  let dock: Element | null = null;
  for (let e: Element | null = nav ?? null; e && e !== document.body; e = e.parentElement) if (getComputedStyle(e).position === "fixed") dock = e;
  const inDock = !!dock && dock.contains(el);
  const r = el.getBoundingClientRect();
  const d = dock ? dock.getBoundingClientRect() : null;
  return {
    name: (el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 30) || el.tagName.toLowerCase(),
    inDock,
    covered: !!d && !inDock && r.bottom > d.top && r.top < d.bottom,
  };
};

for (const v of [KIOSK[2], KIOSK[3]]) {
  test(`kiosk ${v.name}: keyboard focus is never hidden behind the dock`, async ({ browser }) => {
    test.setTimeout(240_000);
    const { context, page } = await newPage(browser, v);
    // [route, least number of page-content tab stops expected]. /booking carries a seeded room and a date two days ahead (today's slots may all be past), so the slot grid is on the page.
    for (const [route, minStops] of [[`/booking?raum=lcc-demo-room-k1-103&datum=${berlinDate(2)}`, 30], ["/rooms", 20], ["/map", 10], ["/schedule", 3]] as const) {
      await open(page, route, "de");
      const where = `${v.name} ${route}`;
      await page.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); window.scrollTo(0, 0); });
      // Forward walk through page content. The dock is first in tab order, so its stops are passed, not a reason to stop.
      const covered: string[] = [];
      let contentStops = 0;
      for (let i = 0; i < 110; i++) {
        await page.keyboard.press("Tab");
        const stop = await page.evaluate(focusProbe);
        if (!stop) break;
        if (!stop.inDock) contentStops++;
        if (stop.covered) covered.push(stop.name);
      }
      expect(contentStops, `${where}: the walk reached page content, not only the dock`).toBeGreaterThanOrEqual(minStops);
      expect(covered, `${where}: focused controls hidden behind the dock`).toEqual([]);
      // Backward from the top lands on the LAST control of the page: it must sit above the dock.
      await page.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); window.scrollTo(0, 0); });
      await page.keyboard.press("Shift+Tab");
      const last = await page.evaluate(focusProbe);
      expect(last, `${where}: Shift+Tab focuses an element`).not.toBeNull();
      expect(last!.covered, `${where}: the last control (${last!.name}) is not behind the dock`).toBe(false);
    }
    await context.close();
  });
}

test("kiosk: search, language switch, bare Rooms link and Back/Forward keep working through the dock", async ({ browser }) => {
  const { context, page } = await newPage(browser, KIOSK[0]);
  const nav = () => page.getByRole("navigation", { name: /Campus/ });
  await open(page, "/rooms", "de");
  const search = page.getByRole("searchbox");
  await search.fill("zagel");
  await expect(page).toHaveURL(/suche=zagel/);
  await page.getByRole("group", { name: "Sprache" }).getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/suche=zagel/);
  await expect(page).toHaveURL(/lang=en/);
  await expect(page.getByRole("searchbox")).toHaveValue("zagel");
  await nav().getByRole("link", { name: "Rooms" }).click();
  await expect(page).toHaveURL(/\/rooms\?lang=en$/);
  await expect(page.getByRole("searchbox")).toHaveValue("");
  await page.goBack();
  await expect(page).toHaveURL(/suche=zagel/);
  await expect(page.getByRole("searchbox")).toHaveValue("zagel");
  await page.goForward();
  await expect(page).toHaveURL(/\/rooms\?lang=en$/);
  await expect(page.getByRole("searchbox")).toHaveValue("");
  await context.close();
});

test("kiosk: the course-title note appears only where class titles are shown", async ({ browser }) => {
  const { context, page } = await newPage(browser, KIOSK[0]);
  const note = page.getByText(/Course titles, lecturers and study groups/);
  for (const route of ["/booking", "/booking/cancel", "/map", "/newcomers", "/display"]) {
    await open(page, route, "en");
    await expect(note, `${route} (en) has no course-title note`).toHaveCount(0);
  }
  for (const route of ["/schedule", "/rooms"]) {
    await open(page, route, "en");
    await expect(note.first(), `${route} (en) keeps the note`).toBeVisible();
  }
  await context.close();
});

// ---------- announcement board in the dock layout (synthetic answers, nothing is written) ----------
const notice = (i: number) => ({
  id: `synthetic-${i}`,
  title: `Beispielmitteilung ${i} mit einem etwas längeren Titel für den Zeilenumbruch`,
  body: `Synthetischer Text ${i}. `.concat("Füllinhalt für den Überlauf-Test. ".repeat(6)),
  category: (["general", "event", "important"] as const)[i % 3],
  pinned: i === 1,
  publishedAt: new Date().toISOString(),
  endsAt: null,
  titleEn: null,
  bodyEn: null,
});

async function stubBoard(page: Page, mode: "many" | "empty" | "error") {
  await page.route("**/api/public/announcements", async (route: Route) => {
    if (mode === "error") return route.abort();
    const announcements = mode === "many" ? Array.from({ length: 8 }, (_, i) => notice(i + 1)) : [];
    return route.fulfill({ json: { serverTime: new Date().toISOString(), announcements } });
  });
}

for (const v of [KIOSK[0], KIOSK[3]]) {
  test(`board ${v.name}: dock below the scrolling list; cards, empty and error states intact`, async ({ browser }) => {
    test.setTimeout(120_000);
    const { context, page } = await newPage(browser, v);
    await stubBoard(page, "many");
    await open(page, "/display", "de");
    await expect(page.getByRole("heading", { name: /Beispielmitteilung 1 /, level: 3 })).toBeVisible();
    const g = await geometry(page);
    expect(g.rows.map((r) => r.count)).toEqual([4, 3]);
    for (const row of g.rows) expect(Math.abs(row.centre - g.frameCentre)).toBeLessThanOrEqual(2);
    const list = await page.evaluate(() => {
      const cards = [...document.querySelectorAll("article")];
      const box = cards[0].parentElement!;
      const scrollable = box.scrollHeight > box.clientHeight;
      box.scrollTop = box.scrollHeight;
      const last = cards[cards.length - 1].getBoundingClientRect();
      const b = box.getBoundingClientRect();
      const nav = [...document.querySelectorAll('nav[aria-label="Campus-Informationen"], nav[aria-label="Campus information"]')].find((n) => n.getBoundingClientRect().height > 0)!;
      return { cards: cards.length, scrollable, clipped: cards.filter((c) => c.scrollHeight > c.clientHeight + 1).length, lastReachable: last.bottom <= b.bottom + 1, listBottom: b.bottom, navTop: nav.getBoundingClientRect().top };
    });
    expect(list).toMatchObject({ cards: 8, scrollable: true, clipped: 0, lastReachable: true });
    expect(list.listBottom, "the scrolling list ends above the navigation").toBeLessThanOrEqual(list.navTop + 1);
    await page.unroute("**/api/public/announcements");

    await stubBoard(page, "empty");
    await open(page, "/display", "de");
    await expect(page.getByText("Zurzeit gibt es keine Mitteilungen.")).toBeVisible();
    expect((await geometry(page)).rows.map((r) => r.count)).toEqual([4, 3]);
    await page.unroute("**/api/public/announcements");

    await stubBoard(page, "error");
    await page.goto("/display");
    // (Next.js' route announcer also has role="alert", so the board's own alert is selected by its text)
    await expect(page.getByRole("alert").filter({ hasText: "können gerade nicht geladen werden" })).toBeVisible();
    expect((await geometry(page)).rows.map((r) => r.count)).toEqual([4, 3]);
    await context.close();
  });
}

test("the admin preview of an announcement has no public navigation", async ({ browser, request, baseURL }) => {
  const headers = await loginViaApi(request, baseURL!);
  const created = await request.post("/api/admin/announcements", { headers, data: sampleInput({ title: `Dock-Vorschau ${Date.now()}` }) });
  expect(created.status()).toBe(201);
  const id = (await created.json()).announcement.id as string;
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await loginViaUi(page);
  await page.goto(`/admin/announcements/${id}/preview`);
  await expect(page.getByText("Vorschau – nicht veröffentlicht")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Campus-Informationen" })).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Sprache" })).toHaveCount(0);
  await context.close();
});

// ---------- the existing pending-booking guard against the shared dock ----------
const berlinDate = (days: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date(Date.now() + days * 86_400_000));

test("kiosk: the pending-booking guard still intercepts the dock; confirm and receipt actions stay above the dock", async ({ browser, request, baseURL }) => {
  const origin = await loginViaApi(request, baseURL!);
  const code = `DOCK-${randomBytes(3).toString("hex").toUpperCase()}`;
  const created = await request.post("/api/admin/rooms", {
    headers: { ...origin, "Content-Type": "application/json" },
    data: { code, name: "Dock-Testraum", floorId: "1OG", type: "seminar", description: "", reservable: true },
  });
  expect(created.status()).toBe(201);
  const roomId = (await created.json()).room.id as string;
  const date = berlinDate(2);

  const { context, page } = await newPage(browser, KIOSK[2]);
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await page.route("**/api/public/bookings", async (route: Route) => {
    const response = await route.fetch();
    await gate;
    await route.fulfill({ response });
  });
  const dockTop = () => page.evaluate(() => {
    const nav = [...document.querySelectorAll('nav[aria-label="Campus-Informationen"], nav[aria-label="Campus information"]')].find((n) => n.getBoundingClientRect().height > 0)!;
    let dock: Element = nav;
    for (let e: Element | null = nav; e && e !== document.body; e = e.parentElement) if (getComputedStyle(e).position === "fixed") dock = e;
    return dock.getBoundingClientRect().top;
  });

  await page.goto(`/booking?raum=${encodeURIComponent(roomId)}&datum=${date}`);
  await page.getByRole("button", { name: "10:00", exact: true }).click();
  await page.getByRole("button", { name: "Weiter zur Bestätigung" }).click();
  const confirm = page.getByRole("button", { name: "Demo-Reservierung bestätigen" });
  // Keyboard focus on the confirm action must not leave it behind the dock.
  await confirm.focus();
  expect((await confirm.boundingBox())!.y + (await confirm.boundingBox())!.height, "confirm button above the dock after focus").toBeLessThanOrEqual((await dockTop()) + 0.5);
  await confirm.click();

  // While the request is pending, a tap on the dock opens the leave dialog instead of navigating.
  const nav = page.getByRole("navigation", { name: "Campus-Informationen" });
  for (const link of [nav.getByRole("link", { name: "Räume" }), page.getByRole("group", { name: "Sprache" }).getByRole("link", { name: "English" })]) {
    await link.click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("Buchungsnummer und Stornierungscode");
    await dialog.getByRole("button", { name: "Hierbleiben" }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/booking/);
  }
  release();
  const receipt = page.getByTestId("booking-receipt");
  await expect(receipt).toBeVisible();
  // V2 gates Done until the visitor acknowledges saving the credentials.
  await receipt.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Fertig" }).focus();
  await expect(page.getByRole("button", { name: "Fertig" })).toBeFocused();
  const done = (await page.getByRole("button", { name: "Fertig" }).boundingBox())!;
  expect(done.y + done.height, "receipt 'Fertig' button above the dock after focus").toBeLessThanOrEqual((await dockTop()) + 0.5);
  await context.close();
});

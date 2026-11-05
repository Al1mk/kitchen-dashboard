import { randomBytes } from "node:crypto";
import { expect, test, type APIRequestContext, type Browser, type BrowserContext, type Page, type Route } from "@playwright/test";
import { PUBLIC_TEXT, publicHref, type Lang } from "../../src/lib/i18n/public.ts";
import { loginViaApi } from "./helpers.ts";

// V2 Stage 3 (AL-05 shared accessibility), docs/contracts.md C14.
//
// What is checked here is what a browser can report: document language, titles, headings, the first tab stop,
// where keyboard focus lands relative to the pinned chip bar and the fixed dock, computed placeholder contrast
// and the accessible names of links. It is NOT a screen-reader session, not a WCAG conformance audit and not a
// usability test, and every context is a nominal emulation in headless Chromium (not the physical Elo screen).
// Fixtures go through the admin API or are synthetic answers to the public API: no traces, videos or screenshots.
test.use({ trace: "off", video: "off", screenshot: "off" });

type Viewport = { name: string; width: number; height: number; hasTouch: boolean; dpr: number; isMobile?: boolean };
const KIOSK: Viewport[] = [
  { name: "1080x1920 touch", width: 1080, height: 1920, hasTouch: true, dpr: 1 },
  { name: "1080x1920 pointer-fine", width: 1080, height: 1920, hasTouch: false, dpr: 1 },
  { name: "540x960 (assumed 200 % zoom)", width: 540, height: 960, hasTouch: true, dpr: 2 },
];
const ORDINARY: Viewport[] = [
  { name: "laptop 1440x900", width: 1440, height: 900, hasTouch: false, dpr: 1 },
  { name: "phone 390x844", width: 390, height: 844, hasTouch: true, dpr: 2, isMobile: true },
];
const LANGS: Lang[] = ["de", "en"];
const NAV = 'nav[aria-label="Campus-Informationen"], nav[aria-label="Campus information"]';
const SHELL_ROUTES = ["/", "/newcomers", "/map", "/rooms", "/schedule", "/booking", "/booking/cancel"];
const ALL_ROUTES = [...SHELL_ROUTES, "/display"];

// The wording is pinned here on purpose: a test that read it from the app could not notice a lost or renamed string.
const SKIP_NAME: Record<Lang, string> = { de: "Zum Inhalt springen", en: "Skip to main content" };
const titleLabel = (route: string, lang: Lang) => {
  const t = PUBLIC_TEXT[lang];
  const en = lang === "en";
  return {
    "/": t.start.title,
    "/newcomers": en ? "New to campus" : "Neu am Campus",
    "/map": t.sections.map,
    "/rooms": t.sections.rooms,
    "/schedule": t.sections.schedule,
    "/booking": en ? "Book a room" : "Raum reservieren",
    "/booking/cancel": en ? "Cancel a booking" : "Reservierung stornieren",
    "/display": t.sections.display,
  }[route]!;
};

async function newPage(browser: Browser, v: Viewport): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.dpr, hasTouch: v.hasTouch, isMobile: v.isMobile ?? false });
  return { context, page: await context.newPage() };
}

async function open(page: Page, route: string, lang: Lang) {
  const [path, query] = route.split("?");
  await page.goto(publicHref(path, lang) + (query ? (lang === "en" ? "&" : "?") + query : ""));
  await expect(page.locator(NAV).first()).toBeVisible();
  await page.waitForLoadState("networkidle");
}

// ---- synthetic announcements for /display (the board polls the public API; nothing is written) ----
const notice = (i: number) => ({
  id: `stage3-${i}`,
  title: `Stufe-3-Mitteilung ${i}`,
  body: `Synthetischer Text ${i}.`,
  category: (["general", "event", "important"] as const)[i % 3],
  pinned: false,
  publishedAt: new Date().toISOString(),
  endsAt: null,
  titleEn: `Stage 3 notice ${i}`,
  bodyEn: `Synthetic text ${i}.`,
});
async function stubBoard(page: Page, count = 3) {
  await page.route("**/api/public/announcements", (route: Route) =>
    route.fulfill({ json: { serverTime: new Date().toISOString(), announcements: Array.from({ length: count }, (_, i) => notice(i + 1)) } }),
  );
}

/** WCAG contrast of a text colour (optionally of the ::placeholder pseudo-element) against the element's effective background. */
async function contrast(page: Page, selector: string, pseudo?: "::placeholder") {
  return page.locator(selector).first().evaluate((el, ps) => {
    const g = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
    g.canvas.width = g.canvas.height = 1;
    const rgba = (css: string) => {
      g.clearRect(0, 0, 1, 1);
      g.fillStyle = "#000";
      g.fillStyle = css;
      g.fillRect(0, 0, 1, 1);
      const d = g.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2], d[3] / 255];
    };
    const lum = ([r, gg, b]: number[]) => {
      const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
      return 0.2126 * f(r) + 0.7152 * f(gg) + 0.0722 * f(b);
    };
    const layers: number[][] = [];
    for (let a: Element | null = el; a; a = a.parentElement) {
      const c = rgba(getComputedStyle(a).backgroundColor);
      if (c[3] > 0) layers.push(c);
      if (c[3] >= 1) break;
    }
    let bg = [255, 255, 255];
    for (const c of layers.reverse()) bg = bg.map((v, k) => Math.round(c[k] * c[3] + v * (1 - c[3])));
    const style = getComputedStyle(el, ps ?? null);
    const fgRaw = rgba(style.color);
    const alpha = fgRaw[3] * (ps ? parseFloat(style.opacity || "1") : 1);
    const fg = fgRaw.slice(0, 3).map((v, k) => Math.round(v * alpha + bg[k] * (1 - alpha)));
    const [l1, l2] = [lum(fg), lum(bg)];
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }, pseudo);
}

// ------------------------------------------------------------------------------------------------ language
for (const lang of LANGS) {
  test(`document language follows the page language on every public route (${lang})`, async ({ browser }) => {
    test.setTimeout(120_000);
    const { context, page } = await newPage(browser, KIOSK[0]);
    await stubBoard(page);
    for (const route of ALL_ROUTES) {
      await open(page, route, lang);
      await expect(page.locator("html"), `${route} ${lang}: <html lang>`).toHaveAttribute("lang", lang);
    }
    await context.close();
  });
}

test("document language follows client-side language switches and navigation", async ({ browser }) => {
  const { context, page } = await newPage(browser, KIOSK[0]);
  await open(page, "/rooms", "de");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await page.getByRole("group", { name: "Sprache" }).getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/lang=en/);
  await expect(page.locator("html"), "after switching to English without a reload").toHaveAttribute("lang", "en");
  await page.getByRole("navigation", { name: "Campus information" }).getByRole("link", { name: "Home" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Campus information" })).toBeVisible();
  await expect(page.locator("html"), "English stays English across pages").toHaveAttribute("lang", "en");
  await page.getByRole("group", { name: "Language" }).getByRole("link", { name: "Deutsch" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Campus-Informationen" })).toBeVisible();
  await expect(page.locator("html"), "back to German").toHaveAttribute("lang", "de");
  // A fresh load of an admin page is not a public page: it keeps the German default.
  await page.goto("/admin/login");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await context.close();
});

// ------------------------------------------------------------------------------------------------ page identity
for (const lang of LANGS) {
  test(`every public page has a title in its own language and exactly one level-1 heading (${lang})`, async ({ browser }) => {
    test.setTimeout(120_000);
    const { context, page } = await newPage(browser, KIOSK[0]);
    await stubBoard(page);
    for (const route of ALL_ROUTES) {
      await open(page, route, lang);
      const where = `${route} ${lang}`;
      // One page-identity suffix on every public route, including booking cancellation.
      await expect(page, `${where}: title`).toHaveTitle(`${titleLabel(route, lang)} – Campus Board`);
      await expect(page.getByRole("heading", { level: 1 }), `${where}: one h1`).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 }), `${where}: h1 has text`).not.toHaveText("");
    }
    await context.close();
  });

  test(`/display: the board heading is the h1 and announcements are h2; the look is unchanged (${lang})`, async ({ browser }) => {
    const { context, page } = await newPage(browser, KIOSK[0]);
    await stubBoard(page, 3);
    await open(page, "/display", lang);
    const t = PUBLIC_TEXT[lang];
    const board = page.getByTestId("display-board");
    await expect(board.getByRole("heading", { level: 1 }), "one h1 on the board").toHaveCount(1);
    await expect(board.getByRole("heading", { level: 1 })).toHaveText(t.sections.display);
    await expect(board.getByRole("heading", { level: 2 }), "each announcement title is an h2").toHaveCount(3);
    await expect(board.getByRole("heading", { level: 3 }), "no heading level is skipped").toHaveCount(0);
    // "No announcement-card redesign": the sizes are the container-relative ones the board always had.
    const sizes = await page.evaluate(() => ({
      h1: parseFloat(getComputedStyle(document.querySelector("h1")!).fontSize),
      card: parseFloat(getComputedStyle(document.querySelector("article h2")!).fontSize),
      frame: document.querySelector('[data-testid="display-board"]')!.getBoundingClientRect().width,
    }));
    expect(sizes.h1, "board heading 5.4cqw").toBeCloseTo(sizes.frame * 0.054, 0);
    expect(sizes.card, "card title 4.6cqw").toBeCloseTo(sizes.frame * 0.046, 0);
    await context.close();
  });
}

// ------------------------------------------------------------------------------------------------ skip link
for (const v of [...KIOSK, ...ORDINARY]) {
  test(`skip link ${v.name}: first tab stop, readable and unobstructed when focused, moves focus into the content`, async ({ browser }) => {
    test.setTimeout(150_000);
    const { context, page } = await newPage(browser, v);
    for (const lang of LANGS) {
      for (const route of SHELL_ROUTES) {
        const where = `${v.name} ${lang} ${route}`;
        await open(page, route, lang);
        const url = page.url();
        await page.keyboard.press("Tab");
        const skip = page.getByRole("link", { name: SKIP_NAME[lang] });
        await expect(skip, `${where}: the first tab stop is the skip link`).toBeFocused();
        const seen = await skip.evaluate((el) => {
          const r = el.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          return { x: r.left, y: r.top, w: r.width, h: r.height, vw: innerWidth, vh: innerHeight, topmost: document.elementFromPoint(cx, cy) === el, cx, cy };
        });
        expect(seen.x, `${where}: inside the viewport (left)`).toBeGreaterThanOrEqual(0);
        expect(seen.y, `${where}: inside the viewport (top)`).toBeGreaterThanOrEqual(0);
        expect(seen.x + seen.w, `${where}: inside the viewport (right)`).toBeLessThanOrEqual(seen.vw);
        expect(seen.y + seen.h, `${where}: inside the viewport (bottom)`).toBeLessThanOrEqual(seen.vh);
        expect(seen.h, `${where}: target height (px)`).toBeGreaterThanOrEqual(44);
        expect(seen.topmost, `${where}: nothing covers the focused skip link`).toBe(true);
        expect(await contrast(page, `a:focus`), `${where}: text contrast`).toBeGreaterThanOrEqual(4.5);

        await page.keyboard.press("Enter");
        const target = await page.evaluate(() => ({ tag: document.activeElement?.tagName, id: document.activeElement?.id }));
        expect(target, `${where}: focus moved to <main id="main-content">`).toEqual({ tag: "MAIN", id: "main-content" });
        expect(page.url(), `${where}: no hash and no new history entry`).toBe(url);
        await page.keyboard.press("Tab");
        const next = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement;
          return { inMain: !!document.querySelector("main")?.contains(el) && el !== document.querySelector("main"), inDock: !!el.closest("[data-public-dock]") };
        });
        expect(next, `${where}: the next tab stop is inside the content, not the dock`).toEqual({ inMain: true, inDock: false });
        // Once focus has left, the skip link is no longer on the screen.
        const gone = await page.evaluate(({ cx, cy }) => document.elementFromPoint(cx, cy)?.closest("a")?.textContent?.trim() ?? "", seen);
        expect(gone, `${where}: hidden again after focus moved on`).not.toBe(SKIP_NAME[lang]);
      }
    }
    await context.close();
  });
}

const berlinDate = (days: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date(Date.now() + days * 86_400_000));

test("skip link: with a booking request pending, using it does not open the leave dialog", async ({ browser, request, baseURL }) => {
  test.setTimeout(120_000);
  const origin = await loginViaApi(request, baseURL!);
  const code = `S3G-${randomBytes(3).toString("hex").toUpperCase()}`;
  const created = await request.post("/api/admin/rooms", {
    headers: { ...origin, "Content-Type": "application/json" },
    data: { code, name: "Stufe3-Testraum", floorId: "1OG", type: "seminar", description: "", reservable: true },
  });
  expect(created.status()).toBe(201);
  const roomId = (await created.json()).room.id as string;

  const { context, page } = await newPage(browser, KIOSK[0]);
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await page.route("**/api/public/bookings", async (route: Route) => {
    const response = await route.fetch();
    await gate;
    await route.fulfill({ response });
  });
  await page.goto(`/booking?raum=${encodeURIComponent(roomId)}&datum=${berlinDate(2)}`);
  await page.getByRole("button", { name: "10:00", exact: true }).click();
  await page.getByRole("button", { name: "Weiter zur Bestätigung" }).click();
  await page.getByRole("button", { name: "Demo-Reservierung bestätigen" }).click();

  // The guard is armed: a dock link opens the dialog (proves the situation this test is about) ...
  await page.getByRole("navigation", { name: "Campus-Informationen" }).getByRole("link", { name: "Räume" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("Buchungsnummer und Stornierungscode");
  await dialog.getByRole("button", { name: "Hierbleiben" }).click();
  await expect(dialog).toBeHidden();

  // ... but the skip link only moves focus inside this page, so it must not.
  const skip = page.getByRole("link", { name: SKIP_NAME.de });
  await expect(skip, "the skip link exists on the booking page").toHaveCount(1);
  await skip.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await expect(dialog, "no leave dialog for an in-page skip").toHaveCount(0);
  await expect(page).toHaveURL(/\/booking\?/);
  release();
  await expect(page.getByTestId("booking-receipt")).toBeVisible();
  await context.close();
});

// ------------------------------------------------------------------------------------------------ logo
for (const lang of LANGS) {
  test(`the logo is a link to Home that keeps the language (${lang})`, async ({ browser }) => {
    test.setTimeout(120_000);
    const { context, page } = await newPage(browser, KIOSK[0]);
    await stubBoard(page);
    for (const route of [...SHELL_ROUTES, "/display"]) {
      await open(page, route, lang);
      const logo = page.getByRole("link", { name: /^Hochschule Coburg/ });
      await expect(logo, `${route} ${lang}: one logo link`).toHaveCount(1);
      await expect(logo, `${route} ${lang}: target`).toHaveAttribute("href", publicHref("/", lang));
      await expect(logo.locator("img"), `${route} ${lang}: logo image inside the link`).toHaveCount(1);
    }
    await open(page, "/rooms", lang);
    await page.getByRole("link", { name: /^Hochschule Coburg/ }).click();
    await expect(page).toHaveURL(lang === "en" ? /\/\?lang=en$/ : /\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(PUBLIC_TEXT[lang].start.title);
    await context.close();
  });
}

// ------------------------------------------------------------------------------------------------ placeholders
for (const lang of LANGS) {
  test(`search placeholders reach 4.5:1 on /rooms and /map (${lang}), kiosk and laptop`, async ({ browser }) => {
    test.setTimeout(90_000);
    for (const v of [KIOSK[0], ORDINARY[0]]) {
      const { context, page } = await newPage(browser, v);
      for (const route of ["/rooms", "/map"]) {
        await open(page, route, lang);
        const input = "input[placeholder]";
        await expect(page.locator(input).first(), `${v.name} ${route} ${lang}: a search field with a placeholder exists`).toBeVisible();
        expect(await contrast(page, input, "::placeholder"), `${v.name} ${route} ${lang}: placeholder contrast`).toBeGreaterThanOrEqual(4.5);
      }
      await context.close();
    }
  });
}

// ------------------------------------------------------------------------------------------------ link names
const DAY = "2031-05-16";
let origin: { Origin: string };
let stamp: string;
async function createRoom(request: APIRequestContext, input: { code: string; name: string }) {
  const response = await request.post("/api/admin/rooms", { headers: origin, data: { nameEn: "", descriptionEn: "", type: "seminar", description: "", reservable: true, floorId: "1OG", ...input } });
  expect(response.status()).toBe(201);
  return (await response.json()).room.id as string;
}
async function createSession(request: APIRequestContext, input: { title: string; roomId: string; startTime: string; endTime: string }) {
  const response = await request.post("/api/admin/sessions", { headers: origin, data: { cohort: "Stufe3", term: "SS 2031", date: DAY, instructor: `Quasimodo3${stamp}`, ...input } });
  expect(response.status()).toBe(201);
}

test.beforeAll(async ({ request, baseURL }) => {
  origin = await loginViaApi(request, baseURL!);
  stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const a = await createRoom(request, { code: `S3A-${stamp}`, name: "Namensraum A" });
  const b = await createRoom(request, { code: `S3B-${stamp}`, name: "Namensraum B" });
  await createSession(request, { title: "Glocken (Stufe3)", roomId: a, startTime: "10:00", endTime: "11:00" });
  await createSession(request, { title: "Turmuhr (Stufe3)", roomId: a, startTime: "12:00", endTime: "13:00" });
  await createSession(request, { title: "Orgel (Stufe3)", roomId: b, startTime: "10:00", endTime: "11:00" });
});

/** Links (name + href) of a region, as the browser's accessibility tree reports them. */
async function linksOf(region: ReturnType<Page["locator"]>) {
  const yaml = await region.ariaSnapshot();
  const links: { name: string; href: string }[] = [];
  const lines = yaml.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*- link "(.*)":?\s*$/);
    if (!m) continue;
    const next = lines[i + 1]?.match(/^\s*- \/url: (.*)$/);
    links.push({ name: m[1].replace(/\\"/g, '"'), href: next?.[1] ?? "" });
  }
  return links;
}

for (const lang of LANGS) {
  test(`room links have distinct, contextual names that start with the visible label (${lang})`, async ({ browser }) => {
    test.setTimeout(90_000);
    const { context, page } = await newPage(browser, KIOSK[0]);
    await open(page, "/rooms", lang);
    const t = PUBLIC_TEXT[lang].rooms;
    const cards = await page.locator("article[data-room-id]").evaluateAll((els) =>
      els.map((e) => ({ id: e.getAttribute("data-room-id")!, code: e.querySelector("h3")!.childNodes[0].textContent!.trim() })),
    );
    expect(cards.length, "the demo directory is listed").toBeGreaterThan(40);
    const links = await linksOf(page.getByTestId("room-directory"));
    const names = links.map((l) => l.name);
    const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
    expect(duplicates.slice(0, 5), `${lang}: no two links in the directory share a name`).toEqual([]);
    for (const card of cards) {
      for (const label of [t.todayInRoom, t.onMap]) {
        const mine = names.filter((n) => n.startsWith(label) && n.includes(card.code));
        expect(mine, `${lang} ${card.code}: "${label}" names the room`).toHaveLength(1);
      }
    }
    await context.close();
  });

  test(`class-result links name their room and agree where they lead (${lang})`, async ({ browser }) => {
    test.setTimeout(90_000);
    const { context, page } = await newPage(browser, KIOSK[0]);
    await page.goto(`/rooms?suche=Quasimodo3${stamp}&datum=${DAY}${lang === "en" ? "&lang=en" : ""}`);
    await expect(page.getByTestId("class-match")).toHaveCount(3);
    const t = PUBLIC_TEXT[lang].rooms;
    const links = await linksOf(page.getByTestId("search-classes"));
    const room = links.filter((l) => /\/(map|schedule)\?/.test(l.href));
    expect(room.length, "two room links per class").toBe(6);
    const scheduleLabel = lang === "de" ? "Termine in diesem Raum" : "Classes in this room";
    for (const l of room) {
      expect(l.name.startsWith(t.onMap) || l.name.startsWith(scheduleLabel), `${lang}: "${l.name}" starts with its visible label`).toBe(true);
      expect(l.name, `${lang}: "${l.name}" names the room`).toMatch(new RegExp(`S3[AB]-${stamp}`));
    }
    // The same name must never lead to two different places.
    const byName = new Map<string, Set<string>>();
    for (const l of room) byName.set(l.name, (byName.get(l.name) ?? new Set()).add(l.href));
    for (const [name, hrefs] of byName) expect(hrefs.size, `${lang}: "${name}" leads to one place`).toBe(1);
    await context.close();
  });
}

// ------------------------------------------------------------------------------------------------ focus clearance
/** Where the keyboard-focused element sits relative to what can cover it: the pinned chip bar (top) and the dock (bottom). */
const focusBand = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return null;
    const r = el.getBoundingClientRect();
    const bar = document.querySelector('[data-testid="floor-jump"]');
    const barBox = bar && getComputedStyle(bar).position === "sticky" ? bar.getBoundingClientRect() : null;
    const dock = document.querySelector("[data-public-dock]");
    const dockBox = dock && getComputedStyle(dock).position === "fixed" ? dock.getBoundingClientRect() : null;
    return {
      label: (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 50),
      top: r.top,
      bottom: r.bottom,
      covering: !!bar?.contains(el) || !!dock?.contains(el),
      barBottom: barBox ? barBox.bottom : 0,
      dockTop: dockBox ? dockBox.top : innerHeight,
    };
  });

async function expectClear(page: Page, where: string) {
  const b = await focusBand(page);
  expect(b, `${where}: something has focus`).not.toBeNull();
  if (!b || b.covering) return;
  expect(b.top, `${where}: "${b.label}" is not under the chip bar (bar bottom ${Math.round(b.barBottom)})`).toBeGreaterThanOrEqual(b.barBottom - 0.5);
  expect(b.bottom, `${where}: "${b.label}" is not under the dock (dock top ${Math.round(b.dockTop)})`).toBeLessThanOrEqual(b.dockTop + 0.5);
}

for (const v of KIOSK) {
  for (const lang of LANGS) {
    test(`focus clearance ${v.name} ${lang}: keyboard focus is never left under the pinned chip bar or the dock`, async ({ browser }) => {
      test.setTimeout(120_000);
      const { context, page } = await newPage(browser, v);
      await open(page, "/rooms", lang);
      const bar = page.getByTestId("floor-jump");
      expect(await bar.evaluate((e) => getComputedStyle(e).position), `${v.name}: the chip bar is pinned in kiosk mode`).toBe("sticky");
      const cards = page.locator("article[data-room-id]");
      const target = cards.nth(25).getByRole("link").first();
      const before = cards.nth(24).getByRole("link").last();
      const after = cards.nth(25).getByRole("link").nth(1);

      // Moving up (Shift+Tab) to a link that sits just below the top edge, i.e. behind the chip bar.
      await target.focus();
      const y = await before.evaluate((e) => e.getBoundingClientRect().top);
      await page.evaluate((dy) => window.scrollBy(0, dy), y - 30);
      expect(await before.evaluate((e) => e.getBoundingClientRect().top), "set-up: the previous link is behind the chip bar").toBeLessThan(60);
      await page.keyboard.press("Shift+Tab");
      await expect(before).toBeFocused();
      await expectClear(page, `${v.name} ${lang} Shift+Tab from under the bar`);

      // Moving down (Tab) to a link that sits behind the dock.
      await target.focus();
      const dockTop = (await focusBand(page))!.dockTop;
      const ny = await after.evaluate((e) => e.getBoundingClientRect().top);
      await page.evaluate((dy) => window.scrollBy(0, dy), ny - (dockTop - 20));
      await page.keyboard.press("Tab");
      await expect(after).toBeFocused();
      await expectClear(page, `${v.name} ${lang} Tab to a link behind the dock`);

      // A longer walk in both directions, with a check after every key press.
      for (let i = 0; i < 14; i++) {
        await page.keyboard.press("Tab");
        await expectClear(page, `${v.name} ${lang} Tab ${i + 1}`);
      }
      for (let i = 0; i < 28; i++) {
        await page.keyboard.press("Shift+Tab");
        await expectClear(page, `${v.name} ${lang} Shift+Tab ${i + 1}`);
      }
      await context.close();
    });
  }
}

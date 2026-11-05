import { expect, test, type APIRequestContext, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { PUBLIC_TEXT, publicHref, type Lang } from "../../src/lib/i18n/public.ts";
import { NEWCOMER_CARDS } from "../../src/lib/newcomers/content.ts";
import { FLOORS } from "../../src/lib/rooms/schema.ts";
import { loginViaApi } from "./helpers.ts";

// V2 Stage 2 (AL-03 Home/Newcomers, AL-04 Rooms), docs/contracts.md C11.
// All contexts are nominal emulations in headless Chromium: not the physical Elo screen, not a measurement of
// reach, not a usability test. Sizes asserted here are provisional design choices pending the real panel (V2-P0).
// Fixtures are created through the admin API: no traces, videos or screenshots.
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
const LANGS: Lang[] = ["de", "en"];
const NAV = 'nav[aria-label="Campus-Informationen"], nav[aria-label="Campus information"]';

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

/** Top of the fixed dock in kiosk mode, or null when nothing is pinned (ordinary layouts). */
const dockTop = (page: Page) =>
  page.evaluate(() => {
    const el = document.querySelector("[data-public-dock]");
    return el && getComputedStyle(el).position === "fixed" ? el.getBoundingClientRect().top : null;
  });

/** WCAG contrast of `selector`'s text (or SVG stroke) against its effective background, resolved through a canvas so any CSS colour syntax works. */
async function contrast(page: Page, selector: string, what: "text" | "stroke") {
  return page.locator(selector).first().evaluate((el, kind) => {
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
    const style = getComputedStyle(el);
    const fgRaw = rgba(kind === "stroke" ? style.stroke : style.color);
    const fg = fgRaw.slice(0, 3).map((v, k) => Math.round(v * fgRaw[3] + bg[k] * (1 - fgRaw[3])));
    const [l1, l2] = [lum(fg), lum(bg)];
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }, what);
}

const HOME_PATHS = { newcomers: "/newcomers", map: "/map", rooms: "/rooms", schedule: "/schedule", booking: "/booking", display: "/display" } as const;
const HOME_ORDER = Object.keys(HOME_PATHS) as (keyof typeof HOME_PATHS)[];

// ------------------------------------------------------------------------------------------------ Home
for (const v of [...KIOSK, ...ORDINARY]) {
  test(`home ${v.name}: six large cards with a pictogram and a label, same destinations in both languages`, async ({ browser }) => {
    test.setTimeout(90_000);
    const { context, page } = await newPage(browser, v);
    const wide = v.width >= 900;
    for (const lang of LANGS) {
      await open(page, "/", lang);
      const t = PUBLIC_TEXT[lang];
      const cards = page.getByTestId("home-card");
      await expect(cards, `${v.name} ${lang}: six cards`).toHaveCount(6);
      for (const [i, section] of HOME_ORDER.entries()) {
        const card = cards.nth(i);
        const where = `${v.name} ${lang} ${section}`;
        await expect(card, where).toHaveAttribute("href", publicHref(HOME_PATHS[section], lang));
        await expect(card, where).toContainText(t.sections[section]);
        await expect(card, `${where}: one-line description`).toContainText(t.start.tiles[section]);
        // A pictogram never replaces the label: decorative SVG next to visible text.
        await expect(card.locator('svg[aria-hidden="true"]'), `${where}: pictogram`).toHaveCount(1);
        const box = (await card.boundingBox())!;
        expect(box.width, `${where}: card width`).toBeGreaterThanOrEqual(wide && v.width < 1300 ? 440 : 330);
        expect(box.height, `${where}: card height`).toBeGreaterThanOrEqual(wide && v.width < 1300 ? 240 : 96);
      }
      // Two columns on the wide portrait screen, one on narrow ones.
      const lefts = await cards.evaluateAll((els) => [...new Set(els.map((e) => Math.round(e.getBoundingClientRect().left)))]);
      expect(lefts.length, `${v.name} ${lang}: columns`).toBe(v.width >= 640 ? 2 : 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${v.name} ${lang}: no horizontal overflow`).toBeLessThanOrEqual(0);
    }
    await context.close();
  });
}

for (const v of KIOSK.filter((k) => k.width === 1080)) {
  test(`home ${v.name}: the cards use the portrait space down to the dock, and stay above it`, async ({ browser }) => {
    const { context, page } = await newPage(browser, v);
    for (const lang of LANGS) {
      await open(page, "/", lang);
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      const top = (await dockTop(page))!;
      const lastBottom = await page.getByTestId("home-card").last().evaluate((e) => e.getBoundingClientRect().bottom);
      expect(lastBottom, `${v.name} ${lang}: last card ends above the dock`).toBeLessThanOrEqual(top);
      // V1 left a gap of ~300 px under the cards; the cards now fill the area (footer and padding remain).
      expect(top - lastBottom, `${v.name} ${lang}: space left under the cards`).toBeLessThanOrEqual(170);
    }
    await context.close();
  });
}

test("home: card text and pictogram are readable (contrast measured through the real colours)", async ({ browser }) => {
  const { context, page } = await newPage(browser, KIOSK[0]);
  await open(page, "/", "de");
  expect(await contrast(page, '[data-testid="home-card"] [data-card-title]', "text"), "title contrast").toBeGreaterThanOrEqual(4.5);
  expect(await contrast(page, '[data-testid="home-card"] [data-card-text]', "text"), "description contrast").toBeGreaterThanOrEqual(4.5);
  expect(await contrast(page, '[data-testid="home-card"] svg', "stroke"), "pictogram contrast (graphic, 3:1)").toBeGreaterThanOrEqual(3);
  await context.close();
});

// ------------------------------------------------------------------------------------------------ Newcomers
const PRIMARY = NEWCOMER_CARDS.filter((card) => card.id !== "help");

for (const v of [...KIOSK, ...ORDINARY]) {
  test(`newcomers ${v.name}: four action cards and a full-width help card, Reza's text unchanged, no prototype block`, async ({ browser }) => {
    test.setTimeout(90_000);
    const { context, page } = await newPage(browser, v);
    const wide = v.width >= 640;
    for (const lang of LANGS) {
      await open(page, "/newcomers", lang);
      const where = `${v.name} ${lang}`;
      // The long coloured block is gone in both languages (old strings), and a compact marker took its place.
      await expect(page.getByText(/Studentischer HCI-Prototyp|Student HCI prototype/), `${where}: old block`).toHaveCount(0);
      expect(await page.locator("main [role=note]").count(), `${where}: no note box`).toBe(0);
      const marker = page.getByTestId("prototype-marker");
      await expect(marker, `${where}: marker`).toBeVisible();
      await expect(marker).toHaveText(lang === "de" ? /Prototyp.*Beispieldaten/ : /prototype.*example data/i);
      const markerStyle = await marker.evaluate((el) => {
        const s = getComputedStyle(el);
        return { background: s.backgroundColor, border: parseFloat(s.borderTopWidth) + parseFloat(s.borderLeftWidth), height: el.getBoundingClientRect().height, fontSize: parseFloat(s.fontSize) };
      });
      expect(markerStyle.background, `${where}: marker has no fill`).toBe("rgba(0, 0, 0, 0)");
      expect(markerStyle.border, `${where}: marker has no border`).toBe(0);
      expect(markerStyle.fontSize, `${where}: marker text stays readable`).toBeGreaterThanOrEqual(16);
      expect(markerStyle.height, `${where}: marker is compact (at most two lines)`).toBeLessThanOrEqual(markerStyle.fontSize * 1.6 * 2 + 4);

      // Five cards, one link each (the existing newcomer test counts exactly five); four primary then help.
      const cards = page.getByRole("main").getByRole("article");
      await expect(cards, where).toHaveCount(5);
      const order = await cards.evaluateAll((els) => els.map((e) => e.getAttribute("data-newcomer-card")));
      expect(order, `${where}: order follows content.ts, help last`).toEqual([...PRIMARY.map((c) => c.id), "help"]);
      for (const card of NEWCOMER_CARDS) {
        const el = page.locator(`article[data-newcomer-card="${card.id}"]`);
        const name = `${where} ${card.id}`;
        await expect(el.getByRole("heading"), `${name}: title`).toHaveText(card.title[lang]);
        await expect(el.getByText(card.body[lang], { exact: true }), `${name}: body text verbatim, not shortened`).toBeVisible();
        const link = el.getByRole("link");
        await expect(link, `${name}: one link`).toHaveCount(1);
        await expect(link, name).toHaveText(card.actionLabel[lang]);
        await expect(link, name).toHaveAttribute("href", publicHref(card.path, lang));
        expect((await link.boundingBox())!.height, `${name}: action height`).toBeGreaterThanOrEqual(56);
        await expect(el.locator('svg[aria-hidden="true"]'), `${name}: pictogram`).toHaveCount(1);
        // Nothing is clipped: neither the card nor any text inside it overflows its box.
        const clipped = await el.evaluate((root) => [root, ...root.querySelectorAll("*")].filter((n) => (n as HTMLElement).scrollHeight > (n as HTMLElement).clientHeight + 1 && getComputedStyle(n).overflow !== "visible").length);
        expect(clipped, `${name}: clipped elements`).toBe(0);
      }
      // Hierarchy: the four actions are the primary (filled) buttons; the help action is secondary.
      const fills = await page.locator("article[data-newcomer-card] a").evaluateAll((as) => as.map((a) => getComputedStyle(a).backgroundColor));
      expect(new Set(fills.slice(0, 4)).size, `${where}: the four actions look alike`).toBe(1);
      expect(fills[4], `${where}: help action is not a competing primary`).not.toBe(fills[0]);

      if (wide) {
        const boxes = await cards.evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width }; }));
        const primary = boxes.slice(0, 4);
        expect(new Set(primary.map((b) => Math.round(b.left))).size, `${where}: two columns`).toBe(2);
        expect(Math.abs(primary[0].top - primary[1].top), `${where}: first row aligned`).toBeLessThanOrEqual(1);
        expect(Math.abs(primary[0].bottom - primary[1].bottom), `${where}: equal card heights per row`).toBeLessThanOrEqual(1);
        const help = boxes[4];
        expect(help.left, `${where}: help card starts at the grid's left edge`).toBeCloseTo(primary[0].left, 0);
        expect(help.right, `${where}: help card spans the full grid width`).toBeCloseTo(primary[1].right, 0);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${where}: no horizontal overflow`).toBeLessThanOrEqual(0);
    }
    await context.close();
  });
}

test("newcomers: the end of the page is reachable above the dock", async ({ browser }) => {
  const { context, page } = await newPage(browser, KIOSK[2]);
  for (const lang of LANGS) {
    await open(page, "/newcomers", lang);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const top = (await dockTop(page))!;
    const lastBottom = await page.locator('article[data-newcomer-card="help"] a').evaluate((e) => e.getBoundingClientRect().bottom);
    expect(lastBottom, `${lang}: the help action ends above the dock`).toBeLessThanOrEqual(top);
  }
  await context.close();
});

// ------------------------------------------------------------------------------------------------ Rooms
let headers: { Origin: string };
const DAY = "2031-05-14";
let stamp: string;

async function createRoom(request: APIRequestContext, input: { code: string; name: string; floorId: string; reservable?: boolean; description?: string }) {
  const response = await request.post("/api/admin/rooms", { headers, data: { nameEn: "", descriptionEn: "", type: "seminar", description: "", reservable: false, ...input } });
  expect(response.status()).toBe(201);
  return (await response.json()).room.id as string;
}
async function createSession(request: APIRequestContext, input: { title: string; instructor: string; roomId: string; startTime?: string; endTime?: string }) {
  const response = await request.post("/api/admin/sessions", { headers, data: { cohort: "Stufe2", term: "SS 2031", date: DAY, startTime: "10:00", endTime: "11:00", ...input } });
  expect(response.status()).toBe(201);
}

test.beforeAll(async ({ request, baseURL }) => {
  headers = await loginViaApi(request, baseURL!);
  stamp = Date.now().toString(36).toUpperCase().slice(-6);
  // A short, reservable card (three actions) with no description, so its size is controlled.
  await createRoom(request, { code: `S2C-${stamp}`, name: "Kompaktraum", floorId: "1OG", reservable: true });
  const roomId = await createRoom(request, { code: `S2R-${stamp}`, name: "Rohrpost", floorId: "1OG" });
  await createSession(request, { title: "Pneumatik (Stufe2)", instructor: "Quasimodo Stufe2", roomId });
  // A second slot: the occupancy rule (409) forbids two classes in one room at the same time.
  await createSession(request, { title: "Rohrpost-Praxis (Stufe2)", instructor: "Dozent Stufe2", roomId, startTime: "12:00", endTime: "13:00" });
});

const searchBox = (page: Page, lang: Lang) => page.getByRole("searchbox", { name: lang === "de" ? "Raum, Lehrperson oder Lehrveranstaltung suchen" : "Search for a room, lecturer or course" });
const jumpGroup = (page: Page) => page.getByTestId("floor-jump");

for (const v of [...KIOSK, ...ORDINARY]) {
  test(`rooms ${v.name}: floor chips jump to the floor, without a new history entry, and focus lands on the heading`, async ({ browser, request }) => {
    test.setTimeout(120_000);
    const { context, page } = await newPage(browser, v);
    const present = new Set(((await (await request.get("/api/public/rooms")).json()).rooms as { floorId: string }[]).map((r) => r.floorId));
    const floors = FLOORS.filter((f) => present.has(f.id));
    expect(floors.length, "the test data spans at least two floors").toBeGreaterThanOrEqual(2);
    for (const lang of LANGS) {
      await open(page, "/rooms", lang);
      const t = PUBLIC_TEXT[lang];
      await expect(page.getByRole("heading", { level: 2, name: t.floors[floors[0].id] })).toBeVisible();
      const where = `${v.name} ${lang}`;
      const group = jumpGroup(page);
      await expect(group, where).toBeVisible();
      await expect(group.getByRole("button"), `${where}: one chip per floor that has rooms, in floor order`).toHaveText(floors.map((f) => t.floors[f.id]));
      expect((await group.getByRole("button").first().boundingBox())!.height, `${where}: chip height`).toBeGreaterThanOrEqual(56);

      const urlBefore = page.url();
      const historyBefore = await page.evaluate(() => history.length);
      for (const floor of [...floors].reverse()) {
        const heading = page.locator(`#stock-${floor.id}`);
        await group.getByRole("button", { name: t.floors[floor.id], exact: true }).click();
        // The scroll is smooth: wait until the heading has settled.
        // "Near the top" means directly under the chip bar (which is pinned in kiosk mode and static otherwise).
        await expect.poll(async () => {
          const r = await heading.evaluate((e, sel) => {
            const bar = document.querySelector(sel)!;
            const pinned = getComputedStyle(bar).position === "sticky";
            return { top: e.getBoundingClientRect().top, barBottom: pinned ? bar.getBoundingClientRect().bottom : 0, y: scrollY, max: document.documentElement.scrollHeight - innerHeight };
          }, '[data-testid="floor-jump"]');
          return r.top >= r.barBottom - 1 && (r.top <= r.barBottom + 60 || Math.abs(r.y - r.max) < 2);
        }, { message: `${where} ${floor.id}: heading directly under the chips (or the page cannot scroll further)`, timeout: 8_000 }).toBe(true);
        const bottom = await heading.evaluate((e) => e.getBoundingClientRect().bottom);
        const top = await dockTop(page);
        if (top !== null) expect(bottom, `${where} ${floor.id}: heading above the dock`).toBeLessThanOrEqual(top);
        await expect(heading, `${where} ${floor.id}: focus moved to the heading`).toBeFocused();
      }
      expect(page.url(), `${where}: URL unchanged (no hash, no query)`).toBe(urlBefore);
      expect(await page.evaluate(() => history.length), `${where}: no history entries added`).toBe(historyBefore);
    }
    await context.close();
  });
}

for (const v of KIOSK) {
  test(`rooms ${v.name}: a card is compact, its actions share one row, and ids and links are unchanged`, async ({ browser, request }) => {
    const roomId = (((await (await request.get("/api/public/rooms")).json()).rooms as { id: string; code: string }[]).find((r) => r.code === `S2C-${stamp}`))!.id;
    const { context, page } = await newPage(browser, v);
    for (const lang of LANGS) {
      await open(page, "/rooms", lang);
      const t = PUBLIC_TEXT[lang];
      const card = page.locator(`[data-room-id="${roomId}"]`);
      await expect(card).toHaveCount(1);
      const links = card.getByRole("link");
      await expect(links, `${lang}: three actions (reservable room)`).toHaveCount(3);
      await expect(links.nth(0)).toHaveAttribute("href", publicHref("/schedule", lang, { raum: roomId }));
      await expect(links.nth(1)).toHaveAttribute("href", publicHref("/map", lang, { raum: roomId }));
      await expect(links.nth(2)).toHaveAttribute("href", publicHref("/booking", lang, { raum: roomId }));
      // Stage 3 (AL-05, C14): each link now ends in a visually hidden " – <room code>" so its accessible name is
      // distinct. Intentional change of this expectation (was the bare label); the visible label must still come
      // first, and all three actions are checked instead of one.
      for (const [i, label] of [t.rooms.todayInRoom, t.rooms.onMap, t.rooms.book].entries()) {
        await expect(links.nth(i), `${lang}: action ${i} reads "${label}" first, then the room code`).toHaveText(`${label} – S2C-${stamp}`);
      }
      const tops = await links.evaluateAll((as) => as.map((a) => Math.round(a.getBoundingClientRect().top)));
      expect(new Set(tops).size, `${lang}: the three actions are in one row`).toBe(1);
      const heights = await links.evaluateAll((as) => as.map((a) => a.getBoundingClientRect().height));
      const wide = v.width >= 900;
      for (const h of heights) expect(h, `${lang}: action height stays a full touch target (56 px at the 16 px root, 77 px at 22 px)`).toBeGreaterThanOrEqual(wide ? 77 : 56);
      const box = (await card.boundingBox())!;
      expect(box.height, `${lang}: card height (Stage 1: ~385 px at 1080 px)`).toBeLessThanOrEqual(wide ? 270 : 230);
    }
    await context.close();
  });

  test(`rooms ${v.name}: cards are spaced tightly enough that the list is not longer than the audited V1 pitch`, async ({ browser }) => {
    const { context, page } = await newPage(browser, v);
    await open(page, "/rooms", "de");
    // Distance from one card's top to the next within a floor: V1 ≈ 295 px, Stage 1 ≈ 400 px.
    const pitches = await page.locator("article[data-room-id]").evaluateAll((els) => {
      const tops = els.map((e) => e.getBoundingClientRect().top);
      return tops.slice(1).map((t, i) => t - tops[i]).filter((d) => d > 0 && d < 600).sort((a, b) => a - b);
    });
    expect(pitches.length).toBeGreaterThan(10);
    const median = pitches[Math.floor(pitches.length / 2)];
    expect(median, "median card pitch at 1080 px (px)").toBeLessThanOrEqual(290);
    await context.close();
  });
}

for (const lang of LANGS) {
  test(`rooms search (${lang}): matching classes come first and are never contradicted by a "no room found" box`, async ({ browser }) => {
    test.setTimeout(90_000);
    const { context, page } = await newPage(browser, KIOSK[0]);
    const url = `/rooms?suche=Quasimodo&datum=${DAY}${lang === "en" ? "&lang=en" : ""}`;
    const noRoom = page.getByText(lang === "de" ? /Kein Raum passt zu/ : /No room matches/);
    const classes = page.getByTestId("search-classes");
    const rooms = page.getByTestId("search-rooms");

    // While the class request is held back: no "no room" message may appear, and it must not lead.
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    await page.route((u) => u.pathname === "/api/public/schedule", async (route) => { await gate; await route.continue(); });
    await page.goto(url);
    await expect(searchBox(page, lang)).toHaveValue("Quasimodo");
    // (Rooms may still be loading too, so the class group's own loading status is selected by its text.)
    await expect(page.getByRole("status").filter({ hasText: lang === "de" ? "Termine werden geladen" : "Loading classes" }), "class loading state shown").toBeVisible();
    await page.waitForTimeout(400);
    await expect(noRoom, "no 'no room' message while the classes are loading").toHaveCount(0);
    release();

    await expect(page.getByTestId("class-match"), `${lang}: the class is found`).toHaveCount(1);
    await expect(classes.getByRole("heading", { level: 2 })).toContainText(lang === "de" ? "Mittwoch, 14. Mai 2031" : "Wednesday, 14 May 2031");
    // Classes lead; the (empty) room group follows and says where the matches are.
    await expect(page.locator('[data-testid="search-classes"] ~ [data-testid="search-rooms"]'), `${lang}: classes before rooms`).toHaveCount(1);
    await expect(rooms).toContainText(lang === "de" ? "· 0 Räume" : "· 0 rooms");
    await expect(noRoom).toHaveCount(1);
    await expect(noRoom).toContainText(lang === "de" ? "stehen oben" : "classes above");
    const classBox = (await classes.boundingBox())!;
    const noRoomBox = (await noRoom.boundingBox())!;
    expect(noRoomBox.y, `${lang}: the message sits below the matching classes`).toBeGreaterThanOrEqual(classBox.y + classBox.height - 1);
    // Day scope is stated in words as well as in the heading, and the room is not an office.
    await expect(classes, lang).toContainText(lang === "de" ? /Die Suche gilt nur für diesen Tag/ : /covers this one day only/);
    await expect(classes, lang).toContainText(lang === "de" ? "kein Büro und kein aktueller Aufenthaltsort" : "not an office and not where a person is right now");

    // A query that matches a room AND a class keeps the rooms first.
    await searchBox(page, lang).fill("Rohrpost");
    await expect(page.locator('[data-testid="search-rooms"] ~ [data-testid="search-classes"]'), `${lang}: rooms first when a room matches`).toHaveCount(1);
    await expect(page.getByTestId("class-match")).toHaveCount(1);
    await expect(noRoom).toHaveCount(0);

    // Nothing at all: the plain messages remain, one for rooms and one for the day's classes.
    await searchBox(page, lang).fill("Zzzz-gibt-es-nicht");
    await expect(noRoom).toHaveCount(1);
    await expect(noRoom).not.toContainText(lang === "de" ? "stehen oben" : "classes above");
    await expect(classes.getByRole("status")).toBeVisible();
    await context.close();
  });
}

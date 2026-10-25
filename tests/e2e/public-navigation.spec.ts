import { expect, test, type Page } from "@playwright/test";
import { termForDate } from "../../src/lib/sessions/schema.ts";
import { addDays, berlinDateOf } from "../../src/lib/time/berlin.ts";
import { loginViaApi } from "./helpers.ts";

// Public navigation and DE/EN switch, walked from the real public entry ("/")
// by clicking links only, in an anonymous portrait context. The room and its
// session (today, Berlin time) are created through the admin API beforehand.

async function expectNoAdminLinks(page: Page) {
  await expect(page.locator('a[href*="/admin"]')).toHaveCount(0);
}

const nav = (page: Page, name: string) => page.getByRole("navigation", { name }).first();

test("public pages are reachable from / with a return path, keeping language, day and room", async ({ browser, request, baseURL }) => {
  const headers = await loginViaApi(request, baseURL!);
  const code = `NAV-${Date.now().toString(36).toUpperCase()}`;
  const title = `Navigationstest ${code}`;
  const today = berlinDateOf(new Date());
  const tomorrow = addDays(today, 1);

  const created = await request.post("/api/admin/rooms", {
    headers,
    data: { code, name: "Navigationsraum", floorId: "EG", type: "seminar", description: "", reservable: false },
  });
  expect(created.status()).toBe(201);
  const roomId = (await created.json()).room.id as string;
  const session = await request.post("/api/admin/sessions", {
    headers,
    data: { title, instructor: "Testperson", cohort: "Testkohorte", term: termForDate(today), roomId, date: today, startTime: "12:00", endTime: "13:00" },
  });
  expect(session.status()).toBe(201);

  const context = await browser.newContext({ viewport: { width: 540, height: 960 } });
  const page = await context.newPage();

  // 1. The entry is a real start page (no redirect) with the three sections.
  await page.goto("/");
  expect(new URL(page.url()).pathname).toBe("/");
  await expect(page.getByRole("heading", { name: "Campus-Informationen", level: 1 })).toBeVisible();
  await expect(nav(page, "Campus-Informationen").getByRole("link", { name: "Start" })).toHaveAttribute("aria-current", "page");
  await expectNoAdminLinks(page);

  // 2. Start → announcement board, which now has the same navigation.
  await page.getByRole("main").getByRole("link", { name: /Mitteilungen/ }).click();
  await expect(page).toHaveURL(/\/display$/);
  await expect(page.getByTestId("display-board").getByRole("heading", { name: "Mitteilungen" })).toBeVisible();
  await expectNoAdminLinks(page);

  // 3. Board → rooms → "today in this room" keeps the room.
  await nav(page, "Campus-Informationen").getByRole("link", { name: "Räume" }).click();
  await expect(page).toHaveURL(/\/rooms$/);
  const roomCard = page.getByRole("article").filter({ has: page.getByRole("heading", { name: new RegExp(code) }) });
  await roomCard.getByRole("link", { name: "Heute in diesem Raum" }).click();
  await expect(page).toHaveURL(`/schedule?raum=${roomId}`);
  await expect(page.getByText(`Raum ${code} – Navigationsraum (Erdgeschoss)`)).toBeVisible();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expectNoAdminLinks(page);

  // 4. Next day keeps the room.
  await page.getByRole("link", { name: "Folgetag →" }).click();
  await expect(page).toHaveURL(`/schedule?datum=${tomorrow}&raum=${roomId}`);
  await expect(page.getByText("An diesem Tag sind keine Termine eingetragen.")).toBeVisible();

  // 5. Switching to English keeps day and room; interface text changes, staff content does not.
  await page.getByRole("group", { name: "Sprache" }).getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(`/schedule?datum=${tomorrow}&raum=${roomId}&lang=en`);
  await expect(page.getByRole("heading", { name: "Schedule", level: 1 })).toBeVisible();
  await expect(page.getByText(`Room ${code} – Navigationsraum (Ground floor)`)).toBeVisible();
  await expect(page.getByText("No classes are scheduled on this day.")).toBeVisible();
  await expect(page.getByText(/are shown in German/)).toBeVisible();
  await expect(page.getByRole("group", { name: "Language" }).getByRole("link", { name: "English" })).toHaveAttribute("aria-current", "true");

  // 6. Day navigation in English keeps language and room.
  await page.getByRole("link", { name: "← Previous day" }).click();
  await expect(page).toHaveURL(`/schedule?datum=${today}&raum=${roomId}&lang=en`);
  await expect(page.getByRole("heading", { name: title })).toHaveAttribute("lang", "de");

  // 7. "All rooms" drops the room, keeps day and language.
  await page.getByRole("link", { name: "All rooms" }).click();
  await expect(page).toHaveURL(`/schedule?datum=${today}&lang=en`);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  // 8. Section navigation keeps English: rooms → room schedule → board → home.
  await nav(page, "Campus information").getByRole("link", { name: "Rooms" }).click();
  await expect(page).toHaveURL("/rooms?lang=en");
  await expect(page.getByRole("heading", { name: "Ground floor" })).toBeVisible();
  await roomCard.getByRole("link", { name: "Today in this room" }).click();
  await expect(page).toHaveURL(`/schedule?raum=${roomId}&lang=en`);
  await nav(page, "Campus information").getByRole("link", { name: "Announcements" }).click();
  await expect(page).toHaveURL("/display?lang=en");
  await expect(page.getByTestId("display-board").getByRole("heading", { name: "Announcements" })).toBeVisible();
  await expectNoAdminLinks(page);
  await nav(page, "Campus information").getByRole("link", { name: "Home" }).click();
  await expect(page).toHaveURL("/?lang=en");
  await expect(page.getByRole("heading", { name: "Campus information", level: 1 })).toBeVisible();

  // 9. Back to German from the start page.
  await page.getByRole("group", { name: "Language" }).getByRole("link", { name: "Deutsch" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Campus-Informationen", level: 1 })).toBeVisible();

  await context.close();
});

test("the board's language switch stays on the board and English carries over to other sections", async ({ page }) => {
  await page.goto("/display");
  await page.getByRole("group", { name: "Sprache" }).getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL("/display?lang=en");
  await expect(page.getByTestId("display-board").getByRole("heading", { name: "Announcements" })).toBeVisible();
  await expect(page.locator('[lang="en"]').first()).toBeVisible();
  await nav(page, "Campus information").getByRole("link", { name: "Schedule" }).click();
  await expect(page).toHaveURL("/schedule?lang=en");
  await expect(page.getByRole("heading", { name: "Schedule", level: 1 })).toBeVisible();
});

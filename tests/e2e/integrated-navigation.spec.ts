import { expect, test, type Page } from "@playwright/test";

// T12/T15: every module is reachable from Start by clicks, context (raum,
// datum, lang) survives map → schedule → booking → map and language switches,
// and there is always a way home. Screenshots are simulated viewports, not a
// physical kiosk test; they contain no booking credentials.
const OUT = process.env.SCREENSHOT_DIR ?? "docs/evidence/integration-2026-10-31/screenshots";
const nav = (page: Page, name: string) => page.getByRole("navigation", { name });

test("newcomer → map → schedule → booking → map, by clicks, in English", async ({ page }) => {
  await page.goto("/?lang=en");
  await page.getByRole("main").getByRole("link", { name: /New to campus/ }).click();
  await expect(page).toHaveURL(/\/newcomers\?lang=en$/);
  await page.getByRole("link", { name: "Open the map" }).click();
  await expect(page).toHaveURL(/\/map\?lang=en$/);

  await page.getByLabel("Search rooms").fill("K1-120");
  const details = page.getByTestId("map-details");
  await expect(details).toContainText("K1-120");
  await details.getByRole("link", { name: "Classes in this room" }).click();
  await expect(page).toHaveURL(/\/schedule\?raum=lcc-demo-room-k1-120&lang=en$/);
  await expect(page.getByRole("main")).toContainText("K1-120");

  await page.getByRole("link", { name: "On the map" }).click();
  await expect(page).toHaveURL(/\/map\?raum=lcc-demo-room-k1-120&lang=en$/);
  await page.getByTestId("map-details").getByRole("link", { name: "Book this room (demo)" }).click();
  await expect(page).toHaveURL(/\/booking\?raum=lcc-demo-room-k1-120&lang=en$/);
  await expect(page.getByLabel("1. Choose a room")).toHaveValue("lcc-demo-room-k1-120");

  // Language switch keeps the room; the booking form follows.
  await page.getByRole("link", { name: "Deutsch" }).click();
  await expect(page).toHaveURL(/\/booking\?.*raum=lcc-demo-room-k1-120/);
  await expect(page).not.toHaveURL(/lang=en/);
  await expect(page.getByLabel("1. Raum auswählen")).toHaveValue("lcc-demo-room-k1-120");
  await page.getByRole("link", { name: "Diesen Raum auf der Karte zeigen" }).click();
  await expect(page).toHaveURL(/\/map\?raum=lcc-demo-room-k1-120/);

  // Home from every module, in the current language.
  for (const path of ["/map", "/booking", "/newcomers", "/rooms", "/schedule", "/display"]) {
    await page.goto(`${path}?lang=en`);
    await nav(page, "Campus information").getByRole("link", { name: "Home" }).click();
    await expect(page).toHaveURL(/\/\?lang=en$/);
  }
});

test("navigation lists all seven sections once, with no admin link", async ({ page }) => {
  await page.goto("/");
  const links = nav(page, "Campus-Informationen").getByRole("link");
  await expect(links).toHaveText(["Start", "Neu am Campus", "Karte", "Räume", "Stundenplan", "Raumbuchung", "Mitteilungen"]);
  for (const path of ["/", "/map", "/booking", "/booking/cancel", "/newcomers", "/rooms", "/schedule", "/display"]) {
    await page.goto(path);
    await expect(page.locator('a[href*="/admin"]')).toHaveCount(0);
  }
});

test("the newcomer page's links all lead to working pages in both languages", async ({ page }) => {
  for (const lang of ["de", "en"] as const) {
    await page.goto(lang === "en" ? "/newcomers?lang=en" : "/newcomers");
    const actions = page.getByRole("main").getByRole("article").getByRole("link");
    await expect(actions).toHaveCount(5);
    const hrefs = await actions.evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
    for (const href of hrefs) {
      expect(href.includes("lang=en")).toBe(lang === "en");
      const response = await page.request.get(href);
      expect(response.status(), href).toBe(200);
    }
    await expect(page.getByRole("main")).not.toContainText(/integriert|integrated version|TODO/i);
  }
});

for (const viewport of [
  { width: 540, height: 960 },
  { width: 1080, height: 1920 },
]) {
  test(`simulated portrait ${viewport.width}×${viewport.height}: start, map and booking fit without horizontal page scroll`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const [name, path] of [
      ["start", "/"],
      ["map", "/map?raum=lcc-demo-room-k1-120"],
      ["booking", "/booking"],
      ["newcomers", "/newcomers"],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} page-level horizontal overflow`).toBeLessThanOrEqual(0);
      await page.screenshot({ path: `${OUT}/v1-${name}-de-${viewport.width}x${viewport.height}.png`, fullPage: true });
    }
  });
}

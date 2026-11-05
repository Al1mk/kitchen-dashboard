import { expect, test, type Page } from "@playwright/test";
import { loginViaApi } from "./helpers.ts";

// T11: the map lives in the shared shell, reads live room data and binds
// positions to stable room ids. The E2E database is seeded with the team demo
// rooms (playwright.config.ts). Each test uses different catalog rooms.

const marker = (page: Page, roomId: string) => page.locator(`[data-testid="map-layer"] button[data-room-id="${roomId}"]`);
const details = (page: Page) => page.getByTestId("map-details");

async function editRoom(request: import("@playwright/test").APIRequestContext, baseURL: string, id: string, changes: Record<string, unknown>) {
  const origin = await loginViaApi(request, baseURL);
  const current = (await (await request.get(`/api/admin/rooms/${id}`)).json()).room;
  const res = await request.put(`/api/admin/rooms/${id}`, {
    headers: { ...origin, "Content-Type": "application/json" },
    data: { code: current.code, name: current.name, nameEn: current.nameEn, floorId: current.floorId, type: current.type, description: current.description, descriptionEn: current.descriptionEn, reservable: current.reservable, ...changes },
  });
  expect(res.status()).toBe(200);
  return origin;
}

test("deep link selects the room on its floor, in the shared shell, with schedule and booking links", async ({ page }) => {
  const id = "lcc-demo-room-k1-303";
  await page.goto(`/map?raum=${id}&lang=en`);
  await expect(page.getByRole("heading", { level: 1, name: "Map" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Campus information" }).getByRole("link", { name: "Map" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("button", { name: "3rd floor", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(marker(page, id)).toHaveAttribute("aria-pressed", "true");
  await expect(details(page)).toContainText("K1-303");
  await expect(details(page).getByRole("link", { name: "Classes in this room" })).toHaveAttribute("href", `/schedule?raum=${id}&lang=en`);
  await expect(details(page).getByRole("link", { name: "Book this room (demo)" })).toHaveAttribute("href", `/booking?raum=${id}&lang=en`);
  await expect(page.locator('a[href*="/admin"]')).toHaveCount(0);
  // Reload keeps language and room (URL is the source of context).
  await page.reload();
  await expect(details(page)).toContainText("K1-303");
  await expect(page.getByRole("button", { name: "3rd floor", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("markers sit on the image at their normalized position, also after zooming", async ({ page }) => {
  await page.setViewportSize({ width: 1080, height: 1920 });
  await page.goto("/map?etage=1OG");
  const layer = page.getByTestId("map-layer");
  const pin = marker(page, "lcc-demo-room-k1-103"); // x 0.1294346, y 0.2522936 in the source data
  // Isolate this pin: grouped affordances deliberately sit at a centroid.
  await page.getByLabel("Raum suchen").fill("103");
  await expect(pin).toBeVisible();
  for (const zoomClicks of [0, 2]) {
    for (let i = 0; i < zoomClicks; i++) await page.getByRole("button", { name: "Vergrößern" }).click();
    // Read both boxes in one frame, after scroll/zoom settles.
    await expect.poll(async () => layer.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const pin = element.querySelector('[data-room-id="lcc-demo-room-k1-103"]')!;
      const p = pin.getBoundingClientRect();
      return Math.max(Math.abs((p.x + p.width / 2 - box.x) / box.width - 0.1294346), Math.abs((p.y + p.height / 2 - box.y) / box.height - 0.2522936));
    })).toBeLessThan(0.01);
  }
});

test("search by code selects the room; changing the floor clears the room and keeps the language", async ({ page }) => {
  await page.goto("/map?lang=en");
  await page.getByLabel("Search rooms").fill("207");
  await expect(details(page)).toContainText("K1-207");
  await expect(page).toHaveURL(/raum=lcc-demo-room-k1-207/);
  await expect(page.getByRole("button", { name: "2nd floor", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "3rd floor", exact: true }).click();
  await expect(page).toHaveURL(/\/map\?etage=3OG&lang=en$/);
  await expect(details(page)).toContainText("No room selected");
  await expect(page.getByRole("link", { name: "Deutsch" })).toHaveAttribute("href", "/map?etage=3OG");
});

test("renaming keeps the marker (id binding); moving to another floor hides the old position", async ({ page, request, baseURL }) => {
  const id = "lcc-demo-room-k1-108";
  await editRoom(request, baseURL!, id, { code: "K1-108N", name: "Umbenannter Raum" });
  await page.goto(`/map?raum=${id}`);
  const cluster = page.locator(`[data-testid="map-cluster"][data-room-ids~="${id}"]`);
  await expect.poll(async () => await marker(page, id).count() + await cluster.count()).toBe(1);
  if (await cluster.count()) {
    await cluster.click();
    await expect(page.getByTestId("map-cluster-chooser").getByRole("button", { name: /K1-108N/ })).toContainText("Umbenannter Raum");
    await page.getByTestId("map-cluster-chooser").getByRole("button", { name: /K1-108N/ }).click();
  } else await expect(marker(page, id)).toHaveText("K1-108N");
  await expect(details(page)).toContainText("Umbenannter Raum");

  await editRoom(request, baseURL!, id, { floorId: "2OG" });
  await page.goto(`/map?raum=${id}`);
  await expect(page.getByRole("button", { name: "2. Obergeschoss", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(marker(page, id)).toHaveCount(0);
  await expect(cluster).toHaveCount(0);
  await expect(details(page)).toContainText("anderen Stockwerk");
  // The 1OG plan does not show it either.
  await page.getByRole("button", { name: "1. Obergeschoss", exact: true }).click();
  await expect(marker(page, id)).toHaveCount(0);
  await expect(cluster).toHaveCount(0);
});

test("archived and unknown rooms get no marker and no substitute", async ({ page, request, baseURL }) => {
  const id = "lcc-demo-room-k1-109";
  const origin = await loginViaApi(request, baseURL!);
  expect((await request.post(`/api/admin/rooms/${id}/archive`, { headers: origin })).status()).toBe(200);
  for (const raum of [id, "no-such-room"]) {
    await page.goto(`/map?raum=${raum}`);
    await expect(details(page).getByRole("alert")).toContainText("Es wurde kein anderer Raum ausgewählt");
    await expect(page.locator('[data-testid="map-layer"] button[aria-pressed="true"]')).toHaveCount(0);
  }
  await expect(marker(page, id)).toHaveCount(0);
});

test("K1-114 is selectable as information without a dot", async ({ page }) => {
  await page.goto("/map?etage=1OG");
  await page.getByRole("listitem").getByRole("button", { name: /K1-114/ }).click();
  await expect(details(page)).toContainText("K1-114");
  await expect(details(page)).toContainText("keine Position auf dem Plan");
  await expect(marker(page, "lcc-demo-room-k1-114")).toHaveCount(0);
});

test("a missing floor image shows a localized fallback and keeps the room list", async ({ page }) => {
  await page.route("**/map-demo/assets/2OG.png", (route) => route.abort("failed"));
  await page.goto("/map?etage=2OG&lang=en");
  await expect(page.getByRole("alert").filter({ hasText: "The plan cannot be loaded right now" })).toBeVisible();
  await expect(page.getByRole("listitem").getByRole("button", { name: /K1-201/ })).toBeVisible();
});

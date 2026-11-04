import { expect, test } from "@playwright/test";

// AP-01: requires seeded team demo and viewport checks (NOT a physical Elo test).
test("dense pins have a keyboard/touch chooser and no room gets lost", async ({ page }) => {
  await page.setViewportSize({ width: 540, height: 960 });
  await page.goto("/map?etage=1OG");
  const cluster = page.locator('[data-testid="map-cluster"][data-room-ids*="lcc-demo-room-k1-115"]').first();
  await expect(cluster).toBeVisible();
  await expect(cluster).toHaveAttribute("data-room-ids", /lcc-demo-room-k1-118/);
  const rect = await cluster.boundingBox();
  expect(rect?.height).toBeGreaterThanOrEqual(43);
  expect(rect?.width).toBeGreaterThanOrEqual(43);
  await cluster.click();
  const chooser = page.getByRole("region", { name: "Nahe Räume auswählen" });
  await expect(chooser.getByRole("button", { name: /K1-115/ })).toBeVisible();
  await expect(chooser.getByRole("button", { name: /K1-118/ })).toBeVisible();
  await chooser.getByRole("button", { name: /K1-118/ }).click();
  await expect(page.getByTestId("map-details")).toContainText("K1-118");
  await page.getByLabel("Raum suchen").fill("K1-115");
  await expect(page.getByTestId("map-details")).toContainText("K1-115");
  await expect(page.locator('[data-testid="map-layer"] button[data-room-id="lcc-demo-room-k1-115"]')).toBeVisible();
});

test("room chooser stays in English and floor changes reset the chooser", async ({ page }) => {
  await page.setViewportSize({ width: 540, height: 960 });
  await page.goto("/map?etage=1OG&lang=en");
  const cluster = page.locator('[data-testid="map-cluster"][data-room-ids*="lcc-demo-room-k1-115"]').first();
  await cluster.click();
  await expect(page.getByRole("region", { name: "Choose nearby rooms" })).toBeVisible();
  await page.getByRole("button", { name: "2nd floor", exact: true }).click();
  await expect(page.getByRole("region", { name: "Choose nearby rooms" })).toHaveCount(0);
  await expect(page).toHaveURL(/etage=2OG&lang=en/);
});

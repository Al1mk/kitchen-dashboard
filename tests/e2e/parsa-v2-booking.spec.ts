import { randomBytes } from "node:crypto";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { loginViaApi } from "./helpers.ts";

// AP-02 / AP-03 independent E2E regressions. Cancellation credentials are
// NEVER printed, logged or included in screenshots/traces/videos.
test.use({ trace: "off", screenshot: "off", video: "off" });

const berlinDate = (days: number) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date(Date.now() + days * 86_400_000));

async function testRoom(request: APIRequestContext, baseURL: string) {
  const origin = await loginViaApi(request, baseURL);
  const response = await request.post("/api/admin/rooms", {
    headers: { ...origin, "Content-Type": "application/json" },
    data: {
      code: `PARSA-${randomBytes(3).toString("hex").toUpperCase()}`,
      name: "Raum für V2-Test",
      nameEn: "Room for V2 test",
      floorId: "1OG",
      type: "study",
      description: "",
      reservable: true,
    },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).room as { id: string; code: string };
}

async function book(page: Page, roomId: string) {
  await page.goto(`/booking?raum=${roomId}&datum=${berlinDate(4)}&lang=en`);
  await page.getByRole("button", { name: "10:00", exact: true }).click();
  await page.getByRole("button", { name: "Review booking" }).click();
  const review = page.getByRole("heading", { name: "Check your booking" });
  await expect(review).toBeInViewport();
  await page.getByRole("button", { name: "Confirm demo booking" }).click();
  const receipt = page.getByTestId("booking-receipt");
  await expect(receipt).toBeInViewport();
  return receipt;
}

test("AP-02: receipt requires credential acknowledgement, warns on exit and preserves DE/EN switch", async ({ page, request, baseURL }) => {
  const room = await testRoom(request, baseURL!);
  const receipt = await book(page, room.id);
  await expect(receipt.getByRole("button", { name: "Done" })).toBeDisabled();

  await page.getByRole("navigation", { name: "Campus information" }).getByRole("link", { name: "Home" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("Leave this receipt?");
  await dialog.getByRole("button", { name: "Stay here" }).click();
  await expect(dialog).toBeHidden();
  await expect(receipt).toBeVisible();

  await page.getByRole("link", { name: "Deutsch" }).click();
  await expect(receipt.getByRole("heading", { name: "Reservierung gespeichert" })).toBeVisible();
  await expect(receipt.getByRole("button", { name: "Fertig" })).toBeDisabled();
  await receipt.getByLabel("Ich habe Buchungsnummer und Stornierungscode gesichert.").check();
  await receipt.getByRole("button", { name: "Fertig" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId("receipt-code")).toHaveCount(0);
});

test("AP-02: cancellation form offers a user-controlled show/hide code action", async ({ page }) => {
  await page.goto("/booking/cancel?lang=en");
  const code = page.getByLabel("Cancellation code");
  await expect(code).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Show code" }).click();
  await expect(code).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Hide code" }).click();
  await expect(code).toHaveAttribute("type", "password");
});

test("AP-03: room schedule opens booking with stable room id, day and language", async ({ page }) => {
  // The project E2E fixture includes this bookable demo room.
  const roomId = "lcc-demo-room-k1-120";
  const date = berlinDate(4);
  await page.goto(`/schedule?raum=${roomId}&datum=${date}&lang=en`);
  const cta = page.getByRole("link", { name: "Book this room (demo)" });
  await expect(cta).toHaveAttribute("href", `/booking?raum=${roomId}&datum=${date}&lang=en`);
  await cta.click();
  await expect(page).toHaveURL(new RegExp(`/booking\\?raum=${roomId}&datum=${date}&lang=en`));
  await expect(page.getByLabel("1. Choose a room")).toHaveValue(roomId);
});


test("AP-02: last-15-seconds warning and More time protect the temporary receipt", async ({ page, request, baseURL }) => {
  const room = await testRoom(request, baseURL!);
  await page.clock.install();
  const receipt = await book(page, room.id);
  await page.clock.fastForward(46_000);
  await expect(receipt.getByRole("alert")).toContainText("Only 15 seconds left");
  await receipt.getByRole("button", { name: "More time" }).click();
  await expect(receipt.getByRole("alert")).toHaveCount(0);
  await expect(receipt.getByTestId("receipt-countdown")).toHaveText("This receipt will be hidden in 60 seconds.");
  // Auto-expiry is intentionally retained for public-kiosk privacy.
  await page.clock.fastForward(61_000);
  await expect(page.getByTestId("receipt-code")).toHaveCount(0);
  await expect(page).toHaveURL(/\?lang=en$/);
});

test("AP-03: past dates never offer direct booking from the room schedule", async ({ page }) => {
  const roomId = "lcc-demo-room-k1-120";
  await page.goto(`/schedule?raum=${roomId}&datum=${berlinDate(-2)}&lang=en`);
  await expect(page.getByRole("link", { name: "Book this room (demo)" })).toHaveCount(0);
});

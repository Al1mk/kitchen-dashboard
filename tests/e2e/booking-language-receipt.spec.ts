import { randomBytes } from "node:crypto";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { loginViaApi } from "./helpers.ts";

// T13: receipt countdown / More time / Done, no stale receipt after leaving,
// and public cancellation states. The receipt shows a cancellation code, so
// traces, videos and screenshots are off and no value is ever printed.
test.use({ trace: "off", video: "off", screenshot: "off" });

const berlinDate = (days: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date(Date.now() + days * 86_400_000));

async function room(request: APIRequestContext, baseURL: string) {
  const origin = await loginViaApi(request, baseURL);
  const res = await request.post("/api/admin/rooms", {
    headers: { ...origin, "Content-Type": "application/json" },
    data: { code: `RCPT-${randomBytes(3).toString("hex").toUpperCase()}`, name: "Belegraum", nameEn: "Receipt room", floorId: "1OG", type: "study", description: "", reservable: true },
  });
  return (await res.json()).room as { id: string; code: string };
}

async function book(page: Page, roomId: string, lang: "de" | "en", start = "10:00") {
  await page.goto(`/booking?raum=${roomId}&datum=${berlinDate(4)}${lang === "en" ? "&lang=en" : ""}`);
  await page.getByRole("button", { name: start, exact: true }).click();
  await page.getByRole("button", { name: lang === "en" ? "Review booking" : "Weiter zur Bestätigung" }).click();
  await page.getByRole("button", { name: lang === "en" ? "Confirm demo booking" : "Demo-Reservierung bestätigen" }).click();
  const receipt = page.getByTestId("booking-receipt");
  await expect(receipt).toBeVisible();
  return {
    receipt,
    id: ((await receipt.getByTestId("receipt-id").textContent()) ?? "").trim(),
    code: ((await receipt.getByTestId("receipt-code").textContent()) ?? "").trim(),
  };
}

test("English receipt: localized room name, countdown, More time, expiry returns Home in English", async ({ page, request, baseURL }) => {
  const r = await room(request, baseURL!);
  await page.clock.install();
  const { receipt } = await book(page, r.id, "en");
  await expect(receipt).toContainText("Booking saved");
  await expect(receipt).toContainText("Receipt room");
  await expect(receipt).not.toContainText("Belegraum");
  await expect(receipt.getByTestId("receipt-countdown")).toHaveText("This receipt will be hidden in 60 seconds.");
  await page.clock.fastForward(45_000);
  await expect(receipt.getByTestId("receipt-countdown")).toHaveText("This receipt will be hidden in 15 seconds.");
  await receipt.getByRole("button", { name: "More time" }).click();
  await expect(receipt.getByTestId("receipt-countdown")).toHaveText("This receipt will be hidden in 60 seconds.");
  await page.clock.fastForward(61_000);
  await expect(page).toHaveURL(/\/\?lang=en$/);
  await expect(page.getByTestId("booking-receipt")).toHaveCount(0);
});

test("Done clears the receipt; going back does not reveal it again", async ({ page, request, baseURL }) => {
  const r = await room(request, baseURL!);
  const { receipt } = await book(page, r.id, "de", "11:00");
  await receipt.getByRole("button", { name: "Fertig" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/booking/);
  await expect(page.getByTestId("booking-receipt")).toHaveCount(0);
  await expect(page.getByTestId("receipt-code")).toHaveCount(0);
});

test("public cancellation: malformed, wrong and right credentials, repeated cancellation", async ({ page, request, baseURL }) => {
  const r = await room(request, baseURL!);
  const { id, code } = await book(page, r.id, "en", "12:00");
  await page.goto("/booking/cancel?lang=en");
  const idField = page.getByLabel("Booking ID");
  const codeField = page.getByLabel("Cancellation code");
  const go = page.getByRole("button", { name: "Confirm cancellation" });

  await idField.fill("not-an-id");
  await codeField.fill(code);
  await go.click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("The booking ID does not have the right format. Please check it.");

  await idField.fill(id);
  await codeField.fill("short");
  await go.click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("The cancellation code does not have the right format. Please check it.");

  await codeField.fill(randomBytes(32).toString("base64url"));
  await go.click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("ID and code do not match any booking. Please check both.");
  await expect(idField).toHaveValue(id); // kept for correction

  await codeField.fill(code);
  await go.click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("The booking has been cancelled.");
  const admin = await (await request.get(`/api/admin/bookings?from=${berlinDate(4)}&days=1&roomId=${r.id}`)).json();
  expect(admin.bookings[0].status).toBe("cancelled");

  // Repeating the cancellation is harmless.
  await page.goto("/booking/cancel");
  await page.getByLabel("Buchungsnummer").fill(id);
  await page.getByLabel("Stornierungscode").fill(code);
  await page.getByRole("button", { name: "Stornierung bestätigen" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("Die Reservierung wurde storniert.");
});

import { randomBytes } from "node:crypto";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { loginViaApi } from "./helpers.ts";

// T13: receipt countdown / More time / Done, no stale receipt after leaving,
// and public cancellation states. The receipt shows a cancellation code, so
// traces, videos and screenshots are off and no value is ever printed.
test.use({ trace: "off", video: "off", screenshot: "off" });

const berlinDate = (days: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date(Date.now() + days * 86_400_000));

async function room(request: APIRequestContext, baseURL: string, english: string | null = "Receipt room") {
  const origin = await loginViaApi(request, baseURL);
  const res = await request.post("/api/admin/rooms", {
    headers: { ...origin, "Content-Type": "application/json" },
    data: { code: `RCPT-${randomBytes(3).toString("hex").toUpperCase()}`, name: "Belegraum", ...(english ? { nameEn: english } : {}), floorId: "1OG", type: "study", description: "", reservable: true },
  });
  expect(res.status()).toBe(201);
  return (await res.json()).room as { id: string; code: string };
}

/** Counts booking submissions so a language switch can be shown not to send anything. */
function countBookingPosts(page: Page) {
  const counter = { posts: 0 };
  page.on("request", (r) => {
    if (r.method() === "POST" && new URL(r.url()).pathname === "/api/public/bookings") counter.posts++;
  });
  return counter;
}

const switchTo = async (page: Page, lang: "de" | "en") => {
  await page.getByRole("link", { name: lang === "en" ? "English" : "Deutsch", exact: true }).click();
  await expect(page).toHaveURL(lang === "en" ? /lang=en/ : /^(?!.*lang=en)/);
};

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
  await expect(receipt.getByRole("heading", { name: "Booking saved" })).toBeVisible();
  await expect(receipt.getByTestId("receipt-room")).toContainText("Receipt room");
  await expect(receipt.getByTestId("receipt-room")).not.toContainText("Belegraum");
  await expect(receipt.getByTestId("receipt-countdown")).toHaveText("This receipt will be hidden in 60 seconds.");
  await page.clock.fastForward(45_000);
  await expect(receipt.getByTestId("receipt-countdown")).toHaveText("This receipt will be hidden in 15 seconds.");
  await receipt.getByRole("button", { name: "More time" }).click();
  await expect(receipt.getByTestId("receipt-countdown")).toHaveText("This receipt will be hidden in 60 seconds.");
  await page.clock.fastForward(61_000);
  await expect(page).toHaveURL(/\/\?lang=en$/);
  await expect(page.getByTestId("booking-receipt")).toHaveCount(0);
});

test("V1-R002: a settled receipt follows DE → EN → DE without resending, resetting or changing its identity", async ({ page, request, baseURL }) => {
  const r = await room(request, baseURL!);
  const posts = countBookingPosts(page);
  await page.clock.install();
  const { receipt, id, code } = await book(page, r.id, "de", "13:00");
  // receipt-room holds no credential, so a failing assertion never prints the code.
  const nameEl = receipt.getByTestId("receipt-room").locator("span[lang]");
  const sameCredentials = async () =>
    ((await receipt.getByTestId("receipt-id").textContent()) ?? "").trim() === id && ((await receipt.getByTestId("receipt-code").textContent()) ?? "").trim() === code;

  await expect(receipt.getByRole("heading", { name: "Reservierung gespeichert" })).toBeVisible();
  await expect(nameEl).toHaveText("Belegraum");
  await expect(nameEl).toHaveAttribute("lang", "de");
  await page.clock.fastForward(20_000);
  await expect(receipt.getByTestId("receipt-countdown")).toHaveText("Dieser Beleg wird in 40 Sekunden ausgeblendet.");

  await switchTo(page, "en");
  await expect(receipt.getByRole("heading", { name: "Booking saved" })).toBeVisible();
  await expect(nameEl).toHaveText("Receipt room");
  await expect(nameEl).toHaveAttribute("lang", "en");
  await expect(receipt.getByTestId("receipt-room")).not.toContainText("Belegraum");
  await expect(receipt.getByTestId("receipt-room")).not.toContainText("Only in German");
  await expect(receipt.getByTestId("receipt-room")).toContainText(r.code);
  await expect(receipt.getByTestId("receipt-when")).toContainText("13:00–14:00");
  expect(await sameCredentials(), "booking ID and code unchanged after switching").toBe(true);
  // The countdown continues; it is not reset or extended by the switch.
  await expect(receipt.getByTestId("receipt-countdown")).toHaveText(/This receipt will be hidden in (40|39) seconds\./);

  await page.clock.fastForward(10_000);
  await switchTo(page, "de");
  await expect(receipt.getByRole("heading", { name: "Reservierung gespeichert" })).toBeVisible();
  await expect(nameEl).toHaveText("Belegraum");
  await expect(receipt.getByTestId("receipt-room")).not.toContainText("Receipt room");
  await expect(receipt.getByTestId("receipt-room")).not.toContainText("Nur auf Deutsch");
  expect(await sameCredentials(), "booking ID and code unchanged after switching back").toBe(true);
  await expect(receipt.getByTestId("receipt-countdown")).toHaveText(/Dieser Beleg wird in (30|29) Sekunden ausgeblendet\./);
  expect(posts.posts, "language switches sent no booking request").toBe(1);

  // More time and expiry keep their behaviour; expiry goes to Start in the current language.
  await receipt.getByRole("button", { name: "Mehr Zeit" }).click();
  await expect(receipt.getByTestId("receipt-countdown")).toHaveText("Dieser Beleg wird in 60 Sekunden ausgeblendet.");
  await switchTo(page, "en");
  await page.clock.fastForward(61_000);
  await expect(page).toHaveURL(/\/\?lang=en$/);
  await expect(page.getByTestId("booking-receipt")).toHaveCount(0);
  expect(posts.posts).toBe(1);
  const admin = await (await request.get(`/api/admin/bookings?from=${berlinDate(4)}&days=1&roomId=${r.id}`)).json();
  expect(admin.bookings).toEqual([expect.objectContaining({ id, status: "confirmed" })]);
});

test("V1-R002: a room without an English name shows the German fallback marker only in English", async ({ page, request, baseURL }) => {
  const r = await room(request, baseURL!, null);
  const { receipt } = await book(page, r.id, "en", "14:00");
  // receipt-room holds no credential, so a failing assertion never prints the code.
  const nameEl = receipt.getByTestId("receipt-room").locator("span[lang]");
  await expect(receipt.getByRole("heading", { name: "Booking saved" })).toBeVisible();
  await expect(nameEl).toHaveText("Belegraum");
  await expect(nameEl).toHaveAttribute("lang", "de");
  await expect(receipt.getByTestId("receipt-room")).toContainText("Only in German");

  await switchTo(page, "de");
  await expect(receipt.getByRole("heading", { name: "Reservierung gespeichert" })).toBeVisible();
  await expect(nameEl).toHaveText("Belegraum");
  await expect(receipt.getByTestId("receipt-room")).not.toContainText("Nur auf Deutsch");
  await expect(receipt.getByTestId("receipt-room")).not.toContainText("Only in German");

  await switchTo(page, "en");
  await expect(receipt.getByTestId("receipt-room")).toContainText("Only in German");
});

test("Done clears the receipt; going back does not reveal it again", async ({ page, request, baseURL }) => {
  const r = await room(request, baseURL!);
  const { receipt } = await book(page, r.id, "de", "11:00");
  await expect(receipt.getByRole("button", { name: "Fertig" })).toBeDisabled();
  await receipt.getByLabel("Ich habe Buchungsnummer und Stornierungscode gesichert.").check();
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

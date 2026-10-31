import { randomBytes } from "node:crypto";
import { expect, test } from "@playwright/test";
import { loginViaApi, loginViaUi } from "./helpers.ts";

// T14: Katja resolves a booking conflict through the admin UI. The booking is
// created through the public API; its cancellation code never appears here.
test.use({ trace: "off" });

const berlinDate = (days: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date(Date.now() + days * 86_400_000));

test("a class blocked by a booking links to the list; after explicit cancellation the retry succeeds", async ({ page, request, baseURL, context }) => {
  const origin = await loginViaApi(request, baseURL!);
  const json = { ...origin, "Content-Type": "application/json" };
  const code = `ADMB-${randomBytes(3).toString("hex").toUpperCase()}`;
  const room = (await (await request.post("/api/admin/rooms", { headers: json, data: { code, name: "Konfliktraum", floorId: "2OG", type: "seminar", description: "", reservable: true } })).json()).room;
  const date = berlinDate(5);
  const token = randomBytes(32).toString("base64url");
  const created = await request.post("/api/public/bookings", {
    headers: json,
    data: { roomId: room.id, date, startTime: "14:00", endTime: "15:00", requestId: randomBytes(16).toString("base64url"), cancelToken: token },
  });
  expect(created.status()).toBe(201);

  await loginViaUi(page);
  await page.goto(`/admin/schedule/new?datum=${date}&raum=${room.id}`);
  await page.getByRole("textbox", { name: "Lehrveranstaltung / Modul" }).fill("Konflikt-Vorlesung");
  await page.getByRole("textbox", { name: "Lehrperson" }).fill("Testperson");
  await page.getByRole("textbox", { name: "Studiengang / Semester" }).fill("Testkohorte");
  await page.getByLabel("Beginn").fill("14:30");
  await page.getByLabel("Ende").fill("16:00");
  await page.getByRole("button", { name: "Termin anlegen" }).click();
  await expect(page.getByRole("alert").first()).toContainText("Demo-Reservierung");
  const listLink = page.getByRole("link", { name: /Reservierungen für diesen Raum und Tag ansehen/ });
  await expect(listLink).toHaveAttribute("href", `/admin/bookings?von=${date}&raum=${room.id}`);

  // The list opens in a new tab; the class form keeps its input.
  const [list] = await Promise.all([context.waitForEvent("page"), listLink.click()]);
  await list.waitForLoadState();
  await expect(list.getByRole("heading", { name: "Reservierungen" })).toBeVisible();
  const row = list.getByRole("row").filter({ hasText: code });
  await expect(row).toContainText("14:00–15:00 Uhr");
  await expect(row).toContainText("Bestätigt");
  expect(await list.content()).not.toContain(token);
  await row.getByRole("button", { name: "Stornieren" }).click();
  await list.getByRole("dialog").getByRole("button", { name: "Ja, stornieren" }).click();
  await expect(list.getByRole("row").filter({ hasText: code })).toContainText("Storniert");

  await expect(page.getByRole("textbox", { name: "Lehrveranstaltung / Modul" })).toHaveValue("Konflikt-Vorlesung");
  await page.getByRole("button", { name: "Termin anlegen" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Termin angelegt" })).toBeVisible();
});

test("a stale list handles a booking that was cancelled meanwhile; anonymous access is refused", async ({ page, request, baseURL, browser }) => {
  const origin = await loginViaApi(request, baseURL!);
  const json = { ...origin, "Content-Type": "application/json" };
  const code = `ADMS-${randomBytes(3).toString("hex").toUpperCase()}`;
  const room = (await (await request.post("/api/admin/rooms", { headers: json, data: { code, name: "Stale", floorId: "1OG", type: "study", description: "", reservable: true } })).json()).room;
  const date = berlinDate(6);
  const booking = (await (await request.post("/api/public/bookings", {
    headers: json,
    data: { roomId: room.id, date, startTime: "09:00", endTime: "10:00", requestId: randomBytes(16).toString("base64url"), cancelToken: randomBytes(32).toString("base64url") },
  })).json()).booking;

  await loginViaUi(page);
  await page.goto(`/admin/bookings?von=${date}&raum=${room.id}`);
  const row = page.getByRole("row").filter({ hasText: code });
  await expect(row).toContainText("Bestätigt");
  // Cancelled elsewhere in the meantime.
  expect((await request.post(`/api/admin/bookings/${booking.id}/cancel`, { headers: origin })).status()).toBe(200);
  await row.getByRole("button", { name: "Stornieren" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Ja, stornieren" }).click();
  await expect(page.getByRole("row").filter({ hasText: code })).toContainText("Storniert");

  const anonymous = await browser.newContext();
  const anon = await anonymous.newPage();
  await anon.goto("/admin/bookings");
  await expect(anon).toHaveURL(/\/admin\/login/);
  expect((await anon.request.get("/api/admin/bookings")).status()).toBe(401);
  expect((await anon.request.post(`/api/admin/bookings/${booking.id}/cancel`)).status()).toBe(401);
  await anonymous.close();
});

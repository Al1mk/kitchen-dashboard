import { randomBytes } from "node:crypto";
import { expect, test, type APIRequestContext, type Page, type Route } from "@playwright/test";
import { loginViaApi } from "./helpers.ts";

// T08 (audit A-01): the submitted booking request and its credentials must
// survive UI changes while the request is pending or its outcome is unknown.
// Cancellation codes appear on screen: no traces, videos or screenshots, and
// the test never prints a credential value.
test.use({ trace: "off", video: "off", screenshot: "off" });

const berlinDate = (days: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date(Date.now() + days * 86_400_000));
const DATE = berlinDate(2);

async function reservableRoom(request: APIRequestContext, baseURL: string) {
  const origin = await loginViaApi(request, baseURL);
  const code = `PEND-${randomBytes(3).toString("hex").toUpperCase()}`;
  const res = await request.post("/api/admin/rooms", {
    headers: { ...origin, "Content-Type": "application/json" },
    data: { code, name: "Wartetest-Raum", floorId: "1OG", type: "seminar", description: "", reservable: true },
  });
  expect(res.status()).toBe(201);
  return { room: (await res.json()).room as { id: string; code: string }, origin };
}

async function bookingsFor(request: APIRequestContext, roomId: string) {
  const res = await request.get(`/api/admin/bookings?from=${DATE}&days=1&roomId=${encodeURIComponent(roomId)}`);
  expect(res.status()).toBe(200);
  return (await res.json()).bookings as { id: string; status: string; startsAt: string }[];
}

/** Holds the server's (already accepted) answer until release() is called. */
async function holdBookingResponse(page: Page) {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  const bodies: { cancelToken: string; requestId: string; startTime: string; endTime: string }[] = [];
  await page.route("**/api/public/bookings", async (route: Route) => {
    bodies.push(route.request().postDataJSON());
    const response = await route.fetch(); // the server receives and stores the booking now
    await gate;
    await route.fulfill({ response });
  });
  return { release, bodies };
}

async function chooseSlotAndReview(page: Page, roomId: string) {
  await page.goto(`/booking?raum=${encodeURIComponent(roomId)}&datum=${DATE}`);
  await page.getByRole("button", { name: "10:00", exact: true }).click();
  await page.getByRole("button", { name: "Weiter zur Bestätigung" }).click();
}

test("A-01: a delayed accepted response still produces the receipt for the submitted request", async ({ page, request, baseURL }) => {
  const { room } = await reservableRoom(request, baseURL!);
  const held = await holdBookingResponse(page);
  await chooseSlotAndReview(page, room.id);
  await page.getByRole("button", { name: "Demo-Reservierung bestätigen" }).click();
  await expect.poll(() => held.bodies.length).toBe(1);

  // While pending, the selection is locked ...
  await expect.soft(page.getByLabel("3. Dauer")).toBeDisabled();
  await expect.soft(page.getByLabel("1. Raum auswählen")).toBeDisabled();
  // ... and even a forced change must not alter or destroy the submitted request.
  await page.getByLabel("3. Dauer").selectOption("30", { force: true, timeout: 2000 }).catch(() => {});
  held.release();

  // Audit symptom of A-01: the old component showed a JavaScript null-reference message instead of a receipt.
  const receipt = page.getByTestId("booking-receipt");
  await expect(receipt.or(page.getByRole("alert").filter({ hasText: /\S/ })).first()).toBeVisible();
  await expect.soft(page.getByText(/Cannot read properties of null/)).toHaveCount(0);
  await expect(receipt).toBeVisible();
  await expect(receipt.getByTestId("receipt-room")).toContainText(room.code);
  await expect(receipt.getByTestId("receipt-when")).toContainText("10:00–11:00");
  const code = (await receipt.getByTestId("receipt-code").textContent())?.trim() ?? "";
  // The code shown is exactly the one that was submitted (compared, not printed).
  expect(code === held.bodies[0].cancelToken, "receipt code equals submitted cancel token").toBe(true);
  const stored = await bookingsFor(request, room.id);
  expect(stored).toHaveLength(1);
  expect(stored[0].status).toBe("confirmed");
});

test("navigation while pending asks first; staying keeps the request and its receipt", async ({ page, request, baseURL }) => {
  const { room } = await reservableRoom(request, baseURL!);
  const held = await holdBookingResponse(page);
  await chooseSlotAndReview(page, room.id);
  await page.getByRole("button", { name: "Demo-Reservierung bestätigen" }).click();
  await expect.poll(() => held.bodies.length).toBe(1);

  for (const link of [
    page.getByRole("navigation", { name: "Campus-Informationen" }).getByRole("link", { name: "Start" }),
    page.getByRole("link", { name: "English" }),
  ]) {
    await link.click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("Buchungsnummer und Stornierungscode");
    await dialog.getByRole("button", { name: "Hierbleiben" }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/booking/);
  }
  held.release();
  await expect(page.getByTestId("booking-receipt")).toBeVisible();
  expect(await bookingsFor(request, room.id)).toHaveLength(1);
});

test("deliberate abandonment warns that the booking may exist, then leaves", async ({ page, request, baseURL }) => {
  const { room } = await reservableRoom(request, baseURL!);
  const held = await holdBookingResponse(page);
  await chooseSlotAndReview(page, room.id);
  await page.getByRole("button", { name: "Demo-Reservierung bestätigen" }).click();
  await expect.poll(() => held.bodies.length).toBe(1);

  await page.getByRole("navigation", { name: "Campus-Informationen" }).getByRole("link", { name: "Räume" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("kann sie trotzdem bestehen");
  await dialog.getByRole("button", { name: "Trotzdem verlassen" }).click();
  await expect(page).toHaveURL(/\/rooms/);
  held.release();
  // The warning was true: the server had stored the booking.
  expect(await bookingsFor(request, room.id)).toHaveLength(1);
});

test("an uncertain outcome is retried with the identical request and never creates a second booking", async ({ page, request, baseURL }) => {
  const { room } = await reservableRoom(request, baseURL!);
  const bodies: { cancelToken: string; requestId: string; roomId: string; startTime: string; endTime: string; date: string }[] = [];
  let first = true;
  await page.route("**/api/public/bookings", async (route) => {
    bodies.push(route.request().postDataJSON());
    if (first) {
      first = false;
      await route.fetch(); // accepted by the server ...
      await route.abort("failed"); // ... but the answer is lost
      return;
    }
    await route.continue();
  });
  await chooseSlotAndReview(page, room.id);
  await page.getByRole("button", { name: "Demo-Reservierung bestätigen" }).click();
  const uncertain = page.getByRole("alert").filter({ hasText: "nicht bestätigen" });
  await expect(uncertain).toBeVisible();
  await expect(page.getByTestId("booking-receipt")).toHaveCount(0);
  await expect(page.getByLabel("3. Dauer")).toBeDisabled();

  await page.getByRole("button", { name: "Erneut senden" }).click();
  await expect(page.getByTestId("booking-receipt")).toBeVisible();
  // Confirmed replay (V1-R001 regression guard): still the normal saved receipt.
  await expect(page.getByTestId("booking-receipt")).toHaveAttribute("data-status", "confirmed");
  await expect(page.getByRole("heading", { name: "Reservierung gespeichert" })).toBeVisible();
  expect(bodies).toHaveLength(2);
  const same = ["cancelToken", "requestId", "roomId", "date", "startTime", "endTime"].every(
    (k) => bodies[0][k as keyof (typeof bodies)[0]] === bodies[1][k as keyof (typeof bodies)[0]],
  );
  expect(same, "retry repeats the identical request and credentials").toBe(true);
  const stored = await bookingsFor(request, room.id);
  expect(stored).toHaveLength(1);
  expect(stored[0].status).toBe("confirmed");
});

test("V1-R001: accepted, response lost, cancelled by Katja, identical retry → shown as cancelled, nothing re-created", async ({ page, request, baseURL }) => {
  const { room, origin } = await reservableRoom(request, baseURL!);
  const bodies: Record<string, string>[] = [];
  const answers: { id: string; status: string; replayed: boolean }[] = [];
  await page.route("**/api/public/bookings", async (route) => {
    bodies.push(route.request().postDataJSON());
    const response = await route.fetch(); // the server really handles every attempt
    const payload = await response.json();
    answers.push({ id: payload.booking?.id, status: payload.booking?.status, replayed: payload.replayed });
    if (answers.length === 1) await route.abort("failed"); // accepted, but the answer is lost
    else await route.fulfill({ response });
  });
  await chooseSlotAndReview(page, room.id);
  await page.getByRole("button", { name: "Demo-Reservierung bestätigen" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "nicht bestätigen" })).toBeVisible();
  expect(answers[0]).toMatchObject({ status: "confirmed", replayed: false });

  // Katja cancels the stored booking in the admin API while the visitor still sees "unclear".
  const cancelled = await request.post(`/api/admin/bookings/${answers[0].id}/cancel`, { headers: origin });
  expect(cancelled.status()).toBe(200);
  expect((await cancelled.json()).booking.status).toBe("cancelled");

  await page.getByRole("button", { name: "Erneut senden" }).click();
  const receipt = page.getByTestId("booking-receipt");
  await expect(receipt).toBeVisible();
  // The API replayed the same, now cancelled booking ...
  expect(answers).toHaveLength(2);
  expect(answers[1]).toMatchObject({ id: answers[0].id, status: "cancelled", replayed: true });
  const same = ["cancelToken", "requestId", "roomId", "date", "startTime", "endTime"].every((k) => bodies[0][k] === bodies[1][k]);
  expect(same, "retry repeats the identical request and credentials").toBe(true);
  // ... and the visitor is told so: no active-success claim, no code to note down.
  await expect(receipt).toHaveAttribute("data-status", "cancelled");
  await expect(receipt.getByRole("heading", { name: "Diese Reservierung ist storniert" })).toBeVisible();
  await expect(receipt.getByRole("status")).toContainText("Sie ist nicht aktiv, und es wurde keine neue Reservierung angelegt.");
  await expect(receipt.getByRole("heading", { name: /gespeichert/ })).toHaveCount(0);
  await expect(receipt.getByTestId("receipt-code")).toHaveCount(0);
  await expect(receipt.getByTestId("receipt-id")).toHaveText(answers[0].id);
  await expect(receipt.getByTestId("receipt-when")).toContainText("10:00–11:00");

  // Same settled state in English (V1-R002 applies to it too); switching sends nothing.
  await page.getByRole("link", { name: "English", exact: true }).click();
  await expect(page).toHaveURL(/lang=en/);
  await expect(receipt.getByRole("heading", { name: "This booking is cancelled" })).toBeVisible();
  await expect(receipt.getByRole("status")).toContainText("It is not active, and no new booking was created.");
  await expect(receipt.getByRole("heading", { name: /Booking saved/ })).toHaveCount(0);
  await expect(receipt.getByTestId("receipt-id")).toHaveText(answers[0].id);
  expect(bodies).toHaveLength(2);

  // Database: one record, cancelled; no active replacement; the slot is free again.
  const stored = await bookingsFor(request, room.id);
  expect(stored).toEqual([expect.objectContaining({ id: answers[0].id, status: "cancelled" })]);
  const avail = await (await request.get(`/api/public/availability?roomId=${encodeURIComponent(room.id)}&date=${DATE}`)).json();
  expect(avail.busy).toEqual([]);
});

test("V1-R001: an unknown booking state in a successful answer stays recoverable with the same request", async ({ page, request, baseURL }) => {
  const { room } = await reservableRoom(request, baseURL!);
  const bodies: Record<string, string>[] = [];
  await page.route("**/api/public/bookings", async (route) => {
    bodies.push(route.request().postDataJSON());
    const response = await route.fetch();
    if (bodies.length === 1) {
      const payload = await response.json();
      await route.fulfill({ response, json: { ...payload, booking: { ...payload.booking, status: "unexpected" } } });
    } else await route.fulfill({ response });
  });
  await chooseSlotAndReview(page, room.id);
  await page.getByRole("button", { name: "Demo-Reservierung bestätigen" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "nicht bestätigen" })).toBeVisible();
  await expect(page.getByTestId("booking-receipt")).toHaveCount(0);
  await page.getByRole("button", { name: "Erneut senden" }).click();
  await expect(page.getByTestId("booking-receipt")).toHaveAttribute("data-status", "confirmed");
  expect(bodies).toHaveLength(2);
  expect(bodies[0].requestId === bodies[1].requestId && bodies[0].cancelToken === bodies[1].cancelToken, "same request retried").toBe(true);
  expect(await bookingsFor(request, room.id)).toHaveLength(1);
});

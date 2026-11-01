import { randomBytes } from "node:crypto";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { loginViaApi } from "./helpers.ts";

// T09 (audit A-02): an explicitly requested room is never silently replaced,
// and availability always belongs to the current room and date.
test.use({ trace: "off", video: "off" });

const berlinDate = (days: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date(Date.now() + days * 86_400_000));

async function room(request: APIRequestContext, baseURL: string, overrides: Record<string, unknown> = {}) {
  const origin = await loginViaApi(request, baseURL);
  const code = `SEL-${randomBytes(3).toString("hex").toUpperCase()}`;
  const res = await request.post("/api/admin/rooms", {
    headers: { ...origin, "Content-Type": "application/json" },
    data: { code, name: "Auswahltest", floorId: "2OG", type: "seminar", description: "", reservable: true, ...overrides },
  });
  expect(res.status()).toBe(201);
  return { ...(await res.json()).room as { id: string; code: string }, origin };
}

const roomSelect = (page: import("@playwright/test").Page) => page.getByLabel("1. Raum auswählen");

test("unknown, archived and non-reservable requested rooms are explained and never replaced", async ({ page, request, baseURL }) => {
  await room(request, baseURL!); // at least one bookable room exists, so a silent fallback would be possible
  const hidden = await room(request, baseURL!, { reservable: false });
  const archived = await room(request, baseURL!);
  expect((await request.post(`/api/admin/rooms/${archived.id}/archive`, { headers: archived.origin })).status()).toBe(200);

  for (const id of ["missing-room-id", hidden.id, archived.id]) {
    await page.goto(`/booking?raum=${encodeURIComponent(id)}`);
    await expect(page.getByRole("alert").filter({ hasText: "Es wurde kein anderer Raum ausgewählt" })).toBeVisible();
    await expect(roomSelect(page)).toHaveValue("");
    await expect(page.getByRole("button", { name: "Weiter zur Bestätigung" })).toBeDisabled();
    await expect(page.getByText("Wähle zuerst einen Raum.")).toBeVisible();
  }
});

test("no query: the visitor chooses a room deliberately", async ({ page, request, baseURL }) => {
  const r = await room(request, baseURL!);
  await page.goto(`/booking?datum=${berlinDate(1)}`); // no room query
  await expect(roomSelect(page)).toHaveValue("");
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
  await roomSelect(page).selectOption(r.id);
  await expect(page).toHaveURL(new RegExp(`raum=${r.id}`));
  await expect(page.getByRole("button", { name: "08:00", exact: true })).toBeVisible();
});

test("a late availability answer for the previous room is ignored", async ({ page, request, baseURL }) => {
  const a = await room(request, baseURL!);
  const b = await room(request, baseURL!);
  const date = berlinDate(3);
  // Occupy 08:00–09:00 in room B so the two answers are distinguishable.
  const origin = await loginViaApi(request, baseURL!);
  expect((await request.post("/api/admin/sessions", {
    headers: { ...origin, "Content-Type": "application/json" },
    data: { title: "Belegt", instructor: "Test", cohort: "Test", term: "WS 2026/27", roomId: b.id, date, startTime: "08:00", endTime: "09:00" },
  })).status()).toBe(201);

  let releaseA!: () => void;
  const gateA = new Promise<void>((r) => (releaseA = r));
  await page.route("**/api/public/availability?*", async (route) => {
    const response = await route.fetch();
    if (new URL(route.request().url()).searchParams.get("roomId") === a.id) await gateA;
    await route.fulfill({ response });
  });
  await page.goto(`/booking?raum=${a.id}&datum=${date}`);
  await roomSelect(page).selectOption(b.id); // switch before A's answer arrives
  await expect(page.getByText("Belegte Zeiten")).toBeVisible();
  releaseA();
  await page.waitForTimeout(500);
  // Still room B's data: 08:00 is busy there, so no 08:00 start button.
  await expect(roomSelect(page)).toHaveValue(b.id);
  await expect(page.getByRole("button", { name: "08:00", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "09:00", exact: true })).toBeVisible();
});

test("availability failure shows a retry and blocks confirmation until it recovers", async ({ page, request, baseURL }) => {
  const r = await room(request, baseURL!);
  let fail = true;
  await page.route("**/api/public/availability?*", (route) => (fail ? route.abort("failed") : route.continue()));
  await page.goto(`/booking?raum=${r.id}&datum=${berlinDate(1)}`);
  await expect(page.getByRole("alert").filter({ hasText: "Die freien Zeiten können gerade nicht geladen werden." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Weiter zur Bestätigung" })).toBeDisabled();
  fail = false;
  await page.getByRole("button", { name: "Erneut versuchen" }).click();
  await expect(page.getByRole("button", { name: "10:00", exact: true })).toBeVisible();
});

test("English mode translates API errors instead of showing German server text", async ({ page, request, baseURL }) => {
  const r = await room(request, baseURL!);
  await page.route("**/api/public/bookings", (route) =>
    route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ error: "time_conflict", message: "Der Zeitraum ist inzwischen belegt." }) }),
  );
  await page.goto(`/booking?raum=${r.id}&datum=${berlinDate(1)}&lang=en`);
  await page.getByRole("button", { name: "10:00", exact: true }).click();
  await page.getByRole("button", { name: "Review booking" }).click();
  await page.getByRole("button", { name: "Confirm demo booking" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "This time has just been taken" })).toBeVisible();
  await expect(page.getByText("Der Zeitraum ist inzwischen belegt")).toHaveCount(0);
});

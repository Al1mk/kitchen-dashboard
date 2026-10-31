import { randomBytes } from "node:crypto";
import { expect, test } from "@playwright/test";
import { loginViaApi } from "./helpers.ts";

// T10/T17: HTTP contract of the booking API on the real production server
// (docs/contracts.md C5, C6). Requests carry cancellation tokens, so no traces.
test.use({ trace: "off" });

const berlinDate = (daysFromNow: number) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date(Date.now() + daysFromNow * 86_400_000));
const secret = (bytes: number) => randomBytes(bytes).toString("base64url");
const stamp = () => Date.now().toString(36).slice(-6).toUpperCase();

test("booking create, retry, conflicts, admin guards and cancellation follow the contract", async ({ request, baseURL }) => {
  const origin = await loginViaApi(request, baseURL!);
  const json = { ...origin, "Content-Type": "application/json" };
  const code = `API-B${stamp()}`;
  const roomRes = await request.post("/api/admin/rooms", {
    headers: json,
    data: { code, name: "Buchungs-API-Raum", floorId: "1OG", type: "seminar", description: "", reservable: true },
  });
  expect(roomRes.status()).toBe(201);
  const room = (await roomRes.json()).room;
  const date = berlinDate(2);
  const token = secret(32);
  const body = { roomId: room.id, date, startTime: "10:00", endTime: "11:00", requestId: secret(16), cancelToken: token };

  // Cross-site and malformed requests.
  expect((await request.post("/api/public/bookings", { data: body })).status()).toBe(403);
  const malformed = await request.post("/api/public/bookings", { headers: json, data: { ...body, cancelToken: "short" } });
  expect(malformed.status()).toBe(400);
  expect(await malformed.json()).toMatchObject({ error: "validation", detail: "invalid_input" });
  const offGrid = await request.post("/api/public/bookings", { headers: json, data: { ...body, requestId: secret(16), startTime: "10:05" } });
  expect(offGrid.status()).toBe(400);
  expect(await offGrid.json()).toMatchObject({ error: "validation", detail: "grid" });

  // Create, then an exact retry returns the same booking without a second row.
  const created = await request.post("/api/public/bookings", { headers: json, data: body });
  expect(created.status()).toBe(201);
  const createdText = await created.text();
  expect(createdText).not.toContain(token);
  const booking = JSON.parse(createdText).booking;
  expect(booking).toMatchObject({ roomId: room.id, status: "confirmed", isDemo: true });
  expect(created.headers()["cache-control"]).toContain("no-store");
  const retry = await request.post("/api/public/bookings", { headers: json, data: body });
  expect(retry.status()).toBe(200);
  expect(await retry.json()).toMatchObject({ replayed: true, booking: { id: booking.id } });
  const reused = await request.post("/api/public/bookings", { headers: json, data: { ...body, endTime: "11:15" } });
  expect(reused.status()).toBe(409);
  expect((await reused.json()).error).toBe("request_id_reused");
  const overlap = await request.post("/api/public/bookings", { headers: json, data: { ...body, requestId: secret(16), cancelToken: secret(32), startTime: "10:30", endTime: "11:30" } });
  expect(overlap.status()).toBe(409);
  expect((await overlap.json()).error).toBe("time_conflict");

  // Availability shows the booking as busy and grid-aligned free spans around it.
  const avail = await request.get(`/api/public/availability?roomId=${encodeURIComponent(room.id)}&date=${date}`);
  expect(avail.status()).toBe(200);
  const a = await avail.json();
  expect(a.busy).toContainEqual({ startTime: "10:00", endTime: "11:00", kind: "booking" });
  expect(a.free).toContainEqual({ startTime: "08:00", endTime: "10:00" });
  expect(a.free).toContainEqual({ startTime: "11:00", endTime: "20:00" });

  // Katja's class over the booking is refused with a distinguishable code; nothing is cancelled.
  const classInput = { title: "API-Kurs", instructor: "Test", cohort: "Test", term: "WS 2026/27", roomId: room.id, date, startTime: "10:30", endTime: "12:00" };
  const blocked = await request.post("/api/admin/sessions", { headers: json, data: classInput });
  expect(blocked.status()).toBe(409);
  const blockedText = await blocked.text();
  expect(blockedText).not.toContain(token);
  expect(JSON.parse(blockedText)).toMatchObject({ error: "booking_conflict", conflict: { kind: "booking", id: booking.id } });

  // Renaming the room keeps it bookable (the code is not a permission key).
  const renamed = await request.put(`/api/admin/rooms/${room.id}`, {
    headers: json,
    data: { code: `${code}X`, name: "Umbenannt", floorId: "1OG", type: "seminar", description: "", reservable: true },
  });
  expect(renamed.status()).toBe(200);
  expect((await request.get(`/api/public/availability?roomId=${encodeURIComponent(room.id)}&date=${date}`)).status()).toBe(200);

  // Room guards while a booking lies ahead.
  const disable = await request.put(`/api/admin/rooms/${room.id}`, {
    headers: json,
    data: { code: `${code}X`, name: "Umbenannt", floorId: "1OG", type: "seminar", description: "", reservable: false },
  });
  expect(disable.status()).toBe(409);
  expect((await disable.json()).error).toBe("booking_in_use");
  const archive = await request.post(`/api/admin/rooms/${room.id}/archive`, { headers: origin });
  expect(archive.status()).toBe(409);
  const archiveBody = await archive.json();
  expect(archiveBody).toMatchObject({ error: "room_in_use", upcomingSessions: 0, upcomingBookings: 1 });
  expect(archiveBody.message).toContain("Es ist noch 1 Reservierung aktiv");

  // Admin list: the booking without any secret.
  const list = await request.get(`/api/admin/bookings?from=${date}&days=1&roomId=${encodeURIComponent(room.id)}`);
  expect(list.status()).toBe(200);
  const listText = await list.text();
  expect(listText).not.toContain(token);
  expect(listText).not.toMatch(/hash/i);
  expect(JSON.parse(listText).bookings).toEqual([expect.objectContaining({ id: booking.id, roomCode: `${code}X`, status: "confirmed" })]);

  // Public cancellation: possession of the token only.
  const cancelUrl = `/api/public/bookings/${booking.id}/cancel`;
  expect((await request.post(cancelUrl, { headers: { ...origin, Authorization: "Bearer nope" } })).status()).toBe(401);
  expect((await request.post(cancelUrl, { headers: { ...origin, Authorization: `Bearer ${secret(32)}` } })).status()).toBe(404);
  expect((await request.post(cancelUrl, { headers: { Authorization: `Bearer ${token}` } })).status()).toBe(403);
  const cancelled = await request.post(cancelUrl, { headers: { ...origin, Authorization: `Bearer ${token}` } });
  expect(cancelled.status()).toBe(200);
  expect(await cancelled.json()).toMatchObject({ booking: { id: booking.id, status: "cancelled" } });
  expect((await request.post(cancelUrl, { headers: { ...origin, Authorization: `Bearer ${token}` } })).status()).toBe(200);

  // The class can now be saved; the old booking stays as a cancelled record.
  expect((await request.post("/api/admin/sessions", { headers: json, data: classInput })).status()).toBe(201);
  const after = await (await request.get(`/api/admin/bookings?from=${date}&days=1&roomId=${encodeURIComponent(room.id)}`)).json();
  expect(after.bookings).toEqual([expect.objectContaining({ id: booking.id, status: "cancelled" })]);
});

test("public availability refuses unknown and non-reservable rooms; there is no public booking list", async ({ request, baseURL }) => {
  const origin = await loginViaApi(request, baseURL!);
  const res = await request.post("/api/admin/rooms", {
    headers: { ...origin, "Content-Type": "application/json" },
    data: { code: `API-N${stamp()}`, name: "Nicht reservierbar", floorId: "2OG", type: "office", description: "", reservable: false },
  });
  const room = (await res.json()).room;
  for (const id of [room.id, "does-not-exist"]) {
    const r = await request.get(`/api/public/availability?roomId=${encodeURIComponent(id)}&date=${berlinDate(1)}`);
    expect(r.status()).toBe(409);
    expect((await r.json()).error).toBe("room_not_reservable");
  }
  expect((await request.get(`/api/public/availability?roomId=${encodeURIComponent(room.id)}&date=${berlinDate(30)}`)).status()).toBe(400);
  expect((await request.get("/api/public/bookings")).status()).toBe(405);
});

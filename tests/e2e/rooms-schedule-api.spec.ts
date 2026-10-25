import { expect, test } from "@playwright/test";
import { loginViaApi } from "./helpers.ts";

// M2 server-side checks: authorization, origin, validation, conflicts and the
// public projections of rooms and class sessions.

const stamp = () => Date.now().toString(36);
const roomInput = (code: string, overrides: Record<string, unknown> = {}) => ({
  code,
  name: "API-Testraum",
  floorId: "1OG",
  type: "seminar",
  description: "",
  reservable: false,
  ...overrides,
});
const sessionInput = (roomId: string, overrides: Record<string, unknown> = {}) => ({
  title: "API-Test",
  instructor: "Testperson",
  cohort: "Test",
  term: "WS 2029/30",
  roomId,
  date: "2030-01-15",
  startTime: "10:00",
  endTime: "11:30",
  ...overrides,
});

test("anonymous requests cannot read or change rooms and sessions", async ({ request }) => {
  for (const [method, url] of [
    ["GET", "/api/admin/rooms"],
    ["POST", "/api/admin/rooms"],
    ["PUT", "/api/admin/rooms/x"],
    ["POST", "/api/admin/rooms/x/archive"],
    ["GET", "/api/admin/sessions"],
    ["POST", "/api/admin/sessions"],
    ["POST", "/api/admin/sessions/x/cancel"],
  ] as const) {
    const response = await request.fetch(url, { method, data: method === "GET" ? undefined : {} });
    expect(response.status(), `${method} ${url}`).toBe(401);
  }
  expect((await request.post("/api/public/rooms", { data: {} })).status()).toBe(405);
  expect((await request.post("/api/public/schedule", { data: {} })).status()).toBe(405);
});

test("admin API validates, prevents conflicts and protects references", async ({ request, baseURL }) => {
  const headers = await loginViaApi(request, baseURL!);
  const code = `API-${stamp()}`;

  // Cross-origin mutation with a valid session.
  const foreign = await request.post("/api/admin/rooms", { headers: { Origin: "https://evil.example" }, data: roomInput(code) });
  expect(foreign.status()).toBe(403);

  const invalidRoom = await request.post("/api/admin/rooms", { headers, data: roomInput("", { floorId: "9OG" }) });
  expect(invalidRoom.status()).toBe(400);
  expect(Object.keys((await invalidRoom.json()).fieldErrors).sort()).toEqual(["code", "floorId"]);

  const created = await request.post("/api/admin/rooms", { headers, data: roomInput(code) });
  expect(created.status()).toBe(201);
  const room = (await created.json()).room;
  expect((await request.post("/api/admin/rooms", { headers, data: roomInput(code.toLowerCase()) })).status()).toBe(409);

  const endBeforeStart = await request.post("/api/admin/sessions", { headers, data: sessionInput(room.id, { endTime: "09:00" }) });
  expect(endBeforeStart.status()).toBe(400);
  expect((await endBeforeStart.json()).fieldErrors.endTime).toBeTruthy();
  const dstGap = await request.post("/api/admin/sessions", {
    headers,
    data: sessionInput(room.id, { term: "SS 2030", date: "2030-03-31", startTime: "02:30", endTime: "04:00" }),
  });
  expect(dstGap.status()).toBe(400);
  expect((await dstGap.json()).fieldErrors.startTime[0]).toMatch(/Zeitumstellung/);

  const first = await request.post("/api/admin/sessions", { headers, data: sessionInput(room.id) });
  expect(first.status()).toBe(201);
  const session = (await first.json()).session;
  expect(session).toMatchObject({ startsAt: "2030-01-15T09:00:00.000Z", endsAt: "2030-01-15T10:30:00.000Z", status: "scheduled" });

  const clash = await request.post("/api/admin/sessions", { headers, data: sessionInput(room.id, { startTime: "11:00", endTime: "12:00" }) });
  expect(clash.status()).toBe(409);
  expect((await clash.json()).error).toBe("room_conflict");

  const blocked = await request.post(`/api/admin/rooms/${room.id}/archive`, { headers });
  expect(blocked.status()).toBe(409);
  expect(await blocked.json()).toMatchObject({ error: "room_in_use", upcomingSessions: 1 });

  expect((await request.post(`/api/admin/sessions/${session.id}/cancel`, { headers })).status()).toBe(200);
  expect((await request.post(`/api/admin/rooms/${room.id}/archive`, { headers })).status()).toBe(200);
  const reuse = await request.post("/api/admin/sessions", { headers, data: sessionInput(room.id, { startTime: "14:00", endTime: "15:00" }) });
  expect(reuse.status()).toBe(409);
  expect((await reuse.json()).error).toBe("room_archived");
});

test("public room and schedule output contain only allowlisted fields", async ({ request, baseURL }) => {
  const headers = await loginViaApi(request, baseURL!);
  const code = `PUB-${stamp()}`;
  const room = (await (await request.post("/api/admin/rooms", { headers, data: roomInput(code) })).json()).room;
  await request.post("/api/admin/sessions", { headers, data: sessionInput(room.id, { date: "2030-02-05", term: "WS 2029/30" }) });

  const rooms = await request.get("/api/public/rooms");
  expect(rooms.headers()["cache-control"]).toContain("no-store");
  const listed = (await rooms.json()).rooms.find((r: { code: string }) => r.code === code);
  expect(Object.keys(listed).sort()).toEqual(["code", "description", "floorId", "id", "isDemo", "name", "reservable", "type"]);

  const day = await (await request.get(`/api/public/schedule?date=2030-02-05&roomId=${room.id}`)).json();
  expect(day.date).toBe("2030-02-05");
  expect(day.sessions).toHaveLength(1);
  expect(Object.keys(day.sessions[0]).sort()).toEqual(["cohort", "endsAt", "id", "instructor", "isDemo", "room", "startsAt", "status", "term", "title"]);

  const today = await (await request.get("/api/public/schedule")).json();
  expect(today.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect((await request.get("/api/public/schedule?date=2030-02-30")).status()).toBe(400);
  expect((await request.get("/api/public/schedule?roomId=unknown")).status()).toBe(404);
});

import { expect, test } from "@playwright/test";
import { termForDate } from "../../src/lib/sessions/schema.ts";
import { loginViaApi, loginViaUi } from "./helpers.ts";

// Layout evidence for M2 (rooms and schedule). Content is created by this test
// and labelled as test data; 1080×1920 is a simulated portrait viewport, not
// the measured resolution of the campus screen.

const OUT = "docs/evidence/screenshots";

test("capture M2 admin (1440×900) and public (1080×1920) layouts", async ({ browser, request, baseURL }) => {
  const headers = await loginViaApi(request, baseURL!);
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date());
  const tag = Date.now().toString(36).toUpperCase().slice(-4);

  const rooms: Record<string, string> = {};
  for (const [key, data] of Object.entries({
    a: { code: `T${tag}-0.1`, name: "Küche (Testinhalt)", floorId: "EG", type: "common", description: "Automatisch erzeugter Testinhalt.", reservable: false },
    b: { code: `T${tag}-1.1`, name: "Seminarraum (Testinhalt)", floorId: "1OG", type: "seminar", description: "", reservable: true },
    c: { code: `T${tag}-2.1`, name: "Gruppenraum (Testinhalt)", floorId: "2OG", type: "study", description: "", reservable: true },
  })) {
    const res = await request.post("/api/admin/rooms", { headers, data });
    expect(res.status()).toBe(201);
    rooms[key] = (await res.json()).room.id;
  }
  const sessions = [
    { roomId: rooms.b, startTime: "08:15", endTime: "09:45", title: "Einführung (Testinhalt)" },
    { roomId: rooms.c, startTime: "10:00", endTime: "11:30", title: "Projektarbeit (Testinhalt)" },
    { roomId: rooms.b, startTime: "13:00", endTime: "14:30", title: "Übung (Testinhalt)", cancel: true },
  ];
  let editId = "";
  for (const s of sessions) {
    const res = await request.post("/api/admin/sessions", {
      headers,
      data: { title: s.title, instructor: "Testperson", cohort: "Testkohorte", term: termForDate(today), roomId: s.roomId, date: today, startTime: s.startTime, endTime: s.endTime },
    });
    expect(res.status()).toBe(201);
    const id = (await res.json()).session.id;
    editId ||= id;
    if (s.cancel) await request.post(`/api/admin/sessions/${id}/cancel`, { headers });
  }

  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "de-DE", timezoneId: "Europe/Berlin" });
  const admin = await adminContext.newPage();
  await loginViaUi(admin);
  await admin.screenshot({ path: `${OUT}/m2-admin-overview-1440x900.png` });
  await admin.goto("/admin/rooms");
  await admin.screenshot({ path: `${OUT}/m2-admin-rooms-1440x900.png`, fullPage: true });
  await admin.goto(`/admin/rooms/${rooms.b}`);
  await admin.screenshot({ path: `${OUT}/m2-admin-room-form-1440x900.png`, fullPage: true });
  await admin.goto(`/admin/schedule?von=${today}`);
  await admin.screenshot({ path: `${OUT}/m2-admin-schedule-1440x900.png` });
  await admin.goto(`/admin/schedule/${editId}`);
  await admin.screenshot({ path: `${OUT}/m2-admin-session-form-1440x900.png`, fullPage: true });
  await adminContext.close();

  const publicContext = await browser.newContext({ viewport: { width: 1080, height: 1920 }, locale: "de-DE", timezoneId: "Europe/Berlin" });
  const page = await publicContext.newPage();
  await page.goto("/rooms");
  await expect(page.getByRole("heading", { name: new RegExp(`T${tag}-0.1`) })).toBeVisible();
  await page.screenshot({ path: `${OUT}/m2-public-rooms-1080x1920.png` });
  await page.goto("/schedule");
  await expect(page.getByText("Projektarbeit (Testinhalt)")).toBeVisible();
  await page.screenshot({ path: `${OUT}/m2-public-schedule-1080x1920.png` });
  await publicContext.close();
});

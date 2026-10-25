import { expect, test, type Page } from "@playwright/test";
import { loginViaApi } from "./helpers.ts";

// Regression B-001 (found by Codex): in the English schedule without a room
// filter, session rows showed a German room name without the "Only in German"
// marker. Rooms: one with an English name, one without, on a fixed day used by
// no other test. Course title, lecturer and study group are never marked.

const DAY = "2030-03-12";

test("unfiltered English schedule marks untranslated room names in each row", async ({ browser, request, baseURL }) => {
  const headers = await loginViaApi(request, baseURL!);
  const stamp = Date.now().toString(36).toUpperCase();
  const createRoom = async (data: Record<string, unknown>) => {
    const res = await request.post("/api/admin/rooms", { headers, data: { floorId: "1OG", type: "seminar", reservable: false, description: "", ...data } });
    expect(res.status()).toBe(201);
    return (await res.json()).room as { id: string; code: string };
  };
  const translated = await createRoom({ code: `B1-${stamp}-EN`, name: "Seminarraum Übersetzt", nameEn: "Seminar room translated" });
  const german = await createRoom({ code: `B1-${stamp}-DE`, name: "Seminarraum Deutsch" });
  for (const [room, title, start, end] of [
    [translated, "Wirtschaftsinformatik I", "08:15", "09:45"],
    [german, "Grundlagen der Programmierung", "10:00", "11:30"],
  ] as const) {
    const res = await request.post("/api/admin/sessions", {
      headers,
      data: { title, instructor: "Prof. Beispiel", cohort: "WI 2.0 – 1. Semester", term: "SS 2030", roomId: room.id, date: DAY, startTime: start, endTime: end },
    });
    expect(res.status()).toBe(201);
  }

  const context = await browser.newContext({ viewport: { width: 540, height: 960 } });
  const page = await context.newPage();
  const row = (title: string) => page.getByRole("article").filter({ has: page.getByRole("heading", { name: title }) });
  const roomLine = (title: string, code: string) => row(title).locator("p").filter({ hasText: code });

  async function expectEnglishRows(p: Page) {
    // Translated room: English name, no marker anywhere in the row.
    await expect(roomLine("Wirtschaftsinformatik I", translated.code)).toContainText("Seminar room translated");
    await expect(row("Wirtschaftsinformatik I").getByText(/in German/)).toHaveCount(0);
    // Untranslated room: German name with the marker beside it, in the room line.
    await expect(roomLine("Grundlagen der Programmierung", german.code)).toContainText("Seminarraum Deutsch");
    await expect(roomLine("Grundlagen der Programmierung", german.code).getByText("Only in German", { exact: true })).toBeVisible();
    await expect(row("Grundlagen der Programmierung").getByText(/in German/)).toHaveCount(1);
    // Official course title, lecturer and study group stay as entered, unmarked.
    await expect(p.getByRole("heading", { name: "Grundlagen der Programmierung" })).toHaveAttribute("lang", "de");
    await expect(row("Grundlagen der Programmierung").getByText("WI 2.0 – 1. Semester · Prof. Beispiel")).toBeVisible();
  }

  // 1. Unfiltered English view.
  await page.goto(`/schedule?datum=${DAY}&lang=en`);
  await expectEnglishRows(page);

  // 2. Selected-room header keeps its own marker (unchanged behaviour).
  await page.goto(`/schedule?datum=${DAY}&raum=${german.id}&lang=en`);
  const header = page.getByText(`Room ${german.code} – Seminarraum Deutsch (1st floor)`).locator("..");
  await expect(header.getByText("Only in German", { exact: true })).toBeVisible();
  await page.goto(`/schedule?datum=${DAY}&raum=${translated.id}&lang=en`);
  await expect(page.getByText(`Room ${translated.code} – Seminar room translated (1st floor)`).locator("..").getByText(/in German/)).toHaveCount(0);

  // 3. Removing the room filter returns to the unfiltered rows, still marked.
  await page.getByRole("link", { name: "All rooms" }).click();
  await expect(page).toHaveURL(`/schedule?datum=${DAY}&lang=en`);
  await expectEnglishRows(page);

  // 4. Back to German: German names, no markers.
  await page.getByRole("group", { name: "Language" }).getByRole("link", { name: "Deutsch" }).click();
  await expect(page).toHaveURL(`/schedule?datum=${DAY}`);
  await expect(roomLine("Wirtschaftsinformatik I", translated.code)).toContainText("Seminarraum Übersetzt");
  await expect(roomLine("Grundlagen der Programmierung", german.code)).toContainText("Seminarraum Deutsch");
  await expect(page.getByText(/in German/)).toHaveCount(0);

  await context.close();
});

import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { loginViaApi } from "./helpers.ts";

// T32 room search and the classroom part of T33 on /rooms, through the real
// interface. Controlled fixtures on fixed future dates (created via the admin
// API), so nothing depends on today's demo sessions. A class result is the
// room of a class on a day, never an office or a person's location.

// Fixtures are created with the admin login: no traces, videos or screenshots.
test.use({ trace: "off", video: "off", screenshot: "off" });

const DAY = "2031-05-12"; // Monday
const NEXT_DAY = "2031-05-13";
const UPDATE_TIMEOUT = 9_000; // poll interval (5 s) + margin
const K1_120 = "lcc-demo-room-k1-120"; // team demo room with a map position

type Fixture = { roomId: string; code: string; archivedId: string; archivedCode: string; groschSession: string };
let fixture: Fixture;
let headers: { Origin: string };

async function createRoom(request: APIRequestContext, code: string, name: string, nameEn: string) {
  const response = await request.post("/api/admin/rooms", {
    headers,
    data: { code, name, nameEn, floorId: "2OG", type: "seminar", description: "", descriptionEn: "", reservable: false },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).room.id as string;
}

async function createSession(request: APIRequestContext, input: { title: string; instructor: string; roomId: string; date: string; startTime: string; endTime: string }) {
  const response = await request.post("/api/admin/sessions", { headers, data: { cohort: "Suchtest", term: "SS 2031", ...input } });
  expect(response.status()).toBe(201);
  return (await response.json()).session.id as string;
}

test.beforeAll(async ({ request, baseURL }) => {
  headers = await loginViaApi(request, baseURL!);
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const code = `ST-${stamp}`;
  const archivedCode = `SA-${stamp}`;
  const roomId = await createRoom(request, code, "Suchtestraum", "Search test room");
  const archivedId = await createRoom(request, archivedCode, "Archivtestraum", "Archive test room");

  await createSession(request, { title: "Mensch-Maschine-Interaktion (Suchtest)", instructor: "Prof. Dr. Christian Zagel", roomId: K1_120, date: DAY, startTime: "10:00", endTime: "11:30" });
  const groschSession = await createSession(request, { title: "Wirtschaftsinformatik (Suchtest)", instructor: "Christian Grosch (Suchtest)", roomId, date: DAY, startTime: "12:00", endTime: "13:30" });
  const project = await createSession(request, { title: "Mensch-Maschine-Interaktion – Projekt (Suchtest)", instructor: "Prof. Dr. Christian Zagel", roomId, date: DAY, startTime: "14:00", endTime: "15:30" });
  expect((await request.post(`/api/admin/sessions/${project}/cancel`, { headers })).status()).toBe(200);
  await createSession(request, { title: "Statistik (Suchtest)", instructor: "Dozent:in X (Suchtest)", roomId: K1_120, date: NEXT_DAY, startTime: "09:00", endTime: "10:00" });

  // A past-only room: its (cancelled) class still appears for that day, the room is archived.
  const archivedSession = await createSession(request, { title: "Archivkurs (Suchtest)", instructor: "Christian Archiv (Suchtest)", roomId: archivedId, date: NEXT_DAY, startTime: "11:00", endTime: "12:00" });
  expect((await request.post(`/api/admin/sessions/${archivedSession}/cancel`, { headers })).status()).toBe(200);
  expect((await request.post(`/api/admin/rooms/${archivedId}/archive`, { headers })).status()).toBe(200);

  fixture = { roomId, code, archivedId, archivedCode, groschSession };
});

const searchBox = (page: Page, lang: "de" | "en" = "de") =>
  page.getByRole("searchbox", { name: lang === "de" ? "Raum, Lehrperson oder Lehrveranstaltung suchen" : "Search for a room, lecturer or course" });
const roomResults = (page: Page) => page.getByTestId("search-rooms");
const classResults = (page: Page) => page.getByTestId("search-classes");
const classMatches = (page: Page) => page.getByTestId("class-match");
/** Exact path + query at the end of the URL (independent of the base URL). */
function at(pathAndQuery: string) {
  const escaped = pathAndQuery.replace(/[.*+?^$()|[\]\\{}]/g, "\\$&");
  return new RegExp(escaped + "$");
}
const isSchedule = (url: URL) => url.pathname === "/api/public/schedule";

async function chooseDay(page: Page, day: string, lang: "de" | "en" = "de") {
  await page.getByLabel(lang === "de" ? "Tag der Lehrveranstaltungen" : "Day of the classes").fill(day);
  await expect(page.getByLabel(lang === "de" ? "Tag der Lehrveranstaltungen" : "Day of the classes")).toHaveValue(day);
}

test("room search: code variants, names, clear and no results (German)", async ({ page }) => {
  await page.goto("/rooms");
  await expect(page.getByRole("heading", { name: "1. Obergeschoss", level: 2 })).toBeVisible();

  for (const q of ["K1-120", "k1 120", "K1 120"]) {
    await searchBox(page).fill(q);
    await expect(roomResults(page).getByRole("heading", { name: "K1-120 Seminarraum", level: 4 })).toBeVisible();
    await expect(roomResults(page).locator(`[data-room-id="${K1_120}"]`)).toHaveCount(1);
  }
  // Floor grouping and the room's actions stay in the results.
  const card = roomResults(page).locator(`[data-room-id="${K1_120}"]`);
  await expect(roomResults(page).getByRole("heading", { name: "1. Obergeschoss", level: 3 })).toBeVisible();
  await expect(card.getByRole("link", { name: "Auf der Karte zeigen" })).toHaveAttribute("href", `/map?raum=${K1_120}`);
  await expect(card.getByRole("link", { name: "Heute in diesem Raum" })).toHaveAttribute("href", `/schedule?raum=${K1_120}`);

  // Partial name, German and English.
  await searchBox(page).fill("suchtest");
  await expect(roomResults(page).getByRole("heading", { name: `${fixture.code} Suchtestraum` })).toBeVisible();
  await searchBox(page).fill("SEARCH TEST");
  await expect(roomResults(page).getByRole("heading", { name: `${fixture.code} Suchtestraum` })).toBeVisible();

  // No results: a clear message, no substituted room.
  await searchBox(page).fill("Raum-den-es-nicht-gibt");
  await expect(roomResults(page).getByRole("status")).toHaveText("Kein Raum passt zu „Raum-den-es-nicht-gibt“. Prüfe Raumnummer oder Schreibweise.");
  await expect(roomResults(page).getByRole("article")).toHaveCount(0);
  // Punctuation only must not match every room.
  await searchBox(page).fill("!!!");
  await expect(roomResults(page)).toContainText("· 0 Räume");
  await expect(roomResults(page).getByRole("article")).toHaveCount(0);

  // An archived room is not offered.
  await searchBox(page).fill(fixture.archivedCode);
  await expect(roomResults(page).getByRole("status")).toBeVisible();

  // Clear with the keyboard: focus returns to the empty field and the full directory is back.
  await page.getByRole("button", { name: "Suche löschen" }).focus();
  await page.keyboard.press("Enter");
  await expect(searchBox(page)).toHaveValue("");
  await expect(searchBox(page)).toBeFocused();
  await expect(roomResults(page)).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "1. Obergeschoss", level: 2 })).toBeVisible();
  await expect(page).toHaveURL(/\/rooms$/);
});

test("lecturer and course search for a chosen day, aliases, ambiguity and links (German)", async ({ page }) => {
  await page.goto("/rooms");
  await searchBox(page).fill("Chris");
  await chooseDay(page, DAY);
  await expect(classResults(page).getByRole("heading", { level: 2 })).toContainText("Montag, 12. Mai 2031");
  await expect(classResults(page)).toContainText("kein Büro und kein aktueller Aufenthaltsort");

  // Chris → Christian Zagel only (incl. the cancelled project session).
  await expect(classMatches(page)).toHaveCount(2);
  await expect(classMatches(page).filter({ hasText: "Grosch" })).toHaveCount(0);
  const cancelled = classMatches(page).filter({ hasText: "Projekt (Suchtest)" });
  await expect(cancelled).toHaveAttribute("data-status", "cancelled");
  await expect(cancelled).toContainText("Entfällt");
  await expect(cancelled).toContainText("14:00–15:30");
  const hci = classMatches(page).filter({ hasText: "Mensch-Maschine-Interaktion (Suchtest)" });
  await expect(hci).toContainText("10:00–11:30");
  await expect(hci).toContainText("Lehrperson: Prof. Dr. Christian Zagel");
  await expect(hci).toContainText("Raum K1-120 – Seminarraum");
  await expect(hci).toHaveAttribute("data-status", "scheduled");
  // The lecturer is not a room: no room result for this query.
  await expect(roomResults(page)).toContainText("· 0 Räume");

  for (const q of ["Zagel", "Christian Zagel", "HCI", "MMI", "Mensch Maschine Interaktion", "mensch-maschine-interaktion"]) {
    await searchBox(page).fill(q);
    await expect(classMatches(page)).toHaveCount(2);
    await expect(classMatches(page).filter({ hasText: "Prof. Dr. Christian Zagel" })).toHaveCount(2);
  }
  // A broad first name shows every match instead of choosing one person.
  await searchBox(page).fill("Christian");
  await expect(classMatches(page)).toHaveCount(3);
  await expect(classMatches(page).filter({ hasText: "Christian Grosch (Suchtest)" })).toHaveCount(1);

  // Another day: the search stays, the day changes, and an honest empty state.
  await searchBox(page).fill("Chris");
  await page.getByRole("group", { name: "Tag wählen" }).getByRole("button", { name: "Folgetag →" }).click();
  await expect(page.getByLabel("Tag der Lehrveranstaltungen")).toHaveValue(NEXT_DAY);
  await expect(classResults(page).getByRole("status")).toHaveText(/Am Dienstag, 13. Mai 2031 gibt es keine Lehrveranstaltung, die zu „Chris“ passt\./);
  await expect(classMatches(page)).toHaveCount(0);
  // A class whose room was archived is shown without links into a room that no longer exists.
  await searchBox(page).fill("Archivkurs");
  await expect(classMatches(page)).toHaveCount(1);
  await expect(classMatches(page)).toContainText("Dieser Raum ist nicht mehr im Raumverzeichnis.");
  await expect(classMatches(page).getByRole("link")).toHaveCount(0);

  // Back to the HCI class and follow it to the map: same room id, same day.
  await searchBox(page).fill("Chris");
  await page.getByRole("group", { name: "Tag wählen" }).getByRole("button", { name: "← Vortag" }).click();
  await expect(classMatches(page)).toHaveCount(2);
  await expect(page).toHaveURL(at(`/rooms?suche=Chris&datum=${DAY}`));
  await hci.getByRole("link", { name: "Auf der Karte zeigen" }).click();
  await expect(page).toHaveURL(at(`/map?raum=${K1_120}&datum=${DAY}`));
  await expect(page.getByTestId("map-details")).toContainText("K1-120");
  await expect(page.locator(`[data-room-id="${K1_120}"]`)).toHaveAttribute("aria-pressed", "true");

  // Back restores the search and the day.
  await page.goBack();
  await expect(searchBox(page)).toHaveValue("Chris");
  await expect(page.getByLabel("Tag der Lehrveranstaltungen")).toHaveValue(DAY);
  await expect(classMatches(page)).toHaveCount(2);

  await hci.getByRole("link", { name: "Termine in diesem Raum" }).click();
  await expect(page).toHaveURL(at(`/schedule?datum=${DAY}&raum=${K1_120}`));
  await expect(page.getByRole("article").filter({ hasText: "Mensch-Maschine-Interaktion (Suchtest)" })).toContainText("10:00–11:30");
});

test("English search and language switch keep the query, the day and the room context", async ({ page }) => {
  await page.goto("/rooms?lang=en");
  await searchBox(page, "en").fill("search test room");
  await expect(roomResults(page).getByRole("heading", { name: "Matching rooms" })).toContainText("1 room");
  await expect(roomResults(page).getByRole("heading", { name: `${fixture.code} Search test room` })).toBeVisible();

  await searchBox(page, "en").fill("Zagel");
  await chooseDay(page, DAY, "en");
  await expect(classResults(page).getByRole("heading", { level: 2 })).toContainText("Monday, 12 May 2031");
  await expect(classResults(page)).toContainText("not an office and not where a person is right now");
  const hci = classMatches(page).filter({ hasText: "Mensch-Maschine-Interaktion (Suchtest)" });
  await expect(hci).toContainText("Lecturer: Prof. Dr. Christian Zagel");
  await expect(classMatches(page).filter({ hasText: "Projekt (Suchtest)" })).toContainText("Cancelled");

  // Switch to German: query, day and results stay; the URL follows.
  await page.getByRole("link", { name: "Deutsch" }).click();
  await expect(page.getByRole("heading", { name: "Räume", level: 1 })).toBeVisible();
  await expect(searchBox(page)).toHaveValue("Zagel");
  await expect(page.getByLabel("Tag der Lehrveranstaltungen")).toHaveValue(DAY);
  await expect(classResults(page).getByRole("heading", { level: 2 })).toContainText("Passende Lehrveranstaltungen");
  await expect(page).toHaveURL(at(`/rooms?suche=Zagel&datum=${DAY}`));

  // And back to English, then into the room's schedule in English.
  await page.getByRole("link", { name: "English" }).click();
  await expect(searchBox(page, "en")).toHaveValue("Zagel");
  await expect(page).toHaveURL(at(`/rooms?suche=Zagel&datum=${DAY}&lang=en`));
  await hci.getByRole("link", { name: "Classes in this room" }).click();
  await expect(page).toHaveURL(at(`/schedule?datum=${DAY}&raum=${K1_120}&lang=en`));
  await expect(page.getByRole("heading", { name: "Schedule", level: 1 })).toBeVisible();
});

test("results follow a room rename by id, and polling does not reset the search", async ({ page, request, baseURL }) => {
  headers = await loginViaApi(request, baseURL!);
  await page.goto(`/rooms?suche=Grosch&datum=${DAY}`);
  const match = classMatches(page).filter({ hasText: "Wirtschaftsinformatik (Suchtest)" });
  await expect(match).toContainText(`Raum ${fixture.code} – Suchtestraum`);
  await expect(match.getByRole("link", { name: "Termine in diesem Raum" })).toHaveAttribute("href", `/schedule?datum=${DAY}&raum=${fixture.roomId}`);

  const newCode = `${fixture.code}-N`;
  const renamed = await request.put(`/api/admin/rooms/${fixture.roomId}`, {
    headers,
    data: { code: newCode, name: "Suchtestraum Neu", nameEn: "", floorId: "2OG", type: "seminar", description: "", descriptionEn: "", reservable: false },
  });
  expect(renamed.status()).toBe(200);

  // Picked up by polling; the query and day stay, the link keeps the same room id.
  await expect(match).toContainText(`Raum ${newCode} – Suchtestraum Neu`, { timeout: UPDATE_TIMEOUT });
  await expect(searchBox(page)).toHaveValue("Grosch");
  await expect(match.getByRole("link", { name: "Termine in diesem Raum" })).toHaveAttribute("href", `/schedule?datum=${DAY}&raum=${fixture.roomId}`);

  // The new code and the new name find the same room (same id).
  await searchBox(page).fill(newCode);
  await expect(roomResults(page).locator(`[data-room-id="${fixture.roomId}"]`)).toHaveCount(1);
  await searchBox(page).fill("Suchtestraum Neu");
  await expect(roomResults(page).getByRole("heading", { name: `${newCode} Suchtestraum Neu` })).toBeVisible();

  // English view: German-only name now carries the fallback marker.
  await page.goto(`/rooms?suche=${encodeURIComponent(newCode)}&lang=en`);
  const card = roomResults(page).locator(`[data-room-id="${fixture.roomId}"]`);
  await expect(card).toContainText("Only in German");

  // Several poll cycles later the search is unchanged.
  await page.waitForTimeout(6_000);
  await expect(searchBox(page, "en")).toHaveValue(newCode);
  await expect(card).toHaveCount(1);
});

test("a failed class request is not shown as 'no classes'; room search keeps working", async ({ page }) => {
  await page.route(isSchedule, (route) => route.fulfill({ status: 500, contentType: "application/json", body: '{"error":"test"}' }));
  await page.goto(`/rooms?suche=K1-120&datum=${DAY}`);
  await expect(classResults(page).getByRole("alert")).toContainText("Termine können gerade nicht geladen werden.");
  await expect(classResults(page).getByText(/gibt es keine Lehrveranstaltung/)).toHaveCount(0);
  await expect(classMatches(page)).toHaveCount(0);
  await expect(roomResults(page).locator(`[data-room-id="${K1_120}"]`)).toHaveCount(1);
});

test("a late response for a previous day is ignored after the day changes", async ({ page }) => {
  // Hold the answer for DAY back; NEXT_DAY answers immediately.
  await page.route(isSchedule, async (route) => {
    if (route.request().url().includes(`date=${DAY}`)) await new Promise((resolve) => setTimeout(resolve, 2_500));
    await route.continue();
  });
  await page.goto(`/rooms?suche=Chris&datum=${NEXT_DAY}`);
  await expect(classResults(page).getByRole("status")).toContainText("13. Mai 2031");
  await chooseDay(page, DAY); // slow request starts
  await chooseDay(page, NEXT_DAY); // changed again before it answers
  await expect(classResults(page).getByRole("status")).toContainText("13. Mai 2031");
  await page.waitForTimeout(3_500); // the held DAY response has arrived by now
  // Read once, without retrying, so a brief wrong state cannot be waited away.
  expect(await classResults(page).getByRole("status").allTextContents()).toEqual([
    "Am Dienstag, 13. Mai 2031 gibt es keine Lehrveranstaltung, die zu „Chris“ passt.Wähle einen anderen Tag oder prüfe die Schreibweise.",
  ]);
  expect(await classMatches(page).count()).toBe(0);
  await expect(page.getByLabel("Tag der Lehrveranstaltungen")).toHaveValue(NEXT_DAY);
  await expect(classMatches(page)).toHaveCount(0);
  await expect(classResults(page).getByRole("heading", { level: 2 })).toContainText("13. Mai 2031");
});

// SEARCH-R001 (Codex review 2026-11-01): incoming navigation and history must
// restore their own search/day; the previous local state must not rewrite them.
// The URL is re-checked after a pause (no retry) so a late rewrite is caught.
async function expectStableUrl(page: Page, pathAndQuery: string) {
  await expect(page).toHaveURL(at(pathAndQuery));
  await page.waitForTimeout(700);
  expect(page.url()).toMatch(at(pathAndQuery));
}

test("SEARCH-R001: Back and Forward restore each entry's search and day across a language switch", async ({ page }) => {
  await page.goto(`/rooms?suche=Chris&datum=${DAY}`);
  await expect(classMatches(page)).toHaveCount(2);

  await page.getByRole("link", { name: "English" }).click();
  await expect(page.getByRole("heading", { name: "Rooms", level: 1 })).toBeVisible();
  await expectStableUrl(page, `/rooms?suche=Chris&datum=${DAY}&lang=en`);
  await searchBox(page, "en").fill("Grosch");
  await chooseDay(page, NEXT_DAY, "en");
  await expectStableUrl(page, `/rooms?suche=Grosch&datum=${NEXT_DAY}&lang=en`);
  await expect(classResults(page).getByRole("status")).toHaveText(/On Tuesday, 13 May 2031 there is no class matching “Grosch”\./);

  await page.goBack();
  await expect(page.getByRole("heading", { name: "Räume", level: 1 })).toBeVisible();
  await expectStableUrl(page, `/rooms?suche=Chris&datum=${DAY}`);
  await expect(searchBox(page)).toHaveValue("Chris");
  await expect(page.getByLabel("Tag der Lehrveranstaltungen")).toHaveValue(DAY);
  await expect(classMatches(page)).toHaveCount(2);
  await expect(classMatches(page).filter({ hasText: "Prof. Dr. Christian Zagel" })).toHaveCount(2);

  await page.goForward();
  await expect(page.getByRole("heading", { name: "Rooms", level: 1 })).toBeVisible();
  await expectStableUrl(page, `/rooms?suche=Grosch&datum=${NEXT_DAY}&lang=en`);
  await expect(searchBox(page, "en")).toHaveValue("Grosch");
  await expect(page.getByLabel("Day of the classes")).toHaveValue(NEXT_DAY);
  await expect(classMatches(page)).toHaveCount(0);

  // Language switch after edits carries the edited search, not the loaded one.
  await page.getByRole("link", { name: "Deutsch" }).click();
  await expect(page.getByRole("heading", { name: "Räume", level: 1 })).toBeVisible();
  await expectStableUrl(page, `/rooms?suche=Grosch&datum=${NEXT_DAY}`);
  await expect(searchBox(page)).toHaveValue("Grosch");
  await chooseDay(page, DAY);
  await expect(classMatches(page)).toHaveCount(1);
  await expect(classMatches(page)).toContainText("Christian Grosch (Suchtest)");
});

test("SEARCH-R001: the bare Rooms navigation link clears the search in both languages", async ({ page }) => {
  await page.goto(`/rooms?suche=Chris&datum=${DAY}`);
  await expect(classMatches(page)).toHaveCount(2);
  await page.getByRole("navigation", { name: "Campus-Informationen" }).getByRole("link", { name: "Räume" }).click();
  await expectStableUrl(page, "/rooms");
  await expect(searchBox(page)).toHaveValue("");
  await expect(roomResults(page)).toHaveCount(0);
  await expect(classResults(page)).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "1. Obergeschoss", level: 2 })).toBeVisible();

  // Back returns to the filtered entry.
  await page.goBack();
  await expectStableUrl(page, `/rooms?suche=Chris&datum=${DAY}`);
  await expect(searchBox(page)).toHaveValue("Chris");
  await expect(classMatches(page)).toHaveCount(2);

  await page.goto(`/rooms?suche=Zagel&datum=${DAY}&lang=en`);
  await searchBox(page, "en").fill("K1-120");
  await expectStableUrl(page, `/rooms?suche=K1-120&datum=${DAY}&lang=en`);
  await page.getByRole("navigation", { name: "Campus information" }).getByRole("link", { name: "Rooms" }).click();
  await expectStableUrl(page, "/rooms?lang=en");
  await expect(searchBox(page, "en")).toHaveValue("");
  await expect(roomResults(page)).toHaveCount(0);
});

test("SEARCH-R001: fast typing keeps every character and does not navigate per keystroke", async ({ page }) => {
  await page.goto(`/rooms?datum=${DAY}`);
  await expect(page.getByRole("heading", { name: "1. Obergeschoss", level: 2 })).toBeVisible();
  // Page loads, and server requests for a search URL (navigation or prefetch).
  // Prefetches of the unchanged navigation links are not counted.
  const documents: string[] = [];
  page.on("request", (r) => {
    if (r.resourceType() === "document" || (r.url().includes("_rsc=") && r.url().includes("suche="))) documents.push(r.url());
  });
  await searchBox(page).pressSequentially("Mensch Maschine Interaktion", { delay: 0 });
  await expect(searchBox(page)).toHaveValue("Mensch Maschine Interaktion");
  await expectStableUrl(page, `/rooms?suche=Mensch+Maschine+Interaktion&datum=${DAY}`);
  await expect(searchBox(page)).toHaveValue("Mensch Maschine Interaktion");
  await expect(classMatches(page)).toHaveCount(2);
  expect(documents).toEqual([]);

  // Clearing keeps focus and empties the URL search; the day stays.
  await page.getByRole("button", { name: "Suche löschen" }).click();
  await expect(searchBox(page)).toBeFocused();
  await expectStableUrl(page, `/rooms?datum=${DAY}`);
  await searchBox(page).pressSequentially("Zagel", { delay: 60 }); // ordinary typing speed
  await expectStableUrl(page, `/rooms?suche=Zagel&datum=${DAY}`);
  await expect(searchBox(page)).toHaveValue("Zagel");
  expect(documents).toEqual([]);
});

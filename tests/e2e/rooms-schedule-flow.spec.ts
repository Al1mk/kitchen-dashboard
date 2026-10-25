import { expect, test } from "@playwright/test";
import { loginViaUi } from "./helpers.ts";

// M2 journey with two independent browser contexts on one machine: the admin
// edits rooms and sessions; an anonymous public context (portrait viewport)
// shows the room directory and the schedule and picks changes up by polling,
// without reloading. The session uses a fixed future date so the "planned
// sessions block archiving" rule does not depend on the time of the test run.

const UPDATE_TIMEOUT = 9_000; // poll interval (5 s) + margin
const DAY = "2030-01-15";

test("room and session administration appear on the public pages", async ({ browser }) => {
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const publicContext = await browser.newContext({ viewport: { width: 540, height: 960 } });
  const admin = await adminContext.newPage();
  const directory = await publicContext.newPage();
  const schedule = await publicContext.newPage();

  const stamp = Date.now().toString(36).toUpperCase();
  const code = `E2E-${stamp}`;
  const newCode = `E2E-${stamp}-B`;

  await directory.goto("/rooms");
  await expect(directory.getByRole("heading", { name: "Räume", level: 1 })).toBeVisible();

  // 1. Create a room.
  await loginViaUi(admin);
  await admin.getByRole("navigation", { name: "Verwaltung" }).getByRole("link", { name: "Räume" }).click();
  await admin.getByRole("link", { name: "Neuer Raum" }).click();
  await expect(admin.getByText("Nach dem Speichern sind Änderungen sofort")).toBeVisible();
  await admin.getByRole("button", { name: "Raum anlegen" }).click();
  await expect(admin.getByText("Bitte eine Raumnummer eingeben.")).toBeVisible(); // server-side field error next to the field
  await admin.getByRole("textbox", { name: "Raumnummer" }).fill(code);
  await admin.getByRole("textbox", { name: "Name", exact: true }).fill("Testraum Erstfassung");
  await admin.getByRole("combobox", { name: "Stockwerk" }).selectOption("1OG");
  await admin.getByRole("combobox", { name: "Raumart" }).selectOption("seminar");
  await admin.getByRole("button", { name: "Raum anlegen" }).click();
  await expect(admin.getByRole("status").filter({ hasText: "Raum angelegt" })).toBeVisible();
  const roomId = /\/admin\/rooms\/([0-9a-f-]{36})/.exec(admin.url())![1];

  // Appears in the public directory without a reload.
  await expect(directory.getByRole("heading", { name: `${code} Testraum Erstfassung` })).toBeVisible({ timeout: UPDATE_TIMEOUT });

  // 2. Create a session in that room (first with an invalid time range).
  await admin.goto(`/admin/schedule/new?datum=${DAY}&raum=${roomId}`);
  await admin.getByRole("textbox", { name: "Lehrveranstaltung / Modul" }).fill("E2E-Vorlesung");
  await admin.getByRole("textbox", { name: "Lehrperson" }).fill("Testperson");
  await admin.getByRole("textbox", { name: "Studiengang / Semester" }).fill("Testkohorte");
  await expect(admin.getByRole("combobox", { name: "Semester (Studienjahr)" })).toHaveValue("WS 2029/30");
  await admin.getByLabel("Beginn").fill("10:00");
  await admin.getByLabel("Ende").fill("09:00");
  await admin.getByRole("button", { name: "Termin anlegen" }).click();
  await expect(admin.getByText("Das Ende muss nach dem Beginn liegen.")).toBeVisible();
  await admin.getByLabel("Ende").fill("11:30");
  await admin.getByRole("button", { name: "Termin anlegen" }).click();
  await expect(admin.getByRole("status").filter({ hasText: "Termin angelegt" })).toBeVisible();
  const sessionUrl = admin.url();

  await schedule.goto(`/schedule?datum=${DAY}&raum=${roomId}`);
  const card = schedule.getByRole("article").filter({ hasText: "E2E-Vorlesung" });
  await expect(card).toContainText("10:00–11:30");
  await expect(card).toContainText(`${code} – Testraum Erstfassung`);

  // 3. Rename and recode the room: the session keeps its room (stable id).
  await admin.goto(`/admin/rooms/${roomId}`);
  await admin.getByRole("textbox", { name: "Raumnummer" }).fill(newCode);
  await admin.getByRole("textbox", { name: "Name", exact: true }).fill("Testraum Zweitfassung");
  await admin.getByRole("button", { name: "Änderungen speichern" }).click();
  await expect(admin.getByRole("status").filter({ hasText: "jetzt öffentlich sichtbar" })).toBeVisible();
  await expect(directory.getByRole("heading", { name: `${newCode} Testraum Zweitfassung` })).toBeVisible({ timeout: UPDATE_TIMEOUT });
  await expect(directory.getByRole("heading", { name: `${code} Testraum Erstfassung` })).toHaveCount(0);
  await expect(card).toContainText(`${newCode} – Testraum Zweitfassung`, { timeout: UPDATE_TIMEOUT });

  // 4. Edit the session time.
  await admin.goto(sessionUrl);
  await admin.getByLabel("Ende").fill("12:00");
  await admin.getByRole("button", { name: "Änderungen speichern" }).click();
  await expect(admin.getByRole("status").filter({ hasText: "jetzt im öffentlichen Stundenplan sichtbar" })).toBeVisible();
  await expect(card).toContainText("10:00–12:00", { timeout: UPDATE_TIMEOUT });

  // 5. Archiving is refused while the session is still planned.
  await admin.goto(`/admin/rooms/${roomId}`);
  await admin.getByRole("button", { name: "Raum archivieren" }).click();
  await admin.getByRole("dialog").getByRole("button", { name: "Archivieren" }).click();
  await expect(admin.getByRole("alert").filter({ hasText: "kann nicht archiviert werden" })).toContainText("Es ist noch 1 Termin geplant");

  // 6. Cancel the session: it stays public, marked "Entfällt".
  await admin.goto(sessionUrl);
  await admin.getByRole("button", { name: "Termin absagen" }).click();
  await admin.getByRole("dialog").getByRole("button", { name: "Termin absagen" }).click();
  await expect(admin.getByRole("status").filter({ hasText: "Termin abgesagt" })).toBeVisible();
  await expect(card).toContainText("Entfällt", { timeout: UPDATE_TIMEOUT });

  // 7. Now the room can be archived and leaves the public directory.
  await admin.goto(`/admin/rooms/${roomId}`);
  await admin.getByRole("button", { name: "Raum archivieren" }).click();
  await admin.getByRole("dialog").getByRole("button", { name: "Archivieren" }).click();
  await expect(admin.getByRole("status").filter({ hasText: "Raum archiviert" })).toBeVisible();
  await expect(directory.getByRole("heading", { name: new RegExp(newCode) })).toHaveCount(0, { timeout: UPDATE_TIMEOUT });

  // The archived room is no longer offered for new sessions.
  await admin.goto(`/admin/schedule/new?datum=${DAY}`);
  await expect(admin.getByRole("combobox", { name: "Raum" }).locator("option", { hasText: newCode })).toHaveCount(0);

  await adminContext.close();
  await publicContext.close();
});

test("public schedule changes day without admin access", async ({ page }) => {
  await page.goto(`/schedule?datum=${DAY}`);
  await expect(page.getByText("Dienstag, 15. Januar 2030")).toBeVisible();
  await page.getByRole("link", { name: "Folgetag →" }).click();
  await expect(page).toHaveURL(/datum=2030-01-16/);
  await expect(page.getByText("Mittwoch, 16. Januar 2030")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Verwaltung" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Anmelden|Verwaltung/ })).toHaveCount(0);
});

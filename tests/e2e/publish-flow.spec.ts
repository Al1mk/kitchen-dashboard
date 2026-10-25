import { expect, test } from "@playwright/test";
import { ADMIN, loginViaUi } from "./helpers.ts";

// Full M1 journey with two independent browser contexts on one machine:
// an authenticated admin context and an anonymous display context.
// The display page is never reloaded; it must pick up changes by polling.

const UPDATE_TIMEOUT = 9_000; // poll interval (5 s) + margin

test("draft → preview → publish → display → edit/republish → withdraw", async ({ browser }) => {
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const displayContext = await browser.newContext({ viewport: { width: 540, height: 960 } });
  const admin = await adminContext.newPage();
  const display = await displayContext.newPage();

  const title = `Fahrradkeller gesperrt ${Date.now()}`;
  const editedTitle = `${title} – bis Freitag`;

  await display.goto("/display");
  await expect(display.getByRole("heading", { name: "Mitteilungen" })).toBeVisible();

  // 1. Login
  await loginViaUi(admin);
  expect(ADMIN.username).toBeTruthy();

  // 2.–3. Create and save a draft
  await admin.getByRole("link", { name: "Neue Mitteilung" }).click();
  await admin.getByRole("textbox", { name: "Titel", exact: true }).fill(title);
  await admin.getByRole("textbox", { name: "Text", exact: true }).fill("Wegen Bauarbeiten ist der Fahrradkeller gesperrt.");
  await admin.getByRole("radio", { name: "Wichtig" }).check();
  await admin.getByRole("button", { name: "Entwurf speichern" }).click();
  await expect(admin.getByRole("status").filter({ hasText: "Entwurf gespeichert" })).toBeVisible();
  await expect(admin).toHaveURL(/\/admin\/announcements\/[0-9a-f-]{36}/);

  // Draft is not public.
  await display.waitForTimeout(6_000);
  await expect(display.getByText(title)).toHaveCount(0);

  // 4. Preview in portrait presentation
  await admin.getByRole("link", { name: "Große Vorschau öffnen" }).click();
  await expect(admin.getByText("Vorschau – nicht veröffentlicht")).toBeVisible();
  await expect(admin.getByRole("heading", { name: title })).toBeVisible();
  await admin.getByRole("link", { name: "Zurück zur Bearbeitung" }).click();

  // 5.–6. Publish and see it on the independent display context
  await admin.getByRole("button", { name: "Veröffentlichen" }).click();
  await expect(admin.getByRole("status").filter({ hasText: "Veröffentlicht" })).toBeVisible();
  await expect(display.getByRole("heading", { name: title })).toBeVisible({ timeout: UPDATE_TIMEOUT });

  // 7a. Edit and save as draft: the display must keep the published version.
  await admin.getByRole("textbox", { name: "Titel", exact: true }).fill(editedTitle);
  await admin.getByRole("button", { name: "Entwurf speichern" }).click();
  await expect(admin.getByText("weiterhin die zuletzt veröffentlichte Fassung")).toBeVisible();
  await expect(admin.getByText("Änderungen nicht veröffentlicht")).toBeVisible();
  await display.waitForTimeout(6_000);
  await expect(display.getByRole("heading", { name: title, exact: true })).toBeVisible();
  await expect(display.getByText(editedTitle)).toHaveCount(0);

  // 7b. Republish
  await admin.getByRole("button", { name: "Änderungen veröffentlichen" }).click();
  await expect(display.getByRole("heading", { name: editedTitle })).toBeVisible({ timeout: UPDATE_TIMEOUT });
  await expect(display.getByRole("heading", { name: title, exact: true })).toHaveCount(0);

  // 7c. Withdraw (with confirmation)
  await admin.getByRole("button", { name: "Veröffentlichung zurücknehmen" }).click();
  const dialog = admin.getByRole("dialog", { name: "Veröffentlichung zurücknehmen?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Zurücknehmen" }).click();
  await expect(admin.getByRole("status").filter({ hasText: "Veröffentlichung zurückgenommen" })).toBeVisible();
  await expect(display.getByText(editedTitle)).toHaveCount(0, { timeout: UPDATE_TIMEOUT });

  // Content is still recoverable in the admin.
  await expect(admin.getByRole("textbox", { name: "Titel", exact: true })).toHaveValue(editedTitle);

  await adminContext.close();
  await displayContext.close();
});

test("validation errors are shown next to the fields", async ({ page }) => {
  await loginViaUi(page);
  await page.goto("/admin/announcements/new");
  await page.getByRole("button", { name: "Entwurf speichern" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Bitte die markierten Felder prüfen" })).toBeVisible();
  await expect(page.getByText("Bitte einen Titel eingeben.")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Titel", exact: true })).toBeFocused();
  await expect(page.getByRole("textbox", { name: "Titel", exact: true })).toHaveAttribute("aria-invalid", "true");
});

test("leaving with unsaved changes asks for confirmation", async ({ page }) => {
  await loginViaUi(page);
  await page.goto("/admin/announcements/new");
  await page.getByRole("textbox", { name: "Titel", exact: true }).fill("Nicht gespeichert");
  await page.getByRole("link", { name: "Übersicht" }).click();
  const dialog = page.getByRole("dialog", { name: "Ungespeicherte Änderungen verwerfen?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Weiter bearbeiten" }).click();
  await expect(page).toHaveURL(/\/admin\/announcements\/new$/);
  await expect(page.getByRole("textbox", { name: "Titel", exact: true })).toHaveValue("Nicht gespeichert");
});

test("logout from the UI ends access to admin pages", async ({ page }) => {
  await loginViaUi(page);
  await page.getByRole("button", { name: "Abmelden" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin/announcements");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

import { expect, test } from "@playwright/test";
import { loginViaApi, loginViaUi } from "./helpers.ts";

// Optional English versions entered in the (German) admin, seen by an
// anonymous visitor in the English interface. Two browser contexts on one
// machine; the public side picks changes up by polling, without reloading.

const UPDATE_TIMEOUT = 9_000; // poll interval (5 s) + margin
const POLL_WAIT = 6_000;

test("English announcement text follows draft, preview, publish, republish and withdraw", async ({ browser }) => {
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const publicContext = await browser.newContext({ viewport: { width: 540, height: 960 } });
  const admin = await adminContext.newPage();
  const en = await publicContext.newPage();
  const de = await publicContext.newPage();

  const stamp = Date.now().toString(36);
  const titleDe = `Küche geschlossen ${stamp}`;
  const titleEn = `Kitchen closed ${stamp}`;
  const titleEn2 = `Kitchen closed until Friday ${stamp}`;
  const card = (page: typeof en, name: string) => page.getByRole("article").filter({ has: page.getByRole("heading", { name }) });

  await en.goto("/display?lang=en");
  await de.goto("/display");

  // 1. German text plus only an English title (partial translation).
  await loginViaUi(admin);
  await admin.goto("/admin/announcements/new");
  await expect(admin.getByRole("group", { name: "Englische Fassung (optional)" })).toBeVisible();
  await admin.getByRole("textbox", { name: "Titel", exact: true }).fill(titleDe);
  await admin.getByRole("textbox", { name: "Text", exact: true }).fill("Wegen Reinigung bleibt die Küche heute geschlossen.");
  await admin.getByRole("textbox", { name: "Titel (Englisch)" }).fill(titleEn);
  await admin.getByRole("button", { name: "Entwurf speichern" }).click();
  await expect(admin.getByRole("status").filter({ hasText: "Entwurf gespeichert" })).toBeVisible();

  // Live preview in the editor shows both language versions.
  const preview = admin.getByTestId("editor-preview");
  await expect(preview.getByText(titleDe)).toBeVisible();
  await admin.getByRole("button", { name: "Englische Ansicht" }).click();
  await expect(preview.getByText(titleEn)).toBeVisible();
  await expect(preview.getByText("Partly in German", { exact: true })).toBeVisible();
  await expect(preview.getByText("Wegen Reinigung bleibt die Küche heute geschlossen.")).toBeVisible();

  // Large preview with the English view.
  await admin.getByRole("link", { name: "Große Vorschau öffnen" }).click();
  await admin.getByRole("link", { name: "Englische Ansicht" }).click();
  await expect(admin).toHaveURL(/\/preview\?sprache=en$/);
  await expect(admin.getByText("Vorschau – nicht veröffentlicht (englische Ansicht)")).toBeVisible();
  await expect(admin.getByRole("heading", { name: titleEn })).toBeVisible();
  await admin.getByRole("link", { name: "Deutsche Ansicht" }).click();
  await expect(admin.getByRole("heading", { name: titleDe })).toBeVisible();
  await admin.getByRole("link", { name: "Zurück zur Bearbeitung" }).click();

  // The draft is public in neither language.
  await en.waitForTimeout(POLL_WAIT);
  await expect(en.getByText(titleEn)).toHaveCount(0);
  await expect(de.getByText(titleDe)).toHaveCount(0);

  // 2. Publish: English visitors see the English title, German body, marked.
  await admin.getByRole("button", { name: "Veröffentlichen" }).click();
  await expect(admin.getByRole("status").filter({ hasText: "Veröffentlicht" })).toBeVisible();
  await expect(card(en, titleEn)).toBeVisible({ timeout: UPDATE_TIMEOUT });
  await expect(card(en, titleEn).getByText("Partly in German")).toBeVisible();
  await expect(card(en, titleEn).getByRole("heading", { name: titleEn })).toHaveAttribute("lang", "en");
  await expect(card(en, titleEn).getByText("Wegen Reinigung")).toHaveAttribute("lang", "de");
  await expect(card(de, titleDe)).toBeVisible({ timeout: UPDATE_TIMEOUT });
  await expect(de.getByText(titleEn)).toHaveCount(0); // German interface shows German only
  await expect(card(de, titleDe).getByText(/in German/)).toHaveCount(0);

  // 3. Change only the English draft: nothing public changes until republishing.
  await admin.getByRole("textbox", { name: "Titel (Englisch)" }).fill(titleEn2);
  await admin.getByRole("textbox", { name: "Text (Englisch)" }).fill("The kitchen is closed for cleaning today.");
  await admin.getByRole("button", { name: "Entwurf speichern" }).click();
  await expect(admin.getByText("weiterhin die zuletzt veröffentlichte Fassung")).toBeVisible();
  await expect(admin.getByText("Änderungen nicht veröffentlicht")).toBeVisible();
  await expect(admin.getByText(`Englisch: „`)).toHaveCount(0); // published snapshot still incomplete
  await expect(admin.getByText("Englische Fassung unvollständig")).toBeVisible();
  await en.waitForTimeout(POLL_WAIT);
  await expect(card(en, titleEn)).toBeVisible();
  await expect(en.getByText(titleEn2)).toHaveCount(0);
  await expect(en.getByText("The kitchen is closed for cleaning today.")).toHaveCount(0);

  // 4. Republish: full English version, no fallback marker; German unchanged.
  await admin.getByRole("button", { name: "Änderungen veröffentlichen" }).click();
  await expect(card(en, titleEn2)).toBeVisible({ timeout: UPDATE_TIMEOUT });
  await expect(card(en, titleEn2).getByText("The kitchen is closed for cleaning today.")).toBeVisible();
  await expect(card(en, titleEn2).getByText(/in German/)).toHaveCount(0);
  await expect(en.getByRole("heading", { name: titleEn, exact: true })).toHaveCount(0);
  await expect(card(de, titleDe)).toBeVisible();

  // 5. Withdraw: gone in both languages, English text kept in the draft.
  await admin.getByRole("button", { name: "Veröffentlichung zurücknehmen" }).click();
  await admin.getByRole("dialog", { name: "Veröffentlichung zurücknehmen?" }).getByRole("button", { name: "Zurücknehmen" }).click();
  await expect(admin.getByRole("status").filter({ hasText: "Veröffentlichung zurückgenommen" })).toBeVisible();
  await expect(en.getByText(titleEn2)).toHaveCount(0, { timeout: UPDATE_TIMEOUT });
  await expect(de.getByText(titleDe)).toHaveCount(0, { timeout: UPDATE_TIMEOUT });
  await expect(admin.getByRole("textbox", { name: "Titel (Englisch)" })).toHaveValue(titleEn2);

  await adminContext.close();
  await publicContext.close();
});

test("English room names and descriptions, with German fallback, in directory and schedule", async ({ browser, request, baseURL }) => {
  const headers = await loginViaApi(request, baseURL!);
  const stamp = Date.now().toString(36).toUpperCase();
  const base = { floorId: "2OG", type: "study", reservable: false };
  const full = (await (
    await request.post("/api/admin/rooms", {
      headers,
      data: { ...base, code: `EN-${stamp}-1`, name: "Gruppenraum Test", description: "Mit Whiteboard.", nameEn: "Group room test", descriptionEn: "With whiteboard." },
    })
  ).json()).room;
  const partial = (await (
    await request.post("/api/admin/rooms", {
      headers,
      data: { ...base, code: `EN-${stamp}-2`, name: "Lernraum Test", description: "Ruhiger Raum.", nameEn: "Study room test" },
    })
  ).json()).room;
  const none = (await (
    await request.post("/api/admin/rooms", { headers, data: { ...base, code: `EN-${stamp}-3`, name: "Küche Test", description: "" } })
  ).json()).room;
  const session = await request.post("/api/admin/sessions", {
    headers,
    data: { title: "Projektseminar", instructor: "Prof. Beispiel", cohort: "WI 3", term: "WS 2029/30", roomId: full.id, date: "2030-01-16", startTime: "10:00", endTime: "11:30" },
  });
  expect(session.status()).toBe(201);

  const context = await browser.newContext({ viewport: { width: 540, height: 960 } });
  const page = await context.newPage();
  await page.goto("/rooms?lang=en");
  const roomCard = (code: string) => page.getByRole("article").filter({ has: page.getByRole("heading", { name: new RegExp(code) }) });

  await expect(roomCard(full.code).getByRole("heading", { name: `${full.code} Group room test` })).toBeVisible();
  await expect(roomCard(full.code).getByText("With whiteboard.")).toBeVisible();
  await expect(roomCard(full.code).getByText(/in German/)).toHaveCount(0);

  await expect(roomCard(partial.code).getByRole("heading", { name: `${partial.code} Study room test` })).toBeVisible();
  await expect(roomCard(partial.code).getByText("Ruhiger Raum.")).toHaveAttribute("lang", "de");
  await expect(roomCard(partial.code).getByText("Partly in German")).toBeVisible();

  // No description at all: only the missing name counts.
  await expect(roomCard(none.code).getByRole("heading", { name: `${none.code} Küche Test` })).toBeVisible();
  await expect(roomCard(none.code).getByText("Only in German")).toBeVisible();

  // German interface: German texts, no markers.
  await page.getByRole("group", { name: "Language" }).getByRole("link", { name: "Deutsch" }).click();
  await expect(roomCard(full.code).getByRole("heading", { name: `${full.code} Gruppenraum Test` })).toBeVisible();
  await expect(page.getByText(/in German/)).toHaveCount(0);

  // Schedule: English room name; course title, lecturer and cohort as entered.
  await page.goto(`/schedule?datum=2030-01-16&raum=${full.id}&lang=en`);
  await expect(page.getByText(`Room ${full.code} – Group room test (2nd floor)`)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Projektseminar" })).toHaveAttribute("lang", "de");
  await expect(page.getByText("WI 3 · Prof. Beispiel")).toBeVisible();

  // Still one room per record: the public list has each code exactly once.
  const rooms = (await (await request.get("/api/public/rooms")).json()).rooms as { code: string }[];
  expect(rooms.filter((r) => r.code.startsWith(`EN-${stamp}`)).map((r) => r.code).sort()).toEqual([full.code, partial.code, none.code]);

  await context.close();
});

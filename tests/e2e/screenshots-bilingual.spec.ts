import { expect, test } from "@playwright/test";
import { loginViaApi, loginViaUi } from "./helpers.ts";

// Layout evidence for optional English content: the admin editor with the
// English fields and its English preview, and the public English board and
// room directory with one full and one German-only item. Content is created
// by this test and labelled as test content. 1080×1920 is a simulated
// portrait viewport, not the measured resolution of the campus screen.

const OUT = "docs/evidence/screenshots";

test("capture bilingual admin editor (1440×900) and English public pages (1080×1920)", async ({ browser, request, baseURL }) => {
  const headers = await loginViaApi(request, baseURL!);
  const tag = Date.now().toString(36).toUpperCase().slice(-4);
  const make = async (data: Record<string, unknown>) => {
    const res = await request.post("/api/admin/announcements", {
      headers,
      data: { category: "general", pinned: false, startsAt: "", endsAt: "", ...data },
    });
    expect(res.status()).toBe(201);
    const id = (await res.json()).announcement.id as string;
    expect((await request.post(`/api/admin/announcements/${id}/publish`, { headers })).status()).toBe(200);
    return id;
  };
  const translated = await make({
    title: `Spieleabend am Freitag (Testinhalt ${tag})`,
    body: "Ab 18 Uhr in der Küche. Automatisch erzeugter Testinhalt.",
    titleEn: `Games night on Friday (test content ${tag})`,
    bodyEn: "From 6 pm in the kitchen. Automatically generated test content.",
    category: "event",
  });
  await make({ title: `Kühlschrank wird geleert (Testinhalt ${tag})`, body: "Nur auf Deutsch eingegeben. Automatisch erzeugter Testinhalt." });
  await request.post("/api/admin/rooms", {
    headers,
    data: { code: `T${tag}-K`, name: "Küche (Testinhalt)", nameEn: "Kitchen (test content)", floorId: "EG", type: "common", description: "Kaffeemaschine und Wasserkocher.", descriptionEn: "Coffee machine and kettle.", reservable: false },
  });
  await request.post("/api/admin/rooms", {
    headers,
    data: { code: `T${tag}-L`, name: "Lernraum (Testinhalt)", floorId: "EG", type: "study", description: "Nur auf Deutsch eingegeben.", reservable: false },
  });

  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const admin = await adminContext.newPage();
  await loginViaUi(admin);
  await admin.goto(`/admin/announcements/${translated}`);
  await admin.getByRole("button", { name: "Englische Ansicht" }).click();
  await expect(admin.getByTestId("editor-preview").getByText(`Games night on Friday (test content ${tag})`)).toBeVisible();
  await admin.screenshot({ path: `${OUT}/bilingual-admin-editor-1440x900.png`, fullPage: true });
  await adminContext.close();

  const context = await browser.newContext({ viewport: { width: 1080, height: 1920 } });
  const page = await context.newPage();
  await page.goto("/display?lang=en");
  await expect(page.getByText(`Games night on Friday (test content ${tag})`)).toBeVisible();
  await expect(page.getByText("Only in German").first()).toBeVisible();
  await page.screenshot({ path: `${OUT}/bilingual-display-en-1080x1920.png` });
  await page.goto("/rooms?lang=en");
  await expect(page.getByText("Kitchen (test content)")).toBeVisible();
  await page.screenshot({ path: `${OUT}/bilingual-rooms-en-1080x1920.png`, fullPage: true });
  await context.close();
});

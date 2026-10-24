import { expect, test, type Page } from "@playwright/test";
import { BODY_MAX, TITLE_MAX } from "../../src/lib/announcements/schema.ts";
import { loginViaApi, loginViaUi, sampleInput } from "./helpers.ts";

// Regression for review finding R-001: several maximum-length announcements must
// not be squeezed and clipped; every card keeps its full height and the list
// scrolls instead. Checked on the public display and on the admin preview.

const fill = (prefix: string, max: number) =>
  `${prefix} ${"Lange Mitteilung mit viel Text für den Überlauf-Test. ".repeat(40)}`.slice(0, max).trimEnd();

async function boardMetrics(page: Page) {
  return page.evaluate(() => {
    const cards = [...document.querySelectorAll("article")];
    const list = cards[0].parentElement!;
    const clipped = cards.filter((c) => c.scrollHeight > c.clientHeight + 1).length;
    const scrollable = list.scrollHeight > list.clientHeight;
    list.scrollTop = list.scrollHeight;
    const last = cards[cards.length - 1].getBoundingClientRect();
    const box = list.getBoundingClientRect();
    return { cards: cards.length, clipped, scrollable, lastReachable: last.bottom <= box.bottom + 1 };
  });
}

test("long announcements are not clipped on the display or in the preview", async ({ browser, request, baseURL }) => {
  const headers = await loginViaApi(request, baseURL!);
  const stamp = Date.now();
  const ids: string[] = [];
  try {
    for (let i = 1; i <= 4; i++) {
      const res = await request.post("/api/admin/announcements", {
        headers,
        data: sampleInput({ title: fill(`Überlauf ${stamp} Nr. ${i}`, TITLE_MAX), body: fill(`Text ${i}:`, BODY_MAX) }),
      });
      expect(res.status()).toBe(201);
      const id = (await res.json()).announcement.id as string;
      ids.push(id);
      if (i < 4) expect((await request.post(`/api/admin/announcements/${id}/publish`, { headers })).status()).toBe(200);
    }

    const displayContext = await browser.newContext({ viewport: { width: 1080, height: 1920 } });
    const display = await displayContext.newPage();
    await display.goto("/display");
    await expect(display.getByRole("heading", { name: new RegExp(`Überlauf ${stamp} Nr. 3`) })).toBeVisible();
    const onDisplay = await boardMetrics(display);
    expect(onDisplay.cards).toBeGreaterThanOrEqual(3);
    expect(onDisplay).toMatchObject({ clipped: 0, scrollable: true, lastReachable: true });
    await displayContext.close();

    // Preview of the unpublished fourth item among the three public ones.
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const admin = await adminContext.newPage();
    await loginViaUi(admin);
    await admin.goto(`/admin/announcements/${ids[3]}/preview`);
    await expect(admin.getByText("Vorschau – nicht veröffentlicht")).toBeVisible();
    const inPreview = await boardMetrics(admin);
    expect(inPreview.cards).toBeGreaterThanOrEqual(4);
    expect(inPreview).toMatchObject({ clipped: 0, scrollable: true, lastReachable: true });
    await adminContext.close();
  } finally {
    // Keep the shared E2E database tidy for later specs: take the items off the display.
    for (const id of ids.slice(0, 3)) await request.post(`/api/admin/announcements/${id}/withdraw`, { headers });
  }
});

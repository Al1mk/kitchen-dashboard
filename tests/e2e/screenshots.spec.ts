import { expect, test } from "@playwright/test";
import { loginViaApi, loginViaUi, sampleInput } from "./helpers.ts";

// Captures layout evidence. 1080×1920 is a simulated portrait viewport (test
// assumption), not the measured resolution of the campus screen.

const OUT = "docs/evidence/screenshots";

test("capture admin (1440×900) and display (1080×1920) layouts", async ({ browser, request, baseURL }) => {
  const headers = await loginViaApi(request, baseURL!);
  const created = await (
    await request.post("/api/admin/announcements", {
      headers,
      data: sampleInput({
        title: "Küche am Freitag ab 14 Uhr geschlossen (Testinhalt)",
        body: "Automatisch erzeugter Testinhalt für Screenshots.\nBitte Geschirr vorher abräumen.",
        category: "important",
        pinned: true,
      }),
    })
  ).json();
  await request.post(`/api/admin/announcements/${created.announcement.id}/publish`, { headers });

  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const admin = await adminContext.newPage();
  await loginViaUi(admin);
  await admin.screenshot({ path: `${OUT}/admin-overview-1440x900.png` });
  await admin.goto("/admin/announcements");
  await admin.screenshot({ path: `${OUT}/admin-list-1440x900.png`, fullPage: true });
  await admin.goto(`/admin/announcements/${created.announcement.id}`);
  await admin.getByRole("textbox", { name: "Titel", exact: true }).fill("Küche am Freitag ab 13 Uhr geschlossen (Testinhalt)");
  await admin.screenshot({ path: `${OUT}/admin-editor-unsaved-1440x900.png`, fullPage: true });
  await admin.goto(`/admin/announcements/${created.announcement.id}/preview`);
  await admin.screenshot({ path: `${OUT}/admin-preview-1440x900.png`, fullPage: true });
  await admin.goto("/admin/login");
  await adminContext.close();

  const loginContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const login = await loginContext.newPage();
  await login.goto("/admin/login");
  await login.screenshot({ path: `${OUT}/admin-login-1440x900.png` });
  await loginContext.close();

  const displayContext = await browser.newContext({ viewport: { width: 1080, height: 1920 } });
  const display = await displayContext.newPage();
  await display.goto("/display");
  await expect(display.getByRole("heading", { name: /Küche am Freitag/ })).toBeVisible();
  await display.screenshot({ path: `${OUT}/display-portrait-1080x1920.png` });
  await displayContext.close();

  const laptopDisplay = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const lp = await laptopDisplay.newPage();
  await lp.goto("/display");
  await expect(lp.getByRole("heading", { name: /Küche am Freitag/ })).toBeVisible();
  await lp.screenshot({ path: `${OUT}/display-on-laptop-1440x900.png` });
  await laptopDisplay.close();
});

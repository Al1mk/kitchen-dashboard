import { expect, test } from "@playwright/test";

// Layout evidence for the public navigation and the DE/EN switch. Shows
// whatever the e2e database holds at this point (content created by earlier
// tests). 1080×1920 is a simulated portrait viewport, not the measured
// resolution of the campus screen.

const OUT = "docs/evidence/screenshots";

test("capture public start, board and English schedule (1080×1920)", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1080, height: 1920 } });
  const page = await context.newPage();

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Campus-Informationen", level: 1 })).toBeVisible();
  await page.screenshot({ path: `${OUT}/nav-start-de-1080x1920.png` });

  await page.goto("/display");
  await expect(page.getByRole("navigation", { name: "Campus-Informationen" })).toBeVisible();
  await page.waitForTimeout(500); // clock and first poll settled
  await page.screenshot({ path: `${OUT}/nav-display-de-1080x1920.png` });

  await page.goto("/schedule?lang=en");
  await expect(page.getByRole("heading", { name: "Schedule", level: 1 })).toBeVisible();
  await expect(page.getByText("Loading classes …")).toHaveCount(0);
  await page.screenshot({ path: `${OUT}/nav-schedule-en-1080x1920.png`, fullPage: true });

  await context.close();
});

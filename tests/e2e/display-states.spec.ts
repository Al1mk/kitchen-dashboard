import { expect, test } from "@playwright/test";

// Network conditions are simulated with request interception in the display
// browser context. This exercises the UI states; it is not a real network outage.

const API = "**/api/public/announcements";

test("shows a loading state, then an empty state", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await page.route(API, async (route) => {
    await gate;
    await route.fulfill({ json: { serverTime: new Date().toISOString(), announcements: [] } });
  });
  await page.goto("/display");
  await expect(page.getByText("Mitteilungen werden geladen")).toBeVisible();
  release();
  await expect(page.getByText("Zurzeit gibt es keine Mitteilungen.")).toBeVisible();
});

test("shows an error state on first-load failure and recovers", async ({ page }) => {
  await page.route(API, (route) => route.abort("connectionrefused"));
  await page.goto("/display");
  await expect(page.getByText("Mitteilungen können gerade nicht geladen werden.")).toBeVisible();

  await page.unroute(API);
  await page.route(API, (route) =>
    route.fulfill({
      json: {
        serverTime: new Date().toISOString(),
        announcements: [
          { id: "x", title: "Wieder verbunden", body: "Test", category: "general", pinned: false, publishedAt: new Date().toISOString(), endsAt: null },
        ],
      },
    }),
  );
  await page.getByRole("button", { name: "Erneut versuchen" }).click();
  await expect(page.getByRole("heading", { name: "Wieder verbunden" })).toBeVisible();
});

test("keeps last data with a stale notice when the connection drops, then recovers automatically", async ({ page }) => {
  let online = true;
  await page.route(API, (route) =>
    online
      ? route.fulfill({
          json: {
            serverTime: new Date().toISOString(),
            announcements: [
              { id: "y", title: "Letzter Stand", body: "Test", category: "event", pinned: true, publishedAt: new Date().toISOString(), endsAt: null },
            ],
          },
        })
      : route.abort("internetdisconnected"),
  );
  await page.goto("/display");
  await expect(page.getByRole("heading", { name: "Letzter Stand" })).toBeVisible();

  online = false;
  await expect(page.getByText(/Verbindung unterbrochen – angezeigt wird der Stand von/)).toBeVisible({ timeout: 9_000 });
  await expect(page.getByRole("heading", { name: "Letzter Stand" })).toBeVisible();

  online = true;
  await expect(page.getByText(/Verbindung unterbrochen/)).toHaveCount(0, { timeout: 9_000 });
});

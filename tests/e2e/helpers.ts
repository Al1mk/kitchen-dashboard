import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const ADMIN = {
  username: process.env.E2E_ADMIN_USERNAME!,
  password: process.env.E2E_ADMIN_PASSWORD!,
};

export async function loginViaUi(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Benutzername").fill(ADMIN.username);
  await page.getByLabel("Passwort", { exact: true }).fill(ADMIN.password);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await expect(page.getByRole("heading", { name: /Willkommen/ })).toBeVisible();
}

/** Logs an API request context in; returns the headers for same-origin mutations. */
export async function loginViaApi(request: APIRequestContext, baseURL: string) {
  const response = await request.post("/api/auth/login", {
    headers: { Origin: baseURL },
    data: { username: ADMIN.username, password: ADMIN.password },
  });
  expect(response.status()).toBe(200);
  return { Origin: baseURL };
}

export const sampleInput = (overrides: Record<string, unknown> = {}) => ({
  title: `Test ${Math.random().toString(36).slice(2, 8)}`,
  body: "Automatischer Test.",
  category: "general",
  pinned: false,
  startsAt: "",
  endsAt: "",
  ...overrides,
});

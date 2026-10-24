import { expect, request as apiRequest, test } from "@playwright/test";
import { ADMIN } from "./helpers.ts";

// Regression for review finding R-002: the admin editor must work when opened
// over plain HTTP on a non-loopback host name (like a LAN IP), where the browser
// is not a secure context and crypto.randomUUID is missing. Chromium maps the
// reserved name campus-board.test to this machine, so this is an isolated browser
// test on one computer, not a test with a second device or a real network.

const HOST = "campus-board.test";
const PORT = 3100;
const ORIGIN = `http://${HOST}:${PORT}`;

test.use({ launchOptions: { args: [`--host-resolver-rules=MAP ${HOST} 127.0.0.1`] } });

test("editor creates a draft in a non-secure context (HTTP, non-loopback host)", async ({ browser }) => {
  // Log in via localhost and hand the session to the browser for the other host
  // name. (A real plain-HTTP LAN demo would set CAMPUS_BOARD_INSECURE_COOKIES=true
  // so the browser keeps the login cookie; this test server keeps Secure cookies.)
  const api = await apiRequest.newContext({ baseURL: `http://localhost:${PORT}` });
  const login = await api.post("/api/auth/login", {
    headers: { Origin: `http://localhost:${PORT}` },
    data: { username: ADMIN.username, password: ADMIN.password },
  });
  expect(login.status()).toBe(200);
  const token = /cb_admin_session=([^;]+)/.exec(login.headers()["set-cookie"] ?? "")?.[1];
  expect(token).toBeTruthy();
  await api.dispose();

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addCookies([{ name: "cb_admin_session", value: token!, url: ORIGIN }]);
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto(`${ORIGIN}/admin/announcements/new`);
  // The test reproduces the documented condition.
  expect(await page.evaluate(() => ({ secure: isSecureContext, uuid: typeof crypto.randomUUID }))).toEqual({
    secure: false,
    uuid: "undefined",
  });

  const title = `HTTP-IP-Test ${Date.now()}`;
  await page.getByRole("textbox", { name: "Titel" }).fill(title);
  await page.getByRole("textbox", { name: "Text", exact: true }).fill("Bearbeitet über eine unverschlüsselte Adresse.");
  await page.getByRole("button", { name: "Entwurf speichern" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Entwurf gespeichert" })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`^${ORIGIN}/admin/announcements/[0-9a-f-]{36}`));
  expect(errors).toEqual([]);
  await context.close();
});

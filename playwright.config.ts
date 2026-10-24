import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { hashPassword } from "./src/lib/auth/password.ts";

// E2E runs against a production build with a fresh, temporary database and a
// random per-run admin password. Values are set on process.env once by the
// runner and inherited by workers, so all processes agree on them.
process.env.E2E_ADMIN_USERNAME ??= "e2e-admin";
process.env.E2E_ADMIN_PASSWORD ??= randomBytes(18).toString("base64url");
process.env.E2E_DB_PATH ??= join(tmpdir(), `campus-board-e2e-${Date.now()}`, "e2e.sqlite");

const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    locale: "de-DE",
    timezoneId: "Europe/Berlin",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/public/announcements`,
    timeout: 300_000,
    reuseExistingServer: false,
    env: {
      CAMPUS_BOARD_DB_PATH: process.env.E2E_DB_PATH,
      ADMIN_USERNAME: process.env.E2E_ADMIN_USERNAME,
      ADMIN_PASSWORD_HASH: await hashPassword(process.env.E2E_ADMIN_PASSWORD),
    },
  },
});

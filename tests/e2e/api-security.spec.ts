import { expect, test } from "@playwright/test";
import { loginViaApi, sampleInput } from "./helpers.ts";

test.describe("anonymous direct requests", () => {
  test("cannot read or mutate admin data", async ({ request, baseURL }) => {
    const origin = { Origin: baseURL! };
    expect((await request.get("/api/admin/announcements")).status()).toBe(401);
    expect((await request.get("/api/admin/announcements/any-id")).status()).toBe(401);
    expect((await request.post("/api/admin/announcements", { headers: origin, data: sampleInput() })).status()).toBe(401);
    expect((await request.put("/api/admin/announcements/any-id", { headers: origin, data: sampleInput() })).status()).toBe(401);
    expect((await request.post("/api/admin/announcements/any-id/publish", { headers: origin })).status()).toBe(401);
    expect((await request.post("/api/admin/announcements/any-id/withdraw", { headers: origin })).status()).toBe(401);
  });

  test("admin pages redirect to the login page", async ({ page }) => {
    for (const path of ["/admin", "/admin/announcements", "/admin/announcements/new"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin\/login$/);
    }
  });

  test("public API rejects writes", async ({ request }) => {
    expect((await request.post("/api/public/announcements", { data: {} })).status()).toBe(405);
  });

  test("wrong credentials are rejected", async ({ request, baseURL }) => {
    const response = await request.post("/api/auth/login", {
      headers: { Origin: baseURL! },
      data: { username: "e2e-admin", password: "falsch-falsch" },
    });
    expect(response.status()).toBe(401);
  });
});

test.describe("authenticated API", () => {
  test("rejects cross-origin mutations even with a valid session", async ({ request, baseURL }) => {
    await loginViaApi(request, baseURL!);
    const evil = await request.post("/api/admin/announcements", {
      headers: { Origin: "https://evil.example" },
      data: sampleInput(),
    });
    expect(evil.status()).toBe(403);
    const missing = await request.post("/api/admin/announcements", { data: sampleInput() });
    expect(missing.status()).toBe(403);
  });

  test("rejects invalid input server-side with field errors", async ({ request, baseURL }) => {
    const headers = await loginViaApi(request, baseURL!);
    const response = await request.post("/api/admin/announcements", {
      headers,
      data: sampleInput({ title: "", category: "<script>", startsAt: "2026-10-30T18:00", endsAt: "2026-10-30T17:00" }),
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(Object.keys(body.fieldErrors)).toEqual(expect.arrayContaining(["title", "category"]));

    const badTimes = await request.post("/api/admin/announcements", {
      headers,
      data: sampleInput({ startsAt: "2026-10-30T18:00", endsAt: "2026-10-30T17:00" }),
    });
    expect((await badTimes.json()).fieldErrors.endsAt).toBeDefined();

    const notJson = await request.post("/api/admin/announcements", {
      headers: { ...headers, "Content-Type": "application/json" },
      data: "{nope",
    });
    expect(notJson.status()).toBe(400);
  });

  test("public output never contains drafts, future items or admin fields", async ({ request, baseURL }) => {
    const headers = await loginViaApi(request, baseURL!);
    const draft = await (await request.post("/api/admin/announcements", { headers, data: sampleInput({ title: "Geheimer Entwurf" }) })).json();
    const future = await (
      await request.post("/api/admin/announcements", { headers, data: sampleInput({ title: "Zukunft", startsAt: "2099-01-01T10:00" }) })
    ).json();
    expect((await request.post(`/api/admin/announcements/${future.announcement.id}/publish`, { headers })).status()).toBe(200);

    const publicResponse = await request.get("/api/public/announcements");
    expect(publicResponse.headers()["cache-control"]).toContain("no-store");
    const text = await publicResponse.text();
    expect(text).not.toContain("Geheimer Entwurf");
    expect(text).not.toContain(draft.announcement.id);
    expect(text).not.toContain("Zukunft");
    expect(text).not.toContain("draft");
    expect(text).not.toContain("createdAt");
  });

  test("a repeated create request id does not create a duplicate", async ({ request, baseURL }) => {
    const headers = await loginViaApi(request, baseURL!);
    const data = sampleInput({ requestId: "dup-check-1" });
    const first = await (await request.post("/api/admin/announcements", { headers, data })).json();
    const second = await (await request.post("/api/admin/announcements", { headers, data })).json();
    expect(second.announcement.id).toBe(first.announcement.id);
  });

  test("logout invalidates the session server-side", async ({ request, baseURL }) => {
    const headers = await loginViaApi(request, baseURL!);
    const state = await request.storageState();
    const token = state.cookies.find((c) => c.name === "cb_admin_session")?.value;
    expect(token).toBeTruthy();
    expect((await request.post("/api/auth/logout", { headers })).status()).toBe(200);

    // Replay the old token explicitly: it must no longer work.
    const replay = await request.get("/api/admin/announcements", { headers: { Cookie: `cb_admin_session=${token}` } });
    expect(replay.status()).toBe(401);
  });
});

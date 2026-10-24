import { describe, expect, it } from "vitest";
import type { AnnouncementContent } from "../../src/lib/announcements/schema.ts";
import {
  canPublish,
  getAdminState,
  hasPendingChanges,
  isPubliclyVisible,
} from "../../src/lib/announcements/policy.ts";

const now = new Date("2026-10-24T12:00:00.000Z");

function content(overrides: Partial<AnnouncementContent> = {}): AnnouncementContent {
  return {
    title: "Mensa geschlossen",
    body: "Heute bleibt die Küche geschlossen.",
    category: "general",
    pinned: false,
    startsAt: null,
    endsAt: null,
    ...overrides,
  };
}

describe("isPubliclyVisible", () => {
  it("hides drafts", () => {
    expect(isPubliclyVisible({ status: "draft", published: null }, now)).toBe(false);
  });

  it("hides withdrawn announcements even if a snapshot exists", () => {
    expect(isPubliclyVisible({ status: "withdrawn", published: content() }, now)).toBe(false);
  });

  it("shows published announcements without a window", () => {
    expect(isPubliclyVisible({ status: "published", published: content() }, now)).toBe(true);
  });

  it("hides published announcements that start in the future", () => {
    const published = content({ startsAt: "2026-10-24T12:00:01.000Z" });
    expect(isPubliclyVisible({ status: "published", published }, now)).toBe(false);
  });

  it("shows announcements whose start time has been reached", () => {
    const published = content({ startsAt: "2026-10-24T12:00:00.000Z" });
    expect(isPubliclyVisible({ status: "published", published }, now)).toBe(true);
  });

  it("hides expired announcements (end is exclusive)", () => {
    const published = content({ endsAt: "2026-10-24T12:00:00.000Z" });
    expect(isPubliclyVisible({ status: "published", published }, now)).toBe(false);
  });
});

describe("hasPendingChanges", () => {
  it("is false when draft equals the published snapshot", () => {
    expect(hasPendingChanges({ status: "published", draft: content(), published: content() })).toBe(false);
  });

  it("is true when the draft differs from the published snapshot", () => {
    expect(
      hasPendingChanges({ status: "published", draft: content({ title: "Neu" }), published: content() }),
    ).toBe(true);
  });

  it("is false for drafts that were never published", () => {
    expect(hasPendingChanges({ status: "draft", draft: content(), published: null })).toBe(false);
  });
});

describe("getAdminState", () => {
  it("maps lifecycle and window to an admin state", () => {
    expect(getAdminState({ status: "draft", published: null }, now)).toBe("draft");
    expect(getAdminState({ status: "withdrawn", published: null }, now)).toBe("withdrawn");
    expect(getAdminState({ status: "published", published: content() }, now)).toBe("live");
    expect(
      getAdminState({ status: "published", published: content({ startsAt: "2026-10-25T00:00:00.000Z" }) }, now),
    ).toBe("scheduled");
    expect(
      getAdminState({ status: "published", published: content({ endsAt: "2026-10-24T11:00:00.000Z" }) }, now),
    ).toBe("expired");
  });
});

describe("canPublish", () => {
  it("rejects content whose end time already passed", () => {
    const result = canPublish(content({ endsAt: "2026-10-24T11:59:00.000Z" }), now);
    expect(result.ok).toBe(false);
  });

  it("accepts content without an end time", () => {
    expect(canPublish(content(), now).ok).toBe(true);
  });
});

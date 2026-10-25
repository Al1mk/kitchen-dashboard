import { describe, expect, it } from "vitest";
import { parseAnnouncementInput, TITLE_MAX, BODY_MAX } from "../../src/lib/announcements/schema.ts";
import { berlinLocalToUtcIso, utcIsoToBerlinLocal } from "../../src/lib/time/berlin.ts";

const valid = {
  title: "  Spieleabend  ",
  body: "Freitag ab 18 Uhr im Raum 1.12.",
  category: "event",
  pinned: true,
  startsAt: "2026-10-30T18:00",
  endsAt: "2026-10-30T22:00",
};

describe("berlin time conversion", () => {
  it("converts winter time (UTC+1)", () => {
    expect(berlinLocalToUtcIso("2026-12-01T10:00")).toBe("2026-12-01T09:00:00.000Z");
  });

  it("converts summer time (UTC+2)", () => {
    expect(berlinLocalToUtcIso("2026-07-01T10:00")).toBe("2026-07-01T08:00:00.000Z");
  });

  it("rejects a local time that does not exist because of the spring DST gap", () => {
    expect(berlinLocalToUtcIso("2026-03-29T02:30")).toBeNull();
  });

  it("rejects malformed values", () => {
    expect(berlinLocalToUtcIso("30.10.2026 18:00")).toBeNull();
    expect(berlinLocalToUtcIso("2026-13-01T10:00")).toBeNull();
  });

  it("round-trips UTC back to a Berlin input value", () => {
    expect(utcIsoToBerlinLocal("2026-07-01T08:00:00.000Z")).toBe("2026-07-01T10:00");
  });
});

describe("parseAnnouncementInput", () => {
  it("accepts valid input, trims text and converts times to UTC", () => {
    const result = parseAnnouncementInput(valid);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.content).toEqual({
      title: "Spieleabend",
      body: "Freitag ab 18 Uhr im Raum 1.12.",
      category: "event",
      pinned: true,
      startsAt: "2026-10-30T17:00:00.000Z",
      endsAt: "2026-10-30T21:00:00.000Z",
      titleEn: "",
      bodyEn: "",
    });
  });

  it("treats empty times as no restriction", () => {
    const result = parseAnnouncementInput({ ...valid, startsAt: "", endsAt: null });
    expect(result.ok && result.content.startsAt === null && result.content.endsAt === null).toBe(true);
  });

  it("requires title and body", () => {
    const result = parseAnnouncementInput({ ...valid, title: "   ", body: "" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.title).toBeDefined();
    expect(result.fieldErrors.body).toBeDefined();
  });

  it("rejects over-long text", () => {
    const result = parseAnnouncementInput({ ...valid, title: "x".repeat(TITLE_MAX + 1), body: "y".repeat(BODY_MAX + 1) });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.title).toBeDefined();
    expect(result.fieldErrors.body).toBeDefined();
  });

  it("rejects unknown categories and wrong types", () => {
    const result = parseAnnouncementInput({ ...valid, category: "html", pinned: "yes" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.category).toBeDefined();
    expect(result.fieldErrors.pinned).toBeDefined();
  });

  it("rejects an end time that is not after the start time", () => {
    const result = parseAnnouncementInput({ ...valid, endsAt: "2026-10-30T18:00" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.endsAt).toBeDefined();
  });

  it("rejects non-object input", () => {
    expect(parseAnnouncementInput("hello").ok).toBe(false);
  });
});

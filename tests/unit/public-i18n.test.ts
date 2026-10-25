import { describe, expect, it } from "vitest";
import { CATEGORIES } from "../../src/lib/announcements/schema.ts";
import { PUBLIC_TEXT, parseLang, publicHref } from "../../src/lib/i18n/public.ts";
import { FLOOR_IDS, ROOM_TYPES } from "../../src/lib/rooms/schema.ts";
import { formatBerlinDateTime, formatBerlinLongDate, formatCalendarDate } from "../../src/lib/time/berlin.ts";

describe("parseLang", () => {
  it("selects English only for lang=en; everything else is German", () => {
    expect(parseLang("en")).toBe("en");
    for (const value of [undefined, "de", "EN", "fr", "", ["en"], 1]) expect(parseLang(value)).toBe("de");
  });
});

describe("publicHref", () => {
  it("keeps the language and the given context, dropping empty values", () => {
    expect(publicHref("/schedule", "en", { datum: "2026-11-02", raum: "abc" })).toBe("/schedule?datum=2026-11-02&raum=abc&lang=en");
    expect(publicHref("/schedule", "de", { datum: "2026-11-02", raum: null })).toBe("/schedule?datum=2026-11-02");
    expect(publicHref("/", "de")).toBe("/");
    expect(publicHref("/rooms", "en")).toBe("/rooms?lang=en");
  });

  it("encodes values", () => {
    expect(publicHref("/schedule", "de", { raum: "a&b=c" })).toBe("/schedule?raum=a%26b%3Dc");
  });
});

describe("public text", () => {
  it("has German and English labels for every floor, room type and category", () => {
    for (const lang of ["de", "en"] as const) {
      const t = PUBLIC_TEXT[lang];
      for (const id of FLOOR_IDS) expect(t.floors[id]).toBeTruthy();
      for (const type of ROOM_TYPES) expect(t.roomTypes[type]).toBeTruthy();
      for (const category of CATEGORIES) expect(t.board.categories[category]).toBeTruthy();
    }
    expect(PUBLIC_TEXT.en.floors.EG).toBe("Ground floor");
    expect(PUBLIC_TEXT.de.floors.EG).toBe("Erdgeschoss");
  });

  it("only the English interface carries the note that staff content stays German", () => {
    expect(PUBLIC_TEXT.de.contentNote).toBeNull();
    expect(PUBLIC_TEXT.en.contentNote).toMatch(/shown as entered/);
  });
});

describe("date formatting by language", () => {
  it("formats calendar dates in German by default and in English on request", () => {
    expect(formatCalendarDate("2026-11-02")).toBe("Montag, 2. November 2026");
    expect(formatCalendarDate("2026-11-02", "en")).toBe("Monday, 2 November 2026");
  });

  it("formats instants in Berlin time in both languages", () => {
    const iso = "2026-10-24T12:05:00.000Z"; // 14:05 in Berlin (CEST)
    expect(formatBerlinDateTime(iso)).toBe("24.10.2026, 14:05");
    expect(formatBerlinDateTime(iso, "en")).toBe("24 Oct 2026, 14:05");
    expect(formatBerlinLongDate(new Date(iso), "en")).toBe("Saturday 24 October");
  });
});

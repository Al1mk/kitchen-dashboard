import { describe, expect, it } from "vitest";
import { bookingErrorKey, BOOKING_COPY } from "../../src/components/public/booking-copy.ts";
import { BOOKING_POLICY, bookingDateRange } from "../../src/lib/bookings/policy.ts";
import { PUBLIC_TEXT, publicHref } from "../../src/lib/i18n/public.ts";
import { FLOOR_IDS } from "../../src/lib/rooms/schema.ts";

// T06: the meanings fixed in docs/contracts.md (C3–C5, C7) that several
// modules rely on. Behaviour of the API itself is covered by
// tests/e2e/booking-api.spec.ts; the occupancy rule by occupancy.test.ts.

describe("C3 public URL context", () => {
  it("keeps opaque room ids, dates and language; German adds no parameter", () => {
    expect(publicHref("/map", "en", { raum: "lcc-demo-room-k1-120", datum: "2026-11-03" })).toBe("/map?raum=lcc-demo-room-k1-120&datum=2026-11-03&lang=en");
    expect(publicHref("/booking", "de", { raum: "demo-room-101" })).toBe("/booking?raum=demo-room-101");
    expect(publicHref("/map", "en", { raum: null, etage: "3OG" })).toBe("/map?etage=3OG&lang=en");
  });

  it("knows every floor that has a map image, and keeps the old ids", () => {
    expect(FLOOR_IDS).toEqual(["EG", "1OG", "2OG", "3OG"]);
    for (const lang of ["de", "en"] as const) for (const id of FLOOR_IDS) expect(PUBLIC_TEXT[lang].floors[id]).toBeTruthy();
  });
});

describe("C4 booking policy", () => {
  it("offers 14 dates including today in Berlin time", () => {
    // 23:30 UTC on 2 Nov is already 3 Nov in Berlin.
    expect(bookingDateRange(new Date("2026-11-02T23:30:00Z"))).toEqual({ first: "2026-11-03", last: "2026-11-16" });
    expect(BOOKING_POLICY).toMatchObject({ opens: "08:00", closes: "20:00", minuteStep: 15, minMinutes: 15, maxMinutes: 120, daysAhead: 13 });
  });
});

describe("C5/C7 public error codes are translated, never echoed", () => {
  it("maps API error/detail codes to copy keys and unknown ones to a generic message", () => {
    expect(bookingErrorKey("time_conflict", undefined)).toBe("time_conflict");
    expect(bookingErrorKey("room_not_reservable", undefined)).toBe("room_not_reservable");
    expect(bookingErrorKey("validation", "grid")).toBe("grid");
    expect(bookingErrorKey("validation", "in_past")).toBe("in_past");
    expect(bookingErrorKey("validation", "invalid_input")).toBe("generic");
    expect(bookingErrorKey("request_id_reused", undefined)).toBe("generic");
    expect(bookingErrorKey(undefined, undefined)).toBe("generic");
  });

  it("has every message in both languages", () => {
    const keys = (o: object): string[] => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v).map((s) => `${k}.${s}`) : [k]));
    expect(keys(BOOKING_COPY.en).sort()).toEqual(keys(BOOKING_COPY.de).sort());
    expect(Object.values(BOOKING_COPY.en.errors).join(" ")).not.toMatch(/[äöüß]/);
  });
});

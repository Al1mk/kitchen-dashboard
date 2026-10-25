import { describe, expect, it } from "vitest";
import { parseSessionInput, termForDate, termOptions } from "../../src/lib/sessions/schema.ts";
import { addDays, berlinDateOf, berlinDayRange, isCalendarDate } from "../../src/lib/time/berlin.ts";

const valid = {
  title: "  Grundlagen der Wirtschaftsinformatik  ",
  instructor: "Prof. Beispiel",
  cohort: "WI 2.0 – 1. Semester",
  term: "WS 2026/27",
  roomId: "room-1",
  date: "2026-11-02",
  startTime: "08:15",
  endTime: "09:45",
};

describe("berlin calendar days", () => {
  it("recognises real calendar dates only", () => {
    expect(isCalendarDate("2026-11-02")).toBe(true);
    expect(isCalendarDate("2028-02-29")).toBe(true);
    expect(isCalendarDate("2026-02-29")).toBe(false);
    expect(isCalendarDate("2026-13-01")).toBe(false);
    expect(isCalendarDate("02.11.2026")).toBe(false);
  });

  it("adds days across month and year ends", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("gives the Berlin date of an instant, not the UTC date", () => {
    // 23:30 UTC on 1 Nov is already 00:30 on 2 Nov in Berlin (UTC+1).
    expect(berlinDateOf(new Date("2026-11-01T23:30:00.000Z"))).toBe("2026-11-02");
  });

  it("covers a normal winter day", () => {
    expect(berlinDayRange("2026-11-02")).toEqual({ start: "2026-11-01T23:00:00.000Z", end: "2026-11-02T23:00:00.000Z" });
  });

  it("covers the 25-hour autumn DST day and the 23-hour spring DST day", () => {
    expect(berlinDayRange("2026-10-25")).toEqual({ start: "2026-10-24T22:00:00.000Z", end: "2026-10-25T23:00:00.000Z" });
    expect(berlinDayRange("2026-03-29")).toEqual({ start: "2026-03-28T23:00:00.000Z", end: "2026-03-29T22:00:00.000Z" });
  });
});

describe("academic term", () => {
  it("maps dates to terms (assumption: WS Oct–Mar, SS Apr–Sep)", () => {
    expect(termForDate("2026-10-01")).toBe("WS 2026/27");
    expect(termForDate("2027-03-31")).toBe("WS 2026/27");
    expect(termForDate("2027-04-01")).toBe("SS 2027");
    expect(termForDate("2027-09-30")).toBe("SS 2027");
  });

  it("offers the previous, current and next term", () => {
    expect(termOptions("2026-11-02")).toEqual(["SS 2026", "WS 2026/27", "SS 2027"]);
    expect(termOptions("2027-05-10")).toEqual(["WS 2026/27", "SS 2027", "WS 2027/28"]);
  });
});

describe("parseSessionInput", () => {
  it("accepts valid input, trims text and stores UTC (winter time)", () => {
    const result = parseSessionInput(valid);
    expect(result).toEqual({
      ok: true,
      content: {
        title: "Grundlagen der Wirtschaftsinformatik",
        instructor: "Prof. Beispiel",
        cohort: "WI 2.0 – 1. Semester",
        term: "WS 2026/27",
        roomId: "room-1",
        startsAt: "2026-11-02T07:15:00.000Z",
        endsAt: "2026-11-02T08:45:00.000Z",
      },
    });
  });

  it("uses summer time offsets in summer", () => {
    const result = parseSessionInput({ ...valid, term: "SS 2027", date: "2027-06-14" });
    expect(result.ok && result.content.startsAt).toBe("2027-06-14T06:15:00.000Z");
  });

  it("requires every field", () => {
    const result = parseSessionInput({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      for (const key of ["title", "instructor", "cohort", "term", "roomId", "date", "startTime", "endTime"]) {
        expect(result.fieldErrors[key as keyof typeof result.fieldErrors], key).toBeDefined();
      }
    }
  });

  it("rejects an end time that is not after the start", () => {
    for (const endTime of ["08:15", "08:00"]) {
      const result = parseSessionInput({ ...valid, endTime });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.fieldErrors.endTime?.[0]).toMatch(/nach dem Beginn/);
    }
  });

  it("rejects impossible dates and times", () => {
    const badDate = parseSessionInput({ ...valid, date: "2026-02-30" });
    expect(!badDate.ok && badDate.fieldErrors.date).toBeTruthy();
    const badTime = parseSessionInput({ ...valid, startTime: "25:00" });
    expect(!badTime.ok && badTime.fieldErrors.startTime).toBeTruthy();
  });

  it("rejects a start time inside the spring DST gap", () => {
    const result = parseSessionInput({ ...valid, term: "SS 2026", date: "2026-03-29", startTime: "02:30", endTime: "04:00" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors.startTime?.[0]).toMatch(/Zeitumstellung/);
  });

  it("rejects malformed terms and over-long text", () => {
    for (const term of ["WS 2026/28", "Winter 2026", "SS 26"]) {
      const result = parseSessionInput({ ...valid, term });
      expect(!result.ok && result.fieldErrors.term, term).toBeTruthy();
    }
    const long = parseSessionInput({ ...valid, title: "x".repeat(121) });
    expect(!long.ok && long.fieldErrors.title).toBeTruthy();
  });
});

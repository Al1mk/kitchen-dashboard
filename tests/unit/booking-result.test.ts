import { describe, expect, it } from "vitest";
import { settledBooking } from "../../src/components/public/booking-result.ts";

// V1-R001 (review 2026-11-01): which successful booking answers count as settled.
describe("settledBooking", () => {
  it("accepts a confirmed booking and a replayed cancelled booking with their status", () => {
    expect(settledBooking({ booking: { id: "b1", status: "confirmed" }, replayed: false })).toEqual({ id: "b1", status: "confirmed" });
    expect(settledBooking({ booking: { id: "b1", status: "cancelled" }, replayed: true })).toEqual({ id: "b1", status: "cancelled" });
  });

  it("treats unknown, missing or unreadable answers as an unknown outcome (null)", () => {
    for (const data of [null, undefined, {}, { booking: null }, { booking: { id: "b1" } }, { booking: { id: "b1", status: "pending" } }, { booking: { id: "", status: "confirmed" } }, { booking: { id: 7, status: "confirmed" } }]) {
      expect(settledBooking(data)).toBeNull();
    }
  });
});

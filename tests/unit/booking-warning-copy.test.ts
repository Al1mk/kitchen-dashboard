import { describe, expect, it } from "vitest";
import { BOOKING_COPY } from "../../src/components/public/booking-copy.ts";

describe("pending booking warning (PARSA-R001)", () => {
  it("explicitly warns in German that leaving may leave a stored booking", () => {
    expect(BOOKING_COPY.de.guardText).toContain("kann sie trotzdem bestehen");
    expect(BOOKING_COPY.de.guardText).toContain("Buchungsnummer und Stornierungscode");
  });
  it("explicitly warns in English that leaving may leave a stored booking", () => {
    expect(BOOKING_COPY.en.guardText).toContain("may still exist");
    expect(BOOKING_COPY.en.guardText).toContain("booking ID and cancellation code");
  });
});

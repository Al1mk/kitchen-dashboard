// V1-R001: a successful booking response is only "settled" when it names the
// booking and one of the two known states. An exact retry can legitimately
// return a booking that has been cancelled in the meantime; that must be shown
// as cancelled, never as saved. Anything else is treated as an unknown outcome
// so the visitor can retry the identical request.

export type SettledStatus = "confirmed" | "cancelled";

export function settledBooking(data: unknown): { id: string; status: SettledStatus } | null {
  const booking = (data as { booking?: { id?: unknown; status?: unknown } } | null)?.booking;
  if (!booking || typeof booking.id !== "string" || booking.id === "") return null;
  if (booking.status !== "confirmed" && booking.status !== "cancelled") return null;
  return { id: booking.id, status: booking.status };
}

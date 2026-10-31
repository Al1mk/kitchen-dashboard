import type { Metadata } from "next";
import Link from "next/link";
import { BookingCancelButton } from "@/components/admin/BookingCancelButton.tsx";
import { Pill } from "@/components/admin/FormParts.tsx";
import { requireAdmin } from "@/lib/auth/request.ts";
import { FLOORS } from "@/lib/rooms/schema.ts";
import { services } from "@/lib/server.ts";
import { addDays, berlinDateOf, berlinDayRange, formatBerlinDateTime, formatBerlinTime, formatShortCalendarDate, isCalendarDate } from "@/lib/time/berlin.ts";

// Katja's small booking view (T14): demo bookings in a date range, optionally
// for one room, with explicit cancellation. Uses the joint package's booking
// repository; no editing, reinstating or statistics. Never shows tokens.
export const metadata: Metadata = { title: "Reservierungen – Campus Board Verwaltung" };

const DAYS = 14;

export default async function BookingsPage({ searchParams }: PageProps<"/admin/bookings">) {
  await requireAdmin();
  const query = await searchParams;
  const today = berlinDateOf(new Date());
  const from = typeof query.von === "string" && isCalendarDate(query.von) ? query.von : today;
  const allRooms = services().rooms.list({ includeArchived: true });
  const roomFilter = typeof query.raum === "string" ? allRooms.find((r) => r.id === query.raum) : undefined;
  const bookings = services()
    .bookings.listAdmin(berlinDayRange(from).start, berlinDayRange(addDays(from, DAYS - 1)).end, roomFilter?.id)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const now = new Date().toISOString();
  const roomName = new Map(allRooms.map((r) => [r.id, r.name]));
  const link = (von: string) => `/admin/bookings?von=${von}${roomFilter ? `&raum=${encodeURIComponent(roomFilter.id)}` : ""}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Reservierungen</h1>
        <p className="mt-1 text-ink-muted">
          Demo-Reservierungen vom Bildschirm, {formatShortCalendarDate(from)} bis {formatShortCalendarDate(addDays(from, DAYS - 1))}
          {roomFilter ? ` · Raum ${roomFilter.code}` : ""}. Stornieren gibt den Zeitraum sofort frei.
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-line bg-surface px-5 py-4">
        <nav aria-label="Zeitraum" className="flex flex-wrap gap-2">
          <Link href={link(addDays(from, -DAYS))} className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 font-semibold hover:bg-canvas">← Vorherige 14 Tage</Link>
          <Link href={link(today)} className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 font-semibold hover:bg-canvas">Ab heute</Link>
          <Link href={link(addDays(from, DAYS))} className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 font-semibold hover:bg-canvas">Nächste 14 Tage →</Link>
        </nav>
        <form method="get" className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="von-filter" className="text-sm font-semibold">Ab Datum</label>
            <input id="von-filter" type="date" name="von" defaultValue={from} className="min-h-11 rounded-lg border border-line bg-surface px-3" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="raum-filter" className="text-sm font-semibold">Raum</label>
            <select id="raum-filter" name="raum" defaultValue={roomFilter?.id ?? ""} className="min-h-11 rounded-lg border border-line bg-surface px-3">
              <option value="">Alle Räume</option>
              {FLOORS.map((floor) => {
                const options = allRooms.filter((r) => r.floorId === floor.id);
                return options.length ? (
                  <optgroup key={floor.id} label={floor.label}>
                    {options.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.code} – {r.name}{r.archivedAt ? " (archiviert)" : ""}
                      </option>
                    ))}
                  </optgroup>
                ) : null;
              })}
            </select>
          </div>
          <button type="submit" className="min-h-11 rounded-lg border border-ink px-4 font-semibold hover:bg-canvas">Anzeigen</button>
        </form>
      </div>

      {bookings.length === 0 ? (
        <p role="status" className="rounded-xl border border-dashed border-line bg-surface p-6 text-center text-ink-muted">
          In diesem Zeitraum gibt es keine Reservierungen{roomFilter ? " für diesen Raum" : ""}.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-left">
            <caption className="sr-only">Reservierungen</caption>
            <thead className="bg-canvas text-sm">
              <tr>
                <th scope="col" className="px-4 py-2.5">Datum und Zeit</th>
                <th scope="col" className="px-4 py-2.5">Raum</th>
                <th scope="col" className="px-4 py-2.5">Status</th>
                <th scope="col" className="px-4 py-2.5">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const time = `${formatShortCalendarDate(berlinDateOf(new Date(b.startsAt)))}, ${formatBerlinTime(new Date(b.startsAt))}–${formatBerlinTime(new Date(b.endsAt))} Uhr`;
                const ended = b.endsAt <= now;
                return (
                  <tr key={b.id} className="border-t border-line align-top">
                    <td className="px-4 py-3 font-semibold tabular-nums">{time}</td>
                    <td className="px-4 py-3">
                      {b.roomCode} – {roomName.get(b.roomId) ?? ""}
                    </td>
                    <td className="px-4 py-3">
                      {b.status === "cancelled" ? (
                        <span className="flex flex-col items-start gap-1">
                          <Pill tone="danger">Storniert</Pill>
                          {b.cancelledAt && <span className="text-sm text-ink-muted">am {formatBerlinDateTime(b.cancelledAt)}</span>}
                        </span>
                      ) : ended ? (
                        <Pill tone="muted">Vorbei</Pill>
                      ) : (
                        <Pill tone="success">Bestätigt</Pill>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {b.status === "confirmed" && !ended ? <BookingCancelButton id={b.id} label={`${b.roomCode}, ${time}`} /> : <span className="text-ink-muted">–</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

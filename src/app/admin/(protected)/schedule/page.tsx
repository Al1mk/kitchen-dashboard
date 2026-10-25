import type { Metadata } from "next";
import Link from "next/link";
import { Pill } from "@/components/admin/FormParts.tsx";
import { requireAdmin } from "@/lib/auth/request.ts";
import { FLOORS } from "@/lib/rooms/schema.ts";
import { services } from "@/lib/server.ts";
import { addDays, berlinDateOf, berlinDayRange, formatBerlinTime, formatCalendarDate, formatShortCalendarDate, isCalendarDate } from "@/lib/time/berlin.ts";

export const metadata: Metadata = { title: "Stundenplan – Campus Board Verwaltung" };

const DAYS = 7;
const timeRange = (start: string, end: string) => `${formatBerlinTime(new Date(start))}–${formatBerlinTime(new Date(end))}`;

export default async function SchedulePage({ searchParams }: PageProps<"/admin/schedule">) {
  await requireAdmin();
  const query = await searchParams;
  const today = berlinDateOf(new Date());
  const from = typeof query.von === "string" && isCalendarDate(query.von) ? query.von : today;
  const allRooms = services().rooms.list({ includeArchived: true });
  const roomFilter = typeof query.raum === "string" ? allRooms.find((r) => r.id === query.raum) : undefined;
  const activeRooms = allRooms.filter((r) => !r.archivedAt);

  const sessions = services().classSessions.list({
    from: berlinDayRange(from).start,
    to: berlinDayRange(addDays(from, DAYS - 1)).end,
    roomId: roomFilter?.id,
  });
  const days = Array.from({ length: DAYS }, (_, i) => addDays(from, i));
  const byDay = new Map(days.map((d) => [d, sessions.filter((s) => berlinDateOf(new Date(s.startsAt)) === d)]));
  const link = (von: string) => `/admin/schedule?von=${von}${roomFilter ? `&raum=${roomFilter.id}` : ""}`;
  const newHref = `/admin/schedule/new?datum=${from}${roomFilter && !roomFilter.archivedAt ? `&raum=${roomFilter.id}` : ""}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Stundenplan</h1>
          <p className="mt-1 text-ink-muted">
            {formatCalendarDate(from)} bis {formatCalendarDate(addDays(from, DAYS - 1))}
            {roomFilter ? ` · Raum ${roomFilter.code}` : ""}. Änderungen sind nach dem Speichern sofort öffentlich.
          </p>
        </div>
        {activeRooms.length > 0 && (
          <Link href={newHref} className="inline-flex min-h-11 items-center rounded-lg bg-brand px-5 font-semibold text-white hover:bg-brand-strong">
            Neuer Termin
          </Link>
        )}
      </div>

      {activeRooms.length === 0 && (
        <p className="rounded-lg bg-warning-soft px-4 py-3 font-semibold text-warning">
          Es gibt noch keinen aktiven Raum. <Link href="/admin/rooms/new" className="underline underline-offset-4">Legen Sie zuerst einen Raum an.</Link>
        </p>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-line bg-surface px-5 py-4">
        <nav aria-label="Zeitraum" className="flex flex-wrap gap-2">
          <Link href={link(addDays(from, -DAYS))} className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 font-semibold hover:bg-canvas">← Vorherige 7 Tage</Link>
          <Link href={link(today)} className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 font-semibold hover:bg-canvas">Ab heute</Link>
          <Link href={link(addDays(from, DAYS))} className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 font-semibold hover:bg-canvas">Nächste 7 Tage →</Link>
        </nav>
        <form method="get" className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="von" value={from} />
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

      <div className="flex flex-col gap-4">
        {days.map((day) => {
          const list = byDay.get(day)!;
          return (
            <section key={day} aria-labelledby={`tag-${day}`} className="rounded-xl border border-line bg-surface">
              <h2 id={`tag-${day}`} className="border-b border-line bg-canvas px-5 py-2.5 font-display text-lg font-bold">
                {formatShortCalendarDate(day)}
                {day === today && <span className="ml-2 text-sm font-semibold text-brand">Heute</span>}
              </h2>
              {list.length === 0 ? (
                <p className="px-5 py-3 text-ink-muted">Keine Termine.</p>
              ) : (
                <ul>
                  {list.map((s) => (
                    <li key={s.id} className="grid gap-x-4 gap-y-1 border-b border-line px-5 py-3 last:border-0 sm:grid-cols-[8rem_minmax(0,1fr)_12rem]">
                      <span className={`font-semibold tabular-nums ${s.status === "cancelled" ? "text-ink-muted line-through" : ""}`}>
                        {timeRange(s.startsAt, s.endsAt)}
                      </span>
                      <span className="min-w-0">
                        <Link href={`/admin/schedule/${s.id}`} className="font-semibold underline underline-offset-4 [overflow-wrap:anywhere] hover:text-brand">
                          {s.title}
                        </Link>
                        <span className="block text-sm text-ink-muted [overflow-wrap:anywhere]">
                          {s.cohort} · {s.instructor} · {s.term}
                        </span>
                      </span>
                      <span className="flex flex-wrap items-start gap-1.5">
                        <span className="text-sm [overflow-wrap:anywhere]">
                          {s.room.code} – {s.room.name}
                        </span>
                        {s.status === "cancelled" && <Pill tone="danger">Abgesagt</Pill>}
                        {s.room.archived && <Pill tone="muted">Raum archiviert</Pill>}
                        {s.isDemo && <Pill tone="info">Beispieldaten</Pill>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

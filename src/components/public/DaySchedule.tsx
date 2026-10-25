"use client";

import Link from "next/link";
import { FLOOR_LABELS, type PublicRoom } from "@/lib/rooms/schema.ts";
import type { PublicSession } from "@/lib/sessions/schema.ts";
import { addDays, berlinDateOf, formatBerlinTime, formatCalendarDate } from "@/lib/time/berlin.ts";
import { DemoNotice, DemoTag, LoadState } from "./PublicShell.tsx";
import { usePolledJson } from "./usePolledJson.ts";

type ScheduleResponse = { serverTime: string; date: string; room: PublicRoom | null; sessions: PublicSession[] };

const time = (iso: string) => formatBerlinTime(new Date(iso));

/** One day of the public schedule. `date` null means "today" by the server clock. */
export function DaySchedule({ date, roomId }: { date: string | null; roomId: string | null }) {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (roomId) params.set("roomId", roomId);
  const { data, failed, receivedAt, retry } = usePolledJson<ScheduleResponse>(`/api/public/schedule?${params}`);

  const shownDate = data?.date ?? date;
  const today = data ? berlinDateOf(new Date(data.serverTime)) : null;
  const href = (day: string | null) => {
    const q = new URLSearchParams();
    if (day) q.set("datum", day);
    if (roomId) q.set("raum", roomId);
    return `/schedule${q.size ? `?${q}` : ""}`;
  };
  const now = data ? data.serverTime : null;

  return (
    <div className="flex flex-col gap-5" data-testid="day-schedule">
      {shownDate && (
        <div className="flex flex-col gap-3">
          <p className="font-display text-2xl font-bold">
            {formatCalendarDate(shownDate)}
            {shownDate === today && <span className="ml-2 text-brand">· Heute</span>}
          </p>
          <nav aria-label="Tag wählen" className="grid grid-cols-3 gap-2">
            <Link href={href(addDays(shownDate, -1))} className="flex min-h-14 touch-manipulation items-center justify-center rounded-xl border border-line bg-surface px-3 font-semibold">
              ← Vortag
            </Link>
            <Link href={href(null)} className="flex min-h-14 touch-manipulation items-center justify-center rounded-xl border border-line bg-surface px-3 font-semibold">
              Heute
            </Link>
            <Link href={href(addDays(shownDate, 1))} className="flex min-h-14 touch-manipulation items-center justify-center rounded-xl border border-line bg-surface px-3 font-semibold">
              Folgetag →
            </Link>
          </nav>
        </div>
      )}

      {data?.room && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface px-5 py-3">
          <p className="font-semibold [overflow-wrap:anywhere]">
            Raum {data.room.code} – {data.room.name} ({FLOOR_LABELS[data.room.floorId] ?? data.room.floorId})
          </p>
          <Link href={href(date)} className="inline-flex min-h-14 touch-manipulation items-center rounded-xl border border-ink px-4 font-semibold">
            Alle Räume
          </Link>
        </div>
      )}

      <LoadState loading={!data} failed={failed} receivedAt={receivedAt} retry={retry} what="Termine" />

      {data && data.sessions.length === 0 && (
        <div role="status" className="rounded-xl border border-dashed border-line bg-surface p-8 text-center">
          <p className="font-semibold">An diesem Tag sind keine Termine eingetragen.</p>
          <p className="mt-1 text-ink-muted">Änderungen erscheinen hier automatisch.</p>
        </div>
      )}
      {data?.sessions.some((s) => s.isDemo) && <DemoNotice />}

      {data && data.sessions.length > 0 && (
        <ol className="flex flex-col gap-3">
          {data.sessions.map((s) => {
            const cancelled = s.status === "cancelled";
            const running = !cancelled && now !== null && s.startsAt <= now && now < s.endsAt;
            return (
              <li key={s.id}>
                <article
                  aria-labelledby={`termin-${s.id}`}
                  className={`grid gap-x-5 gap-y-1 rounded-xl bg-surface p-5 shadow-sm sm:grid-cols-[9rem_minmax(0,1fr)] ${cancelled ? "opacity-80" : ""} ${running ? "outline-3 outline-brand" : ""}`}
                >
                  <p className={`font-display text-2xl font-bold tabular-nums ${cancelled ? "text-ink-muted line-through" : ""}`}>
                    {time(s.startsAt)}–{time(s.endsAt)}
                  </p>
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 id={`termin-${s.id}`} className="text-xl font-bold [overflow-wrap:anywhere]">
                        {s.title}
                      </h2>
                      {cancelled && <span className="rounded-full bg-danger-soft px-2.5 py-0.5 text-sm font-bold text-danger">Entfällt</span>}
                      {running && <span className="rounded-full bg-brand px-2.5 py-0.5 text-sm font-bold text-white">Läuft gerade</span>}
                      {s.isDemo && <DemoTag />}
                    </div>
                    <p className="[overflow-wrap:anywhere]">
                      Raum <strong>{s.room.code}</strong> – {s.room.name} · {FLOOR_LABELS[s.room.floorId] ?? s.room.floorId}
                    </p>
                    <p className="text-ink-muted [overflow-wrap:anywhere]">
                      {s.cohort} · {s.instructor}
                    </p>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

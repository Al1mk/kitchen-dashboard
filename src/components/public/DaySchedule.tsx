"use client";

import Link from "next/link";
import { fallbackLevel, localize, PUBLIC_TEXT, publicHref, type Lang } from "@/lib/i18n/public.ts";
import type { PublicRoom } from "@/lib/rooms/schema.ts";
import type { PublicSession } from "@/lib/sessions/schema.ts";
import { addDays, berlinDateOf, formatBerlinTime, formatCalendarDate } from "@/lib/time/berlin.ts";
import { DemoNotice, DemoTag, FallbackTag, LoadState } from "./PublicShell.tsx";
import { usePolledJson } from "./usePolledJson.ts";

type ScheduleResponse = { serverTime: string; date: string; room: PublicRoom | null; sessions: PublicSession[] };

const time = (iso: string) => formatBerlinTime(new Date(iso));

/** One day of the public schedule. `date` null means "today" by the server clock. */
export function DaySchedule({ date, roomId, lang }: { date: string | null; roomId: string | null; lang: Lang }) {
  const t = PUBLIC_TEXT[lang];
  const floor = (id: string) => t.floors[id as keyof typeof t.floors] ?? id;
  // Room names follow the language (German if no English name). The fallback
  // marker sits beside the room name: in the header when one room is selected,
  // otherwise in each session row. Course title, lecturer and study group are
  // never translated, so they are never marked.
  const roomName = (room: { name: string; nameEn: string | null }) => localize(room.name, room.nameEn, lang);
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (roomId) params.set("roomId", roomId);
  const { data, failed, receivedAt, retry } = usePolledJson<ScheduleResponse>(`/api/public/schedule?${params}`);
  const headerName = data?.room ? roomName(data.room) : null;

  const shownDate = data?.date ?? date;
  const today = data ? berlinDateOf(new Date(data.serverTime)) : null;
  // Day links keep the room and the language; "all rooms" keeps the day.
  const href = (day: string | null, room: string | null = roomId) => publicHref("/schedule", lang, { datum: day, raum: room });
  const now = data ? data.serverTime : null;

  return (
    <div className="flex flex-col gap-5" data-testid="day-schedule">
      {shownDate && (
        <div className="flex flex-col gap-3">
          <p className="font-display text-2xl font-bold">
            {formatCalendarDate(shownDate, lang)}
            {shownDate === today && <span className="ml-2 text-brand">· {t.schedule.today}</span>}
          </p>
          <nav aria-label={t.schedule.chooseDay} className="grid grid-cols-3 gap-2">
            <Link href={href(addDays(shownDate, -1))} className="flex min-h-14 touch-manipulation items-center justify-center rounded-xl border border-line bg-surface px-3 font-semibold">
              {t.schedule.previousDay}
            </Link>
            <Link href={href(null)} className="flex min-h-14 touch-manipulation items-center justify-center rounded-xl border border-line bg-surface px-3 font-semibold">
              {t.schedule.today}
            </Link>
            <Link href={href(addDays(shownDate, 1))} className="flex min-h-14 touch-manipulation items-center justify-center rounded-xl border border-line bg-surface px-3 font-semibold">
              {t.schedule.nextDay}
            </Link>
          </nav>
        </div>
      )}

      {data?.room && headerName && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface px-5 py-3">
          <p className="font-semibold [overflow-wrap:anywhere]">
            {t.schedule.room} {data.room.code} – <span lang={headerName.lang}>{headerName.text}</span> ({floor(data.room.floorId)})
          </p>
          <FallbackTag lang={lang} level={fallbackLevel([headerName])} />
          <Link href={href(date, null)} className="inline-flex min-h-14 touch-manipulation items-center rounded-xl border border-ink px-4 font-semibold">
            {t.schedule.allRooms}
          </Link>
        </div>
      )}

      <LoadState loading={!data} failed={failed} receivedAt={receivedAt} retry={retry} what="sessions" lang={lang} />

      {data && data.sessions.length === 0 && (
        <div role="status" className="rounded-xl border border-dashed border-line bg-surface p-8 text-center">
          <p className="font-semibold">{t.schedule.empty}</p>
          <p className="mt-1 text-ink-muted">{t.schedule.emptyHint}</p>
        </div>
      )}
      {data?.sessions.some((s) => s.isDemo) && <DemoNotice lang={lang} />}

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
                      <h2 id={`termin-${s.id}`} lang="de" className="text-xl font-bold [overflow-wrap:anywhere]">
                        {s.title}
                      </h2>
                      {cancelled && <span className="rounded-full bg-danger-soft px-2.5 py-0.5 text-sm font-bold text-danger">{t.schedule.cancelled}</span>}
                      {running && <span className="rounded-full bg-brand px-2.5 py-0.5 text-sm font-bold text-white">{t.schedule.running}</span>}
                      {s.isDemo && <DemoTag lang={lang} />}
                    </div>
                    <p className="[overflow-wrap:anywhere]">
                      {t.schedule.room} <strong>{s.room.code}</strong> – <span lang={roomName(s.room).lang}>{roomName(s.room).text}</span>
                      {!data.room && (
                        <>
                          {" "}
                          <FallbackTag lang={lang} level={fallbackLevel([roomName(s.room)])} />
                        </>
                      )}{" "}
                      · {floor(s.room.floorId)}
                    </p>
                    <p lang="de" className="text-ink-muted [overflow-wrap:anywhere]">
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

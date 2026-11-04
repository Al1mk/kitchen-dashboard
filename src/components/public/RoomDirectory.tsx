"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { fallbackLevel, localize, PUBLIC_TEXT, publicHref, type Lang } from "@/lib/i18n/public.ts";
import { FLOORS, type PublicRoom } from "@/lib/rooms/schema.ts";
import { isBlankQuery, roomMatches, sessionMatches } from "@/lib/search/match.ts";
import { searchResultsLayout, type ClassState } from "@/lib/search/results-layout.ts";
import type { PublicSession } from "@/lib/sessions/schema.ts";
import { addDays, formatBerlinTime, formatCalendarDate, isCalendarDate } from "@/lib/time/berlin.ts";
import { DemoNotice, DemoTag, FallbackTag, LoadState } from "./PublicShell.tsx";
import { usePolledJson } from "./usePolledJson.ts";

// Public room directory with search (T32) and a course/lecturer search for one
// day (classroom part of T33). Rooms come from /api/public/rooms, classes from
// /api/public/schedule?date=; both keep polling. The query and the day live in
// component state (polling never resets them) and are mirrored to the URL
// (?suche=, ?datum=) so Back/Forward, reload and the language switch restore
// the search; a navigation to another URL replaces the state (SEARCH-R001). A class result is
// the room of that class on that day, not an office or a person's location.
// V2 Stage 2 (AL-04, docs/contracts.md C11): floor chips jump to a floor (kiosk: they stay at the top of the
// screen), a room card keeps its actions in one row, and when no room matches but classes do, the classes
// lead and no "no room found" box contradicts them (src/lib/search/results-layout.ts).

const copy = {
  de: {
    search: "Raum, Lehrperson oder Lehrveranstaltung suchen",
    hint: "Raumnummer (z. B. K1-105 oder 105), Raumname, Lehrperson oder Lehrveranstaltung.",
    placeholder: "z. B. K1-105, Seminarraum, Zagel oder HCI",
    clear: "Suche löschen",
    roomsTitle: "Passende Räume",
    rooms: (n: number) => (n === 1 ? "1 Raum" : `${n} Räume`),
    noRooms: (q: string) => `Kein Raum passt zu „${q}“. Prüfe Raumnummer oder Schreibweise.`,
    classesTitle: "Passende Lehrveranstaltungen",
    classes: (n: number) => (n === 1 ? "1 Termin" : `${n} Termine`),
    classesScope: "Die Suche gilt nur für diesen Tag.",
    classesNote: "Gezeigt wird der Raum, in dem die Lehrveranstaltung an diesem Tag stattfindet – kein Büro und kein aktueller Aufenthaltsort einer Person.",
    seeClasses: (q: string) => `Kein Raum passt zu „${q}“ – die Treffer stehen oben bei den Lehrveranstaltungen.`,
    jump: "Zum Stockwerk springen",
    day: "Tag der Lehrveranstaltungen",
    noClasses: (q: string, day: string) => `Am ${day} gibt es keine Lehrveranstaltung, die zu „${q}“ passt.`,
    noClassesHint: "Wähle einen anderen Tag oder prüfe die Schreibweise.",
    lecturer: "Lehrperson",
    roomGone: "Dieser Raum ist nicht mehr im Raumverzeichnis.",
    schedule: "Termine in diesem Raum",
  },
  en: {
    search: "Search for a room, lecturer or course",
    hint: "Room number (e.g. K1-105 or 105), room name, lecturer or course.",
    placeholder: "e.g. K1-105, seminar room, Zagel or HCI",
    clear: "Clear search",
    roomsTitle: "Matching rooms",
    rooms: (n: number) => (n === 1 ? "1 room" : `${n} rooms`),
    noRooms: (q: string) => `No room matches “${q}”. Check the room number or spelling.`,
    classesTitle: "Matching classes",
    classes: (n: number) => (n === 1 ? "1 class" : `${n} classes`),
    classesScope: "The search covers this one day only.",
    classesNote: "The room shown is where the class takes place on that day – not an office and not where a person is right now.",
    seeClasses: (q: string) => `No room matches “${q}” – your results are the classes above.`,
    jump: "Jump to a floor",
    day: "Day of the classes",
    noClasses: (q: string, day: string) => `On ${day} there is no class matching “${q}”.`,
    noClassesHint: "Choose another day or check the spelling.",
    lecturer: "Lecturer",
    roomGone: "This room is no longer in the room directory.",
    schedule: "Classes in this room",
  },
} as const;

const QUERY_MAX = 100;

/** Search text and day as given by a URL; `key` identifies the pair. */
function fromUrl(params: { get(name: string): string | null }) {
  const query = (params.get("suche") ?? "").slice(0, QUERY_MAX);
  const value = params.get("datum");
  const date = value && isCalendarDate(value) ? value : null;
  return { query, date, key: `${query}\n${date ?? ""}` };
}

export function RoomDirectory({ lang }: { lang: Lang }) {
  const t = PUBLIC_TEXT[lang];
  const c = copy[lang];
  const searchParams = useSearchParams();
  const { data, failed, receivedAt, retry } = usePolledJson<{ serverTime: string; rooms: PublicRoom[] }>("/api/public/rooms");
  const rooms = data?.rooms ?? [];
  const incoming = fromUrl(searchParams);
  const [query, setQuery] = useState(incoming.query);
  const [date, setDate] = useState<string | null>(incoming.date);
  const input = useRef<HTMLInputElement>(null);
  const searching = !isBlankQuery(query);
  const found = searching ? rooms.filter((r) => roomMatches(r, query)) : rooms;
  // The class group reports whether it is loading / failed / empty / has matches, so the order of the two
  // result groups and the room group's message can follow it (results-layout.ts). It reports "loading" again
  // when it unmounts (the search ended), so the next search starts from the loading state.
  const [classState, setClassState] = useState<ClassState>("loading");
  const layout = searchResultsLayout(found.length, classState);

  // URL <-> state (SEARCH-R001). Typing and day changes are mirrored into the
  // current history entry with history.replaceState (no navigation; Next.js
  // reports the new URL through useSearchParams). Every URL we write is queued
  // in `written` until it comes back. A URL that comes back but was not written
  // here is a navigation (Back/Forward, language switch, bare /rooms link): it
  // wins, and the local state is replaced instead of being written over it.
  const seenKey = useRef(incoming.key);
  const written = useRef<string[]>([]);
  useEffect(() => {
    if (incoming.key !== seenKey.current) {
      seenKey.current = incoming.key;
      const echo = written.current.indexOf(incoming.key);
      if (echo === -1) {
        written.current = [];
        setQuery(incoming.query);
        setDate(incoming.date);
        return; // the next render mirrors nothing: state and URL agree
      }
      written.current.splice(0, echo + 1);
    }
    const want = new URLSearchParams();
    if (searching) want.set("suche", query);
    if (date) want.set("datum", date);
    if (lang !== "de") want.set("lang", lang);
    if (new URLSearchParams(window.location.search).toString() !== want.toString()) {
      written.current.push(fromUrl(want).key);
      window.history.replaceState(null, "", want.size ? `${window.location.pathname}?${want}` : window.location.pathname);
    }
  }, [incoming.key, incoming.query, incoming.date, query, date, lang, searching]);

  function clear() {
    setQuery("");
    input.current?.focus();
  }

  return (
    <div className="flex flex-col gap-5" data-testid="room-directory">
      <form role="search" onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-2">
        <label htmlFor="room-search" className="font-bold">
          {c.search}
        </label>
        <p id="room-search-hint" className="text-base text-ink-muted">
          {c.hint}
        </p>
        <div className="flex gap-2">
          <input
            ref={input}
            id="room-search"
            type="search"
            value={query}
            maxLength={QUERY_MAX}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={c.placeholder}
            aria-describedby="room-search-hint"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            className="min-h-14 w-full rounded-xl border border-ink bg-surface px-4 text-lg"
          />
          {query && (
            <button type="button" onClick={clear} className="min-h-14 shrink-0 touch-manipulation rounded-xl border border-ink px-4 font-semibold">
              {c.clear}
            </button>
          )}
        </div>
      </form>

      <LoadState loading={!data} failed={failed} receivedAt={receivedAt} retry={retry} what="rooms" lang={lang} />
      {data && rooms.length === 0 && (
        <div role="status" className="rounded-xl border border-dashed border-line bg-surface p-8 text-center">
          <p className="font-semibold">{t.rooms.empty}</p>
          <p className="mt-1 text-ink-muted">{t.rooms.emptyHint}</p>
        </div>
      )}
      {rooms.some((r) => r.isDemo) && <DemoNotice lang={lang} />}

      {!searching && <RoomsByFloor rooms={rooms} lang={lang} headingLevel={2} />}

      {/* Both groups keep their key, so React moves them instead of remounting: the class request and its
          polling are not restarted when the order changes. */}
      {searching &&
        orderGroups(layout.first, [
          data && rooms.length > 0 ? (
            <section key="rooms" aria-labelledby="search-rooms-title" data-testid="search-rooms" className="flex flex-col gap-3">
              <h2 id="search-rooms-title" className="font-display text-2xl font-bold">
                {c.roomsTitle} <span className="text-lg font-semibold text-ink-muted">· {c.rooms(found.length)}</span>
              </h2>
              {found.length === 0 && layout.roomsNote !== "none" && (
                <p role="status" className="rounded-xl border border-dashed border-line bg-surface p-5">
                  {layout.roomsNote === "see-classes" ? c.seeClasses(query.trim()) : c.noRooms(query.trim())}
                </p>
              )}
              <RoomsByFloor rooms={found} lang={lang} headingLevel={3} />
            </section>
          ) : null,
          <ClassMatches
            key="classes"
            lang={lang}
            query={query}
            date={date}
            onDate={setDate}
            onState={setClassState}
            activeRoomIds={data ? new Set(rooms.map((r) => r.id)) : null}
          />,
        ])}
    </div>
  );
}

/** Rooms first or classes first (rooms = element 0, classes = element 1). */
function orderGroups(first: "rooms" | "classes", groups: [ReactNode, ReactNode]): ReactNode[] {
  return first === "rooms" ? [groups[0], groups[1]] : [groups[1], groups[0]];
}

const chip = "flex min-h-14 touch-manipulation items-center justify-center rounded-xl border border-ink bg-surface px-3 text-center font-semibold leading-tight active:bg-neutral-soft";

/**
 * One chip per floor that has rooms in the list below. A tap scrolls that floor's heading to just under the
 * chips, moves focus to the heading (so keyboard and screen-reader users arrive there) and changes neither the
 * URL nor the history. In public kiosk mode the chips stay at the top of the screen while the long list
 * scrolls; the dock sits at the bottom, so neither covers the other.
 */
function FloorJump({ floors, lang }: { floors: { id: string; label: string }[]; lang: Lang }) {
  const bar = useRef<HTMLDivElement>(null);
  function jump(id: string) {
    const heading = document.getElementById(`stock-${id}`);
    if (!heading) return;
    const stuck = bar.current && getComputedStyle(bar.current).position === "sticky" ? bar.current.getBoundingClientRect().height : 0;
    const top = heading.getBoundingClientRect().top + window.scrollY - stuck - 12;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: Math.max(0, top), behavior: calm ? "auto" : "smooth" });
    heading.focus({ preventScroll: true });
  }
  return (
    <div ref={bar} data-testid="floor-jump" role="group" aria-label={copy[lang].jump} className="z-30 -mx-1 bg-canvas px-1 py-2 kiosk:sticky kiosk:top-0">
      <div className="grid grid-cols-2 gap-2 min-[520px]:grid-cols-4">
        {floors.map((floor) => (
          <button key={floor.id} type="button" onClick={() => jump(floor.id)} className={chip}>
            {floor.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Room cards grouped by floor, with floor chips when there is more than one floor. */
function RoomsByFloor({ rooms, lang, headingLevel }: { rooms: PublicRoom[]; lang: Lang; headingLevel: 2 | 3 }) {
  const t = PUBLIC_TEXT[lang];
  const FloorHeading = headingLevel === 2 ? "h2" : "h3";
  const RoomHeading = headingLevel === 2 ? "h3" : "h4";
  const floors = FLOORS.filter((floor) => rooms.some((r) => r.floorId === floor.id));
  const action = "inline-flex min-h-14 touch-manipulation items-center justify-center rounded-xl px-3 text-center font-semibold leading-tight min-[520px]:flex-1";
  return (
    <div className="flex flex-col gap-5">
      {floors.length > 1 && <FloorJump floors={floors.map((f) => ({ id: f.id, label: t.floors[f.id] }))} lang={lang} />}
      {floors.map((floor) => {
        const onFloor = rooms.filter((r) => r.floorId === floor.id);
        return (
          <section key={floor.id} aria-labelledby={`stock-${floor.id}`} className="flex flex-col gap-3">
            <FloorHeading id={`stock-${floor.id}`} tabIndex={-1} className="font-display text-2xl font-bold focus:outline-none focus-visible:outline-3">
              {t.floors[floor.id]}
            </FloorHeading>
            <ul className="flex flex-col gap-3">
              {onFloor.map((room) => {
                const name = localize(room.name, room.nameEn, lang);
                const description = localize(room.description, room.descriptionEn, lang);
                return (
                  <li key={room.id}>
                    <article className="flex flex-col gap-2 rounded-xl bg-surface p-5 shadow-sm" aria-labelledby={`raum-${room.id}`} data-room-id={room.id}>
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <RoomHeading id={`raum-${room.id}`} className="font-display text-2xl font-bold [overflow-wrap:anywhere]">
                          {room.code}{" "}
                          <span lang={name.lang} className="font-sans text-xl font-semibold">
                            {name.text}
                          </span>
                        </RoomHeading>
                        <FallbackTag lang={lang} level={fallbackLevel([name, description])} />
                        {room.isDemo && <DemoTag lang={lang} />}
                      </div>
                      <p className="text-ink-muted">{t.roomTypes[room.type] ?? t.roomFallback}</p>
                      {description.text && (
                        <p lang={description.lang} className="whitespace-pre-line [overflow-wrap:anywhere]">
                          {description.text}
                        </p>
                      )}
                      {/* The actions share one row from 520 px up (the kiosk threshold; stacked on phones, as before).
                          Labels may wrap to two lines; their size is not reduced. */}
                      <div className="mt-1 flex flex-col gap-2 min-[520px]:flex-row">
                        <Link href={publicHref("/schedule", lang, { raum: room.id })} className={`${action} border border-ink hover:bg-canvas`}>
                          {t.rooms.todayInRoom}
                        </Link>
                        <Link href={publicHref("/map", lang, { raum: room.id })} className={`${action} border border-ink hover:bg-canvas`}>
                          {t.rooms.onMap}
                        </Link>
                        {room.reservable && (
                          <Link href={publicHref("/booking", lang, { raum: room.id })} className={`${action} bg-brand text-white hover:bg-brand-strong`}>
                            {t.rooms.book}
                          </Link>
                        )}
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

type ScheduleResponse = { serverTime: string; date: string; sessions: PublicSession[] };

const time = (iso: string) => formatBerlinTime(new Date(iso));

/**
 * Classes of one day whose course title or lecturer matches. Mounted only
 * while a query is typed. `date` null = today by the server clock (Berlin).
 * A response for another day is never shown (usePolledJson keys by URL), and
 * a failed request shows the error state, never "no classes".
 */
function ClassMatches({
  lang,
  query,
  date,
  onDate,
  onState,
  activeRoomIds,
}: {
  lang: Lang;
  query: string;
  date: string | null;
  onDate: (date: string | null) => void;
  onState: (state: ClassState) => void;
  activeRoomIds: Set<string> | null;
}) {
  const t = PUBLIC_TEXT[lang];
  const c = copy[lang];
  const { data, failed, receivedAt, retry } = usePolledJson<ScheduleResponse>(date ? `/api/public/schedule?date=${date}` : "/api/public/schedule");
  const shownDate = data?.date ?? date;
  const matches = data ? data.sessions.filter((s) => sessionMatches(s, query)) : [];
  const state: ClassState = !data ? (failed ? "failed" : "loading") : matches.length > 0 ? "some" : "none";
  useEffect(() => onState(state), [state, onState]);
  useEffect(() => () => onState("loading"), [onState]);
  const floor = (id: string) => t.floors[id as keyof typeof t.floors] ?? id;
  const dayButton = "flex min-h-14 touch-manipulation items-center justify-center rounded-xl border border-line bg-surface px-3 font-semibold disabled:opacity-40";

  return (
    <section aria-labelledby="search-classes-title" data-testid="search-classes" className="flex flex-col gap-3">
      <h2 id="search-classes-title" className="font-display text-2xl font-bold">
        {c.classesTitle}
        {shownDate && <span className="text-lg font-semibold text-ink-muted"> · {formatCalendarDate(shownDate, lang)}</span>}
        {data && <span className="text-lg font-semibold text-ink-muted"> · {c.classes(matches.length)}</span>}
      </h2>
      <p className="text-base text-ink-muted">
        <span className="font-semibold text-ink">{c.classesScope}</span> {c.classesNote}
      </p>

      <div className="flex flex-col gap-2">
        <label htmlFor="search-day" className="font-bold">
          {c.day}
        </label>
        <input
          id="search-day"
          type="date"
          value={shownDate ?? ""}
          onChange={(e) => onDate(isCalendarDate(e.target.value) ? e.target.value : null)}
          className="min-h-14 w-full rounded-xl border border-ink bg-surface px-4 text-lg sm:w-fit"
        />
        <div role="group" aria-label={t.schedule.chooseDay} className="grid grid-cols-3 gap-2">
          <button type="button" disabled={!shownDate} onClick={() => shownDate && onDate(addDays(shownDate, -1))} className={dayButton}>
            {t.schedule.previousDay}
          </button>
          <button type="button" onClick={() => onDate(null)} className={dayButton}>
            {t.schedule.today}
          </button>
          <button type="button" disabled={!shownDate} onClick={() => shownDate && onDate(addDays(shownDate, 1))} className={dayButton}>
            {t.schedule.nextDay}
          </button>
        </div>
      </div>

      <LoadState loading={!data} failed={failed} receivedAt={receivedAt} retry={retry} what="sessions" lang={lang} />

      {data && matches.length === 0 && (
        <div role="status" className="rounded-xl border border-dashed border-line bg-surface p-5">
          <p className="font-semibold">{c.noClasses(query.trim(), formatCalendarDate(data.date, lang))}</p>
          <p className="mt-1 text-ink-muted">{c.noClassesHint}</p>
        </div>
      )}

      {data && matches.length > 0 && (
        <ol className="flex flex-col gap-3">
          {matches.map((s) => {
            const cancelled = s.status === "cancelled";
            const roomName = localize(s.room.name, s.room.nameEn, lang);
            const roomListed = !activeRoomIds || activeRoomIds.has(s.room.id);
            return (
              <li key={s.id}>
                <article aria-labelledby={`treffer-${s.id}`} data-testid="class-match" data-status={s.status} className={`flex flex-col gap-2 rounded-xl bg-surface p-5 shadow-sm ${cancelled ? "opacity-80" : ""}`}>
                  <p className={`font-display text-2xl font-bold tabular-nums ${cancelled ? "text-ink-muted line-through" : ""}`}>
                    {time(s.startsAt)}–{time(s.endsAt)}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 id={`treffer-${s.id}`} lang="de" className="text-xl font-bold [overflow-wrap:anywhere]">
                      {s.title}
                    </h3>
                    {cancelled && <span className="rounded-full bg-danger-soft px-2.5 py-0.5 text-sm font-bold text-danger">{t.schedule.cancelled}</span>}
                    {s.isDemo && <DemoTag lang={lang} />}
                  </div>
                  <p className="[overflow-wrap:anywhere]">
                    {c.lecturer}: <span lang="de">{s.instructor}</span>
                  </p>
                  <p className="[overflow-wrap:anywhere]">
                    {t.schedule.room} <strong>{s.room.code}</strong> – <span lang={roomName.lang}>{roomName.text}</span>{" "}
                    <FallbackTag lang={lang} level={fallbackLevel([roomName])} /> · {floor(s.room.floorId)}
                  </p>
                  {roomListed ? (
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={publicHref("/map", lang, { raum: s.room.id, datum: data.date })}
                        className="inline-flex min-h-14 touch-manipulation items-center rounded-xl border border-ink px-5 font-semibold hover:bg-canvas"
                      >
                        {t.rooms.onMap}
                      </Link>
                      <Link
                        href={publicHref("/schedule", lang, { datum: data.date, raum: s.room.id })}
                        className="inline-flex min-h-14 touch-manipulation items-center rounded-xl border border-ink px-5 font-semibold hover:bg-canvas"
                      >
                        {c.schedule}
                      </Link>
                    </div>
                  ) : (
                    <p className="text-ink-muted">{c.roomGone}</p>
                  )}
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { fallbackLevel, localize, PUBLIC_TEXT, publicHref, type Lang } from "@/lib/i18n/public.ts";
import { MAP_FLOORS, mapFloor, markerFor } from "@/lib/map/config.ts";
import { FLOORS, type FloorId, type PublicRoom } from "@/lib/rooms/schema.ts";
import { DemoNotice, DemoTag, FallbackTag, LoadState } from "./PublicShell.tsx";
import { usePolledJson } from "./usePolledJson.ts";

// Campus map inside the shared public shell (T11). Interaction concept, floor
// illustrations and positions by Aryan (public/map-demo, kept as provenance);
// adapted by Ali to the live room API: names, floors and the booking flag
// come from /api/public/rooms, positions are bound to stable room ids
// (src/lib/map/config.ts), and context lives in the URL (raum, etage, lang).

const copy = {
  de: {
    intro: "Wähle ein Stockwerk, tippe auf eine Markierung oder suche nach Raumnummer oder Name.",
    disclaimer: "Hinweis: Die Pläne sind KI-generierte Illustrationen aus dem Team-Prototyp, kein geprüfter Gebäudeplan und kein Fluchtplan. Positionen beziehen sich auf die Bilder.",
    floors: "Stockwerk wählen",
    search: "Raum suchen",
    searchPlaceholder: "z. B. K1-120, 120 oder Seminarraum",
    clear: "Suche löschen",
    noResults: "Kein Raum gefunden. Prüfe die Raumnummer oder wähle ein anderes Stockwerk.",
    results: (n: number) => (n === 1 ? "1 Raum" : `${n} Räume`),
    map: (floor: string) => `Plan ${floor}, verschiebbar`,
    imageAlt: (floor: string) => `Illustration ${floor} (kein geprüfter Gebäudeplan)`,
    noImage: "Für dieses Stockwerk gibt es keinen Plan. Die Räume stehen in der Liste.",
    imageError: "Der Plan kann gerade nicht geladen werden. Die Räume stehen weiterhin in der Liste.",
    zoomIn: "Vergrößern",
    zoomOut: "Verkleinern",
    fit: "Ganzer Plan",
    showOnMap: "Auf dem Plan zeigen",
    selected: "Ausgewählter Raum",
    emptyTitle: "Kein Raum ausgewählt",
    emptyText: "Tippe auf eine Markierung oder einen Raum in der Liste.",
    requestedMissing: "Dieser Raum ist nicht (mehr) in der Raumliste. Es wurde kein anderer Raum ausgewählt.",
    noPosition: "Für diesen Raum ist keine Position auf dem Plan hinterlegt.",
    floorChanged: "Der Raum liegt laut Raumliste jetzt auf einem anderen Stockwerk als im Plan eingezeichnet. Die alte Markierung wird deshalb nicht gezeigt.",
    schedule: "Termine in diesem Raum",
    book: "Diesen Raum reservieren (Demo)",
    notBookable: "Dieser Raum ist nicht für Demo-Reservierungen freigegeben.",
  },
  en: {
    intro: "Choose a floor, tap a marker or search by room number or name.",
    disclaimer: "Note: the plans are AI-generated illustrations from the team prototype, not a verified building or emergency plan. Positions refer to the images.",
    floors: "Choose a floor",
    search: "Search rooms",
    searchPlaceholder: "e.g. K1-120, 120 or seminar room",
    clear: "Clear search",
    noResults: "No room found. Check the room number or choose another floor.",
    results: (n: number) => (n === 1 ? "1 room" : `${n} rooms`),
    map: (floor: string) => `Plan of the ${floor}, scrollable`,
    imageAlt: (floor: string) => `Illustration of the ${floor} (not a verified building plan)`,
    noImage: "There is no plan for this floor. The rooms are in the list.",
    imageError: "The plan cannot be loaded right now. The rooms are still in the list.",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    fit: "Whole plan",
    showOnMap: "Show on the plan",
    selected: "Selected room",
    emptyTitle: "No room selected",
    emptyText: "Tap a marker or a room in the list.",
    requestedMissing: "This room is not (or no longer) in the room list. No other room was selected.",
    noPosition: "No position on the plan is recorded for this room.",
    floorChanged: "According to the room list this room is now on a different floor than drawn in the plan, so the old marker is not shown.",
    schedule: "Classes in this room",
    book: "Book this room (demo)",
    notBookable: "This room is not open for demo bookings.",
  },
} as const;

const normal = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const codeKey = (s: string) => normal(s).replace(/[^a-z0-9]/g, "");
/** Aryan's matching: exact code (also without the "K1-" prefix), or code/name contains the text. */
function isExactCode(room: PublicRoom, term: string) {
  const key = codeKey(term);
  return !!key && (codeKey(room.code) === key || codeKey(room.code.replace(/^K1-/i, "")) === key);
}
function matches(room: PublicRoom, term: string) {
  if (!term) return true;
  return isExactCode(room, term) || normal(`${room.code} ${room.name} ${room.nameEn ?? ""}`).includes(normal(term)) || codeKey(room.code).includes(codeKey(term));
}

const ZOOM_MIN = 1;
const ZOOM_MAX = 3;

export function CampusMap({ lang, initialRoomId, initialFloor, date }: { lang: Lang; initialRoomId: string | null; initialFloor: FloorId | null; date: string | null }) {
  const t = copy[lang];
  const pt = PUBLIC_TEXT[lang];
  const router = useRouter();
  const { data, failed, receivedAt, retry } = usePolledJson<{ serverTime: string; rooms: PublicRoom[] }>("/api/public/rooms");
  const rooms = data?.rooms;
  const [selectedId, setSelectedId] = useState<string | null>(initialRoomId);
  const [floorChoice, setFloorChoice] = useState<FloorId | null>(initialFloor);
  const [query, setQuery] = useState("");
  const [zoom, setZoom] = useState(1);
  const [brokenImage, setBrokenImage] = useState<string | null>(null);
  // URL is the source of context: a link to /map (nav) or another ?raum resets the view.
  const [urlState, setUrlState] = useState({ roomId: initialRoomId, floor: initialFloor });
  if (urlState.roomId !== initialRoomId || urlState.floor !== initialFloor) {
    setUrlState({ roomId: initialRoomId, floor: initialFloor });
    setSelectedId(initialRoomId);
    setFloorChoice(initialFloor);
  }
  const viewport = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);

  // The selection is resolved by id against the *current* room list on every poll.
  const selected = rooms && selectedId ? rooms.find((r) => r.id === selectedId) ?? null : null;
  const selectionMissing = !!rooms && !!selectedId && !selected;
  const floor: FloorId = selected?.floorId ?? floorChoice ?? MAP_FLOORS[0].floorId;
  const floorImage = mapFloor(floor);
  const imageFailed = !!floorImage && brokenImage === floorImage.image;
  const shownFloors = FLOORS.filter((f) => mapFloor(f.id) || rooms?.some((r) => r.floorId === f.id));
  const list = (rooms ?? []).filter((r) => (query ? matches(r, query) : r.floorId === floor));
  const markers = (rooms ?? []).flatMap((room) => {
    if (room.floorId !== floor || !matches(room, query)) return [];
    const marker = markerFor(room);
    return marker.ok ? [{ room, x: marker.position.x, y: marker.position.y }] : [];
  });
  const selectedMarker = selected ? markerFor(selected) : null;

  function syncUrl(roomId: string | null, nextFloor: FloorId | null) {
    router.replace(publicHref("/map", lang, { raum: roomId, etage: roomId ? null : nextFloor, datum: date }), { scroll: false });
  }

  function centerOn(roomId: string) {
    const room = rooms?.find((r) => r.id === roomId);
    const marker = room ? markerFor(room) : null;
    const vp = viewport.current;
    const box = layer.current;
    if (!marker?.ok || !vp || !box) return;
    vp.scrollTo({ left: Math.max(0, box.offsetWidth * marker.position.x - vp.clientWidth / 2), top: Math.max(0, box.offsetHeight * marker.position.y - vp.clientHeight / 2) });
  }

  function select(room: PublicRoom) {
    setSelectedId(room.id);
    setFloorChoice(room.floorId);
    syncUrl(room.id, room.floorId);
    requestAnimationFrame(() => requestAnimationFrame(() => centerOn(room.id)));
  }

  function chooseFloor(id: FloorId) {
    // Changing the floor explicitly clears the room selection and the search.
    setSelectedId(null);
    setFloorChoice(id);
    setQuery("");
    setZoom(1);
    viewport.current?.scrollTo({ left: 0, top: 0 });
    syncUrl(null, id);
  }

  function onSearch(value: string) {
    setQuery(value);
    const exact = rooms?.filter((r) => isExactCode(r, value)) ?? [];
    if (exact.length === 1) select(exact[0]);
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const first = list.find((r) => isExactCode(r, query)) ?? list[0];
    if (first) select(first);
  }

  function zoomBy(change: number) {
    const vp = viewport.current;
    const box = layer.current;
    const next = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.round((zoom + change) * 4) / 4));
    if (next === zoom || !vp || !box) return;
    const rx = (vp.scrollLeft + vp.clientWidth / 2) / box.offsetWidth;
    const ry = (vp.scrollTop + vp.clientHeight / 2) / box.offsetHeight;
    setZoom(next);
    requestAnimationFrame(() => {
      vp.scrollLeft = Math.max(0, rx * box.offsetWidth - vp.clientWidth / 2);
      vp.scrollTop = Math.max(0, ry * box.offsetHeight - vp.clientHeight / 2);
    });
  }

  // A deep link centres the requested room once the data is there.
  const centred = useRef(false);
  useEffect(() => {
    if (centred.current || !selected) return;
    centred.current = true;
    requestAnimationFrame(() => centerOn(selected.id));
  });

  const floorLabel = (id: string) => pt.floors[id as FloorId] ?? id;
  const name = selected ? localize(selected.name, selected.nameEn, lang) : null;
  const description = selected ? localize(selected.description, selected.descriptionEn, lang) : null;

  return (
    <div className="flex flex-col gap-5" data-testid="campus-map">
      <p>{t.intro}</p>
      <p className="rounded-xl border border-warning/40 bg-warning-soft px-4 py-3 text-base text-warning">{t.disclaimer}</p>
      <LoadState loading={!data} failed={failed} receivedAt={receivedAt} retry={retry} what="rooms" lang={lang} />
      {rooms?.some((r) => r.isDemo) && <DemoNotice lang={lang} />}

      <div role="group" aria-label={t.floors} className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {shownFloors.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={f.id === floor}
            onClick={() => chooseFloor(f.id)}
            className={`min-h-14 touch-manipulation rounded-xl px-3 font-semibold ${f.id === floor ? "bg-ink text-white" : "border border-line bg-surface"}`}
          >
            {floorLabel(f.id)}
          </button>
        ))}
      </div>

      <form role="search" onSubmit={submitSearch} className="flex flex-col gap-2">
        <label htmlFor="map-search" className="font-bold">
          {t.search}
        </label>
        <div className="flex gap-2">
          <input
            id="map-search"
            type="search"
            value={query}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            autoComplete="off"
            className="min-h-14 w-full rounded-xl border border-ink bg-surface px-4 text-lg"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="min-h-14 shrink-0 rounded-xl border border-ink px-4 font-semibold">
              {t.clear}
            </button>
          )}
        </div>
      </form>

      <section aria-labelledby="map-floor-title" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="map-floor-title" className="font-display text-2xl font-bold">
            {floorLabel(floor)}
          </h2>
          {floorImage && !imageFailed && (
            <div className="flex gap-2">
              <button type="button" onClick={() => zoomBy(-0.25)} disabled={zoom <= ZOOM_MIN} aria-label={t.zoomOut} className="min-h-14 min-w-14 rounded-xl border border-ink bg-surface text-2xl font-bold disabled:opacity-40">
                −
              </button>
              <button type="button" onClick={() => zoomBy(0.25)} disabled={zoom >= ZOOM_MAX} aria-label={t.zoomIn} className="min-h-14 min-w-14 rounded-xl border border-ink bg-surface text-2xl font-bold disabled:opacity-40">
                +
              </button>
              <button type="button" onClick={() => { setZoom(1); viewport.current?.scrollTo({ left: 0, top: 0 }); }} className="min-h-14 rounded-xl border border-ink bg-surface px-4 font-semibold">
                {t.fit}
              </button>
            </div>
          )}
        </div>
        {!floorImage && <p role="status" className="rounded-xl border border-dashed border-line bg-surface p-6 text-center">{t.noImage}</p>}
        {imageFailed && <p role="alert" className="rounded-xl bg-warning-soft p-4 font-semibold text-warning">{t.imageError}</p>}
        {floorImage && !imageFailed && (
          <div
            ref={viewport}
            tabIndex={0}
            role="region"
            aria-label={t.map(floorLabel(floor))}
            onKeyDown={(e) => {
              if (e.key === "+" || e.key === "=") zoomBy(0.25);
              else if (e.key === "-") zoomBy(-0.25);
            }}
            className="max-h-[70vh] overflow-auto rounded-xl border border-line bg-surface"
          >
            {/* Image and markers share one box: positions are % of the image, never of the page. */}
            <div
              ref={layer}
              data-testid="map-layer"
              className="relative"
              style={{ width: `${zoom * 100}%`, aspectRatio: `${floorImage.width} / ${floorImage.height}` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static illustration with intrinsic size; markers need the exact box */}
              <img
                key={floorImage.image}
                src={floorImage.image}
                alt={t.imageAlt(floorLabel(floor))}
                width={floorImage.width}
                height={floorImage.height}
                onError={() => setBrokenImage(floorImage.image)}
                // The image is server-rendered: an error before hydration fires no React event.
                ref={(img) => {
                  if (img?.complete && img.naturalWidth === 0) setBrokenImage(floorImage.image);
                }}
                className="absolute inset-0 h-full w-full select-none"
                draggable={false}
              />
              {markers.map(({ room, x, y }) => {
                const isSelected = room.id === selected?.id;
                return (
                  <button
                    key={room.id}
                    type="button"
                    data-room-id={room.id}
                    aria-pressed={isSelected}
                    aria-label={`${room.code}, ${localize(room.name, room.nameEn, lang).text}`}
                    onClick={() => select(room)}
                    style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 touch-manipulation rounded-lg border-2 px-1.5 py-0.5 text-xs font-bold whitespace-nowrap shadow ${
                      isSelected ? "z-10 scale-125 border-ink bg-brand text-white" : "border-white bg-ink/85 text-white"
                    }`}
                  >
                    {room.code}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="map-details-title" data-testid="map-details" className="flex flex-col gap-3 rounded-xl border-2 border-line bg-surface p-5">
        <h2 id="map-details-title" className="text-base font-semibold text-ink-muted">
          {t.selected}
        </h2>
        {selectionMissing && (
          <p role="alert" className="rounded-xl bg-warning-soft p-4 font-semibold text-warning">
            {t.requestedMissing}
          </p>
        )}
        {!selected && !selectionMissing && (
          <div>
            <p className="font-display text-2xl font-bold">{t.emptyTitle}</p>
            <p className="text-ink-muted">{t.emptyText}</p>
          </div>
        )}
        {selected && name && description && (
          <>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="font-display text-3xl font-bold [overflow-wrap:anywhere]">
                {selected.code}{" "}
                <span lang={name.lang} className="font-sans text-2xl font-semibold">
                  {name.text}
                </span>
              </p>
              <FallbackTag lang={lang} level={fallbackLevel([name, description])} />
              {selected.isDemo && <DemoTag lang={lang} />}
            </div>
            <p className="text-ink-muted">
              {floorLabel(selected.floorId)} · {pt.roomTypes[selected.type] ?? pt.roomFallback}
            </p>
            {description.text && (
              <p lang={description.lang} className="whitespace-pre-line [overflow-wrap:anywhere]">
                {description.text}
              </p>
            )}
            {selectedMarker && !selectedMarker.ok && (
              <p role="status" className="rounded-xl bg-neutral-soft p-3">
                {selectedMarker.reason === "floor_changed" ? t.floorChanged : selectedMarker.reason === "no_floor_image" ? t.noImage : t.noPosition}
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {selectedMarker?.ok && floorImage && !imageFailed && (
                <button type="button" onClick={() => centerOn(selected.id)} className="min-h-14 rounded-xl border border-ink px-4 font-semibold">
                  {t.showOnMap}
                </button>
              )}
              <Link href={publicHref("/schedule", lang, { raum: selected.id, datum: date })} className="flex min-h-14 items-center justify-center rounded-xl border border-ink px-4 text-center font-semibold">
                {t.schedule}
              </Link>
              {selected.reservable ? (
                <Link href={publicHref("/booking", lang, { raum: selected.id, datum: date })} className="flex min-h-14 items-center justify-center rounded-xl bg-brand px-4 text-center font-bold text-white">
                  {t.book}
                </Link>
              ) : (
                <p className="self-center text-ink-muted">{t.notBookable}</p>
              )}
            </div>
          </>
        )}
      </section>

      {rooms && (
        <section aria-labelledby="map-list-title" className="flex flex-col gap-3">
          <h2 id="map-list-title" className="font-display text-2xl font-bold">
            {query ? t.search : floorLabel(floor)} <span className="text-lg font-semibold text-ink-muted">· {t.results(list.length)}</span>
          </h2>
          {list.length === 0 && <p role="status">{t.noResults}</p>}
          <ul className="grid gap-2 sm:grid-cols-2">
            {list.map((room) => {
              const roomName = localize(room.name, room.nameEn, lang);
              return (
                <li key={room.id}>
                  <button
                    type="button"
                    aria-pressed={room.id === selected?.id}
                    onClick={() => select(room)}
                    className={`flex min-h-14 w-full touch-manipulation flex-col items-start justify-center rounded-xl px-4 py-2 text-left ${
                      room.id === selected?.id ? "bg-ink text-white" : "bg-surface shadow-sm"
                    }`}
                  >
                    <span className="font-bold">{room.code}</span>
                    <span lang={roomName.lang} className="text-base">
                      {roomName.text}
                      {query && ` · ${floorLabel(room.floorId)}`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

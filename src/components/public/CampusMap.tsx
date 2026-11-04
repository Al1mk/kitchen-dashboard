"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { fallbackLevel, localize, PUBLIC_TEXT, publicHref, type Lang } from "@/lib/i18n/public.ts";
import { MAP_FLOORS, mapFloor, markerFor } from "@/lib/map/config.ts";
import { groupMapMarkers } from "@/lib/map/marker-clusters.ts";
import { FLOORS, type FloorId, type PublicRoom } from "@/lib/rooms/schema.ts";
import { isExactRoomCode, roomMatches } from "@/lib/search/match.ts";
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
    chooseNearby: "Nahe Räume auswählen",
    nearbyNote: "Mehrere Raummarkierungen liegen dicht beieinander. Wähle den gewünschten Raum aus dieser Liste.",
    closeNearby: "Auswahl schließen",
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
    chooseNearby: "Choose nearby rooms",
    nearbyNote: "Several room markers are close together. Choose the desired room from this list.",
    closeNearby: "Close room choices",
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

// Aryan's matching (exact code, also without the "K1-" prefix, or code/name
// contains the text), moved to src/lib/search/match.ts so /rooms uses the same rules (T32).
const isExactCode = isExactRoomCode;
const matches = roomMatches;

// Sizing probes share these classes with the actual hit controls. This keeps
// grouping in sync with rem scaling and future size changes, not just zoom.
const PIN_SIZE = "h-11 w-[4.5rem]";
const CLUSTER_SIZE = "h-11 w-11";
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
  const [layerSize, setLayerSize] = useState({ width: 0, height: 0, markerWidth: 0, clusterWidth: 0, targetHeight: 0 });
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);
  // URL is the source of context: a link to /map (nav) or another ?raum resets the view.
  const [urlState, setUrlState] = useState({ roomId: initialRoomId, floor: initialFloor });
  if (urlState.roomId !== initialRoomId || urlState.floor !== initialFloor) {
    setUrlState({ roomId: initialRoomId, floor: initialFloor });
    setSelectedId(initialRoomId);
    setFloorChoice(initialFloor);
  }
  const viewport = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const pinSizer = useRef<HTMLSpanElement>(null);
  const clusterSizer = useRef<HTMLSpanElement>(null);
  const clusterOpener = useRef<HTMLButtonElement | null>(null);
  const detailsHeading = useRef<HTMLHeadingElement>(null);

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
  // Collision checks use the visible map layer at the current zoom; no room
  // coordinate or stable room ID is changed. A cluster is a choice control.
  const pinGroups = groupMapMarkers(markers.map(({ room, x, y }) => ({ id: room.id, x, y, room })), layerSize.width, layerSize.height, { markerWidth: layerSize.markerWidth, clusterWidth: layerSize.clusterWidth, height: layerSize.targetHeight });
  const openGroup = pinGroups.find((g) => g.key === expandedCluster && g.pins.length > 1) ?? null;
  const openGroupKey = openGroup?.key ?? null;
  // An invalidated choice is closed, not remembered for a later poll/resize.
  if (expandedCluster && !openGroup) setExpandedCluster(null);
  const clusterHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const element = layer.current;
    const pin = pinSizer.current;
    const cluster = clusterSizer.current;
    if (!element || !pin || !cluster || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      const pinBox = pin.getBoundingClientRect();
      const clusterBox = cluster.getBoundingClientRect();
      const next = { width: element.clientWidth, height: element.clientHeight, markerWidth: pinBox.width, clusterWidth: clusterBox.width, targetHeight: Math.max(pinBox.height, clusterBox.height) };
      setLayerSize((old) => Object.keys(next).every((key) => old[key as keyof typeof old] === next[key as keyof typeof next]) ? old : next);
    });
    observer.observe(element);
    observer.observe(pin);
    observer.observe(cluster);
    return () => observer.disconnect();
  }, [floor, zoom, imageFailed]);
  // React's ref cleanup runs before the focused subtree is removed. Layout
  // effect cleanup is too late here: activeElement has already become BODY.
  const trackChooser = useCallback((chooser: HTMLElement | null) => {
    if (!chooser) return;
    return () => {
      if (!chooser.contains(document.activeElement)) return;
      requestAnimationFrame(() => {
        // Explicit close/selection or a user's next action takes precedence.
        if (document.activeElement !== document.body) return;
        const opener = clusterOpener.current;
        const target = opener?.isConnected ? opener : viewport.current ?? detailsHeading.current;
        target?.focus({ preventScroll: true });
        target?.scrollIntoView({ block: "center", behavior: "auto" });
      });
    };
  }, []);
  // Make the room chooser discoverable after tapping a marker on a tall kiosk.
  useEffect(() => {
    if (!openGroupKey) return;
    const frame = requestAnimationFrame(() => {
      clusterHeading.current?.focus({ preventScroll: true });
      clusterHeading.current?.scrollIntoView({ block: "center", behavior: "auto" });
    });
    return () => cancelAnimationFrame(frame);
  }, [openGroupKey]);

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
    setExpandedCluster(null);
    setSelectedId(room.id);
    setFloorChoice(room.floorId);
    syncUrl(room.id, room.floorId);
    requestAnimationFrame(() => requestAnimationFrame(() => centerOn(room.id)));
  }

  function closeCluster() {
    setExpandedCluster(null);
    requestAnimationFrame(() => {
      const target = clusterOpener.current?.isConnected ? clusterOpener.current : viewport.current;
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: "center", behavior: "auto" });
    });
  }

  function selectClusterRoom(room: PublicRoom) {
    select(room);
    requestAnimationFrame(() => {
      detailsHeading.current?.focus({ preventScroll: true });
      detailsHeading.current?.scrollIntoView({ block: "center", behavior: "auto" });
    });
  }

  function chooseFloor(id: FloorId) {
    setExpandedCluster(null);
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
    setExpandedCluster(null);
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
              <span ref={pinSizer} aria-hidden="true" className={`pointer-events-none invisible absolute block ${PIN_SIZE}`} />
              <span ref={clusterSizer} aria-hidden="true" className={`pointer-events-none invisible absolute block ${CLUSTER_SIZE}`} />
              {pinGroups.map((group) => {
                const { x, y, pins } = group;
                const isGroup = pins.length > 1;
                const room = pins[0].room;
                const isSelected = pins.some((pin) => pin.room.id === selected?.id);
                return isGroup ? (
                  <button
                    key={group.key}
                    type="button"
                    data-testid="map-cluster"
                    data-room-ids={pins.map((pin) => pin.id).join(" ")}
                    aria-label={`${t.chooseNearby}: ${pins.map((pin) => pin.room.code).join(", ")}`}
                    aria-expanded={expandedCluster === group.key}
                    aria-pressed={isSelected}
                    title={pins.map((pin) => pin.room.code).join(", ")}
                    onClick={(event) => {
                      if (expandedCluster === group.key) closeCluster();
                      else { clusterOpener.current = event.currentTarget; setExpandedCluster(group.key); }
                    }}
                    style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
                    className={`absolute z-[1] flex ${CLUSTER_SIZE} -translate-x-1/2 -translate-y-1/2 touch-manipulation items-center justify-center rounded-xl border-2 px-1 text-sm font-bold shadow ${
                      isSelected ? "border-ink bg-brand text-white" : "border-white bg-ink text-white"
                    }`}
                  >
                    {pins.length}
                  </button>
                ) : (
                  <button
                    key={room.id}
                    type="button"
                    data-room-id={room.id}
                    aria-pressed={isSelected}
                    aria-label={`${room.code}, ${localize(room.name, room.nameEn, lang).text}`}
                    onClick={() => select(room)}
                    title={room.code}
                    style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
                    className={`absolute flex ${PIN_SIZE} -translate-x-1/2 -translate-y-1/2 touch-manipulation items-center justify-center overflow-hidden rounded-lg border-2 px-2 py-1 text-xs font-bold whitespace-nowrap shadow ${
                      isSelected ? "z-10 border-ink bg-brand text-white" : "border-white bg-ink/85 text-white"
                    }`}
                  >
                    <span className="block w-full truncate">{room.code}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {openGroup && (
        <section ref={trackChooser} role="region" aria-label={t.chooseNearby} className="flex flex-col gap-3 rounded-xl border-2 border-ink bg-surface p-4" data-testid="map-cluster-chooser">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 ref={clusterHeading} tabIndex={-1} className="text-xl font-bold">{t.chooseNearby}</h3>
            <button type="button" onClick={closeCluster} className="min-h-11 rounded-xl border border-ink px-4 font-semibold">{t.closeNearby}</button>
          </div>
          <p>{t.nearbyNote}</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {openGroup.pins.map(({ room }) => {
              const localized = localize(room.name, room.nameEn, lang);
              return <li key={room.id}>
                <button type="button" onClick={() => selectClusterRoom(room)} className="flex min-h-14 w-full flex-col justify-center rounded-xl border border-ink bg-surface px-4 py-2 text-left">
                  <span className="font-bold">{room.code}</span>
                  <span lang={localized.lang}>{localized.text}</span>
                  <FallbackTag lang={lang} level={localized.fallback ? "all" : null} />
                </button>
              </li>;
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="map-details-title" data-testid="map-details" className="flex flex-col gap-3 rounded-xl border-2 border-line bg-surface p-5">
        <h2 ref={detailsHeading} tabIndex={-1} id="map-details-title" className="text-base font-semibold text-ink-muted">
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

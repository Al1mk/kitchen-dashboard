"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { BOOKING_POLICY, hhmmToMinutes, minutesToHhmm } from "@/lib/bookings/policy.ts";
import { localize, publicHref, type Lang } from "@/lib/i18n/public.ts";
import type { PublicRoom } from "@/lib/rooms/schema.ts";
import { formatCalendarDate } from "@/lib/time/berlin.ts";
import { BOOKING_COPY, bookingErrorKey, type BookingErrorKey } from "./booking-copy.ts";
import { BookingReceipt, type Receipt } from "./BookingReceipt.tsx";
import { DemoNotice, FallbackTag } from "./PublicShell.tsx";
import { useLeaveGuard } from "./useLeaveGuard.ts";

// Public demo booking flow. Originally supplied by Aryan and Parsa (joint
// package); restructured in the integration (T08, T09, T13):
// - T08: the request (room, date, times, request id, cancel token) is an
//   immutable snapshot taken before sending; the receipt is built from it.
//   While sending or when the outcome is unknown, the selection is locked and
//   leaving asks first. An uncertain outcome is retried with the same snapshot.
// - T09: a requested room (?raum=<id>) is never replaced by another room;
//   availability is keyed by room+date and stale answers are ignored.
// - T13: localized states and errors, receipt with countdown/More time/Done.

type Span = { startTime: string; endTime: string };
type Availability = { date: string; room: { id: string }; free: Span[]; busy: (Span & { kind: "class" | "booking" })[] };
type RoomsState = { status: "loading" } | { status: "failed" } | { status: "ok"; rooms: PublicRoom[] };
type AvailabilityState = { key: string; status: "ok"; data: Availability } | { key: string; status: "failed"; errorKey: BookingErrorKey | null };

/** Everything that is sent, fixed before the request starts. */
type Submitted = {
  room: PublicRoom;
  date: string;
  startTime: string;
  endTime: string;
  requestId: string;
  cancelToken: string;
};
type Phase =
  | { kind: "select" }
  | { kind: "review" }
  | { kind: "submitting"; request: Submitted }
  | { kind: "uncertain"; request: Submitted }
  | { kind: "receipt"; receipt: Receipt };

const DURATIONS = [15, 30, 45, 60, 90, 120].filter((m) => m >= BOOKING_POLICY.minMinutes && m <= BOOKING_POLICY.maxMinutes);

function randomBase64Url(bytes: number): string {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function possibleStarts(free: Span[], duration: number): string[] {
  const times: string[] = [];
  const step = BOOKING_POLICY.minuteStep;
  for (const slot of free) {
    const start = hhmmToMinutes(slot.startTime);
    const end = hhmmToMinutes(slot.endTime);
    if (start === null || end === null) continue;
    for (let x = Math.ceil(start / step) * step; x + duration <= end; x += step) times.push(minutesToHhmm(x));
  }
  return times;
}

const field = "min-h-14 w-full rounded-xl border border-ink bg-surface p-3 text-lg disabled:cursor-not-allowed disabled:opacity-60";
const panel = "rounded-xl bg-surface p-5 shadow-sm";

export function BookingFlow({
  lang,
  initialRoomId,
  initialDate,
  minDate,
  maxDate,
}: {
  lang: Lang;
  initialRoomId: string | null;
  initialDate: string;
  minDate: string;
  maxDate: string;
}) {
  const t = BOOKING_COPY[lang];
  const router = useRouter();
  const ids = { room: useId(), date: useId(), duration: useId() };
  const [roomsState, setRoomsState] = useState<RoomsState>({ status: "loading" });
  const [roomsReload, setRoomsReload] = useState(0);
  const [roomId, setRoomId] = useState(initialRoomId ?? "");
  const [date, setDate] = useState(initialDate);
  const [duration, setDuration] = useState(60);
  const [start, setStart] = useState("");
  const [availability, setAvailability] = useState<AvailabilityState | null>(null);
  const [availabilityReload, setAvailabilityReload] = useState(0);
  const [phase, setPhase] = useState<Phase>({ kind: "select" });
  const [notice, setNotice] = useState<BookingErrorKey | null>(null);
  const sending = useRef(false);

  const locked = phase.kind === "submitting" || phase.kind === "uncertain";
  const guard = useLeaveGuard(locked);

  const rooms = roomsState.status === "ok" ? roomsState.rooms : [];
  const selectedRoom = rooms.find((r) => r.id === roomId) ?? null;
  // An explicitly requested room that is not bookable stays visibly rejected: no substitution.
  const requestRejected = roomsState.status === "ok" && initialRoomId !== null && roomId === initialRoomId && !selectedRoom;
  const key = selectedRoom ? `${selectedRoom.id}|${date}` : "";
  const current = availability && availability.key === key ? availability : null;
  const availabilityLoading = !!selectedRoom && !current;
  const times = current?.status === "ok" ? possibleStarts(current.data.free, duration) : [];
  const chosenStart = times.includes(start) ? start : "";
  const endTime = chosenStart ? minutesToHhmm(hhmmToMinutes(chosenStart)! + duration) : "";

  // Reservable rooms from the public room API (same data as the directory and map).
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/public/rooms", { cache: "no-store", signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ rooms: PublicRoom[] }>;
      })
      .then((payload) => setRoomsState({ status: "ok", rooms: payload.rooms.filter((r) => r.reservable) }))
      .catch(() => {
        if (!controller.signal.aborted) setRoomsState({ status: "failed" });
      });
    return () => controller.abort();
  }, [roomsReload]);

  // Availability for exactly the selected room and date; late answers for another key are ignored.
  useEffect(() => {
    if (!key) return;
    const [requestedRoom, requestedDate] = key.split("|");
    const controller = new AbortController();
    fetch(`/api/public/availability?${new URLSearchParams({ roomId: requestedRoom, date: requestedDate })}`, { cache: "no-store", signal: controller.signal })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setAvailability({ key, status: "failed", errorKey: res.status === 400 || res.status === 409 ? bookingErrorKey(data.error, data.detail) : null });
          return;
        }
        const ok = data as Availability;
        if (ok.room?.id !== requestedRoom || ok.date !== requestedDate) throw new Error("mismatched availability");
        setAvailability({ key, status: "ok", data: ok });
      })
      .catch(() => {
        if (!controller.signal.aborted) setAvailability({ key, status: "failed", errorKey: null });
      });
    return () => controller.abort();
  }, [key, availabilityReload]);

  function syncUrl(nextRoom: string, nextDate: string) {
    router.replace(publicHref("/booking", lang, { raum: nextRoom || null, datum: nextDate }), { scroll: false });
  }
  function changeSelection(update: () => void) {
    if (locked) return; // defence in depth: controls are disabled while locked
    update();
    setStart("");
    setNotice(null);
    setPhase({ kind: "select" });
  }

  async function send(request: Submitted) {
    if (sending.current) return;
    sending.current = true;
    setPhase({ kind: "submitting", request });
    setNotice(null);
    try {
      const response = await fetch("/api/public/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          roomId: request.room.id,
          date: request.date,
          startTime: request.startTime,
          endTime: request.endTime,
          requestId: request.requestId,
          cancelToken: request.cancelToken,
        }),
      });
      const data = await response.json().catch(() => null);
      if (response.ok && data && typeof data.booking?.id === "string") {
        setPhase({
          kind: "receipt",
          receipt: {
            id: data.booking.id,
            roomCode: request.room.code,
            roomName: localize(request.room.name, request.room.nameEn, lang),
            date: request.date,
            startTime: request.startTime,
            endTime: request.endTime,
            cancelToken: request.cancelToken,
          },
        });
        return;
      }
      if (response.status === 400 || response.status === 409) {
        // Definite rejection: nothing was stored, the snapshot can be dropped.
        const errorKey = bookingErrorKey(data?.error, data?.detail);
        setNotice(errorKey);
        setStart("");
        setPhase({ kind: "select" });
        if (errorKey === "time_conflict" || errorKey === "in_past") setAvailabilityReload((n) => n + 1);
        if (errorKey === "room_not_reservable") setRoomsReload((n) => n + 1);
        return;
      }
      // 503, other server errors or an unreadable answer: the outcome is unknown.
      setPhase({ kind: "uncertain", request });
    } catch {
      setPhase({ kind: "uncertain", request });
    } finally {
      sending.current = false;
    }
  }

  function confirm() {
    if (!selectedRoom || !chosenStart || !endTime || locked) return;
    void send({
      room: selectedRoom,
      date,
      startTime: chosenStart,
      endTime,
      requestId: randomBase64Url(16),
      cancelToken: randomBase64Url(32),
    });
  }

  const finish = useCallback(() => {
    setPhase({ kind: "select" });
    setStart("");
    router.push(publicHref("/", lang));
  }, [router, lang]);

  function abandon(href: string | null) {
    setPhase({ kind: "select" });
    setStart("");
    guard.stay();
    if (href) router.push(href);
  }

  if (phase.kind === "receipt") {
    return (
      <div className="flex flex-col gap-5" data-testid="booking-flow">
        <BookingReceipt receipt={phase.receipt} lang={lang} onDone={finish} />
      </div>
    );
  }

  const pendingRequest = phase.kind === "submitting" || phase.kind === "uncertain" ? phase.request : null;
  const shown = pendingRequest ?? (selectedRoom && chosenStart ? { room: selectedRoom, date, startTime: chosenStart, endTime } : null);
  const shownName = shown ? localize(shown.room.name, shown.room.nameEn, lang) : null;

  return (
    <div className="flex flex-col gap-5" data-testid="booking-flow">
      <p className="rounded-xl border border-info/40 bg-info-soft p-4 font-semibold text-info">{t.disclaimer}</p>
      {rooms.some((r) => r.isDemo) && <DemoNotice lang={lang} />}

      <div className={panel}>
        <label htmlFor={ids.room} className="mb-2 block text-lg font-bold">
          {t.room}
        </label>
        {roomsState.status === "loading" && <p role="status">{t.roomsLoading}</p>}
        {roomsState.status === "failed" && (
          <div role="alert" className="flex flex-wrap items-center gap-3">
            <p className="font-semibold">{t.roomsFailed}</p>
            <button type="button" onClick={() => setRoomsReload((n) => n + 1)} className="min-h-14 rounded-xl bg-ink px-5 font-semibold text-white">
              {t.retry}
            </button>
          </div>
        )}
        {roomsState.status === "ok" && rooms.length === 0 && <p role="status">{t.roomsEmpty}</p>}
        {requestRejected && (
          <p role="alert" className="mb-3 rounded-xl bg-warning-soft p-4 font-semibold text-warning">
            {t.requestedUnavailable}
          </p>
        )}
        <select
          id={ids.room}
          className={field}
          value={selectedRoom ? roomId : ""}
          disabled={locked || rooms.length === 0}
          onChange={(e) => {
            const next = e.target.value;
            changeSelection(() => setRoomId(next));
            syncUrl(next, date);
          }}
        >
          <option value="">{t.roomPlaceholder}</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.code} – {localize(r.name, r.nameEn, lang).text}
            </option>
          ))}
        </select>
        {selectedRoom && (
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href={publicHref("/map", lang, { raum: selectedRoom.id })} className="inline-flex min-h-12 items-center rounded-xl border border-ink px-4 font-semibold">
              {t.mapLink}
            </Link>
            <Link href={publicHref("/schedule", lang, { raum: selectedRoom.id, datum: date })} className="inline-flex min-h-12 items-center rounded-xl border border-ink px-4 font-semibold">
              {t.scheduleLink}
            </Link>
          </div>
        )}
      </div>

      <div className={panel}>
        <label htmlFor={ids.date} className="mb-2 block text-lg font-bold">
          {t.date}
        </label>
        <input
          id={ids.date}
          type="date"
          min={minDate}
          max={maxDate}
          value={date}
          disabled={locked}
          onChange={(e) => {
            const next = e.target.value;
            if (!next) return;
            changeSelection(() => setDate(next));
            syncUrl(roomId, next);
          }}
          className={field}
        />
      </div>

      <div className={panel}>
        <label htmlFor={ids.duration} className="mb-2 block text-lg font-bold">
          {t.duration}
        </label>
        <select
          id={ids.duration}
          value={duration}
          disabled={locked}
          onChange={(e) => {
            const next = Number(e.target.value);
            changeSelection(() => setDuration(next));
          }}
          className={field}
        >
          {DURATIONS.map((m) => (
            <option key={m} value={m}>
              {t.minutes(m)}
            </option>
          ))}
        </select>
      </div>

      <section className={panel} aria-labelledby="booking-times">
        <h2 id="booking-times" className="mb-3 text-lg font-bold">
          {t.time}
        </h2>
        {!selectedRoom && <p className="text-ink-muted">{t.chooseRoomFirst}</p>}
        {availabilityLoading && <p role="status">{t.loading}</p>}
        {current?.status === "failed" && (
          <div role="alert" className="flex flex-wrap items-center gap-3">
            <p className="font-semibold">{current.errorKey ? t.errors[current.errorKey] : t.availabilityFailed}</p>
            <button type="button" onClick={() => setAvailabilityReload((n) => n + 1)} className="min-h-14 rounded-xl bg-ink px-5 font-semibold text-white">
              {t.retry}
            </button>
          </div>
        )}
        {current?.status === "ok" && (
          <>
            <div role="group" aria-label={t.time} className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {times.map((value) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={chosenStart === value}
                  disabled={locked}
                  onClick={() => {
                    if (locked) return;
                    setStart(value);
                    setNotice(null);
                    setPhase({ kind: "select" });
                  }}
                  className={`min-h-16 touch-manipulation rounded-xl border-2 px-3 py-3 text-lg font-bold tabular-nums disabled:opacity-60 ${
                    chosenStart === value ? "border-brand bg-brand text-white" : "border-line bg-canvas hover:border-ink"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            {times.length === 0 && (
              <p role="status" className="font-semibold text-warning">
                {t.none}
              </p>
            )}
            {current.data.busy.length > 0 && (
              <p className="mt-5 border-t border-line pt-3 text-base text-ink-muted">
                <strong>{t.busy}: </strong>
                {current.data.busy.map((s) => `${s.startTime}–${s.endTime}`).join(", ")}
              </p>
            )}
          </>
        )}
      </section>

      {notice && (
        <p role="alert" className="rounded-xl bg-danger-soft p-4 font-semibold text-danger">
          {t.errors[notice]}
        </p>
      )}

      {phase.kind === "select" && (
        <button type="button" onClick={() => setPhase({ kind: "review" })} disabled={!shown} className="min-h-16 rounded-xl bg-brand p-4 text-lg font-bold text-white disabled:opacity-50">
          {t.confirm}
        </button>
      )}

      {phase.kind !== "select" && shown && shownName && (
        <section aria-labelledby="booking-review" className="flex flex-col gap-3 rounded-xl border-2 border-brand bg-surface p-5">
          <h2 id="booking-review" className="font-display text-2xl font-bold">
            {t.review}
          </h2>
          <p className="flex flex-wrap items-center gap-2 text-lg">
            <strong>{shown.room.code}</strong> <span lang={shownName.lang}>{shownName.text}</span>
            <FallbackTag lang={lang} level={shownName.fallback ? "all" : null} />
          </p>
          <p className="text-lg font-semibold">
            {formatCalendarDate(shown.date, lang)} · {shown.startTime}–{shown.endTime}
          </p>
          {phase.kind === "submitting" && (
            <p role="status" className="rounded-xl bg-info-soft p-3 font-semibold text-info">
              {t.lockedNote}
            </p>
          )}
          {phase.kind === "uncertain" ? (
            <div role="alert" className="flex flex-col gap-3 rounded-xl bg-warning-soft p-4 text-warning">
              <p className="font-bold">{t.uncertainTitle}</p>
              <p>{t.uncertainText}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => void send(phase.request)} className="min-h-16 rounded-xl bg-brand p-4 text-lg font-bold text-white">
                  {t.resend}
                </button>
                <button type="button" onClick={() => abandon(null)} className="min-h-16 rounded-xl border-2 border-ink bg-surface p-4 font-semibold text-ink">
                  {t.abandon}
                </button>
              </div>
            </div>
          ) : (
            <>
              <button type="button" disabled={locked} onClick={confirm} className="min-h-16 rounded-xl bg-brand p-4 text-lg font-bold text-white disabled:opacity-60">
                {phase.kind === "submitting" ? t.submitting : t.book}
              </button>
              <button type="button" disabled={locked} onClick={() => setPhase({ kind: "select" })} className="min-h-14 rounded-xl border border-ink p-3 font-semibold disabled:opacity-60">
                {t.change}
              </button>
            </>
          )}
        </section>
      )}

      <Link href={publicHref("/booking/cancel", lang)} className="flex min-h-14 items-center justify-center rounded-xl border border-ink p-3 font-semibold">
        {t.cancelLink}
      </Link>

      <LeaveDialog open={guard.blockedHref !== null} lang={lang} onStay={guard.stay} onLeave={() => abandon(guard.blockedHref)} />
    </div>
  );
}

/** Asks before leaving while a booking request is unresolved (T08). */
function LeaveDialog({ open, lang, onStay, onLeave }: { open: boolean; lang: Lang; onStay: () => void; onLeave: () => void }) {
  const t = BOOKING_COPY[lang];
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const textId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={textId}
      onCancel={(e) => {
        e.preventDefault();
        onStay();
      }}
      className="m-auto w-[min(92vw,34rem)] rounded-xl bg-surface p-0 text-ink shadow-xl backdrop:bg-ink/50"
    >
      <div className="flex flex-col gap-4 p-6">
        <h2 id={titleId} className="font-display text-2xl font-bold">
          {t.guardTitle}
        </h2>
        <p id={textId} className="text-lg">
          {t.guardText}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" autoFocus onClick={onStay} className="min-h-16 rounded-xl bg-ink px-4 text-lg font-bold text-white">
            {t.stay}
          </button>
          <button type="button" onClick={onLeave} className="min-h-16 rounded-xl border-2 border-danger px-4 text-lg font-bold text-danger">
            {t.leave}
          </button>
        </div>
      </div>
    </dialog>
  );
}

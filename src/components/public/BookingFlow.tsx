"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { publicHref, type Lang } from "@/lib/i18n/public.ts";
import { hhmmToMinutes, minutesToHhmm } from "@/lib/bookings/policy.ts";

type Room = { id: string; code: string; name: string; nameEn: string | null; reservable: boolean; isDemo: boolean };
type Span = { startTime: string; endTime: string };
type Availability = { date: string; room: { id: string; code: string; name: string }; free: Span[]; busy: (Span & { kind: string })[] };
type Receipt = { id: string; room: Room; date: string; startTime: string; endTime: string; cancelToken: string };
type PendingRequest = { key: string; requestId: string; cancelToken: string };

const copy = {
  de: {
    title: "Raum reservieren", disclaimer: "DEMO – keine echte Hochschulreservierung. Keine Anmeldung, kein offizieller Anspruch auf den Raum.",
    room: "Raum auswählen", date: "Datum", duration: "Dauer", time: "Freie Startzeit wählen",
    busy: "Belegte Zeiten", none: "Keine freien Zeitfenster. Anderen Tag, Raum oder kürzere Dauer wählen.",
    loading: "Lade Zeiten …", confirm: "Weiter zur Bestätigung", review: "Buchung prüfen", back: "Ändern",
    book: "Demo-Reservierung bestätigen", submitting: "Reservierung wird geprüft …", success: "Reservierung erfolgreich",
    conflict: "Zeitfenster ist inzwischen belegt. Bitte ein neues wählen.", failure: "Fehler bei der Anfrage. Bitte erneut versuchen.",
    code: "Stornierungscode", id: "Buchungsnummer", noRecovery: "Wichtig: Nummer und Code notieren! Sie werden nicht gespeichert oder per E-Mail gesendet. Ohne diese Daten ist keine spätere Selbst-Stornierung möglich.",
    privacy: "Auf dem öffentlichen Display wird dieser Beleg nach 60 Sekunden automatisch ausgeblendet.",
    finish: "Fertig – Beleg ausblenden", cancelLink: "Reservierung stornieren", home: "Zur Startseite", mapLink: "Diesen Raum auf der Karte sehen",
  },
  en: {
    title: "Book a room", disclaimer: "DEMO – not a real university room reservation. No login or official entitlement to use this room.",
    room: "Choose a room", date: "Date", duration: "Duration", time: "Select a free start time",
    busy: "Occupied times", none: "No free times. Try another room, date or shorter duration.",
    loading: "Loading availability …", confirm: "Review reservation", review: "Review reservation", back: "Change",
    book: "Confirm demo booking", submitting: "Checking reservation …", success: "Reservation successful",
    conflict: "This time has just been taken. Choose another.", failure: "Request failed. Please try again.",
    code: "Cancellation code", id: "Booking ID", noRecovery: "Important: Write down the ID and code! They are not stored or emailed to you. You need both to cancel later.",
    privacy: "For privacy this receipt disappears automatically after 60 seconds on the public display.",
    finish: "Done – hide receipt", cancelLink: "Cancel a booking", home: "Back to home", mapLink: "View this room on the map",
  },
} as const;

function randomBase64Url(bytes: number): string {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function possibleStarts(free: Span[], duration: number): string[] {
  const times: string[] = [];
  for (const slot of free) {
    const start = hhmmToMinutes(slot.startTime);
    const end = hhmmToMinutes(slot.endTime);
    if (start === null || end === null) continue;
    for (let x = Math.ceil(start / 15) * 15; x + duration <= end; x += 15) times.push(minutesToHhmm(x));
  }
  return times;
}

export function BookingFlow({ lang, initialRoomId, initialDate, minDate, maxDate }: { lang: Lang; initialRoomId: string | null; initialDate: string; minDate: string; maxDate: string }) {
  const t = copy[lang];
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState(initialRoomId ?? "");
  const [date, setDate] = useState(initialDate);
  const [duration, setDuration] = useState(60);
  const [start, setStart] = useState("");
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [review, setReview] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const pendingRef = useRef<PendingRequest | null>(null);
  const selectedRoom = rooms.find((r) => r.id === roomId);
  const times = possibleStarts(availability?.free ?? [], duration);
  const endTime = start ? minutesToHhmm(hhmmToMinutes(start)! + duration) : "";

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/public/rooms", { cache: "no-store", signal: controller.signal })
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((payload: { rooms: Room[] }) => {
        const next = payload.rooms.filter((r) => r.reservable);
        setRooms(next);
        // The map passes the human-readable code, while the booking API uses stable room UUIDs.
        // Resolve after the public room list loads; never guess a database ID in the map.
        setRoomId((old) => next.find((r) => r.id === old || r.code.toLowerCase() === old.toLowerCase())?.id ?? next[0]?.id ?? "");
      })
      .catch((err: unknown) => { if (!(err instanceof Error && err.name === "AbortError")) setError(t.failure); });
    return () => controller.abort();
  }, [t.failure]);

  useEffect(() => {
    if (!roomId || !date) return;
    const controller = new AbortController();
    setLoading(true); setAvailability(null); setStart(""); setReview(false); setError("");
    fetch(`/api/public/availability?${new URLSearchParams({ roomId, date })}`, { cache: "no-store", signal: controller.signal })
      .then(async (res) => { const data = await res.json(); if (!res.ok) throw new Error(data.message || t.failure); return data; })
      .then((data: Availability) => { setAvailability(data); setLoading(false); })
      .catch((err: unknown) => { if (!(err instanceof Error && err.name === "AbortError")) { setError(err instanceof Error ? err.message : t.failure); setLoading(false); } });
    return () => controller.abort();
  }, [roomId, date, t.failure]);

  useEffect(() => {
    if (!receipt) return;
    const timer = window.setTimeout(() => setReceipt(null), 60_000);
    return () => window.clearTimeout(timer);
  }, [receipt]);

  function selectionChanged() { setReview(false); setStart(""); setError(""); pendingRef.current = null; }

  async function submit() {
    if (!selectedRoom || !start || !endTime || submitting) return;
    const key = `${roomId}|${date}|${start}|${endTime}`;
    if (!pendingRef.current || pendingRef.current.key !== key) pendingRef.current = { key, requestId: randomBase64Url(16), cancelToken: randomBase64Url(32) };
    setSubmitting(true); setError("");
    try {
      const response = await fetch("/api/public/bookings", {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        body: JSON.stringify({ roomId, date, startTime: start, endTime, requestId: pendingRef.current.requestId, cancelToken: pendingRef.current.cancelToken }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409 && data.error === "time_conflict") {
          pendingRef.current = null;
          setReview(false);
          setStart("");
          setAvailability(null);
          const latest = await fetch(`/api/public/availability?${new URLSearchParams({ roomId, date })}`, { cache: "no-store" });
          if (latest.ok) setAvailability(await latest.json());
          throw new Error(t.conflict);
        }
        if (response.status === 409 && data.error === "request_id_reused") pendingRef.current = null;
        throw new Error(data.message || t.failure);
      }
      setReceipt({ id: data.booking.id, room: selectedRoom, date, startTime: start, endTime, cancelToken: pendingRef.current.cancelToken });
      pendingRef.current = null;
      setReview(false);
    } catch (err) { setError(err instanceof Error ? err.message : t.failure); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="flex flex-col gap-5" data-testid="booking-flow">
      <p className="rounded-xl border border-info/40 bg-info-soft p-4 font-semibold text-info">{t.disclaimer}</p>
      <Link href={publicHref("/map-demo/index.html", lang, {raum: selectedRoom?.code})}
        className="flex min-h-14 items-center justify-center rounded-xl border border-ink bg-surface p-4 font-semibold hover:bg-canvas">
        ↖ {t.mapLink}
      </Link>
      {receipt ? (
        <section className="flex flex-col gap-4 rounded-xl bg-success-soft p-5" role="status" aria-live="polite">
          <h2 className="font-display text-3xl font-bold text-success">✓ {t.success}</h2>
          <p><strong>{receipt.room.code} · {receipt.room.name}</strong></p>
          <p>{receipt.date} · {receipt.startTime}–{receipt.endTime}</p>
          <div className="rounded-xl bg-surface p-4"><p className="text-base">{t.id}</p><p className="break-all font-mono text-base font-semibold">{receipt.id}</p></div>
          <div className="rounded-xl bg-surface p-4"><p className="text-base">{t.code}</p><p className="break-all font-mono text-base font-semibold">{receipt.cancelToken}</p></div>
          <p className="font-semibold">{t.noRecovery}</p>
          <p className="text-base text-ink-muted">{t.privacy}</p>
          <button type="button" className="min-h-14 rounded-xl bg-ink p-4 font-semibold text-white" onClick={() => { setReceipt(null); setStart(""); }}>{t.finish}</button>
          <Link href={publicHref("/", lang)} className="flex min-h-14 items-center justify-center rounded-xl border border-ink p-4 font-semibold">{t.home}</Link>
        </section>
      ) : (
        <>
          <div className="rounded-xl bg-surface p-5 shadow-sm">
            <label htmlFor="booking-room" className="mb-2 block font-bold">1. {t.room}</label>
            <select id="booking-room" className="min-h-14 w-full rounded-xl border border-ink bg-surface p-3" value={roomId} onChange={(event) => { selectionChanged(); setAvailability(null); setRoomId(event.target.value); }}>
              {rooms.length === 0 && <option value="">–</option>}
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.code} – {lang === "en" && r.nameEn ? r.nameEn : r.name}{r.isDemo ? " (DEMO)" : ""}</option>)}
            </select>
          </div>
          <div className="rounded-xl bg-surface p-5 shadow-sm">
            <label htmlFor="booking-date" className="mb-2 block font-bold">2. {t.date}</label>
            <input id="booking-date" type="date" min={minDate} max={maxDate} value={date} onChange={(event) => { selectionChanged(); setAvailability(null); setDate(event.target.value); }} className="min-h-14 w-full rounded-xl border border-ink bg-surface p-3" />
          </div>
          <div className="rounded-xl bg-surface p-5 shadow-sm">
            <label htmlFor="booking-duration" className="mb-2 block font-bold">3. {t.duration}</label>
            <select id="booking-duration" value={duration} onChange={(event) => { selectionChanged(); setDuration(Number(event.target.value)); }} className="min-h-14 w-full rounded-xl border border-ink bg-surface p-3">
              {[15, 30, 60, 90, 120].map((mins) => <option key={mins} value={mins}>{mins} min</option>)}
            </select>
          </div>
          <section className="rounded-xl bg-surface p-5 shadow-sm">
            <h2 className="mb-3 font-bold">4. {t.time}</h2>
            {loading && <p role="status">{t.loading}</p>}
            {!loading && availability && (
              <>
                <div role="group" aria-label={t.time} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {times.map((value) => <button type="button" key={value} aria-pressed={start === value} onClick={() => { setStart(value); setReview(false); setError(""); pendingRef.current = null; }} className={`min-h-16 touch-manipulation rounded-xl border-2 px-3 py-3 font-bold ${start === value ? "border-brand bg-brand text-white" : "border-line bg-canvas hover:border-ink"}`}>{value}</button>)}
                </div>
                {times.length === 0 && <p role="status" className="text-warning">{t.none}</p>}
                {availability.busy.length > 0 && <div className="mt-5 border-t border-line pt-3 text-base text-ink-muted"><strong>{t.busy}: </strong>{availability.busy.map((s) => `${s.startTime}–${s.endTime}`).join(", ")}</div>}
              </>
            )}
          </section>
          {error && <p role="alert" className="rounded-xl bg-danger-soft p-4 font-semibold text-danger">{error}</p>}
          {review && selectedRoom && start && endTime ? (
            <section className="flex flex-col gap-3 rounded-xl border-2 border-brand bg-surface p-5">
              <h2 className="font-display text-2xl font-bold">{t.review}</h2>
              <p>{selectedRoom.code} · {selectedRoom.name}</p>
              <p className="font-semibold">{date} · {start}–{endTime}</p>
              <button type="button" disabled={submitting} onClick={submit} className="min-h-16 rounded-xl bg-brand p-4 font-bold text-white disabled:opacity-60">{submitting ? t.submitting : t.book}</button>
              <button type="button" disabled={submitting} onClick={() => setReview(false)} className="min-h-14 rounded-xl border border-ink p-3 font-semibold">{t.back}</button>
            </section>
          ) : (
            <button type="button" onClick={() => setReview(true)} disabled={!roomId || !start || !availability || submitting} className="min-h-16 rounded-xl bg-brand p-4 font-bold text-white disabled:opacity-50">{t.confirm}</button>
          )}
          <Link href={publicHref("/booking/cancel", lang)} className="flex min-h-14 items-center justify-center rounded-xl border border-ink p-3 font-semibold">{t.cancelLink}</Link>
        </>
      )}
    </div>
  );
}

export function BookingCancel({ lang }: { lang: Lang }) {
  const [id, setId] = useState("");
  const [token, setToken] = useState("");
  const [state, setState] = useState<"idle" | "pending" | "success">("idle");
  const [error, setError] = useState("");
  const t = lang === "de" ? {
    title: "Reservierung stornieren", id: "Buchungsnummer", code: "Stornierungscode", go: "Stornierung bestätigen",
    done: "Reservierung wurde storniert.", failed: "Stornierung fehlgeschlagen. Nummer und Code prüfen.", back: "Zur Buchung",
  } : {
    title: "Cancel a booking", id: "Booking ID", code: "Cancellation code", go: "Confirm cancellation",
    done: "Booking cancelled.", failed: "Cancellation failed. Check ID and code.", back: "Book a room",
  };
  async function cancel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState("pending"); setError("");
    try {
      const response = await fetch(`/api/public/bookings/${encodeURIComponent(id.trim())}/cancel`, { method: "POST", headers: { Authorization: `Bearer ${token.trim()}` }, cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || t.failed);
      setId(""); setToken(""); setState("success");
    } catch (err) { setError(err instanceof Error ? err.message : t.failed); setState("idle"); }
  }
  return <div className="flex flex-col gap-5">
    <p className="rounded-xl bg-info-soft p-4 font-semibold text-info">DEMO – {lang === "de" ? "kein offizielles Raumbuchungssystem." : "not an official university booking system."}</p>
    {state === "success" ? <p role="status" className="rounded-xl bg-success-soft p-4 font-semibold text-success">✓ {t.done}</p> :
      <form onSubmit={cancel} className="flex flex-col gap-4 rounded-xl bg-surface p-5">
        <label className="flex flex-col gap-2 font-bold">{t.id}<input type="text" autoComplete="off" spellCheck={false} value={id} onChange={(e) => setId(e.target.value)} required maxLength={60} className="min-h-14 rounded-xl border border-ink px-3 font-mono text-base" /></label>
        <label className="flex flex-col gap-2 font-bold">{t.code}<input type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} required maxLength={100} className="min-h-14 rounded-xl border border-ink px-3 font-mono text-base" /></label>
        {error && <p role="alert" className="rounded-xl bg-danger-soft p-4 text-danger">{error}</p>}
        <button disabled={state === "pending"} className="min-h-16 rounded-xl bg-brand p-4 font-bold text-white disabled:opacity-50" type="submit">{t.go}</button>
      </form>}
    <Link href={publicHref("/booking", lang)} className="flex min-h-14 items-center justify-center rounded-xl border border-ink p-3 font-semibold">{t.back}</Link>
  </div>;
}

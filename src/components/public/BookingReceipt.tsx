"use client";

import { useEffect, useState } from "react";
import { localize, type Lang } from "@/lib/i18n/public.ts";
import { formatCalendarDate } from "@/lib/time/berlin.ts";
import { BOOKING_COPY } from "./booking-copy.ts";
import type { SettledStatus } from "./booking-result.ts";
import { FallbackTag } from "./PublicShell.tsx";

export const RECEIPT_SECONDS = 60;

export type Receipt = {
  id: string;
  status: SettledStatus;
  roomCode: string;
  /** Source names; localized when rendering so a language switch applies (V1-R002). */
  roomName: string;
  roomNameEn: string | null;
  date: string;
  startTime: string;
  endTime: string;
  cancelToken: string;
};

/**
 * Settled booking receipt (T13, provisional design to be tested with people):
 * visible countdown, "More time" and "Done". Expiry and Done call onDone, which
 * clears the credentials and returns to Start. Held in memory only.
 * A replay of a booking that was cancelled meanwhile (V1-R001) shows that it is
 * cancelled and not active; it has no cancellation code to note down.
 */
export function BookingReceipt({ receipt, lang, onDone }: { receipt: Receipt; lang: Lang; onDone: () => void }) {
  const t = BOOKING_COPY[lang].receipt;
  const [expiresAt, setExpiresAt] = useState(() => Date.now() + RECEIPT_SECONDS * 1000);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = Date.now();
      if (current >= expiresAt) onDone();
      else setNow(current);
    }, 250);
    return () => window.clearInterval(timer);
  }, [expiresAt, onDone]);

  const secondsLeft = Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const roomName = localize(receipt.roomName, receipt.roomNameEn, lang);
  const cancelled = receipt.status === "cancelled";

  return (
    <section
      data-testid="booking-receipt"
      data-status={receipt.status}
      aria-labelledby="receipt-title"
      className={`flex flex-col gap-4 rounded-xl border-2 p-5 ${cancelled ? "border-warning bg-warning-soft" : "border-success bg-success-soft"}`}
    >
      <div role="status">
        <h2 id="receipt-title" className={`font-display text-3xl font-bold ${cancelled ? "text-warning" : "text-success"}`}>
          {cancelled ? `✕ ${t.cancelledTitle}` : `✓ ${t.success}`}
        </h2>
        {cancelled && <p className="mt-2 text-lg font-semibold text-warning">{t.cancelledText}</p>}
      </div>
      <div data-testid="receipt-room" className="flex flex-wrap items-center gap-2 text-xl">
        <strong>{receipt.roomCode}</strong>
        <span lang={roomName.lang}>{roomName.text}</span>
        <FallbackTag lang={lang} level={roomName.fallback ? "all" : null} />
      </div>
      <p data-testid="receipt-when" className="text-xl font-semibold">
        {formatCalendarDate(receipt.date, lang)} · {receipt.startTime}–{receipt.endTime}
      </p>
      <div className="rounded-xl bg-surface p-4">
        <p className="text-base">{t.id}</p>
        <p data-testid="receipt-id" className="break-all font-mono text-lg font-semibold">{receipt.id}</p>
      </div>
      {!cancelled && (
        <>
          <div className="rounded-xl bg-surface p-4">
            <p className="text-base">{t.code}</p>
            <p data-testid="receipt-code" className="break-all font-mono text-lg font-semibold">{receipt.cancelToken}</p>
          </div>
          <p className="font-semibold">{t.noRecovery}</p>
        </>
      )}
      <p data-testid="receipt-countdown" aria-live="off" className="rounded-xl bg-surface px-4 py-3 text-lg font-semibold tabular-nums">
        {t.countdown(secondsLeft)}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setExpiresAt(Date.now() + RECEIPT_SECONDS * 1000)}
          className="min-h-16 touch-manipulation rounded-xl border-2 border-ink bg-surface px-4 text-lg font-bold"
        >
          {t.more}
        </button>
        <button type="button" onClick={onDone} className="min-h-16 touch-manipulation rounded-xl bg-ink px-4 text-lg font-bold text-white">
          {t.finish}
        </button>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { Lang, LocalizedText } from "@/lib/i18n/public.ts";
import { formatCalendarDate } from "@/lib/time/berlin.ts";
import { BOOKING_COPY } from "./booking-copy.ts";
import { FallbackTag } from "./PublicShell.tsx";

export const RECEIPT_SECONDS = 60;

export type Receipt = {
  id: string;
  roomCode: string;
  roomName: LocalizedText;
  date: string;
  startTime: string;
  endTime: string;
  cancelToken: string;
};

/**
 * Settled booking receipt (T13, provisional design to be tested with people):
 * visible countdown, "More time" and "Done". Expiry and Done call onDone, which
 * clears the credentials and returns to Start. Held in memory only.
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

  return (
    <section data-testid="booking-receipt" aria-labelledby="receipt-title" className="flex flex-col gap-4 rounded-xl border-2 border-success bg-success-soft p-5">
      <div role="status">
        <h2 id="receipt-title" className="font-display text-3xl font-bold text-success">
          ✓ {t.success}
        </h2>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xl">
        <strong>{receipt.roomCode}</strong>
        <span lang={receipt.roomName.lang}>{receipt.roomName.text}</span>
        <FallbackTag lang={lang} level={receipt.roomName.fallback ? "all" : null} />
      </div>
      <p className="text-xl font-semibold">
        {formatCalendarDate(receipt.date, lang)} · {receipt.startTime}–{receipt.endTime}
      </p>
      <div className="rounded-xl bg-surface p-4">
        <p className="text-base">{t.id}</p>
        <p data-testid="receipt-id" className="break-all font-mono text-lg font-semibold">{receipt.id}</p>
      </div>
      <div className="rounded-xl bg-surface p-4">
        <p className="text-base">{t.code}</p>
        <p data-testid="receipt-code" className="break-all font-mono text-lg font-semibold">{receipt.cancelToken}</p>
      </div>
      <p className="font-semibold">{t.noRecovery}</p>
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

"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { publicHref, type Lang } from "@/lib/i18n/public.ts";
import { BOOKING_COPY, type BookingCopy } from "./booking-copy.ts";

// Public self-cancellation with booking ID + code (joint package's form,
// localized and with per-code messages in T13). Fields are cleared only on
// success, so a typo can be corrected.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Problem = Exclude<keyof BookingCopy["cancel"], "id" | "code" | "go" | "pending" | "done" | "back" | "demo">;

export function BookingCancel({ lang }: { lang: Lang }) {
  const t = BOOKING_COPY[lang].cancel;
  const [id, setId] = useState("");
  const [token, setToken] = useState("");
  const [state, setState] = useState<"idle" | "pending" | "success">("idle");
  const [problem, setProblem] = useState<Problem | null>(null);

  async function cancel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const bookingId = id.trim();
    if (!UUID.test(bookingId)) {
      setProblem("badId");
      return;
    }
    setState("pending");
    setProblem(null);
    try {
      const response = await fetch(`/api/public/bookings/${encodeURIComponent(bookingId)}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token.trim()}` },
        cache: "no-store",
      });
      if (response.ok) {
        setId("");
        setToken("");
        setState("success");
        return;
      }
      const code = response.status === 401 ? "unauthorized" : response.status === 503 ? "busy" : ((await response.json().catch(() => ({}))) as { error?: string }).error;
      setProblem(code === "unauthorized" || code === "not_found" || code === "booking_ended" || code === "busy" ? code : "generic");
    } catch {
      setProblem("generic");
    }
    setState("idle");
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="rounded-xl bg-info-soft p-4 font-semibold text-info">{t.demo}</p>
      {state === "success" ? (
        <p role="status" className="rounded-xl bg-success-soft p-4 text-xl font-semibold text-success">
          ✓ {t.done}
        </p>
      ) : (
        <form onSubmit={cancel} className="flex flex-col gap-4 rounded-xl bg-surface p-5">
          <label className="flex flex-col gap-2 font-bold">
            {t.id}
            <input type="text" autoComplete="off" spellCheck={false} value={id} onChange={(e) => setId(e.target.value)} required maxLength={60} className="min-h-14 rounded-xl border border-ink px-3 font-mono text-base" />
          </label>
          <label className="flex flex-col gap-2 font-bold">
            {t.code}
            <input type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} required maxLength={100} className="min-h-14 rounded-xl border border-ink px-3 font-mono text-base" />
          </label>
          {problem && (
            <p role="alert" className="rounded-xl bg-danger-soft p-4 font-semibold text-danger">
              {t[problem]}
            </p>
          )}
          <button disabled={state === "pending"} className="min-h-16 rounded-xl bg-brand p-4 text-lg font-bold text-white disabled:opacity-60" type="submit">
            {state === "pending" ? t.pending : t.go}
          </button>
        </form>
      )}
      <Link href={publicHref("/booking", lang)} className="flex min-h-14 items-center justify-center rounded-xl border border-ink p-3 font-semibold">
        {t.back}
      </Link>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { adminFetch, failureText } from "./adminFetch.ts";
import { ConfirmDialog } from "./ConfirmDialog.tsx";

/** Explicit admin cancellation of one demo booking (T14). Refreshes the list afterwards. */
export function BookingCancelButton({ id, label }: { id: string; label: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const busyRef = useRef(false);

  async function cancel() {
    setConfirm(false);
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const response = await adminFetch<{ booking: { status: string } }>(`/api/admin/bookings/${encodeURIComponent(id)}/cancel`, "POST");
    busyRef.current = false;
    setBusy(false);
    if (response.ok) setResult({ ok: true, text: "Storniert." });
    else if (response.data.error === "booking_ended") setResult({ ok: false, text: "Die Reservierung ist bereits vorbei und kann nicht mehr storniert werden." });
    else if (response.status === 404) setResult({ ok: false, text: "Diese Reservierung gibt es nicht mehr." });
    else if (response.status === 503) setResult({ ok: false, text: "Das System ist gerade beschäftigt. Bitte erneut versuchen." });
    else setResult({ ok: false, text: failureText(response.status, response.data) });
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={() => setConfirm(true)}
        className="min-h-11 rounded-lg border border-danger px-4 font-semibold text-danger hover:bg-danger-soft disabled:opacity-60"
      >
        {busy ? "Wird storniert …" : "Stornieren"}
      </button>
      {result && (
        <span role={result.ok ? "status" : "alert"} className={`text-sm font-semibold ${result.ok ? "text-success" : "text-danger"}`}>
          {result.text}
        </span>
      )}
      <ConfirmDialog open={confirm} title="Reservierung stornieren?" confirmLabel="Ja, stornieren" onConfirm={() => void cancel()} onCancel={() => setConfirm(false)}>
        <p>{label}</p>
        <p className="mt-2">
          Die Reservierung wird als „Storniert“ markiert und der Zeitraum ist wieder frei. Die Person, die reserviert hat, wird nicht benachrichtigt. Das lässt sich nicht rückgängig machen.
        </p>
      </ConfirmDialog>
    </div>
  );
}

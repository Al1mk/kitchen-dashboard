import Link from "next/link";
import type { ReactNode } from "react";
import { formatBerlinTime } from "@/lib/time/berlin.ts";

// Frame of the public room directory and schedule. No admin links or session.
// Sized for the portrait kiosk (large text, ≥ 56 px touch targets) and usable
// on laptops and phones. How these pages join the kiosk's start screen and the
// team's map is still open (see docs/contracts.md).

const NAV = [
  { href: "/display", label: "Mitteilungen", key: "display" },
  { href: "/rooms", label: "Räume", key: "rooms" },
  { href: "/schedule", label: "Stundenplan", key: "schedule" },
] as const;

export function PublicShell({ active, title, children }: { active: "rooms" | "schedule"; title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-lg text-ink">
      <header className="bg-surface">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-4 px-5 pt-5 pb-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- small static logo */}
          <img src="/brand/hs-coburg-logo-screenshot.png" alt="Hochschule Coburg" width={445} height={118} className="h-auto w-44" />
          <p className="font-semibold text-ink-muted">Lucas-Cranach-Campus Kronach</p>
        </div>
        <nav aria-label="Campus-Informationen" className="mx-auto w-full max-w-3xl px-5 pb-3">
          <ul className="grid grid-cols-3 gap-2">
            {NAV.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  aria-current={item.key === active ? "page" : undefined}
                  className={`flex min-h-14 touch-manipulation items-center justify-center rounded-xl px-3 text-center font-semibold ${
                    item.key === active ? "bg-brand text-white" : "bg-canvas text-ink hover:bg-neutral-soft"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="brand-stripe h-1.5" aria-hidden="true" />
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-5 py-6">
        <h1 className="font-display text-4xl font-bold">{title}</h1>
        {children}
      </main>
      <footer className="border-t border-line bg-surface px-5 py-3 text-center text-sm text-ink-muted">
        Prototyp im Kurs Mensch-Maschine-Interaktion – keine offizielle Anzeige der Hochschule Coburg.
      </footer>
    </div>
  );
}

/** Loading, error and stale states shared by the public pages. */
export function LoadState({
  loading,
  failed,
  receivedAt,
  retry,
  what,
}: {
  loading: boolean;
  failed: boolean;
  receivedAt: Date | null;
  retry: () => void;
  what: string;
}) {
  const retryButton = (
    <button type="button" onClick={retry} className="min-h-14 touch-manipulation rounded-xl bg-ink px-5 font-semibold text-white active:bg-black">
      Erneut versuchen
    </button>
  );
  if (loading && !failed) {
    return (
      <p role="status" className="py-10 text-center text-ink-muted">
        {what} werden geladen …
      </p>
    );
  }
  if (failed && !receivedAt) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="font-semibold">{what} können gerade nicht geladen werden.</p>
        <p className="text-ink-muted">Wir versuchen es automatisch weiter.</p>
        {retryButton}
      </div>
    );
  }
  if (failed && receivedAt) {
    return (
      <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-warning-soft px-4 py-3 text-warning">
        <p className="font-semibold">Verbindung unterbrochen – angezeigt wird der Stand von {formatBerlinTime(receivedAt)} Uhr.</p>
        {retryButton}
      </div>
    );
  }
  return null;
}

export function DemoNotice() {
  return (
    <p className="rounded-xl border border-info/30 bg-info-soft px-4 py-3 text-info">
      <span className="font-semibold">Beispieldaten:</span> Einträge mit der Markierung „Beispiel“ sind erfundene Demo-Daten, keine offiziellen Raum- oder
      Termininformationen.
    </p>
  );
}

export function DemoTag() {
  return <span className="rounded-full bg-info-soft px-2.5 py-0.5 text-sm font-semibold text-info">Beispiel</span>;
}

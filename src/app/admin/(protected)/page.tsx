import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/request.ts";
import { services } from "@/lib/server.ts";
import { berlinDateOf, berlinDayRange } from "@/lib/time/berlin.ts";

export const metadata: Metadata = { title: "Übersicht – Campus Board Verwaltung" };

export default async function AdminHome() {
  const session = await requireAdmin();
  const announcements = services().announcements.list();
  const today = berlinDayRange(berlinDateOf(new Date()));
  const todaysSessions = services().classSessions.list({ from: today.start, to: today.end });
  const counts = [
    { label: "Aktive Räume", value: services().rooms.list({ includeArchived: false }).length, href: "/admin/rooms" },
    { label: "Termine heute", value: todaysSessions.filter((s) => s.status === "scheduled").length, href: "/admin/schedule" },
    { label: "Heute abgesagt", value: todaysSessions.filter((s) => s.status === "cancelled").length, href: "/admin/schedule" },
    { label: "Öffentliche Mitteilungen", value: announcements.filter((a) => a.state === "live").length, href: "/admin/announcements" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Willkommen, {session.username}</h1>
        <p className="mt-1 text-ink-muted">
          Hier pflegen Sie die Campus-Informationen für Studierende und Neue: Räume, Stundenplan und Mitteilungen für den Bildschirm in der Küche.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/schedule/new" className="inline-flex min-h-11 items-center rounded-lg bg-brand px-5 font-semibold text-white hover:bg-brand-strong">
          Neuer Termin
        </Link>
        <Link href="/admin/rooms/new" className="inline-flex min-h-11 items-center rounded-lg border border-ink bg-surface px-5 font-semibold hover:bg-canvas">
          Neuer Raum
        </Link>
        <Link href="/admin/announcements/new" className="inline-flex min-h-11 items-center rounded-lg border border-ink bg-surface px-5 font-semibold hover:bg-canvas">
          Neue Mitteilung
        </Link>
      </div>

      <section aria-labelledby="stand" className="flex flex-col gap-3">
        <h2 id="stand" className="font-display text-xl font-bold">Aktueller Stand</h2>
        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {counts.map((c) => (
            <div key={c.label} className="rounded-xl border border-line bg-surface p-5">
              <dt className="text-ink-muted">
                <Link href={c.href} className="underline-offset-4 hover:underline">{c.label}</Link>
              </dt>
              <dd className="mt-1 font-display text-3xl font-bold tabular-nums">{c.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="ablauf" className="rounded-xl border border-line bg-surface p-6">
        <h2 id="ablauf" className="font-display text-xl font-bold">Wann wird eine Änderung öffentlich?</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>
            <strong>Räume und Termine:</strong> sofort nach dem Speichern – im öffentlichen{" "}
            <a href="/rooms" target="_blank" rel="noopener" className="underline underline-offset-4">Raumverzeichnis</a> und{" "}
            <a href="/schedule" target="_blank" rel="noopener" className="underline underline-offset-4">Stundenplan</a>.
          </li>
          <li>
            <strong>Mitteilungen:</strong> erst nach <strong>Veröffentlichen</strong>. Gespeicherte Entwürfe bleiben unsichtbar, bis Sie sie veröffentlichen.
          </li>
          <li>Abgesagte Termine bleiben sichtbar und werden als „Entfällt“ markiert.</li>
        </ul>
      </section>
    </div>
  );
}

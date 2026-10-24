import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/request.ts";
import { services } from "@/lib/server.ts";

export const metadata: Metadata = { title: "Übersicht – Campus Board Verwaltung" };

export default async function AdminHome() {
  const session = await requireAdmin();
  const all = services().announcements.list();
  const counts = [
    { label: "Öffentlich sichtbar", value: all.filter((a) => a.state === "live").length },
    { label: "Entwürfe", value: all.filter((a) => a.state === "draft").length },
    { label: "Mit unveröffentlichten Änderungen", value: all.filter((a) => a.hasPendingChanges).length },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Willkommen, {session.username}</h1>
        <p className="mt-1 text-ink-muted">Hier verwalten Sie die Mitteilungen für den Bildschirm in der Küche.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/announcements/new" className="inline-flex min-h-11 items-center rounded-lg bg-brand px-5 font-semibold text-white hover:bg-brand-strong">
          Neue Mitteilung
        </Link>
        <Link href="/admin/announcements" className="inline-flex min-h-11 items-center rounded-lg border border-ink bg-surface px-5 font-semibold hover:bg-canvas">
          Alle Mitteilungen
        </Link>
      </div>

      <section aria-labelledby="stand" className="flex flex-col gap-3">
        <h2 id="stand" className="font-display text-xl font-bold">Aktueller Stand</h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          {counts.map((c) => (
            <div key={c.label} className="rounded-xl border border-line bg-surface p-5">
              <dt className="text-ink-muted">{c.label}</dt>
              <dd className="mt-1 font-display text-3xl font-bold tabular-nums">{c.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="ablauf" className="rounded-xl border border-line bg-surface p-6">
        <h2 id="ablauf" className="font-display text-xl font-bold">So kommt eine Mitteilung auf den Bildschirm</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5">
          <li><strong>Entwurf speichern</strong> – noch nicht öffentlich.</li>
          <li><strong>Vorschau prüfen</strong> – im Hochformat des Bildschirms.</li>
          <li><strong>Veröffentlichen</strong> – erscheint innerhalb von etwa 5 Sekunden auf der öffentlichen Anzeige.</li>
          <li>Später ändern und erneut veröffentlichen oder die <strong>Veröffentlichung zurücknehmen</strong>.</li>
        </ol>
      </section>
    </div>
  );
}

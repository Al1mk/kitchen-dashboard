import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/StatusBadge.tsx";
import { CATEGORY_LABELS } from "@/lib/announcements/schema.ts";
import { requireAdmin } from "@/lib/auth/request.ts";
import { services } from "@/lib/server.ts";
import { formatBerlinDateTime } from "@/lib/time/berlin.ts";

export const metadata: Metadata = { title: "Mitteilungen – Campus Board Verwaltung" };

function windowText(startsAt: string | null, endsAt: string | null) {
  if (!startsAt && !endsAt) return "Ohne Einschränkung";
  return [startsAt && `ab ${formatBerlinDateTime(startsAt)}`, endsAt && `bis ${formatBerlinDateTime(endsAt)}`].filter(Boolean).join(" ");
}

export default async function AnnouncementsPage() {
  await requireAdmin();
  const announcements = services().announcements.list();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Mitteilungen</h1>
          <p className="mt-1 text-ink-muted">Zuletzt geänderte zuerst.</p>
        </div>
        <Link href="/admin/announcements/new" className="inline-flex min-h-11 items-center rounded-lg bg-brand px-5 font-semibold text-white hover:bg-brand-strong">
          Neue Mitteilung
        </Link>
      </div>

      {announcements.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface p-10 text-center">
          <p className="font-semibold">Noch keine Mitteilungen vorhanden.</p>
          <p className="mt-1 text-ink-muted">Legen Sie die erste Mitteilung an – sie bleibt bis zur Veröffentlichung ein Entwurf.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-left">
            <thead className="border-b border-line bg-canvas text-sm text-ink-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Titel</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 font-semibold">Kategorie</th>
                <th scope="col" className="px-4 py-3 font-semibold">Zeitraum</th>
                <th scope="col" className="px-4 py-3 font-semibold">Geändert</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((a) => (
                <tr key={a.id} className="border-b border-line last:border-0">
                  <td className="max-w-xs px-4 py-3">
                    <Link href={`/admin/announcements/${a.id}`} className="font-semibold text-ink underline underline-offset-4 [overflow-wrap:anywhere] hover:text-brand">
                      {a.draft.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3"><StatusBadge state={a.state} pending={a.hasPendingChanges} /></td>
                  <td className="px-4 py-3">{CATEGORY_LABELS[a.draft.category]}{a.draft.pinned ? " · hervorgehoben" : ""}</td>
                  <td className="px-4 py-3 text-sm">{windowText(a.draft.startsAt, a.draft.endsAt)}</td>
                  <td className="px-4 py-3 text-sm tabular-nums">{formatBerlinDateTime(a.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

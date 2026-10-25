import type { Metadata } from "next";
import Link from "next/link";
import { Pill } from "@/components/admin/FormParts.tsx";
import { requireAdmin } from "@/lib/auth/request.ts";
import { FLOOR_LABELS, ROOM_TYPE_LABELS } from "@/lib/rooms/schema.ts";
import { services } from "@/lib/server.ts";

export const metadata: Metadata = { title: "Räume – Campus Board Verwaltung" };

export default async function RoomsPage({ searchParams }: PageProps<"/admin/rooms">) {
  await requireAdmin();
  const showArchived = (await searchParams).archiviert === "1";
  const rooms = services().rooms.list({ includeArchived: showArchived });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Räume</h1>
          <p className="mt-1 text-ink-muted">Nach Stockwerk und Raumnummer sortiert. Änderungen sind nach dem Speichern sofort öffentlich.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={showArchived ? "/admin/rooms" : "/admin/rooms?archiviert=1"}
            className="inline-flex min-h-11 items-center rounded-lg border border-line bg-surface px-4 font-semibold hover:bg-canvas"
          >
            {showArchived ? "Archivierte ausblenden" : "Archivierte anzeigen"}
          </Link>
          <Link href="/admin/rooms/new" className="inline-flex min-h-11 items-center rounded-lg bg-brand px-5 font-semibold text-white hover:bg-brand-strong">
            Neuer Raum
          </Link>
        </div>
      </div>

      {rooms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface p-10 text-center">
          <p className="font-semibold">Noch keine Räume vorhanden.</p>
          <p className="mt-1 text-ink-muted">Legen Sie den ersten Raum an. Termine im Stundenplan brauchen einen Raum.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-left">
            <thead className="border-b border-line bg-canvas text-sm text-ink-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Raumnummer</th>
                <th scope="col" className="px-4 py-3 font-semibold">Name</th>
                <th scope="col" className="px-4 py-3 font-semibold">Stockwerk</th>
                <th scope="col" className="px-4 py-3 font-semibold">Raumart</th>
                <th scope="col" className="px-4 py-3 font-semibold">Reservierbar</th>
                <th scope="col" className="px-4 py-3 font-semibold">Geplante Termine</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/rooms/${r.id}`} className="font-semibold text-ink underline underline-offset-4 [overflow-wrap:anywhere] hover:text-brand">
                      {r.code}
                    </Link>
                  </td>
                  <td className="max-w-xs px-4 py-3 [overflow-wrap:anywhere]">{r.name}</td>
                  <td className="px-4 py-3">{FLOOR_LABELS[r.floorId] ?? r.floorId}</td>
                  <td className="px-4 py-3">{ROOM_TYPE_LABELS[r.type] ?? r.type}</td>
                  <td className="px-4 py-3">{r.reservable ? "Ja" : "Nein"}</td>
                  <td className="px-4 py-3 tabular-nums">{r.upcomingSessions}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex flex-wrap gap-1.5">
                      {r.archivedAt ? <Pill tone="muted">Archiviert</Pill> : <Pill tone="success">Aktiv</Pill>}
                      {r.isDemo && <Pill tone="info">Beispieldaten</Pill>}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

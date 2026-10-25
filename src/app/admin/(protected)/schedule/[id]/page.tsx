import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SessionForm } from "@/components/admin/SessionForm.tsx";
import { requireAdmin } from "@/lib/auth/request.ts";
import { services } from "@/lib/server.ts";
import { berlinDateOf } from "@/lib/time/berlin.ts";

export const metadata: Metadata = { title: "Termin bearbeiten – Campus Board Verwaltung" };

const FLASH: Record<string, string> = {
  gespeichert: "Termin angelegt. Er ist jetzt im öffentlichen Stundenplan sichtbar.",
};

export default async function EditSessionPage({ params, searchParams }: PageProps<"/admin/schedule/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const { hinweis } = await searchParams;
  const session = services().classSessions.get(id);
  if (!session) notFound();
  // Active rooms, plus the session's own room if it was archived in the meantime.
  const rooms = services()
    .rooms.list({ includeArchived: true })
    .filter((r) => !r.archivedAt || r.id === session.roomId)
    .map((r) => ({ id: r.id, code: r.code, name: r.name, floorId: r.floorId, archived: !!r.archivedAt }));
  const date = berlinDateOf(new Date(session.startsAt));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/admin/schedule?von=${date}`} className="text-sm font-semibold underline underline-offset-4">← Stundenplan</Link>
        <h1 className="mt-2 font-display text-3xl font-bold [overflow-wrap:anywhere]">Termin bearbeiten</h1>
      </div>
      <SessionForm
        key={session.id}
        initial={session}
        rooms={rooms}
        defaults={{ date, roomId: session.roomId }}
        flash={typeof hinweis === "string" ? FLASH[hinweis] : undefined}
      />
    </div>
  );
}

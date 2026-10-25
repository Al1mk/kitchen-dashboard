import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RoomForm } from "@/components/admin/RoomForm.tsx";
import { requireAdmin } from "@/lib/auth/request.ts";
import { services } from "@/lib/server.ts";

export const metadata: Metadata = { title: "Raum bearbeiten – Campus Board Verwaltung" };

const FLASH: Record<string, string> = {
  gespeichert: "Raum angelegt. Er ist jetzt im öffentlichen Raumverzeichnis sichtbar.",
};

export default async function EditRoomPage({ params, searchParams }: PageProps<"/admin/rooms/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const { hinweis } = await searchParams;
  const room = services().rooms.get(id);
  if (!room) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/rooms" className="text-sm font-semibold underline underline-offset-4">← Alle Räume</Link>
        <h1 className="mt-2 font-display text-3xl font-bold [overflow-wrap:anywhere]">Raum {room.code} bearbeiten</h1>
      </div>
      <RoomForm key={room.id} initial={room} flash={typeof hinweis === "string" ? FLASH[hinweis] : undefined} />
    </div>
  );
}

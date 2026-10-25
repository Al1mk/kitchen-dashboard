import type { Metadata } from "next";
import Link from "next/link";
import { RoomForm } from "@/components/admin/RoomForm.tsx";
import { requireAdmin } from "@/lib/auth/request.ts";

export const metadata: Metadata = { title: "Neuer Raum – Campus Board Verwaltung" };

export default async function NewRoomPage() {
  await requireAdmin();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/rooms" className="text-sm font-semibold underline underline-offset-4">← Alle Räume</Link>
        <h1 className="mt-2 font-display text-3xl font-bold">Neuer Raum</h1>
      </div>
      <RoomForm initial={null} />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { SessionForm } from "@/components/admin/SessionForm.tsx";
import { requireAdmin } from "@/lib/auth/request.ts";
import { services } from "@/lib/server.ts";
import { berlinDateOf, isCalendarDate } from "@/lib/time/berlin.ts";

export const metadata: Metadata = { title: "Neuer Termin – Campus Board Verwaltung" };

export default async function NewSessionPage({ searchParams }: PageProps<"/admin/schedule/new">) {
  await requireAdmin();
  const { datum, raum } = await searchParams;
  const rooms = services().rooms.list({ includeArchived: false }).map((r) => ({ id: r.id, code: r.code, name: r.name, floorId: r.floorId, archived: false }));
  const date = typeof datum === "string" && isCalendarDate(datum) ? datum : berlinDateOf(new Date());
  const roomId = typeof raum === "string" && rooms.some((r) => r.id === raum) ? raum : "";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/schedule" className="text-sm font-semibold underline underline-offset-4">← Stundenplan</Link>
        <h1 className="mt-2 font-display text-3xl font-bold">Neuer Termin</h1>
      </div>
      {rooms.length === 0 ? (
        <p className="rounded-lg bg-warning-soft px-4 py-3 font-semibold text-warning">
          Es gibt noch keinen aktiven Raum. <Link href="/admin/rooms/new" className="underline underline-offset-4">Legen Sie zuerst einen Raum an.</Link>
        </p>
      ) : (
        <SessionForm initial={null} rooms={rooms} defaults={{ date, roomId }} />
      )}
    </div>
  );
}

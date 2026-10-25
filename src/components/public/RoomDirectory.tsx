"use client";

import Link from "next/link";
import { FLOORS, ROOM_TYPE_LABELS, type PublicRoom } from "@/lib/rooms/schema.ts";
import { DemoNotice, DemoTag, LoadState } from "./PublicShell.tsx";
import { usePolledJson } from "./usePolledJson.ts";

export function RoomDirectory() {
  const { data, failed, receivedAt, retry } = usePolledJson<{ serverTime: string; rooms: PublicRoom[] }>("/api/public/rooms");
  const rooms = data?.rooms ?? [];

  return (
    <div className="flex flex-col gap-5" data-testid="room-directory">
      <LoadState loading={!data} failed={failed} receivedAt={receivedAt} retry={retry} what="Räume" />
      {data && rooms.length === 0 && (
        <div role="status" className="rounded-xl border border-dashed border-line bg-surface p-8 text-center">
          <p className="font-semibold">Zurzeit sind keine Räume eingetragen.</p>
          <p className="mt-1 text-ink-muted">Neue Räume erscheinen hier automatisch.</p>
        </div>
      )}
      {rooms.some((r) => r.isDemo) && <DemoNotice />}
      {FLOORS.map((floor) => {
        const onFloor = rooms.filter((r) => r.floorId === floor.id);
        if (onFloor.length === 0) return null;
        return (
          <section key={floor.id} aria-labelledby={`stock-${floor.id}`} className="flex flex-col gap-3">
            <h2 id={`stock-${floor.id}`} className="font-display text-2xl font-bold">
              {floor.label}
            </h2>
            <ul className="flex flex-col gap-3">
              {onFloor.map((room) => (
                <li key={room.id}>
                  <article className="flex flex-col gap-2 rounded-xl bg-surface p-5 shadow-sm" aria-labelledby={`raum-${room.id}`}>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 id={`raum-${room.id}`} className="font-display text-2xl font-bold [overflow-wrap:anywhere]">
                        {room.code} <span className="font-sans text-xl font-semibold">{room.name}</span>
                      </h3>
                      {room.isDemo && <DemoTag />}
                    </div>
                    <p className="text-ink-muted">{ROOM_TYPE_LABELS[room.type] ?? "Raum"}</p>
                    {room.description && <p className="whitespace-pre-line [overflow-wrap:anywhere]">{room.description}</p>}
                    <Link
                      href={`/schedule?raum=${room.id}`}
                      className="mt-1 inline-flex min-h-14 w-fit touch-manipulation items-center rounded-xl border border-ink px-5 font-semibold hover:bg-canvas"
                    >
                      Heute in diesem Raum
                    </Link>
                  </article>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

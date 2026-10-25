"use client";

import Link from "next/link";
import { fallbackLevel, localize, PUBLIC_TEXT, publicHref, type Lang } from "@/lib/i18n/public.ts";
import { FLOORS, type PublicRoom } from "@/lib/rooms/schema.ts";
import { DemoNotice, DemoTag, FallbackTag, LoadState } from "./PublicShell.tsx";
import { usePolledJson } from "./usePolledJson.ts";

export function RoomDirectory({ lang }: { lang: Lang }) {
  const t = PUBLIC_TEXT[lang];
  const { data, failed, receivedAt, retry } = usePolledJson<{ serverTime: string; rooms: PublicRoom[] }>("/api/public/rooms");
  const rooms = data?.rooms ?? [];

  return (
    <div className="flex flex-col gap-5" data-testid="room-directory">
      <LoadState loading={!data} failed={failed} receivedAt={receivedAt} retry={retry} what="rooms" lang={lang} />
      {data && rooms.length === 0 && (
        <div role="status" className="rounded-xl border border-dashed border-line bg-surface p-8 text-center">
          <p className="font-semibold">{t.rooms.empty}</p>
          <p className="mt-1 text-ink-muted">{t.rooms.emptyHint}</p>
        </div>
      )}
      {rooms.some((r) => r.isDemo) && <DemoNotice lang={lang} />}
      {FLOORS.map((floor) => {
        const onFloor = rooms.filter((r) => r.floorId === floor.id);
        if (onFloor.length === 0) return null;
        return (
          <section key={floor.id} aria-labelledby={`stock-${floor.id}`} className="flex flex-col gap-3">
            <h2 id={`stock-${floor.id}`} className="font-display text-2xl font-bold">
              {t.floors[floor.id]}
            </h2>
            <ul className="flex flex-col gap-3">
              {onFloor.map((room) => {
                const name = localize(room.name, room.nameEn, lang);
                const description = localize(room.description, room.descriptionEn, lang);
                return (
                <li key={room.id}>
                  <article className="flex flex-col gap-2 rounded-xl bg-surface p-5 shadow-sm" aria-labelledby={`raum-${room.id}`}>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 id={`raum-${room.id}`} className="font-display text-2xl font-bold [overflow-wrap:anywhere]">
                        {room.code}{" "}
                        <span lang={name.lang} className="font-sans text-xl font-semibold">
                          {name.text}
                        </span>
                      </h3>
                      <FallbackTag lang={lang} level={fallbackLevel([name, description])} />
                      {room.isDemo && <DemoTag lang={lang} />}
                    </div>
                    <p className="text-ink-muted">{t.roomTypes[room.type] ?? t.roomFallback}</p>
                    {description.text && (
                      <p lang={description.lang} className="whitespace-pre-line [overflow-wrap:anywhere]">
                        {description.text}
                      </p>
                    )}
                    <Link
                      href={publicHref("/schedule", lang, { raum: room.id })}
                      className="mt-1 inline-flex min-h-14 w-fit touch-manipulation items-center rounded-xl border border-ink px-5 font-semibold hover:bg-canvas"
                    >
                      {t.rooms.todayInRoom}
                    </Link>
                  </article>
                </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

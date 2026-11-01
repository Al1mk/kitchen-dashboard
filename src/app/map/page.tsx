import type { Metadata } from "next";
import { CampusMap } from "@/components/public/CampusMap.tsx";
import { PublicShell } from "@/components/public/PublicShell.tsx";
import { PUBLIC_TEXT, parseLang } from "@/lib/i18n/public.ts";
import { FLOOR_IDS, type FloorId } from "@/lib/rooms/schema.ts";
import { isCalendarDate } from "@/lib/time/berlin.ts";

// Public campus map in the shared shell (T11). ?raum=<room id> selects a room
// (on its current floor), ?etage=<floor> a floor when no room is selected,
// ?datum= is passed on to schedule/booking links, ?lang=en switches language.
// Aryan's original static navigator stays under /map-demo/ as provenance.
export async function generateMetadata({ searchParams }: PageProps<"/map">): Promise<Metadata> {
  const lang = parseLang((await searchParams).lang);
  return { title: `${PUBLIC_TEXT[lang].sections.map} – Campus Board` };
}

export default async function MapPage({ searchParams }: PageProps<"/map">) {
  const { raum, etage, datum, lang: langParam } = await searchParams;
  const lang = parseLang(langParam);
  const roomId = typeof raum === "string" && raum.length > 0 && raum.length <= 100 ? raum : null;
  const floor = typeof etage === "string" && (FLOOR_IDS as string[]).includes(etage) ? (etage as FloorId) : null;
  const date = typeof datum === "string" && isCalendarDate(datum) ? datum : null;
  return (
    <PublicShell active="map" lang={lang} path="/map" params={{ raum: roomId, etage: roomId ? null : floor, datum: date }} title={PUBLIC_TEXT[lang].sections.map}>
      <CampusMap lang={lang} initialRoomId={roomId} initialFloor={floor} date={date} />
    </PublicShell>
  );
}

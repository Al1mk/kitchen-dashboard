import type { Metadata } from "next";
import { DaySchedule } from "@/components/public/DaySchedule.tsx";
import { PublicShell } from "@/components/public/PublicShell.tsx";
import { PUBLIC_TEXT, parseLang } from "@/lib/i18n/public.ts";
import { isCalendarDate } from "@/lib/time/berlin.ts";

// Public, read-only daily schedule. ?datum=JJJJ-MM-TT selects a day (default:
// today by the server clock), ?raum=<id> limits it to one room, ?lang=en
// switches the interface to English.
export async function generateMetadata({ searchParams }: PageProps<"/schedule">): Promise<Metadata> {
  const lang = parseLang((await searchParams).lang);
  return { title: `${PUBLIC_TEXT[lang].sections.schedule} – Campus Board` };
}

export default async function SchedulePage({ searchParams }: PageProps<"/schedule">) {
  const { datum, raum, lang: langParam } = await searchParams;
  const lang = parseLang(langParam);
  const date = typeof datum === "string" && isCalendarDate(datum) ? datum : null;
  const roomId = typeof raum === "string" && raum.length <= 100 ? raum : null;
  return (
    <PublicShell active="schedule" lang={lang} path="/schedule" params={{ datum: date, raum: roomId }} title={PUBLIC_TEXT[lang].sections.schedule}>
      <DaySchedule key={`${date}-${roomId}`} date={date} roomId={roomId} lang={lang} />
    </PublicShell>
  );
}

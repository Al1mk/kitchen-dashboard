import type { Metadata } from "next";
import { BookingFlow } from "@/components/public/BookingFlow.tsx";
import { PublicShell } from "@/components/public/PublicShell.tsx";
import { parseLang } from "@/lib/i18n/public.ts";
import { addDays, berlinDateOf, isCalendarDate } from "@/lib/time/berlin.ts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Raum reservieren – LCC Campus Board" };

export default async function BookingPage({ searchParams }: PageProps<"/booking">) {
  const params = await searchParams;
  const lang = parseLang(params.lang);
  const today = berlinDateOf(new Date());
  const date = typeof params.datum === "string" && isCalendarDate(params.datum) && params.datum >= today && params.datum <= addDays(today, 13) ? params.datum : today;
  const roomId = typeof params.raum === "string" && params.raum.length <= 100 ? params.raum : null;
  return <PublicShell active="booking" lang={lang} path="/booking" params={{ datum: date, raum: roomId }} title={lang === "de" ? "Raum reservieren" : "Book a room"}>
    <BookingFlow lang={lang} initialRoomId={roomId} initialDate={date} minDate={today} maxDate={addDays(today, 13)} />
  </PublicShell>;
}

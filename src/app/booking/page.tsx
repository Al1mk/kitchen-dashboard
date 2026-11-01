import type { Metadata } from "next";
import { BookingFlow } from "@/components/public/BookingFlow.tsx";
import { PublicShell } from "@/components/public/PublicShell.tsx";
import { bookingDateRange } from "@/lib/bookings/policy.ts";
import { parseLang } from "@/lib/i18n/public.ts";
import { isCalendarDate } from "@/lib/time/berlin.ts";

// Public demo booking. ?raum=<room id> preselects a room (never substituted
// when unavailable), ?datum=JJJJ-MM-TT a date inside the demo range, ?lang=en.
export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: PageProps<"/booking">): Promise<Metadata> {
  const lang = parseLang((await searchParams).lang);
  return { title: `${lang === "en" ? "Book a room" : "Raum reservieren"} – Campus Board` };
}

export default async function BookingPage({ searchParams }: PageProps<"/booking">) {
  const params = await searchParams;
  const lang = parseLang(params.lang);
  const { first, last } = bookingDateRange(new Date());
  const date = typeof params.datum === "string" && isCalendarDate(params.datum) && params.datum >= first && params.datum <= last ? params.datum : first;
  const roomId = typeof params.raum === "string" && params.raum.length > 0 && params.raum.length <= 100 ? params.raum : null;
  return (
    <PublicShell active="booking" lang={lang} path="/booking" params={{ datum: date, raum: roomId }} title={lang === "en" ? "Book a room" : "Raum reservieren"}>
      <BookingFlow lang={lang} initialRoomId={roomId} initialDate={date} minDate={first} maxDate={last} />
    </PublicShell>
  );
}

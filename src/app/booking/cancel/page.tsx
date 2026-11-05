import type { Metadata } from "next";
import { BookingCancel } from "@/components/public/BookingCancel.tsx";
import { PublicShell } from "@/components/public/PublicShell.tsx";
import { parseLang } from "@/lib/i18n/public.ts";

export async function generateMetadata({ searchParams }: PageProps<"/booking/cancel">): Promise<Metadata> {
  const lang = parseLang((await searchParams).lang);
  return { title: `${lang === "de" ? "Reservierung stornieren" : "Cancel a booking"} – Campus Board` };
}
export default async function BookingCancelPage({ searchParams }: PageProps<"/booking/cancel">) {
  const lang = parseLang((await searchParams).lang);
  return <PublicShell active="booking" lang={lang} path="/booking/cancel" title={lang === "de" ? "Reservierung stornieren" : "Cancel a booking"}>
    <BookingCancel lang={lang} />
  </PublicShell>;
}

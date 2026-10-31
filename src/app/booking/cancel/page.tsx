import type { Metadata } from "next";
import { BookingCancel } from "@/components/public/BookingFlow.tsx";
import { PublicShell } from "@/components/public/PublicShell.tsx";
import { parseLang } from "@/lib/i18n/public.ts";

export const metadata: Metadata = { title: "Reservierung stornieren – LCC Campus Board" };
export default async function BookingCancelPage({ searchParams }: PageProps<"/booking/cancel">) {
  const lang = parseLang((await searchParams).lang);
  return <PublicShell active="booking" lang={lang} path="/booking/cancel" title={lang === "de" ? "Reservierung stornieren" : "Cancel a booking"}>
    <BookingCancel lang={lang} />
  </PublicShell>;
}

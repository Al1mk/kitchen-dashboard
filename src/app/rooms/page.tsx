import type { Metadata } from "next";
import { PublicShell } from "@/components/public/PublicShell.tsx";
import { RoomDirectory } from "@/components/public/RoomDirectory.tsx";
import { PUBLIC_TEXT, parseLang } from "@/lib/i18n/public.ts";

// Public, read-only room directory. Same data as the admin, refreshed by polling.
export async function generateMetadata({ searchParams }: PageProps<"/rooms">): Promise<Metadata> {
  const lang = parseLang((await searchParams).lang);
  return { title: `${PUBLIC_TEXT[lang].sections.rooms} – Campus Board` };
}

export default async function RoomsPage({ searchParams }: PageProps<"/rooms">) {
  const lang = parseLang((await searchParams).lang);
  return (
    <PublicShell active="rooms" lang={lang} path="/rooms" title={PUBLIC_TEXT[lang].sections.rooms}>
      <RoomDirectory lang={lang} />
    </PublicShell>
  );
}

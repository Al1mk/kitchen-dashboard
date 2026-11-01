import type { Metadata } from "next";
import { PublicShell } from "@/components/public/PublicShell.tsx";
import { RoomDirectory } from "@/components/public/RoomDirectory.tsx";
import { PUBLIC_TEXT, parseLang } from "@/lib/i18n/public.ts";

// Public, read-only room directory. Same data as the admin, refreshed by polling.
// Search (T32/T33): ?suche=<text> and ?datum=JJJJ-MM-TT are read and kept up to
// date by the client component; ?lang=en switches the language.
export async function generateMetadata({ searchParams }: PageProps<"/rooms">): Promise<Metadata> {
  const lang = parseLang((await searchParams).lang);
  return { title: `${PUBLIC_TEXT[lang].sections.rooms} – Campus Board` };
}

export default async function RoomsPage({ searchParams }: PageProps<"/rooms">) {
  const lang = parseLang((await searchParams).lang);
  return (
    <PublicShell active="rooms" lang={lang} path="/rooms" liveParams={["suche", "datum"]} title={PUBLIC_TEXT[lang].sections.rooms}>
      <RoomDirectory lang={lang} />
    </PublicShell>
  );
}

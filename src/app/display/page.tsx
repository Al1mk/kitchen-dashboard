import type { Metadata, Viewport } from "next";
import { DisplayBoard } from "@/components/display/DisplayBoard.tsx";
import { LanguageSwitch, PublicNav } from "@/components/public/PublicNav.tsx";
import { PUBLIC_TEXT, parseLang } from "@/lib/i18n/public.ts";

// Public kiosk route: no admin navigation, no session, read-only data. The
// public navigation (start, rooms, schedule) and the language switch are part
// of the board.
export async function generateMetadata({ searchParams }: PageProps<"/display">): Promise<Metadata> {
  const lang = parseLang((await searchParams).lang);
  return { title: `${PUBLIC_TEXT[lang].sections.display} – Campus Board` };
}
export const viewport: Viewport = { themeColor: "#23252b" };

export default async function DisplayPage({ searchParams }: PageProps<"/display">) {
  const lang = parseLang((await searchParams).lang);
  return (
    <DisplayBoard
      lang={lang}
      nav={<PublicNav active="display" lang={lang} variant="board" />}
      languageSwitch={<LanguageSwitch lang={lang} path="/display" variant="board" />}
    />
  );
}

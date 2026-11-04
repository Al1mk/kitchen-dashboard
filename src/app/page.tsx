import type { Metadata } from "next";
import Link from "next/link";
import { Pictogram } from "@/components/public/Pictograms.tsx";
import { PublicShell } from "@/components/public/PublicShell.tsx";
import { PUBLIC_TEXT, parseLang, publicHref } from "@/lib/i18n/public.ts";
import { HOME_SECTIONS } from "@/lib/public-pictograms.ts";

// Public entry: one large card with a pictogram, the name and one line for each of the six destinations
// (same order as the navigation; Start is this page). Every public page links back here ("Start"/"Home");
// ?lang=en keeps the visitor's language. V2 Stage 2 (AL-03): in public kiosk mode the cards fill the
// portrait space between the heading and the dock (docs/contracts.md C11). A pictogram never replaces the
// label: it is decorative and the name is always written next to it.

const PATHS = { newcomers: "/newcomers", map: "/map", rooms: "/rooms", schedule: "/schedule", booking: "/booking", display: "/display" } as const;

export async function generateMetadata({ searchParams }: PageProps<"/">): Promise<Metadata> {
  const lang = parseLang((await searchParams).lang);
  return { title: `${PUBLIC_TEXT[lang].start.title} – Campus Board` };
}

export default async function StartPage({ searchParams }: PageProps<"/">) {
  const lang = parseLang((await searchParams).lang);
  const t = PUBLIC_TEXT[lang];
  return (
    <PublicShell active="start" lang={lang} path="/" title={t.start.title}>
      <p>{t.start.intro}</p>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 kiosk:flex-1 kiosk:auto-rows-[minmax(min-content,1fr)]">
        {HOME_SECTIONS.map((key) => (
          <li key={key} className="flex">
            <Link
              href={publicHref(PATHS[key], lang)}
              data-testid="home-card"
              className="flex min-h-28 w-full touch-manipulation flex-row items-center gap-4 rounded-2xl border-l-8 border-brand bg-surface p-5 shadow-sm hover:bg-neutral-soft active:bg-neutral-soft sm:flex-col sm:items-stretch sm:justify-between sm:gap-3"
            >
              <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-brand-cream text-brand-strong sm:size-20 sm:rounded-2xl">
                <Pictogram name={key} className="size-9 sm:size-12" />
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span data-card-title className="font-display text-3xl font-bold">
                  {t.sections[key]}
                </span>
                <span data-card-text className="text-ink-muted">
                  {t.start.tiles[key]}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </PublicShell>
  );
}

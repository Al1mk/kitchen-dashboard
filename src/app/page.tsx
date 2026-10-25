import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/public/PublicShell.tsx";
import { PUBLIC_TEXT, parseLang, publicHref } from "@/lib/i18n/public.ts";

// Public entry: links to the three public sections. Every public page links
// back here ("Start"/"Home"); ?lang=en keeps the visitor's language.

export async function generateMetadata({ searchParams }: PageProps<"/">): Promise<Metadata> {
  const lang = parseLang((await searchParams).lang);
  return { title: `${PUBLIC_TEXT[lang].start.title} – Campus Board` };
}

const TILES = [
  { key: "display", path: "/display" },
  { key: "rooms", path: "/rooms" },
  { key: "schedule", path: "/schedule" },
] as const;

export default async function StartPage({ searchParams }: PageProps<"/">) {
  const lang = parseLang((await searchParams).lang);
  const t = PUBLIC_TEXT[lang];
  return (
    <PublicShell active="start" lang={lang} path="/" title={t.start.title}>
      <p>{t.start.intro}</p>
      <ul className="flex flex-col gap-3">
        {TILES.map(({ key, path }) => (
          <li key={key}>
            <Link
              href={publicHref(path, lang)}
              className="flex min-h-24 touch-manipulation flex-col justify-center gap-1 rounded-xl border-l-8 border-brand bg-surface px-6 py-4 shadow-sm hover:bg-neutral-soft"
            >
              <span className="font-display text-3xl font-bold">{t.sections[key]}</span>
              <span className="text-ink-muted">{t.start.tiles[key]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </PublicShell>
  );
}

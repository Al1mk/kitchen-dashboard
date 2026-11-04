import type { Metadata } from "next";
import Link from "next/link";
import { Pictogram } from "@/components/public/Pictograms.tsx";
import { PublicShell } from "@/components/public/PublicShell.tsx";
import { parseLang, publicHref } from "@/lib/i18n/public.ts";
import { NEWCOMER_PICTOGRAM } from "@/lib/public-pictograms.ts";
import { NEWCOMER_CARDS } from "@/lib/newcomers/content.ts";

// Static newcomer guide. Original page by Reza (commit 6bc0b21); adapted by Ali in T15 (every card leads to
// a working in-app destination, incl. the integrated map). V2 Stage 2 (AL-03, docs/contracts.md C11): the
// long coloured prototype block is replaced by one compact line; the four task cards form a 2 × 2 grid with
// a pictogram each and the help card spans the full width below them as a quieter, secondary action. The
// card texts come from src/lib/newcomers/content.ts (Reza's file) unchanged, in the order of that file.
export async function generateMetadata({ searchParams }: PageProps<"/newcomers">): Promise<Metadata> {
  const lang = parseLang((await searchParams).lang);
  return { title: `${lang === "en" ? "New to campus" : "Neu am Campus"} – Campus Board` };
}

export default async function NewcomersPage({ searchParams }: PageProps<"/newcomers">) {
  const lang = parseLang((await searchParams).lang);
  const t = lang === "en"
    ? {
        title: "New to campus?",
        intro: "Choose what you need right now.",
        marker: "Prototype · example data – not an official information system of Hochschule Coburg.",
      }
    : {
        title: "Neu am Campus?",
        intro: "Wähle direkt aus, was du gerade brauchst.",
        marker: "Prototyp · Beispieldaten – kein offizielles Informationssystem der Hochschule Coburg.",
      };

  return (
    <PublicShell active="newcomers" lang={lang} path="/newcomers" title={t.title}>
      <section className="flex flex-col gap-5">
        <p className="text-lg leading-relaxed">{t.intro}</p>
        <p data-testid="prototype-marker" className="text-base text-ink-muted">
          {t.marker}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {NEWCOMER_CARDS.map((card) => {
            const help = card.id === "help";
            return (
              <article
                key={card.id}
                data-newcomer-card={card.id}
                aria-labelledby={`newcomer-${card.id}`}
                className={`flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-sm ${help ? "sm:col-span-2" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-brand-cream text-brand-strong">
                    <Pictogram name={NEWCOMER_PICTOGRAM[card.id]} className="size-9" />
                  </span>
                  <h2 id={`newcomer-${card.id}`} className="font-display text-2xl font-bold">
                    {card.title[lang]}
                  </h2>
                </div>
                <p className="leading-relaxed text-ink-muted">{card.body[lang]}</p>
                <Link
                  href={publicHref(card.path, lang)}
                  className={`mt-auto flex min-h-14 touch-manipulation items-center justify-center rounded-xl px-5 py-3 text-center text-lg font-bold focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                    help ? "border-2 border-ink bg-surface text-ink hover:bg-neutral-soft" : "bg-brand text-white hover:bg-brand-strong"
                  }`}
                >
                  {card.actionLabel[lang]}
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </PublicShell>
  );
}

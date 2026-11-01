import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/public/PublicShell.tsx";
import { parseLang, publicHref } from "@/lib/i18n/public.ts";
import { NEWCOMER_CARDS } from "@/lib/newcomers/content.ts";

// Static newcomer guide. Original page by Reza (commit 6bc0b21); adapted by Ali
// in T15: one prototype note instead of per-card developer text, every card
// leads to a working in-app destination (incl. the integrated map).
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
        prototype: "Student HCI prototype – not an official information system of Hochschule Coburg. Rooms and classes shown here are partly example data; please confirm important details with official university sources.",
      }
    : {
        title: "Neu am Campus?",
        intro: "Wähle direkt aus, was du gerade brauchst.",
        prototype: "Studentischer HCI-Prototyp – kein offizielles Informationssystem der Hochschule Coburg. Räume und Termine sind teilweise Beispieldaten; prüfe wichtige Angaben über offizielle Hochschulquellen.",
      };

  return (
    <PublicShell active="newcomers" lang={lang} path="/newcomers" title={t.title}>
      <section className="space-y-5">
        <p className="text-lg leading-relaxed">{t.intro}</p>
        <p role="note" className="rounded-xl border border-info/30 bg-info-soft px-4 py-3 text-base text-info">
          {t.prototype}
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {NEWCOMER_CARDS.map((card) => (
            <article key={card.id} aria-labelledby={`newcomer-${card.id}`} className="flex min-h-52 flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm">
              <h2 id={`newcomer-${card.id}`} className="font-display text-2xl font-bold">
                {card.title[lang]}
              </h2>
              <p className="leading-relaxed text-ink-muted">{card.body[lang]}</p>
              <Link
                href={publicHref(card.path, lang)}
                className="mt-auto flex min-h-14 touch-manipulation items-center justify-center rounded-xl bg-brand px-5 py-3 text-center text-lg font-bold text-white focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                {card.actionLabel[lang]}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/public/PublicShell.tsx";
import { parseLang, publicHref, type Lang } from "@/lib/i18n/public.ts";
import { NEWCOMER_CARDS } from "@/lib/newcomers/content.ts";

export async function generateMetadata({ searchParams }: PageProps<"/newcomers">): Promise<Metadata> {
  const lang = parseLang((await searchParams).lang);
  return { title: `${lang === "en" ? "New to campus" : "Neu am Campus"} – Campus Board` };
}

/** Integration-ready static guide. Shared navigation must be updated by agreement with Ali. */
export default async function NewcomersPage({ searchParams }: PageProps<"/newcomers">) {
  const lang = parseLang((await searchParams).lang);
  const t = lang === "en"
    ? {
        title: "New to campus?",
        intro: "Start with the task you need. Choose one clear starting point.",
        prototype: "Student HCI prototype — not an official university information system.",
        demo: "Demo information may be incomplete or unverified. Confirm important room and class details through official university sources.",
        rooms: "Open the existing room directory. The map is not linked until its route is integrated and verified.",
        schedule: "Open the schedule and confirm important information with official sources.",
        notices: "Only published notices should be shown in the integrated version; demo items must be labelled.",
        help: "Use official university information channels. No unverified contact details or opening hours are supplied here.",
      }
    : {
        title: "Neu am Campus?",
        intro: "Wähle direkt aus, was du gerade brauchst.",
        prototype: "Studentischer HCI-Prototyp — kein offizielles Informationssystem der Hochschule.",
        demo: "Demo-Informationen können unvollständig oder unbestätigt sein. Prüfe wichtige Raum- und Kursangaben über offizielle Hochschulquellen.",
        rooms: "Öffne die vorhandene Raumübersicht. Die Karte wird erst verlinkt, wenn ihre Route integriert und geprüft ist.",
        schedule: "Öffne den Stundenplan und prüfe wichtige Informationen zusätzlich über offizielle Quellen.",
        notices: "In der integrierten Version sollen nur veröffentlichte Hinweise erscheinen; Demo-Einträge müssen gekennzeichnet sein.",
        help: "Nutze offizielle Informationskanäle der Hochschule. Hier werden keine unbestätigten Kontakte oder Öffnungszeiten genannt.",
      };

  const paths: Record<string, string> = {
    rooms: "/rooms",
    schedule: "/schedule",
    notices: "/display",
    help: "/display",
  };
  const details: Record<string, string> = {
    rooms: t.rooms,
    schedule: t.schedule,
    notices: t.notices,
    help: t.help,
  };

  return (
    <PublicShell active="newcomers" lang={lang} path="/newcomers" title={t.title}>
      <section className="space-y-5">
        <p className="text-lg leading-relaxed">{t.intro}</p>
        <div role="note" className="rounded-xl border border-info/30 bg-info-soft px-4 py-3 text-base text-info">
          <strong className="block">{t.prototype}</strong>
          <span>{t.demo}</span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {NEWCOMER_CARDS.map((card) => {
            const title = card.title[lang] || card.title.de;
            const body = card.body[lang] || card.body.de;
            const action = card.actionLabel[lang] || card.actionLabel.de;
            return (
              <article key={card.id} className="flex min-h-52 flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm">
                <h2 className="font-display text-2xl font-bold">{title}</h2>
                <p className="leading-relaxed text-ink-muted">{body}</p>
                <p className="text-sm leading-relaxed text-ink-muted">{details[card.id]}</p>
                {card.id !== "help" && (
                  <Link
                    href={publicHref(paths[card.id], lang)}
                    className="mt-auto flex min-h-14 touch-manipulation items-center justify-center rounded-xl bg-brand px-5 py-3 text-center text-lg font-bold text-white focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    {action}
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </PublicShell>
  );
}

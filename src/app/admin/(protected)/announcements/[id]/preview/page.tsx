import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BoardLayout, type BoardItem } from "@/components/display/BoardLayout.tsx";
import { comparePublic } from "@/lib/announcements/projection.ts";
import { requireAdmin } from "@/lib/auth/request.ts";
import { parseLang } from "@/lib/i18n/public.ts";
import { services } from "@/lib/server.ts";

export const metadata: Metadata = { title: "Vorschau – Campus Board Verwaltung" };

// ?sprache=en shows the board as visitors of the English interface see it
// (English text where given, German fallback marked). The admin text around it stays German.
export default async function PreviewPage({ params, searchParams }: PageProps<"/admin/announcements/[id]/preview">) {
  await requireAdmin();
  const { id } = await params;
  const lang = parseLang((await searchParams).sprache);
  const announcement = services().announcements.get(id);
  if (!announcement) notFound();

  const now = new Date();
  const draft: BoardItem = {
    id: announcement.id,
    title: announcement.draft.title,
    body: announcement.draft.body,
    category: announcement.draft.category,
    pinned: announcement.draft.pinned,
    publishedAt: now.toISOString(),
    endsAt: announcement.draft.endsAt,
    titleEn: announcement.draft.titleEn || null,
    bodyEn: announcement.draft.bodyEn || null,
    isPreview: true,
  };
  // The saved draft shown among what is currently public, in display order.
  const items = [draft, ...services().announcements.listPublic().filter((a) => a.id !== id)].sort(comparePublic);

  const tab = (code: "de" | "en", label: string) => (
    <Link
      href={code === "en" ? `/admin/announcements/${id}/preview?sprache=en` : `/admin/announcements/${id}/preview`}
      aria-current={lang === code ? "page" : undefined}
      className={`inline-flex min-h-11 items-center rounded-lg px-4 font-semibold ${lang === code ? "bg-ink text-white" : "border border-line bg-surface hover:bg-canvas"}`}
    >
      {label}
    </Link>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href={`/admin/announcements/${id}`} className="text-sm font-semibold underline underline-offset-4">← Zurück zur Bearbeitung</Link>
          <h1 className="mt-2 font-display text-3xl font-bold">Vorschau im Bildschirm-Format</h1>
          <p className="mt-1 max-w-2xl text-ink-muted">
            Zeigt den <strong>gespeicherten Entwurf</strong> (gestrichelt markiert) zwischen den aktuell öffentlichen Mitteilungen.
            Diese Vorschau ist nur in der Verwaltung sichtbar und nicht veröffentlicht. Hochformat 9:16 (Annahme, Bildschirmmaße noch nicht gemessen).
          </p>
        </div>
        <nav aria-label="Sprachfassung der Vorschau" className="flex gap-2">
          {tab("de", "Deutsche Ansicht")}
          {tab("en", "Englische Ansicht")}
        </nav>
      </div>
      {lang === "en" && (
        <p className="max-w-2xl rounded-lg bg-info-soft px-4 py-3 text-info">
          So sehen Besucher:innen mit englischer Oberfläche den Bildschirm. Fehlt eine englische Fassung, erscheint der deutsche Text mit dem
          Hinweis „Only in German“ bzw. „Partly in German“.
        </p>
      )}
      <div className="mx-auto aspect-[9/16] w-full max-w-[min(32rem,calc((100dvh-6rem)*9/16))] overflow-hidden rounded-xl border-8 border-ink shadow-xl">
        <BoardLayout
          items={items}
          now={now}
          lang={lang}
          banner={
            <p lang="de" className="bg-brand-purple px-[4.5cqw] py-[2cqw] text-[2.8cqw] font-semibold text-white">
              Vorschau – nicht veröffentlicht{lang === "en" ? " (englische Ansicht)" : ""}
            </p>
          }
        />
      </div>
    </div>
  );
}

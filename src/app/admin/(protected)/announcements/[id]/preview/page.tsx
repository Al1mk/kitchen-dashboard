import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BoardLayout, type BoardItem } from "@/components/display/BoardLayout.tsx";
import { comparePublic } from "@/lib/announcements/projection.ts";
import { requireAdmin } from "@/lib/auth/request.ts";
import { services } from "@/lib/server.ts";

export const metadata: Metadata = { title: "Vorschau – Campus Board Verwaltung" };

export default async function PreviewPage({ params }: PageProps<"/admin/announcements/[id]/preview">) {
  await requireAdmin();
  const { id } = await params;
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
    isPreview: true,
  };
  // The saved draft shown among what is currently public, in display order.
  const items = [draft, ...services().announcements.listPublic().filter((a) => a.id !== id)].sort(comparePublic);

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
      </div>
      <div className="mx-auto aspect-[9/16] w-full max-w-[min(32rem,calc((100dvh-6rem)*9/16))] overflow-hidden rounded-xl border-8 border-ink shadow-xl">
        <BoardLayout
          items={items}
          now={now}
          banner={
            <p className="bg-brand-purple px-[4.5cqw] py-[2cqw] text-[2.8cqw] font-semibold text-white">
              Vorschau – nicht veröffentlicht
            </p>
          }
        />
      </div>
    </div>
  );
}

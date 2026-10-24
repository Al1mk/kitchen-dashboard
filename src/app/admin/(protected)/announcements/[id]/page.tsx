import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnnouncementEditor } from "@/components/admin/AnnouncementEditor.tsx";
import { requireAdmin } from "@/lib/auth/request.ts";
import { services } from "@/lib/server.ts";

export const metadata: Metadata = { title: "Mitteilung bearbeiten – Campus Board Verwaltung" };

const FLASH: Record<string, string> = {
  gespeichert: "Entwurf gespeichert. Noch nicht öffentlich sichtbar.",
  veroeffentlicht: "Veröffentlicht. Die Mitteilung erscheint innerhalb von etwa 5 Sekunden auf dem Bildschirm.",
};

export default async function EditAnnouncementPage({ params, searchParams }: PageProps<"/admin/announcements/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const { hinweis } = await searchParams;
  const announcement = services().announcements.get(id);
  if (!announcement) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/announcements" className="text-sm font-semibold underline underline-offset-4">← Alle Mitteilungen</Link>
        <h1 className="mt-2 font-display text-3xl font-bold">Mitteilung bearbeiten</h1>
      </div>
      <AnnouncementEditor key={announcement.id} initial={announcement} flash={typeof hinweis === "string" ? FLASH[hinweis] : undefined} />
    </div>
  );
}

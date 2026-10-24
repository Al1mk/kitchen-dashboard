import type { Metadata } from "next";
import Link from "next/link";
import { AnnouncementEditor } from "@/components/admin/AnnouncementEditor.tsx";
import { requireAdmin } from "@/lib/auth/request.ts";

export const metadata: Metadata = { title: "Neue Mitteilung – Campus Board Verwaltung" };

export default async function NewAnnouncementPage() {
  await requireAdmin();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/announcements" className="text-sm font-semibold underline underline-offset-4">← Alle Mitteilungen</Link>
        <h1 className="mt-2 font-display text-3xl font-bold">Neue Mitteilung</h1>
      </div>
      <AnnouncementEditor initial={null} />
    </div>
  );
}

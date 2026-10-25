import type { AnnouncementContent, AnnouncementStatus } from "./schema.ts";

// Pure publication rules. "now" always comes from the server clock.

type PublicationFields = { status: AnnouncementStatus; published: AnnouncementContent | null };

function isWithinWindow(content: AnnouncementContent, now: Date): boolean {
  const t = now.getTime();
  if (content.startsAt && Date.parse(content.startsAt) > t) return false;
  if (content.endsAt && Date.parse(content.endsAt) <= t) return false;
  return true;
}

export function isPubliclyVisible(record: PublicationFields, now: Date): boolean {
  return record.status === "published" && record.published !== null && isWithinWindow(record.published, now);
}

export function contentEquals(a: AnnouncementContent, b: AnnouncementContent): boolean {
  return (
    a.title === b.title &&
    a.body === b.body &&
    a.category === b.category &&
    a.pinned === b.pinned &&
    a.startsAt === b.startsAt &&
    a.endsAt === b.endsAt &&
    a.titleEn === b.titleEn &&
    a.bodyEn === b.bodyEn
  );
}

export function hasPendingChanges(record: PublicationFields & { draft: AnnouncementContent }): boolean {
  return record.status === "published" && record.published !== null && !contentEquals(record.draft, record.published);
}

export type AdminState = "draft" | "live" | "scheduled" | "expired" | "withdrawn";

export function getAdminState(record: PublicationFields, now: Date): AdminState {
  if (record.status === "draft") return "draft";
  if (record.status === "withdrawn" || !record.published) return "withdrawn";
  const { startsAt, endsAt } = record.published;
  if (startsAt && Date.parse(startsAt) > now.getTime()) return "scheduled";
  if (endsAt && Date.parse(endsAt) <= now.getTime()) return "expired";
  return "live";
}

export function canPublish(content: AnnouncementContent, now: Date): { ok: true } | { ok: false; reason: "expired" } {
  if (content.endsAt && Date.parse(content.endsAt) <= now.getTime()) return { ok: false, reason: "expired" };
  return { ok: true };
}

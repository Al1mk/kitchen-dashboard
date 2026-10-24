import type { AnnouncementContent, PublicAnnouncement } from "./schema.ts";

/** Builds the public view from a published snapshot. Only allowlisted fields leave the server. */
export function toPublicAnnouncement(id: string, published: AnnouncementContent, publishedAt: string): PublicAnnouncement {
  return {
    id,
    title: published.title,
    body: published.body,
    category: published.category,
    pinned: published.pinned,
    publishedAt,
    endsAt: published.endsAt,
  };
}

/** Pinned first, then most recently published first. */
export function comparePublic(a: PublicAnnouncement, b: PublicAnnouncement): number {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  return b.publishedAt.localeCompare(a.publishedAt);
}

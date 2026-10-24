import { randomUUID } from "node:crypto";
import type { Db } from "../db/database.ts";
import { canPublish, getAdminState, hasPendingChanges, isPubliclyVisible, type AdminState } from "./policy.ts";
import { comparePublic, toPublicAnnouncement } from "./projection.ts";
import type { AnnouncementContent, AnnouncementStatus, PublicAnnouncement } from "./schema.ts";

/** Admin view of one announcement. Never send this to the public display. */
export type AdminAnnouncement = {
  id: string;
  status: AnnouncementStatus;
  state: AdminState;
  hasPendingChanges: boolean;
  draft: AnnouncementContent;
  published: AnnouncementContent | null;
  publishedAt: string | null;
  withdrawnAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type Row = {
  id: string;
  status: AnnouncementStatus;
  draft_json: string;
  published_json: string | null;
  published_at: string | null;
  withdrawn_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PublishResult = { ok: true; announcement: AdminAnnouncement } | { ok: false; reason: "not_found" | "expired" };
export type WithdrawResult = { ok: true; announcement: AdminAnnouncement } | { ok: false; reason: "not_found" | "not_published" };

export function createAnnouncementRepository(db: Db, clock: () => Date = () => new Date()) {
  const selectOne = db.prepare<[string], Row>("SELECT * FROM announcements WHERE id = ?");
  const selectByRequest = db.prepare<[string], Row>("SELECT * FROM announcements WHERE create_request_id = ?");
  const selectAll = db.prepare<[], Row>("SELECT * FROM announcements ORDER BY updated_at DESC");
  const selectPublished = db.prepare<[], Row>("SELECT * FROM announcements WHERE status = 'published'");

  function toAdmin(row: Row): AdminAnnouncement {
    const draft = JSON.parse(row.draft_json) as AnnouncementContent;
    const published = row.published_json ? (JSON.parse(row.published_json) as AnnouncementContent) : null;
    const fields = { status: row.status, draft, published };
    return {
      id: row.id,
      status: row.status,
      state: getAdminState(fields, clock()),
      hasPendingChanges: hasPendingChanges(fields),
      draft,
      published,
      publishedAt: row.published_at,
      withdrawnAt: row.withdrawn_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  function get(id: string): AdminAnnouncement | null {
    const row = selectOne.get(id);
    return row ? toAdmin(row) : null;
  }

  return {
    get,

    list(): AdminAnnouncement[] {
      return selectAll.all().map(toAdmin);
    },

    /** Creates a draft. A repeated requestId returns the first record instead of a duplicate. */
    create(content: AnnouncementContent, requestId?: string): AdminAnnouncement {
      return db.transaction(() => {
        if (requestId) {
          const existing = selectByRequest.get(requestId);
          if (existing) return toAdmin(existing);
        }
        const id = randomUUID();
        const now = clock().toISOString();
        db.prepare(
          `INSERT INTO announcements (id, create_request_id, status, draft_json, created_at, updated_at)
           VALUES (?, ?, 'draft', ?, ?, ?)`,
        ).run(id, requestId ?? null, JSON.stringify(content), now, now);
        return get(id)!;
      })();
    },

    /** Saves the draft only; the published snapshot stays untouched. */
    saveDraft(id: string, content: AnnouncementContent): AdminAnnouncement | null {
      const info = db
        .prepare("UPDATE announcements SET draft_json = ?, updated_at = ? WHERE id = ?")
        .run(JSON.stringify(content), clock().toISOString(), id);
      return info.changes ? get(id) : null;
    },

    /** Copies the current draft into the published snapshot. */
    publish(id: string): PublishResult {
      return db.transaction((): PublishResult => {
        const row = selectOne.get(id);
        if (!row) return { ok: false, reason: "not_found" };
        const draft = JSON.parse(row.draft_json) as AnnouncementContent;
        const check = canPublish(draft, clock());
        if (!check.ok) return check;
        const now = clock().toISOString();
        db.prepare(
          `UPDATE announcements
           SET status = 'published', published_json = draft_json, published_at = ?, withdrawn_at = NULL, updated_at = ?
           WHERE id = ?`,
        ).run(now, now, id);
        return { ok: true, announcement: get(id)! };
      })();
    },

    /** Removes the announcement from public output; the draft remains for later reuse. */
    withdraw(id: string): WithdrawResult {
      return db.transaction((): WithdrawResult => {
        const row = selectOne.get(id);
        if (!row) return { ok: false, reason: "not_found" };
        if (row.status !== "published") return { ok: false, reason: "not_published" };
        const now = clock().toISOString();
        db.prepare(
          `UPDATE announcements
           SET status = 'withdrawn', published_json = NULL, withdrawn_at = ?, updated_at = ?
           WHERE id = ?`,
        ).run(now, now, id);
        return { ok: true, announcement: get(id)! };
      })();
    },

    /** Everything the public display may show right now, already projected. */
    listPublic(): PublicAnnouncement[] {
      const now = clock();
      const result: PublicAnnouncement[] = [];
      for (const row of selectPublished.all()) {
        const published = row.published_json ? (JSON.parse(row.published_json) as AnnouncementContent) : null;
        if (published && row.published_at && isPubliclyVisible({ status: row.status, published }, now)) {
          result.push(toPublicAnnouncement(row.id, published, row.published_at));
        }
      }
      return result.sort(comparePublic);
    },
  };
}

export type AnnouncementRepository = ReturnType<typeof createAnnouncementRepository>;

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase } from "../../src/lib/db/database.ts";
import { createAnnouncementRepository } from "../../src/lib/announcements/repository.ts";
import type { AnnouncementContent } from "../../src/lib/announcements/schema.ts";

let dir: string;
let dbPath: string;
const now = new Date("2026-10-24T12:00:00.000Z");
const clock = () => now;

function content(overrides: Partial<AnnouncementContent> = {}): AnnouncementContent {
  return {
    title: "Kaffeemaschine defekt",
    body: "Bitte die Maschine im Erdgeschoss nutzen.",
    category: "general",
    pinned: false,
    startsAt: null,
    endsAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "campus-board-test-"));
  dbPath = join(dir, "test.sqlite");
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("announcement repository", () => {
  it("creates drafts that are not public", () => {
    const db = openDatabase(dbPath);
    const repo = createAnnouncementRepository(db, clock);
    const created = repo.create(content());
    expect(created.status).toBe("draft");
    expect(repo.listPublic()).toEqual([]);
    db.close();
  });

  it("returns the existing record for a repeated create request id", () => {
    const db = openDatabase(dbPath);
    const repo = createAnnouncementRepository(db, clock);
    const first = repo.create(content(), "req-1");
    const second = repo.create(content({ title: "Doppelt" }), "req-1");
    expect(second.id).toBe(first.id);
    expect(repo.list()).toHaveLength(1);
    db.close();
  });

  it("publishes, keeps the published snapshot while the draft changes, and republishes", () => {
    const db = openDatabase(dbPath);
    const repo = createAnnouncementRepository(db, clock);
    const { id } = repo.create(content());

    const published = repo.publish(id);
    expect(published.ok).toBe(true);
    expect(repo.listPublic().map((a) => a.title)).toEqual(["Kaffeemaschine defekt"]);

    const edited = repo.saveDraft(id, content({ title: "Kaffeemaschine wieder da" }));
    expect(edited?.hasPendingChanges).toBe(true);
    expect(repo.listPublic().map((a) => a.title)).toEqual(["Kaffeemaschine defekt"]);

    repo.publish(id);
    expect(repo.listPublic().map((a) => a.title)).toEqual(["Kaffeemaschine wieder da"]);
    expect(repo.get(id)?.hasPendingChanges).toBe(false);
    db.close();
  });

  it("withdraws from public output but keeps the content recoverable", () => {
    const db = openDatabase(dbPath);
    const repo = createAnnouncementRepository(db, clock);
    const { id } = repo.create(content());
    repo.publish(id);

    const result = repo.withdraw(id);
    expect(result.ok).toBe(true);
    expect(repo.listPublic()).toEqual([]);
    expect(repo.get(id)?.status).toBe("withdrawn");
    expect(repo.get(id)?.draft.title).toBe("Kaffeemaschine defekt");

    expect(repo.publish(id).ok).toBe(true);
    expect(repo.listPublic()).toHaveLength(1);
    db.close();
  });

  it("refuses to withdraw something that is not published", () => {
    const db = openDatabase(dbPath);
    const repo = createAnnouncementRepository(db, clock);
    const { id } = repo.create(content());
    expect(repo.withdraw(id)).toEqual({ ok: false, reason: "not_published" });
    expect(repo.withdraw("missing")).toEqual({ ok: false, reason: "not_found" });
    db.close();
  });

  it("refuses to publish already expired content", () => {
    const db = openDatabase(dbPath);
    const repo = createAnnouncementRepository(db, clock);
    const { id } = repo.create(content({ endsAt: "2026-10-24T11:00:00.000Z" }));
    expect(repo.publish(id)).toEqual({ ok: false, reason: "expired" });
    db.close();
  });

  it("excludes future and expired published content and exposes only allowlisted fields", () => {
    const db = openDatabase(dbPath);
    let current = new Date("2026-10-24T08:00:00.000Z");
    const repo = createAnnouncementRepository(db, () => current);
    const future = repo.create(content({ title: "Später", startsAt: "2026-10-24T10:00:00.000Z" }));
    const ending = repo.create(content({ title: "Bald vorbei", endsAt: "2026-10-24T09:00:00.000Z" }));
    repo.publish(future.id);
    repo.publish(ending.id);

    expect(repo.listPublic().map((a) => a.title)).toEqual(["Bald vorbei"]);
    expect(Object.keys(repo.listPublic()[0]).sort()).toEqual(
      ["body", "category", "endsAt", "id", "pinned", "publishedAt", "title"].sort(),
    );

    current = new Date("2026-10-24T10:30:00.000Z");
    expect(repo.listPublic().map((a) => a.title)).toEqual(["Später"]);
    db.close();
  });

  it("orders pinned announcements first, then newest publication", () => {
    const db = openDatabase(dbPath);
    let current = new Date("2026-10-24T08:00:00.000Z");
    const repo = createAnnouncementRepository(db, () => current);
    const a = repo.create(content({ title: "A" }));
    const b = repo.create(content({ title: "B", pinned: true }));
    const c = repo.create(content({ title: "C" }));
    repo.publish(a.id);
    current = new Date("2026-10-24T08:01:00.000Z");
    repo.publish(b.id);
    current = new Date("2026-10-24T08:02:00.000Z");
    repo.publish(c.id);
    expect(repo.listPublic().map((x) => x.title)).toEqual(["B", "C", "A"]);
    db.close();
  });

  it("keeps data after the database is closed and reopened", () => {
    const db1 = openDatabase(dbPath);
    const repo1 = createAnnouncementRepository(db1, clock);
    const { id } = repo1.create(content());
    repo1.publish(id);
    db1.close();

    const db2 = openDatabase(dbPath);
    const repo2 = createAnnouncementRepository(db2, clock);
    expect(repo2.get(id)?.status).toBe("published");
    expect(repo2.listPublic()).toHaveLength(1);
    db2.close();
  });
});

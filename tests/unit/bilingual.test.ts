import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createAnnouncementRepository } from "../../src/lib/announcements/repository.ts";
import { parseAnnouncementInput, type AnnouncementContent } from "../../src/lib/announcements/schema.ts";
import { openDatabase } from "../../src/lib/db/database.ts";
import { MIGRATIONS } from "../../src/lib/db/migrations.ts";
import { fallbackLevel, localize } from "../../src/lib/i18n/public.ts";
import { createRoomRepository } from "../../src/lib/rooms/repository.ts";
import { parseRoomInput, type RoomContent } from "../../src/lib/rooms/schema.ts";
import { createSessionRepository } from "../../src/lib/sessions/repository.ts";

// Optional English texts for announcements and rooms (ADR-019): upgrade of
// existing data, draft isolation, republish/withdraw and fallback rules.

let dir: string;
const now = new Date("2026-10-24T12:00:00.000Z");
const clock = () => now;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "campus-board-bilingual-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function announcement(overrides: Partial<AnnouncementContent> = {}): AnnouncementContent {
  return {
    title: "Kaffeemaschine defekt",
    body: "Bitte die Maschine im Erdgeschoss nutzen.",
    category: "general",
    pinned: false,
    startsAt: null,
    endsAt: null,
    titleEn: "",
    bodyEn: "",
    ...overrides,
  };
}

function room(overrides: Partial<RoomContent> = {}): RoomContent {
  return { code: "T-1.01", name: "Seminarraum Test", floorId: "1OG", type: "seminar", description: "Beamer", reservable: false, nameEn: "", descriptionEn: "", ...overrides };
}

describe("upgrade of an existing (schema 2) database", () => {
  it("adds empty English fields without changing content, ids, publication state or references", () => {
    const path = join(dir, "v2.sqlite");
    const old = new Database(path);
    old.exec(MIGRATIONS[0]);
    old.exec(MIGRATIONS[1]);
    old.pragma("user_version = 2");
    const t = "2026-10-24T10:00:00.000Z";
    // Content JSON exactly as M1/M2 stored it (no English keys).
    const v2 = (title: string) =>
      JSON.stringify({ title, body: "Text mit Umlauten: äöü ß", category: "event", pinned: true, startsAt: null, endsAt: null });
    const insert = old.prepare(
      "INSERT INTO announcements (id, status, draft_json, published_json, published_at, withdrawn_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    );
    insert.run("live", "published", v2("Live"), v2("Live"), t, null, t, t);
    insert.run("pending", "published", v2("Neuer Entwurf"), v2("Alt veröffentlicht"), t, null, t, t);
    insert.run("draft", "draft", v2("Nur Entwurf"), null, null, null, t, t);
    insert.run("withdrawn", "withdrawn", v2("Zurückgenommen"), null, t, t, t, t);
    old.prepare("INSERT INTO rooms (id, code, name, floor_id, type, description, created_at, updated_at) VALUES ('r1', 'A-1', 'Küche', 'EG', 'common', 'Beschreibung', ?, ?)").run(t, t);
    old
      .prepare(
        `INSERT INTO class_sessions (id, title, instructor, cohort, term, room_id, starts_at, ends_at, status, created_at, updated_at)
         VALUES ('s1', 'Mathematik', 'Prof. Beispiel', 'WI 1', 'WS 2026/27', 'r1', '2026-10-26T08:00:00.000Z', '2026-10-26T09:30:00.000Z', 'scheduled', ?, ?)`,
      )
      .run(t, t);
    old.close();

    const db = openDatabase(path);
    expect(db.pragma("user_version", { simple: true })).toBe(MIGRATIONS.length);

    const repo = createAnnouncementRepository(db, clock);
    const byId = Object.fromEntries(repo.list().map((a) => [a.id, a]));
    expect(Object.keys(byId).sort()).toEqual(["draft", "live", "pending", "withdrawn"]);
    expect(byId.live.draft).toEqual({ ...JSON.parse(v2("Live")), titleEn: "", bodyEn: "" });
    expect(byId.live.published).toEqual(byId.live.draft);
    // No phantom "unpublished changes" after the upgrade; real ones stay.
    expect(byId.live.hasPendingChanges).toBe(false);
    expect(byId.pending.hasPendingChanges).toBe(true);
    expect(byId.pending.published?.title).toBe("Alt veröffentlicht");
    expect([byId.live.state, byId.pending.state, byId.draft.state, byId.withdrawn.state]).toEqual(["live", "live", "draft", "withdrawn"]);
    expect(byId.draft.published).toBeNull();
    expect(repo.listPublic().map((a) => [a.title, a.titleEn, a.bodyEn])).toEqual([
      ["Live", null, null],
      ["Alt veröffentlicht", null, null],
    ]);

    const rooms = createRoomRepository(db, clock);
    expect(rooms.get("r1")).toMatchObject({ code: "A-1", name: "Küche", description: "Beschreibung", nameEn: "", descriptionEn: "" });
    expect(rooms.listPublic()[0]).toMatchObject({ id: "r1", nameEn: null, descriptionEn: null });
    const day = createSessionRepository(db, clock).listPublicDay("2026-10-26");
    expect(day.map((s) => [s.id, s.title, s.room.id, s.room.nameEn])).toEqual([["s1", "Mathematik", "r1", null]]);
    db.close();

    // Opening again does not migrate twice.
    const again = openDatabase(path);
    expect(createAnnouncementRepository(again, clock).get("live")?.draft).toEqual(byId.live.draft);
    again.close();
  });
});

describe("English input validation", () => {
  it("treats English fields as optional, trims them and checks their length", () => {
    const base = { title: "T", body: "B", category: "general", pinned: false };
    const ok = parseAnnouncementInput({ ...base, titleEn: "  Title  ", bodyEn: "   " });
    expect(ok.ok && [ok.content.titleEn, ok.content.bodyEn]).toEqual(["Title", ""]);
    const missing = parseAnnouncementInput(base);
    expect(missing.ok && [missing.content.titleEn, missing.content.bodyEn]).toEqual(["", ""]);
    const tooLong = parseAnnouncementInput({ ...base, titleEn: "x".repeat(121), bodyEn: "y".repeat(1201) });
    expect(!tooLong.ok && tooLong.fieldErrors).toMatchObject({
      titleEn: ["Der englische Titel darf höchstens 120 Zeichen lang sein."],
      bodyEn: ["Der englische Text darf höchstens 1200 Zeichen lang sein."],
    });

    const roomBase = { code: "A", name: "N", floorId: "EG", type: "other", reservable: false };
    const roomOk = parseRoomInput({ ...roomBase, nameEn: " Kitchen " });
    expect(roomOk.ok && [roomOk.content.nameEn, roomOk.content.descriptionEn]).toEqual(["Kitchen", ""]);
    const roomBad = parseRoomInput({ ...roomBase, nameEn: "x".repeat(81) });
    expect(!roomBad.ok && roomBad.fieldErrors.nameEn?.[0]).toBe("Der englische Name darf höchstens 80 Zeichen lang sein.");
  });
});

describe("English versions of announcements follow draft and publish", () => {
  it("never changes published English text before republishing; republish and withdraw affect both languages", () => {
    const db = openDatabase(join(dir, "a.sqlite"));
    const repo = createAnnouncementRepository(db, clock);
    const a = repo.create(announcement({ titleEn: "Coffee machine broken", bodyEn: "Please use the machine on the ground floor." }));
    expect(repo.listPublic()).toEqual([]); // drafts stay private in every language
    repo.publish(a.id);
    expect(repo.listPublic().map((x) => [x.title, x.titleEn, x.bodyEn])).toEqual([
      ["Kaffeemaschine defekt", "Coffee machine broken", "Please use the machine on the ground floor."],
    ]);

    // Editing only the English draft: public output unchanged, change is pending.
    const edited = repo.saveDraft(a.id, announcement({ titleEn: "Coffee machine repaired", bodyEn: "It works again." }))!;
    expect(edited.hasPendingChanges).toBe(true);
    expect(edited.published?.titleEn).toBe("Coffee machine broken");
    expect(repo.listPublic()[0]).toMatchObject({ titleEn: "Coffee machine broken", bodyEn: "Please use the machine on the ground floor." });

    repo.publish(a.id);
    expect(repo.listPublic()[0]).toMatchObject({ title: "Kaffeemaschine defekt", titleEn: "Coffee machine repaired", bodyEn: "It works again." });
    expect(repo.get(a.id)?.hasPendingChanges).toBe(false);

    // Removing the English text is also only public after republishing.
    repo.saveDraft(a.id, announcement());
    expect(repo.listPublic()[0].titleEn).toBe("Coffee machine repaired");
    repo.publish(a.id);
    expect(repo.listPublic()[0]).toMatchObject({ titleEn: null, bodyEn: null });

    repo.withdraw(a.id);
    expect(repo.listPublic()).toEqual([]);
    expect(repo.get(a.id)?.draft).toEqual(announcement()); // content kept as draft
    db.close();
  });

  it("publishes a partial translation as such", () => {
    const db = openDatabase(join(dir, "p.sqlite"));
    const repo = createAnnouncementRepository(db, clock);
    const a = repo.create(announcement({ titleEn: "Only the title" }));
    repo.publish(a.id);
    expect(repo.listPublic()[0]).toMatchObject({ titleEn: "Only the title", bodyEn: null });
    db.close();
  });
});

describe("English room texts", () => {
  it("belong to the same room record and appear in room and schedule output", () => {
    const db = openDatabase(join(dir, "r.sqlite"));
    const rooms = createRoomRepository(db, clock);
    const created = rooms.create(room());
    if (!created.ok) throw new Error("setup");
    const sessions = createSessionRepository(db, clock);
    sessions.create({
      title: "Mathematik",
      instructor: "Prof. Beispiel",
      cohort: "WI 1",
      term: "WS 2026/27",
      roomId: created.room.id,
      startsAt: "2026-10-26T08:00:00.000Z",
      endsAt: "2026-10-26T09:30:00.000Z",
    });

    const updated = rooms.update(created.room.id, room({ nameEn: "Seminar room (test)" }));
    expect(updated.ok && updated.room.id).toBe(created.room.id);
    expect(rooms.list({ includeArchived: true })).toHaveLength(1); // no second room per language
    expect(rooms.listPublic()[0]).toMatchObject({ name: "Seminarraum Test", nameEn: "Seminar room (test)", description: "Beamer", descriptionEn: null });
    const [session] = sessions.listPublicDay("2026-10-26");
    expect(session.title).toBe("Mathematik"); // course data is not translated
    expect(session.room).toMatchObject({ id: created.room.id, code: "T-1.01", name: "Seminarraum Test", nameEn: "Seminar room (test)" });
    db.close();
  });
});

describe("localize and fallbackLevel", () => {
  it("uses English when present, otherwise German marked as fallback (English interface only)", () => {
    expect(localize("Küche", "Kitchen", "en")).toEqual({ text: "Kitchen", lang: "en", fallback: false });
    expect(localize("Küche", null, "en")).toEqual({ text: "Küche", lang: "de", fallback: true });
    expect(localize("Küche", "Kitchen", "de")).toEqual({ text: "Küche", lang: "de", fallback: false });
    expect(localize("", null, "en")).toEqual({ text: "", lang: "de", fallback: false }); // nothing shown, nothing to mark
  });

  it("marks an item fully, partly or not at all", () => {
    const full = [localize("T", "T", "en"), localize("B", "B", "en")];
    const partial = [localize("T", "T", "en"), localize("B", null, "en")];
    const none = [localize("T", null, "en"), localize("B", null, "en")];
    const emptyDescription = [localize("Name", "Name", "en"), localize("", null, "en")];
    expect([fallbackLevel(full), fallbackLevel(partial), fallbackLevel(none), fallbackLevel(emptyDescription)]).toEqual([null, "partial", "all", null]);
    expect(fallbackLevel([localize("T", null, "de")])).toBeNull();
  });
});

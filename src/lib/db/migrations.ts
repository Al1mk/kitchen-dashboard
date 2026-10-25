// Ordered schema migrations. Index + 1 is the schema version stored in
// PRAGMA user_version. Never edit an existing entry; append a new one.

export const MIGRATIONS: string[] = [
  `
  CREATE TABLE announcements (
    id                TEXT PRIMARY KEY,
    create_request_id TEXT UNIQUE,
    status            TEXT NOT NULL CHECK (status IN ('draft', 'published', 'withdrawn')),
    draft_json        TEXT NOT NULL,
    published_json    TEXT,
    published_at      TEXT,
    withdrawn_at      TEXT,
    created_at        TEXT NOT NULL,
    updated_at        TEXT NOT NULL
  );

  CREATE TABLE sessions (
    id_hash    TEXT PRIMARY KEY,
    username   TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );
  `,
  // M2: rooms and class sessions. Rooms are archived, never deleted; sessions
  // reference them by stable id. floor_id and type are validated in the app
  // (not by CHECK), so their value lists can grow without a migration.
  `
  CREATE TABLE rooms (
    id          TEXT PRIMARY KEY,
    code        TEXT NOT NULL COLLATE NOCASE UNIQUE,
    name        TEXT NOT NULL,
    floor_id    TEXT NOT NULL,
    type        TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    reservable  INTEGER NOT NULL DEFAULT 0 CHECK (reservable IN (0, 1)),
    is_demo     INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
    archived_at TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );

  CREATE TABLE class_sessions (
    id                TEXT PRIMARY KEY,
    create_request_id TEXT UNIQUE,
    title             TEXT NOT NULL,
    instructor        TEXT NOT NULL,
    cohort            TEXT NOT NULL,
    term              TEXT NOT NULL,
    room_id           TEXT NOT NULL REFERENCES rooms (id) ON DELETE RESTRICT,
    starts_at         TEXT NOT NULL,
    ends_at           TEXT NOT NULL CHECK (ends_at > starts_at),
    status            TEXT NOT NULL CHECK (status IN ('scheduled', 'cancelled')),
    cancelled_at      TEXT,
    is_demo           INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
    created_at        TEXT NOT NULL,
    updated_at        TEXT NOT NULL
  );

  CREATE INDEX class_sessions_room_time ON class_sessions (room_id, starts_at);
  CREATE INDEX class_sessions_time ON class_sessions (starts_at);
  `,
  // Optional English texts for the public English interface ("" = none).
  // Announcement content is JSON: json_insert adds the keys only where they
  // are missing, in both the draft and the published snapshot, so an existing
  // record keeps its content and does not appear to have unpublished changes.
  `
  UPDATE announcements
  SET draft_json = json_insert(draft_json, '$.titleEn', '', '$.bodyEn', ''),
      published_json = CASE WHEN published_json IS NULL THEN NULL
                            ELSE json_insert(published_json, '$.titleEn', '', '$.bodyEn', '') END;

  ALTER TABLE rooms ADD COLUMN name_en TEXT NOT NULL DEFAULT '';
  ALTER TABLE rooms ADD COLUMN description_en TEXT NOT NULL DEFAULT '';
  `,
];

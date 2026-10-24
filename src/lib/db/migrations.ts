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
];

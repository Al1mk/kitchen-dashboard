import "server-only";
import { createAnnouncementRepository, type AnnouncementRepository } from "./announcements/repository.ts";
import { createSessionStore } from "./auth/sessions.ts";
import { getDatabasePath } from "./config.ts";
import { openDatabase, type Db } from "./db/database.ts";

// One database connection per server process (survives dev hot reloads).

type Services = { db: Db; announcements: AnnouncementRepository; sessions: ReturnType<typeof createSessionStore> };

const globalForServices = globalThis as typeof globalThis & { __campusBoard?: Services };

export function services(): Services {
  if (!globalForServices.__campusBoard) {
    const db = openDatabase(getDatabasePath());
    globalForServices.__campusBoard = {
      db,
      announcements: createAnnouncementRepository(db),
      sessions: createSessionStore(db),
    };
  }
  return globalForServices.__campusBoard;
}

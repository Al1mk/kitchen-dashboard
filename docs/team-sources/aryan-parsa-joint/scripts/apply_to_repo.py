#!/usr/bin/env python3
"""Apply Parsa's HCI booking module to Ali's repo, without touching GitHub.

Usage: python3 apply_to_repo.py /path/to/kitchen-dashboard
It refuses files that have been modified unexpectedly and never replaces existing new modules.
Run in a clean git feature branch. Review `git diff` before committing.
"""
from __future__ import annotations
import argparse
import sys
from pathlib import Path

PACKAGE = Path(__file__).resolve().parent
NEW = PACKAGE / "add"


def replace_once(source: str, needle: str, addition: str, path: str) -> str:
    count = source.count(needle)
    if count != 1:
        raise RuntimeError(f"Refusing to patch {path}: expected anchor once, saw {count}. Ali may have updated this file.")
    return source.replace(needle, addition, 1)


def patches(p: str, old: str) -> str:
    s = old
    if p == "src/lib/db/migrations.ts":
        if "CREATE TABLE room_bookings" in s:
            raise RuntimeError("Booking table migration already exists; review it instead of adding a duplicate.")
        insertion = '''  // M4: persistent DEMO room reservations. Keep existing migrations unchanged.
  `
  CREATE TABLE room_bookings (
    id                TEXT PRIMARY KEY,
    create_request_id TEXT NOT NULL UNIQUE,
    room_id           TEXT NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    starts_at         TEXT NOT NULL,
    ends_at           TEXT NOT NULL CHECK (ends_at > starts_at),
    cancel_token_hash TEXT NOT NULL,
    status            TEXT NOT NULL CHECK (status IN ('confirmed', 'cancelled')),
    is_demo           INTEGER NOT NULL DEFAULT 1 CHECK (is_demo = 1),
    cancelled_at      TEXT,
    created_at        TEXT NOT NULL,
    updated_at        TEXT NOT NULL
  );
  CREATE INDEX room_bookings_room_time ON room_bookings(room_id, starts_at);
  CREATE INDEX room_bookings_status_time ON room_bookings(status, starts_at);
  `,
'''
        s = replace_once(s, "\n];\n", "\n" + insertion + "];\n", p)

    elif p == "src/lib/rooms/schema.ts":
        s = replace_once(s,
            '  { id: "2OG", label: "2. Obergeschoss" },',
            '  { id: "2OG", label: "2. Obergeschoss" },\n  { id: "3OG", label: "3. Obergeschoss" },'.replace('\\n','\n'), p)

    elif p == "src/lib/i18n/public.ts":
        s = replace_once(s,
            'export type PublicSection = "start" | "display" | "rooms" | "schedule";',
            'export type PublicSection = "start" | "display" | "rooms" | "schedule" | "booking";', p)
        s = replace_once(s, 'sections: { start: "Start", display: "Mitteilungen", rooms: "Räume", schedule: "Stundenplan" }',
            'sections: { start: "Start", display: "Mitteilungen", rooms: "Räume", schedule: "Stundenplan", booking: "Raumbuchung" }', p)
        s = replace_once(s, 'sections: { start: "Home", display: "Announcements", rooms: "Rooms", schedule: "Schedule" }',
            'sections: { start: "Home", display: "Announcements", rooms: "Rooms", schedule: "Schedule", booking: "Booking" }', p)
        s = replace_once(s, 'floors: { EG: "Ground floor", "1OG": "1st floor", "2OG": "2nd floor" },',
            'floors: { EG: "Ground floor", "1OG": "1st floor", "2OG": "2nd floor", "3OG": "3rd floor" },', p)

    elif p == "src/components/public/PublicNav.tsx":
        s = replace_once(s, '  { key: "schedule", path: "/schedule" },',
            '  { key: "schedule", path: "/schedule" },\n  { key: "booking", path: "/booking" },'.replace('\\n','\n'), p)
        s = replace_once(s, 'list: "grid grid-cols-2 gap-2 sm:grid-cols-4",',
            'list: "grid grid-cols-2 gap-2 sm:grid-cols-3",', p)
        s = replace_once(s, 'list: "grid grid-cols-4 gap-[1.4cqw]",',
            'list: "grid grid-cols-3 gap-[1.4cqw]",', p)

    elif p == "src/lib/server.ts":
        s = replace_once(s,
            'import { createRoomRepository, type RoomRepository } from "./rooms/repository.ts";',
            'import { createRoomRepository, type RoomRepository } from "./rooms/repository.ts";\nimport { createBookingRepository, type BookingRepository } from "./bookings/repository.ts";', p)
        s = replace_once(s, "  classSessions: SessionRepository;", "  classSessions: SessionRepository;\n  bookings: BookingRepository;", p)
        s = replace_once(s, "      classSessions: createSessionRepository(db),", "      classSessions: createSessionRepository(db),\n      bookings: createBookingRepository(db),", p)

    elif p == "src/lib/sessions/repository.ts":
        s = replace_once(s, 'import { randomUUID } from "node:crypto";',
            'import { randomUUID } from "node:crypto";\nimport { bookingConflict } from "../bookings/repository.ts";', p)
        s = replace_once(s,
            '''    const conflict = selectOverlap.get(roomId, endsAt, startsAt, exceptId);
    return conflict ? { ok: false, reason: "conflict", conflict } : null;''',
            '''    const conflict = selectOverlap.get(roomId, endsAt, startsAt, exceptId);
    if (conflict) return { ok: false, reason: "conflict", conflict };
    // Booking and class occupancy is checked in the SAME transaction as mutation.
    const reservation = bookingConflict(db, roomId, startsAt, endsAt);
    if (reservation) return {
      ok: false, reason: "conflict",
      conflict: { id: reservation.id, title: "Demo-Raumreservierung", startsAt: reservation.startsAt, endsAt: reservation.endsAt },
    };
    return null;''', p)

    elif p == "src/lib/rooms/repository.ts":
        s = replace_once(s,
            'export type RoomWriteResult = { ok: true; room: AdminRoom } | { ok: false; reason: "not_found" | "duplicate_code" };',
            'export type RoomWriteResult = { ok: true; room: AdminRoom } | { ok: false; reason: "not_found" | "duplicate_code" | "booking_in_use" };', p)
        anchor = '''  const countUpcoming = db.prepare<[string, string], { n: number }>(
    "SELECT COUNT(*) AS n FROM class_sessions WHERE room_id = ? AND status = 'scheduled' AND ends_at > ?",
  );'''
        s = replace_once(s, anchor, anchor + '''
  const countUpcomingBookings = db.prepare<[string, string], { n: number }>(
    "SELECT COUNT(*) AS n FROM room_bookings WHERE room_id = ? AND status = 'confirmed' AND ends_at > ?",
  );''', p)
        s = replace_once(s,
            '''        if (!selectOne.get(id)) return { ok: false, reason: "not_found" };
        if (codeTaken(content.code, id))''',
            '''        const current = selectOne.get(id);
        if (!current) return { ok: false, reason: "not_found" };
        if (current.reservable === 1 && !content.reservable && countUpcomingBookings.get(id, clock().toISOString())!.n > 0) {
          return { ok: false, reason: "booking_in_use" };
        }
        if (codeTaken(content.code, id))''', p)
        s = replace_once(s,
            '''        const upcoming = countUpcoming.get(id, now)!.n;
        if (upcoming > 0)''',
            '''        const upcoming = countUpcoming.get(id, now)!.n + countUpcomingBookings.get(id, now)!.n;
        if (upcoming > 0)''', p)

    elif p == "src/lib/http/schedule-errors.ts":
        s = replace_once(s,
            'reason: "not_found" | "duplicate_code" | "already_archived" | "not_archived" | "in_use", upcoming = 0',
            'reason: "not_found" | "duplicate_code" | "already_archived" | "not_archived" | "in_use" | "booking_in_use", upcoming = 0', p)
        s = replace_once(s, '    case "already_archived":',
            '    case "booking_in_use":\n      return jsonError(409, "booking_in_use", "Aktive Reservierungen verhindern das Abschalten der Buchbarkeit.");\n    case "already_archived":', p)
        s = replace_once(s,
            '''`Der Raum kann nicht archiviert werden: Es ${upcoming === 1 ? "ist noch 1 Termin" : `sind noch ${upcoming} Termine`} geplant. Bitte verlegen oder absagen Sie ${upcoming === 1 ? "ihn" : "sie"} zuerst.`''',
            '''`Der Raum hat noch ${upcoming} aktive Termine/Reservierungen und kann nicht archiviert werden. Bitte zuerst absagen oder stornieren.`''', p)

    elif p == "src/app/booking/page.tsx" or p == "src/app/booking/cancel/page.tsx":
        # These paths are created from add/ and NOT patched here. The patch is
        # done in add/ at packaging time.
        raise RuntimeError("Internal: booking pages must come from add/, not PATCH_TARGETS")

    elif p == "src/app/page.tsx":
        anchor='''      </ul>
    </PublicShell>'''
        s=replace_once(s,anchor,'''      </ul>
      <Link href={publicHref("/booking", lang)}
        className="flex min-h-24 touch-manipulation flex-col justify-center rounded-xl border-l-8 border-brand bg-surface px-6 py-4 shadow-sm hover:bg-neutral-soft">
        <span className="font-display text-3xl font-bold">{lang === "de" ? "Raum reservieren (DEMO)" : "Book a room (DEMO)"}</span>
        <span className="text-ink-muted">{lang === "de" ? "Freie Zeiten prüfen und Probe-Reservierung erstellen" : "Find free times and make a test reservation"}</span>
      </Link>
    </PublicShell>''',p)

    elif p == "src/components/public/RoomDirectory.tsx":
        s = replace_once(s, 'import Link from "next/link";',
            'import Link from "next/link";\nimport { isDemoBookableRoom } from "@/lib/bookings/policy.ts";'.replace('\\n', '\n'), p)
        anchor='''                      {t.rooms.todayInRoom}
                    </Link>'''
        s=replace_once(s,anchor,'''                      {t.rooms.todayInRoom}
                    </Link>
                    {room.reservable && isDemoBookableRoom(room.code) && (
                      <Link href={publicHref("/booking", lang, { raum: room.id })}
                        className="mt-1 inline-flex min-h-14 w-fit touch-manipulation items-center rounded-xl bg-brand px-5 font-semibold text-white hover:bg-brand-strong">
                        {lang === "de" ? "Raum reservieren (DEMO)" : "Book room (DEMO)"}
                      </Link>
                    )}''',p)
    else:
        raise RuntimeError(f"Unknown patch file: {p}")
    return s

PATCH_TARGETS = (
    "src/lib/db/migrations.ts",
    "src/lib/rooms/schema.ts",
    "src/lib/i18n/public.ts",
    "src/components/public/PublicNav.tsx",
    "src/lib/server.ts",
    "src/lib/sessions/repository.ts",
    "src/lib/rooms/repository.ts",
    "src/lib/http/schedule-errors.ts",
    "src/app/page.tsx",
    "src/components/public/RoomDirectory.tsx",
)

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("repo", help="Directory of Ali's current kitchen-dashboard checkout")
    parser.add_argument("--dry-run", action="store_true", help="Check patch anchors without writing any files")
    args = parser.parse_args()
    root = Path(args.repo).expanduser().resolve()
    if not (root / "package.json").is_file() or not (root / "src/lib/db/migrations.ts").is_file():
        print("ERROR: This is not an Ali kitchen-dashboard checkout.", file=sys.stderr)
        return 2
    # Avoid applying generated code directly to the team's main branch.
    if not args.dry_run and (root / ".git").exists():
        import subprocess
        branch = subprocess.run(["git", "-C", str(root), "branch", "--show-current"], capture_output=True, text=True, check=False).stdout.strip()
        if branch in ("main", "master"):
            print("STOP: Create a feature branch first: git switch -c feature/parsa-booking", file=sys.stderr)
            return 1
    new_files = [p for p in NEW.rglob("*") if p.is_file()]
    try:
        for file in new_files:
            dest = root / file.relative_to(NEW)
            if dest.exists():
                raise RuntimeError(f"Refusing to overwrite existing file: {dest.relative_to(root)}")
        modified: dict[Path, str] = {}
        for rel in PATCH_TARGETS:
            path = root / rel
            modified[path] = patches(rel, path.read_text(encoding="utf-8"))
    except (OSError, RuntimeError) as exc:
        print(f"STOP: {exc}\nNo files were written. Ask Ali to review the changed anchor.", file=sys.stderr)
        return 1
    print(f"Checked {len(PATCH_TARGETS)} existing files and {len(new_files)} new files.")
    if args.dry_run:
        print("DRY RUN OK. Nothing written.")
        return 0
    for dest, content in modified.items():
        dest.write_text(content, encoding="utf-8")
    for file in new_files:
        dest = root / file.relative_to(NEW)
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(file.read_bytes())
    print("Booking module applied LOCALLY. No commits/pushes were made.")
    print("Next: npm run typecheck && npm run lint && npm test && npm run build")
    print("Review `git diff` and use a feature branch + Pull Request for Ali's approval.")
    return 0

if __name__ == "__main__":
    sys.exit(main())

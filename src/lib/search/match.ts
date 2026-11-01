// Text matching for the public searches (T32 room search on /rooms and the
// map, T33 course/lecturer search for one day). Safe to import from client and
// server code. Matching runs in the browser on the public API data; there is
// no search index or service.
//
// Normalization: accents removed (é → e, ü → u), ß → ss, lower case, every run
// of other characters (spaces, hyphens, punctuation) becomes one space. A
// second variant spells umlauts as ae/oe/ue so "Kueche" also finds "Küche".
// A query that is not blank but normalizes to nothing (e.g. "!!!") matches
// nothing; it never turns into an empty key that matches every room.

import type { PublicRoom } from "../rooms/schema.ts";
import type { PublicSession } from "../sessions/schema.ts";

const COMBINING_MARKS = /[̀-ͯ]/g;

function fold(value: string, umlautsAsE: boolean): string {
  let text = value.normalize("NFC").toLowerCase();
  if (umlautsAsE) text = text.replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue");
  return text
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Normalized search text: "Mensch-Maschine-Interaktion" → "mensch maschine interaktion". */
export function searchText(value: string): string {
  return fold(value, false);
}

const compact = (value: string) => searchText(value).replace(/ /g, "");

/** Both spellings of a stored text, for matching (with and without ae/oe/ue). */
function variants(value: string): string[] {
  const plain = fold(value, false);
  const spelled = fold(value, true);
  return plain === spelled ? [plain] : [plain, spelled];
}

/** True when the visitor has not typed anything except spaces. */
export function isBlankQuery(query: string): boolean {
  return query.trim() === "";
}

/** Exact room code, also without the "K1-" prefix ("105", "k1 105" → K1-105). Aryan's rule from the map. */
export function isExactRoomCode(room: Pick<PublicRoom, "code">, query: string): boolean {
  const key = compact(query);
  if (!key) return false;
  return compact(room.code) === key || compact(room.code.replace(/^K1-/i, "")) === key;
}

/**
 * Room code, German name or English name contains the query, or the code
 * matches exactly. A blank query is "no filter" (true); a query that
 * normalizes to nothing matches no room.
 */
export function roomMatches(room: Pick<PublicRoom, "code" | "name" | "nameEn">, query: string): boolean {
  if (isBlankQuery(query)) return true;
  const text = searchText(query);
  if (!text) return false;
  if (isExactRoomCode(room, query)) return true;
  if (variants(`${room.code} ${room.name} ${room.nameEn ?? ""}`).some((h) => h.includes(text))) return true;
  return compact(room.code).includes(text.replace(/ /g, ""));
}

/**
 * Explicitly approved aliases (Ali, 1 November 2026). An alias applies only
 * when it is the whole query. It is matched against its target and as a whole
 * word, never as a fragment: "Chris" finds Christian Zagel but not every
 * "Christian…", and "MMI" does not match inside "Kommission". No other
 * abbreviations or translations are derived automatically.
 */
export const SEARCH_ALIASES: readonly { alias: string; field: "instructor" | "title"; target: string }[] = [
  { alias: "chris", field: "instructor", target: "christian zagel" },
  { alias: "mmi", field: "title", target: "mensch maschine interaktion" },
  { alias: "hci", field: "title", target: "mensch maschine interaktion" },
];

const hasWord = (haystack: string, word: string) => ` ${haystack} `.includes(` ${word} `);

/**
 * Course title or lecturer of a class session contains the query (or the
 * query is an approved alias). Status is ignored: cancelled sessions match too
 * and are labelled by the interface. A blank or empty-key query matches nothing.
 */
export function sessionMatches(session: Pick<PublicSession, "title" | "instructor">, query: string): boolean {
  const text = searchText(query);
  if (!text) return false;
  const fields = { title: variants(session.title), instructor: variants(session.instructor) };
  const all = [...fields.title, ...fields.instructor];
  const aliases = SEARCH_ALIASES.filter((a) => a.alias === text);
  if (aliases.length > 0) {
    return aliases.some((a) => fields[a.field].some((h) => h.includes(a.target))) || all.some((h) => hasWord(h, text));
  }
  return all.some((h) => h.includes(text));
}

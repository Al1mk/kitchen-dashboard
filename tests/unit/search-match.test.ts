import { describe, expect, it } from "vitest";
import { isBlankQuery, isExactRoomCode, roomMatches, searchText, sessionMatches } from "../../src/lib/search/match.ts";

// T32/T33 matching rules (src/lib/search/match.ts). Fixtures are small inline
// records, not the demo seed, so the expectations do not depend on its contents.

const room = (code: string, name: string, nameEn: string | null = null) => ({ code, name, nameEn });
const ROOMS = [
  room("K1-105", "EDV-Raum", "IT room"),
  room("K1-120", "Seminarraum", "Seminar room"),
  room("K1-1050", "Lager"),
  room("K1-108", "Kommunikation", "Communication area"),
  room("DEMO-E01", "Küche / Aufenthalt (Demo)", "Kitchen / common room (Demo)"),
  room("1.12", "Café Lounge"),
];
const codesFor = (query: string) => ROOMS.filter((r) => roomMatches(r, query)).map((r) => r.code);

describe("searchText", () => {
  it("lower-cases, removes accents, folds ß and turns punctuation and whitespace runs into one space", () => {
    expect(searchText("  Mensch-Maschine-Interaktion ")).toBe("mensch maschine interaktion");
    expect(searchText("Mensch   Maschine\tInteraktion")).toBe("mensch maschine interaktion");
    expect(searchText("Café Straße")).toBe("cafe strasse");
    expect(searchText("K1-105")).toBe("k1 105");
    expect(searchText("!!!")).toBe("");
  });
});

describe("room search", () => {
  it("finds a room by its code in common spellings", () => {
    for (const q of ["K1-105", "k1-105", "K1 105", "k1105", " K1-105 ", "K1.105"]) {
      expect(isExactRoomCode(ROOMS[0], q)).toBe(true);
      expect(isExactRoomCode(ROOMS[2], q)).toBe(false);
      // Partial matching also lists the longer code that starts the same way.
      expect(codesFor(q)).toEqual(["K1-105", "K1-1050"]);
    }
    expect(codesFor("K1-120")).toEqual(["K1-120"]);
  });

  it("treats a bare number as the code without the K1- prefix and as a partial code", () => {
    expect(isExactRoomCode(ROOMS[0], "105")).toBe(true);
    expect(codesFor("105")).toEqual(["K1-105", "K1-1050"]);
    expect(codesFor("K1-1")).toEqual(["K1-105", "K1-120", "K1-1050", "K1-108"]);
  });

  it("matches partial German and English names case-insensitively", () => {
    expect(codesFor("seminar")).toEqual(["K1-120"]);
    expect(codesFor("SEMINAR ROOM")).toEqual(["K1-120"]);
    expect(codesFor("it room")).toEqual(["K1-105"]);
    expect(codesFor("communication")).toEqual(["K1-108"]);
    expect(codesFor("kommunikation")).toEqual(["K1-108"]);
  });

  it("ignores accents and accepts umlauts spelled ae/oe/ue", () => {
    expect(codesFor("kuche")).toEqual(["DEMO-E01"]);
    expect(codesFor("Küche")).toEqual(["DEMO-E01"]);
    expect(codesFor("Kueche")).toEqual(["DEMO-E01"]);
    expect(codesFor("cafe")).toEqual(["1.12"]);
    expect(codesFor("CAFÉ")).toEqual(["1.12"]);
  });

  it("treats a blank query as no filter but never lets an empty key match every room", () => {
    expect(isBlankQuery("   ")).toBe(true);
    expect(codesFor("")).toHaveLength(ROOMS.length);
    expect(codesFor("   ")).toHaveLength(ROOMS.length);
    for (const q of ["!!!", "-", " / ", "…", "مهندسی", "Ж"]) {
      expect(isBlankQuery(q)).toBe(false);
      expect(codesFor(q)).toEqual([]);
      expect(isExactRoomCode(ROOMS[0], q)).toBe(false);
    }
  });

  it("returns nothing for an unrelated query instead of a nearby room", () => {
    expect(codesFor("K1-999")).toEqual([]);
    expect(codesFor("Hörsaal")).toEqual([]);
  });
});

const session = (title: string, instructor: string) => ({ title, instructor });
const SESSIONS = [
  session("Mensch-Maschine-Interaktion (Demo)", "Prof. Dr. Christian Zagel"),
  session("Mensch-Maschine-Interaktion – Projekt (Demo)", "Prof. Dr. Christian Zagel"),
  session("Wirtschaftsinformatik – Übung", "Christian Grosch"),
  session("Kommissionierung und Logistik", "Dr. Christiane Beispiel"),
  session("Statistik (Demo)", "Dozent:in A (Demo)"),
];
const titlesFor = (query: string) => SESSIONS.filter((s) => sessionMatches(s, query)).map((s) => `${s.title} / ${s.instructor}`);
const zagelSessions = SESSIONS.slice(0, 2).map((s) => `${s.title} / ${s.instructor}`);

describe("course and lecturer search", () => {
  it("finds Christian Zagel by full name, surname and any capitalization", () => {
    expect(titlesFor("Christian Zagel")).toEqual(zagelSessions);
    expect(titlesFor("Zagel")).toEqual(zagelSessions);
    expect(titlesFor("zAGEL")).toEqual(zagelSessions);
    expect(titlesFor("Prof. Dr. Christian Zagel")).toEqual(zagelSessions);
  });

  it("maps the approved alias Chris to Christian Zagel only, not to every Christian", () => {
    expect(titlesFor("Chris")).toEqual(zagelSessions);
    expect(titlesFor(" chris ")).toEqual(zagelSessions);
  });

  it("shows every lecturer for a broad first name instead of choosing one", () => {
    const christian = titlesFor("Christian");
    expect(christian).toHaveLength(4);
    expect(christian).toContain("Wirtschaftsinformatik – Übung / Christian Grosch");
    expect(christian).toContain("Kommissionierung und Logistik / Dr. Christiane Beispiel");
  });

  it("finds the course with hyphens, spaces, partial words and the explicit MMI/HCI aliases", () => {
    for (const q of ["Mensch-Maschine-Interaktion", "Mensch Maschine Interaktion", "mensch maschine", "Interaktion", "MMI", "hci", "HCI"]) {
      expect(titlesFor(q)).toEqual(zagelSessions);
    }
    expect(titlesFor("Projekt")).toEqual([zagelSessions[1]]);
  });

  it("uses aliases only as whole queries and whole words", () => {
    // "mmi" occurs inside "Kommissionierung" but is not an automatic abbreviation there.
    expect(titlesFor("mmi")).not.toContain("Kommissionierung und Logistik / Dr. Christiane Beispiel");
    expect(titlesFor("HCI Projekt")).toEqual([]);
    expect(titlesFor("Human-Computer Interaction")).toEqual([]);
  });

  it("matches nothing for blank or empty-key queries", () => {
    for (const q of ["", "   ", "!!!", "–"]) expect(titlesFor(q)).toEqual([]);
  });
});

/* eslint-disable @typescript-eslint/no-unused-vars -- audit scratch variables; scripts are kept as they were executed */
// Phase A step 2a: task journeys that need no booking data: find a room, map -> room -> schedule,
// search by lecturer/course and pick a day, newcomer information, schedule exploration, language/Back/Home.
// Real visible controls are used (touch tap on the kiosk context). No API shortcuts for the journeys themselves.
// node 02-journeys-find.mjs [kiosk|laptop|kioskSens|zoom200] [de|en]
import { writeFileSync } from "node:fs";
import { launch, url, settle, ensureDir, OUT, CONTEXTS, BASE } from "./audit-lib.mjs";

const ctxKey = process.argv[2] ?? "kiosk";
const lang = process.argv[3] ?? "de";
const L = lang === "en"
  ? { rooms: "Rooms", start: "Home", map: "Map", sched: "Schedule", newc: "New to campus", ann: "Announcements", mapBtn: /Show on the map/i, todayBtn: /Today in this room|Classes today/i, clear: /Clear search|Clear/i, next: /Next day/i, prev: /Previous day/i }
  : { rooms: "Räume", start: "Start", map: "Karte", sched: "Stundenplan", newc: "Neu am Campus", ann: "Mitteilungen", mapBtn: /Auf der Karte zeigen/i, todayBtn: /Heute in diesem Raum/i, clear: /Suche löschen/i, next: /Folgetag/i, prev: /Vortag/i };
const tapOrClick = (loc) => (CONTEXTS[ctxKey].options.hasTouch ? loc.tap({ timeout: 8000 }) : loc.click({ timeout: 8000 }));

const { browser, page, events, ctx } = await launch(ctxKey);
const dir = `${OUT}/journeys/${ctx.label}`;
ensureDir(dir);
const log = [];
let jn = "";

async function step(name, fn, probe = true) {
  const t0 = Date.now();
  let ok = true, err;
  try { await fn(); } catch (e) { ok = false; err = String(e).split("\n")[0].slice(0, 220); }
  await settle(page, 350);
  const n = String(log.length + 1).padStart(2, "0");
  const shot = `${dir}/${jn}-${lang}-${n}-${name}.png`;
  await page.screenshot({ path: shot });
  const info = await page.evaluate(() => {
    const m = document.querySelector("main");
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    return {
      url: location.pathname + location.search, h1: document.querySelector("h1")?.innerText ?? null, scrollY: Math.round(scrollY), docH: document.documentElement.scrollHeight, vh: innerHeight,
      mainText: (m?.innerText ?? "").replace(/\s+/g, " ").slice(0, 700),
      buttons: [...document.querySelectorAll("main button, main a[href]")].filter(vis).slice(0, 40).map((e) => (e.getAttribute("aria-label") || e.innerText || "").replace(/\s+/g, " ").trim().slice(0, 40)),
      active: document.activeElement?.tagName?.toLowerCase() + (document.activeElement?.id ? "#" + document.activeElement.id : ""),
    };
  });
  const rec = { journey: jn, n: log.length + 1, step: name, ok, err, ms: Date.now() - t0, ...info, shot: shot.replace(OUT + "/", "") };
  log.push(rec);
  console.log(`[${jn}] ${n} ${name.padEnd(26)} ${ok ? "ok " : "FAIL"} ${info.url}  h1=${JSON.stringify(info.h1)} scrollY=${info.scrollY}/${info.docH}${err ? "  ERR: " + err : ""}`);
  return rec;
}
const type = async (sel, text) => { const el = page.locator(sel); await tapOrClick(el); await page.keyboard.type(text, { delay: 50 }); };
const nav = (name) => tapOrClick(page.getByRole("navigation").first().getByRole("link", { name, exact: true }));

// ---------- A1: find a room by number, then map, then schedule, then Home
jn = "A1-find-room";
await step("start", async () => { await page.goto(url("/", lang)); });
await step("tap-rooms-nav", async () => { await nav(L.rooms); });
await step("type-120", async () => { await type("#room-search", "120"); });
let r = await step("results-120", async () => {});
await step("tap-show-on-map", async () => { await tapOrClick(page.getByRole("link", { name: L.mapBtn }).first()); });
await step("map-selected", async () => {});
await step("tap-schedule-link", async () => {
  const link = page.getByRole("link", { name: /Stundenplan|Schedule|Heute|Today|Belegung/i }).filter({ hasNot: page.getByRole("navigation") });
  const cands = await page.locator("main").getByRole("link").allInnerTexts();
  console.log("   main links on map after selection:", JSON.stringify(cands.map((s) => s.replace(/\s+/g, " ").trim())));
  await tapOrClick(page.locator("main").getByRole("link", { name: /Termine in diesem Raum|Classes in this room|Schedule for this room|Today in this room|Stundenplan|Schedule|Termine|Classes/i }).first());
});
await step("schedule-for-room", async () => {});
await step("tap-home", async () => { await nav(L.start); });

// ---------- A2: map marker flow
jn = "A2-map-marker";
await step("open-map", async () => { await page.goto(url("/map", lang)); });
await step("tap-marker-K1-120", async () => { await tapOrClick(page.getByRole("button", { name: /K1-120/ }).first()); });
await step("selected-panel", async () => {});
await step("tap-floor-2", async () => { await tapOrClick(page.getByRole("button", { name: /2\. Obergeschoss|2nd floor/i }).first()); });
await step("type-search-labor", async () => { await type('input[type="search"], input[type="text"]', "Labor"); });
await step("tap-room-in-list", async () => { await tapOrClick(page.locator("main").getByRole("button", { name: /K1-217|Testmethoden|K1-217/ }).first()); });

// ---------- A3: lecturer/course search + day choice
jn = "A3-search-people";
await step("rooms-zagel", async () => { await page.goto(url("/rooms", lang)); await type("#room-search", "Zagel"); });
await step("next-day", async () => { await tapOrClick(page.getByRole("button", { name: L.next }).or(page.getByRole("link", { name: L.next })).first()); });
await step("back-to-today", async () => { await tapOrClick(page.getByRole("button", { name: /Heute|Today/ }).last()); });
await step("tap-class-map-link", async () => { await tapOrClick(page.getByRole("link", { name: L.mapBtn }).first()); });
await step("browser-back", async () => { await page.goBack(); });
await step("clear-search", async () => { await tapOrClick(page.getByRole("button", { name: L.clear })); });
await step("search-typo-zagl", async () => { await type("#room-search", "Zagl"); });
await step("clear-2", async () => { await tapOrClick(page.getByRole("button", { name: L.clear })); });
await step("search-HCI", async () => { await type("#room-search", "HCI"); });
await step("clear-3", async () => { await tapOrClick(page.getByRole("button", { name: L.clear })); });
await step("search-gibberish", async () => { await type("#room-search", "qqqqq"); });

// ---------- A4: newcomer path
jn = "A4-newcomer";
await step("start", async () => { await page.goto(url("/", lang)); });
await step("tap-newcomer-card", async () => { await tapOrClick(page.locator("main").getByRole("link", { name: new RegExp(L.newc, "i") }).first()); });
await step("tap-help-card-cta", async () => { await tapOrClick(page.locator("main").getByRole("link", { name: /Mitteilungen ansehen|View announcements|Announcements/i }).last()); });

// ---------- A5: schedule exploration
jn = "A5-schedule";
await step("open", async () => { await page.goto(url("/schedule", lang)); });
await step("tap-next", async () => { await tapOrClick(page.getByRole("link", { name: L.next })); });
await step("tap-prev-prev", async () => { await tapOrClick(page.getByRole("link", { name: L.prev })); await settle(page, 200); await tapOrClick(page.getByRole("link", { name: L.prev })); });
await step("saturday-empty", async () => { await page.goto(url("/schedule", lang, "datum=2026-11-07")); });
await step("far-future", async () => { await page.goto(url("/schedule", lang, "datum=2031-01-01")); });
await step("bad-date", async () => { await page.goto(url("/schedule", lang, "datum=not-a-date")); });
await step("room-filter-param", async () => { await page.goto(url("/schedule", lang, "raum=k1-120")); });

writeFileSync(`${dir}/_journeys-find-${lang}.json`, JSON.stringify({ ctx: ctx.label, note: ctx.note, lang, log, events }, null, 1));
await browser.close();
console.log("events:", JSON.stringify({ console: events.console.length, pageerror: events.pageerror.length, requestfailed: events.requestfailed.length, bad: events.badresponse }));

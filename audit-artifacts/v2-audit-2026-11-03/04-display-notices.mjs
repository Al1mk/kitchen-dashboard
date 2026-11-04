// Phase A step 3: how /display behaves with realistic and long notice lists, an empty list, and over time.
// Notices are created/withdrawn through the admin API of the DISPOSABLE audit DB only (test support).
// Admin credentials are read from the local audit file and never printed.
import { readFileSync, writeFileSync } from "node:fs";
import { request as pwRequest } from "@playwright/test";
import { launch, url, settle, ensureDir, OUT, BASE, measure, summarise } from "./audit-lib.mjs";

const AUD = process.env.AUDIT_INSTALL;
const pw = readFileSync(`${AUD}/audit.pw`, "utf8").trim();
const api = await pwRequest.newContext({ baseURL: BASE });
const origin = { Origin: BASE };
const login = await api.post("/api/auth/login", { headers: origin, data: { username: "audit-admin", password: pw } });
console.log("admin login status:", login.status());

const created = [];
async function make(title, body, extra = {}) {
  const r = await api.post("/api/admin/announcements", { headers: origin, data: { title, body, category: "general", pinned: false, startsAt: "", endsAt: "", ...extra } });
  const j = await r.json().catch(() => ({}));
  const id = j.id ?? j.announcement?.id ?? j.data?.id;
  if (!id) { console.log("create failed", r.status(), JSON.stringify(j).slice(0, 200)); return null; }
  const p = await api.post(`/api/admin/announcements/${id}/publish`, { headers: origin, data: {} });
  created.push(id);
  return p.status();
}
const lorem = "Dies ist ein längerer Beispieltext für die Audit-Datenbank, damit wir sehen, wie viele Zeilen eine Mitteilung auf dem Portrait-Bildschirm einnimmt und ob der untere Rand erreichbar bleibt. ";
const N = [
  ["Mensa heute geschlossen (Audit)", lorem.repeat(2), { category: "general", pinned: true }],
  ["Bibliothek: verlängerte Öffnungszeiten in der Klausurenphase (Audit)", lorem, {}],
  ["Workshop Prototyping für Erstsemester (Audit)", lorem.repeat(3), { category: "event" }],
  ["Aufzug im Gebäude K1 außer Betrieb (Audit)", lorem, {}],
  ["Fundsachen: Schlüsselbund im Sekretariat (Audit)", "Kurz.", {}],
  ["Neue Lernräume im 2. Obergeschoss (Audit)", lorem.repeat(2), { category: "event" }],
  ["Wichtige Mitteilung mit einem sehr langen Titel, der sicher über mehrere Zeilen umbrochen werden muss, um das Layout zu testen (Audit)", lorem.repeat(4), {}],
];
for (const [t, b, e] of N) console.log("create+publish", t.slice(0, 30), await make(t, b, e));

const { browser, page, ctx } = await launch("kiosk");
const dir = `${OUT}/journeys/${ctx.label}`;
ensureDir(dir);
const res = {};
for (const lang of ["de", "en"]) {
  await page.goto(url("/display", lang));
  await settle(page, 800);
  await page.screenshot({ path: `${dir}/D1-display-${lang}-many.viewport.png` });
  await page.screenshot({ path: `${dir}/D1-display-${lang}-many.full.png`, fullPage: true });
  const m = await page.evaluate(measure);
  res[lang] = { summary: summarise(m), docH: m.scroll.scrollHeight, vh: m.viewport.vh, headings: m.headings.map((h) => `${h.l}:${h.t.slice(0, 30)}@${h.y}`), pinned: m.pinned };
  console.log(lang, "display many: screens", m.scroll.screens, "docH", m.scroll.scrollHeight, "minFs", Math.min(...m.text.items.map((t) => t.fs)), "h3 count", m.headings.filter((h) => h.l === "H3").length);
}
// time behaviour: does anything move/rotate/scroll by itself on /display within 25 s?
await page.goto(url("/display", "de"));
await settle(page, 600);
const snap = () => page.evaluate(() => ({ y: Math.round(scrollY), first: document.querySelector("main h3")?.innerText?.slice(0, 40), n: document.querySelectorAll("main h3").length, clock: document.body.innerText.match(/\b\d{2}:\d{2}\b/)?.[0] }));
const a = await snap();
await page.waitForTimeout(25000);
const b = await snap();
console.log("display t0:", JSON.stringify(a), " t+25s:", JSON.stringify(b));
res.autoMotion = { t0: a, t25: b };
// bottom reachable by touch scroll? (use the browser's real scrolling, then see what is below the fold)
await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await page.waitForTimeout(300);
await page.screenshot({ path: `${dir}/D1-display-de-scrolled-bottom.png` });
res.bottom = await page.evaluate(() => ({ y: Math.round(scrollY), docH: document.documentElement.scrollHeight, vh: innerHeight, lastNoticeBottom: Math.round([...document.querySelectorAll("main h3")].at(-1)?.getBoundingClientRect().bottom ?? 0), footerTop: Math.round(document.querySelector("footer")?.getBoundingClientRect().top ?? 0) }));
console.log("display bottom:", JSON.stringify(res.bottom));

// empty state: withdraw ALL published notices (seed ones included: it is the disposable DB), look, then leave empty
const list = await (await api.get("/api/admin/announcements")).json().catch(() => null);
const items = Array.isArray(list) ? list : list?.announcements ?? list?.items ?? [];
let withdrawn = 0;
for (const it of items) {
  if (it.status === "published" || it.publishedAt) { const w = await api.post(`/api/admin/announcements/${it.id}/withdraw`, { headers: origin, data: {} }); if (w.status() < 300) withdrawn++; }
}
console.log("withdrawn:", withdrawn, "of", items.length);
for (const lang of ["de", "en"]) {
  await page.goto(url("/display", lang));
  await settle(page, 700);
  await page.screenshot({ path: `${dir}/D2-display-${lang}-empty.viewport.png` });
  res[`empty_${lang}`] = (await page.evaluate(() => document.querySelector("main")?.innerText?.replace(/\s+/g, " "))).slice(0, 200);
  console.log(lang, "empty:", res[`empty_${lang}`]);
}
writeFileSync(`${dir}/_display-notices.json`, JSON.stringify(res, null, 1));
await browser.close();
await api.dispose();

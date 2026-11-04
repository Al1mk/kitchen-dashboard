/* eslint-disable @typescript-eslint/no-unused-vars -- audit scratch variables; scripts are kept as they were executed */
// Phase A step 2e: separate, repeatable checks of what happens to the memory-only receipt, plus controlled
// error/slow-response scenarios for booking. Disposable audit DB only; codes never printed; output redacted.
// Each scenario uses its own browser context and its own room, so a failure cannot contaminate the next.
import { writeFileSync } from "node:fs";
import { launch, url, settle, ensureDir, OUT } from "./audit-lib.mjs";

const dir0 = `${OUT}/journeys/kiosk-nominal-1080x1920`;
ensureDir(dir0);
const out = [];
const say = (k, v) => { out.push({ k, v }); console.log(`${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`); };
const CODEISH = /\b(?=[A-Za-z0-9_-]*\d)(?=[A-Za-z0-9_-]*[A-Za-z])[A-Za-z0-9_-]{8,}\b|\b\d{6,}\b/g;
const redact = (s) => (s || "").replace(CODEISH, "[REDACTED]");
const text = async (page) => redact(await page.evaluate(() => (document.querySelector("main")?.innerText ?? "").replace(/\s+/g, " ")));

async function shot(page, name) {
  await settle(page, 200);
  await page.evaluate((src) => {
    const re = new RegExp(src, "g");
    document.querySelectorAll("main *").forEach((el) => {
      const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.nodeValue).join(" ");
      if (re.test(own)) el.setAttribute("data-audit-mask", "1");
      re.lastIndex = 0;
    });
  }, CODEISH.source);
  await page.screenshot({ path: `${dir0}/B5-${name}.png`, mask: [page.locator("[data-audit-mask]")], maskColor: "#444444" });
}

async function toConfirm(page, lang, roomCode, which = "last") {
  await page.goto(url("/booking", lang));
  await settle(page, 300);
  const box = page.getByRole("combobox").first();
  const opt = (await box.locator("option").allInnerTexts()).find((o) => o.includes(roomCode));
  await box.selectOption({ label: opt });
  await settle(page, 500);
  const slots = (await page.locator("main button").allInnerTexts()).map((t) => t.trim()).filter((t) => /^\d{2}:\d{2}$/.test(t));
  const slot = which === "last" ? slots.at(-1) : slots[0];
  await page.getByRole("button", { name: new RegExp("^" + slot + "$") }).tap();
  await page.getByRole("button", { name: /Weiter zur Bestätigung|Review booking/ }).tap();
  return slot;
}
const confirmBtn = (page) => page.getByRole("button", { name: /Demo-Reservierung bestätigen|Confirm demo booking/ });

// ---- S1: receipt -> language switch (receipt on screen, nothing else touched)
{
  const { browser, page } = await launch("kiosk");
  await toConfirm(page, "de", "K1-103");
  await confirmBtn(page).scrollIntoViewIfNeeded(); await confirmBtn(page).tap();
  await page.getByText(/Reservierung gespeichert/).waitFor({ timeout: 8000 });
  await page.getByRole("link", { name: "English", exact: true }).tap();
  await page.waitForTimeout(1000);
  say("S1 receipt -> tap English: url", await page.evaluate(() => location.pathname + location.search));
  say("S1 receipt still visible?", /saved|gespeichert/i.test(await text(page)));
  say("S1 main text", (await text(page)).slice(0, 260));
  await shot(page, "S1-receipt-then-english");
  await browser.close();
}
// ---- S2: receipt -> browser Back
{
  const { browser, page } = await launch("kiosk");
  await toConfirm(page, "de", "K1-112");
  await confirmBtn(page).scrollIntoViewIfNeeded(); await confirmBtn(page).tap();
  await page.getByText(/Reservierung gespeichert/).waitFor({ timeout: 8000 });
  await page.goBack(); await page.waitForTimeout(1000);
  say("S2 receipt -> browser Back: url", await page.evaluate(() => location.pathname + location.search));
  say("S2 receipt still visible?", /gespeichert/i.test(await text(page)));
  say("S2 main text", (await text(page)).slice(0, 220));
  await shot(page, "S2-receipt-then-back");
  await browser.close();
}
// ---- S3: receipt -> nav 'Start' (repeat in DE) and nav 'Karte'
for (const [i, navName] of ["Start", "Karte"].entries()) {
  const { browser, page } = await launch("kiosk");
  await toConfirm(page, "de", ["K1-114", "K1-119"][i]);
  await confirmBtn(page).scrollIntoViewIfNeeded(); await confirmBtn(page).tap();
  await page.getByText(/Reservierung gespeichert/).waitFor({ timeout: 8000 });
  const t0 = await page.evaluate(() => performance.now());
  await page.getByRole("navigation").first().getByRole("link", { name: navName, exact: true }).tap();
  await page.waitForTimeout(900);
  say(`S3.${i + 1} receipt -> tap nav ${navName}: url`, await page.evaluate(() => location.pathname + location.search));
  say(`S3.${i + 1} any dialog?`, await page.evaluate(() => [...document.querySelectorAll('[role="dialog"],[role="alertdialog"],dialog')].filter((d) => d.getBoundingClientRect().width > 0).length));
  await page.goBack(); await page.waitForTimeout(900);
  say(`S3.${i + 1} Back after leaving: receipt recoverable?`, /gespeichert/i.test(await text(page)));
  await shot(page, `S3-${i + 1}-after-back`);
  await browser.close();
}
// ---- S4: POST fails (network abort) -> what does the UI say, is the guard shown, can we retry
{
  const { browser, page } = await launch("kiosk");
  let blocked = 0;
  await page.route("**/api/public/bookings", async (route) => {
    if (route.request().method() === "POST" && blocked < 1) { blocked++; return route.abort("connectionreset"); }
    return route.continue();
  });
  await toConfirm(page, "de", "K1-121");
  await confirmBtn(page).scrollIntoViewIfNeeded(); await confirmBtn(page).tap();
  await page.waitForTimeout(1500);
  say("S4 POST aborted: main text (tail)", (await text(page)).slice(-420));
  say("S4 live regions", await page.evaluate(() => [...document.querySelectorAll('[role="alert"],[role="status"],[aria-live]')].map((e) => ({ role: e.getAttribute("role"), t: (e.innerText || "").replace(/\s+/g, " ").slice(0, 200) }))));
  await shot(page, "S4-post-aborted");
  const btns = await page.evaluate(() => [...document.querySelectorAll("main button")].filter((b) => b.getBoundingClientRect().width > 0).map((b) => ({ t: b.innerText.replace(/\s+/g, " ").trim().slice(0, 40), h: Math.round(b.getBoundingClientRect().height), w: Math.round(b.getBoundingClientRect().width) })).filter((b) => !/^\d{2}:\d{2}$/.test(b.t)));
  say("S4 visible buttons", btns);
  // does a nav tap now show the guard?
  await page.getByRole("navigation").first().getByRole("link", { name: "Karte", exact: true }).tap();
  await page.waitForTimeout(900);
  say("S4 nav tap during unresolved state: url", await page.evaluate(() => location.pathname + location.search));
  say("S4 dialog visible?", await page.evaluate(() => [...document.querySelectorAll('[role="dialog"],[role="alertdialog"],dialog')].filter((d) => d.getBoundingClientRect().width > 0).map((d) => (d.innerText || "").replace(/\s+/g, " ").slice(0, 250))));
  await shot(page, "S4-nav-during-unresolved");
  const stay = page.getByRole("button", { name: /Hierbleiben/ });
  if (await stay.isVisible().catch(() => false)) {
    const sb = await stay.boundingBox(); const lb = await page.getByRole("button", { name: /Trotzdem verlassen/ }).boundingBox();
    say("S4 guard buttons", { stay: sb && [Math.round(sb.width), Math.round(sb.height)], leave: lb && [Math.round(lb.width), Math.round(lb.height)] });
    await stay.tap(); await page.waitForTimeout(500);
    say("S4 after Hierbleiben: url", await page.evaluate(() => location.pathname + location.search));
  }
  await browser.close();
}
// ---- S5: slow POST (4 s) -> pending feedback, double-tap protection
{
  const { browser, page } = await launch("kiosk");
  let posts = 0;
  await page.route("**/api/public/bookings", async (route) => {
    if (route.request().method() === "POST") { posts++; await new Promise((r) => setTimeout(r, 4000)); }
    return route.continue();
  });
  await toConfirm(page, "de", "K1-125", "first");
  await confirmBtn(page).scrollIntoViewIfNeeded();
  await confirmBtn(page).tap();
  await page.waitForTimeout(300);
  await shot(page, "S5-slow-post-t0300ms");
  const mid = await page.evaluate(() => { const b = [...document.querySelectorAll("main button")].find((x) => /bestätigen|speichern|Speichere|wird/i.test(x.innerText)); return b ? { t: b.innerText.trim(), disabled: b.disabled, ariaBusy: b.getAttribute("aria-busy") } : null; });
  say("S5 confirm button 300 ms after tap", mid);
  await confirmBtn(page).tap({ timeout: 1000, force: false }).catch(() => {});
  await page.getByText(/Reservierung gespeichert/).waitFor({ timeout: 12000 }).catch(() => {});
  say("S5 POST requests sent after two taps", posts);
  await browser.close();
}
// ---- S6: availability GET fails (controlled) -> error state on booking form
{
  const { browser, page } = await launch("kiosk");
  await page.route("**/api/public/availability**", (route) => route.abort("connectionreset"));
  await page.goto(url("/booking", "de")); await settle(page, 300);
  const box = page.getByRole("combobox").first();
  const opt = (await box.locator("option").allInnerTexts()).find((o) => o.includes("K1-120"));
  await box.selectOption({ label: opt });
  await page.waitForTimeout(2500);
  say("S6 availability aborted: main text (tail)", (await text(page)).slice(-380));
  await shot(page, "S6-availability-fails");
  await browser.close();
}
// ---- S7: rooms API fails on /rooms and /map (controlled)
for (const route of ["/rooms", "/map"]) {
  const { browser, page } = await launch("kiosk");
  await page.route("**/api/public/rooms", (r) => r.abort("connectionreset"));
  await page.goto(url(route, "de")); await page.waitForTimeout(3500);
  say(`S7 ${route} rooms API aborted: main text`, (await text(page)).slice(0, 320));
  await shot(page, `S7-${route.slice(1)}-rooms-api-fails`);
  await browser.close();
}
writeFileSync(`${dir0}/_receipt-guard-errors.json`, JSON.stringify(out, null, 1));

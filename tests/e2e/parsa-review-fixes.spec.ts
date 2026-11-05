import { randomBytes } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { loginViaApi } from './helpers.ts';

test.use({viewport:{width:540,height:960},hasTouch:true,trace:'off',video:'off',screenshot:'off'});

for (const size of [{ width: 540, height: 960 }, { width: 1080, height: 1920 }, { width: 1080, height: 1700 }]) {
 for (const lang of ["de", "en"]) {
  test(`PARSA-R002: warning keeps controls visible without scrolling (${size.width}x${size.height}, ${lang})`, async ({browser, request, baseURL}) => {
   const context = await browser.newContext({ viewport: size, hasTouch: true, baseURL });
   const page = await context.newPage();
   const headers = await loginViaApi(request, baseURL!);
   const response = await request.post("/api/admin/rooms", {headers, data: {
    code: "PR-WARN-" + randomBytes(3).toString("hex"), name: "Prüfraum", nameEn: "Review room",
    floorId: "1OG", type: "study", description: "", reservable: true,
   }});
   expect(response.status()).toBe(201);
   const room = (await response.json()).room;
   const date = new Intl.DateTimeFormat("en-CA", {timeZone: "Europe/Berlin"}).format(new Date(Date.now()+4*86400000));
   await page.clock.install();
   await page.goto(`/booking?raum=${room.id}&datum=${date}&lang=${lang}`);
   await page.getByRole("button", {name: "10:00", exact:true}).click();
   await page.getByRole("button", {name:lang==="de"?"Weiter zur Bestätigung":"Review booking",exact:true}).click();
   await page.getByRole("button", {name:lang==="de"?"Demo-Reservierung bestätigen":"Confirm demo booking",exact:true}).click();
   const receipt = page.getByTestId("booking-receipt");
   await expect(receipt).toBeVisible();
   const more = receipt.getByRole("button", {name:lang==="de"?"Mehr Zeit":"More time",exact:true});
   const measure = () => more.evaluate(el=>({
    buttonTop: el.getBoundingClientRect().top, buttonBottom: el.getBoundingClientRect().bottom,
    dockTop: document.querySelector("[data-public-dock]")!.getBoundingClientRect().top,
    scrollY: window.scrollY,
    doneBottom: el.parentElement!.querySelectorAll("button")[1].getBoundingClientRect().bottom,
   }));
   const before = await measure();
   await page.clock.fastForward(46_000);
   await expect(receipt.getByRole("alert")).toContainText(lang==="de"?"Nur noch 15 Sekunden":"Only 15 seconds left");
   const after = await measure();
   // No click/focus before measuring: Playwright would scroll away the defect.
   await more.click();
   await expect(receipt.getByRole("alert")).toHaveCount(0);
   await expect(receipt.getByTestId("receipt-countdown")).toHaveText(lang==="de"?"Dieser Beleg wird in 60 Sekunden ausgeblendet.":"This receipt will be hidden in 60 seconds.");
   await context.close(); // Do not export credential-bearing failure snapshots.
   expect(before.buttonBottom).toBeLessThanOrEqual(before.dockTop);
   expect(before.doneBottom, "Done is visible before interacting with the receipt").toBeLessThanOrEqual(before.dockTop);
   expect(after.buttonBottom).toBeLessThanOrEqual(after.dockTop);
   expect(after.doneBottom, "Done stays above the dock with the warning").toBeLessThanOrEqual(after.dockTop);
   expect(after.buttonTop).toBeGreaterThanOrEqual(0);
   expect(Math.abs(after.buttonTop-before.buttonTop)).toBeLessThanOrEqual(1);
   expect(Math.abs(after.scrollY-before.scrollY)).toBeLessThanOrEqual(1);
  });
 }
}

for (const lang of ['de', 'en']) {
 test(`PARSA-R003: invalid schedule room has a localized recovery path (${lang})`, async ({page}) => {
  await page.goto(`/schedule?raum=unknown-parsa-review&datum=2026-11-10&lang=${lang}`);
  const main = page.getByRole('main');
  await expect(main.getByRole('alert')).toContainText(lang === 'de' ? 'nicht verfügbar' : 'unavailable');
  await expect(main.getByRole('link', {name:lang==='de'?'Alle Räume':'All rooms',exact:true})).toHaveAttribute('href', `/schedule?datum=2026-11-10${lang==='en'?'&lang=en':''}`);
  await expect(main).not.toContainText(lang==='de'?'Wir versuchen':'We keep trying');
 });
 test(`PARSA-R004: cancellation title follows language (${lang})`,async({page})=>{
  await page.goto(`/booking/cancel?lang=${lang}`);
  // Final Stage3 integration uses the same suffix as every public route (C14).
  await expect(page).toHaveTitle(`${lang==='de'?'Reservierung stornieren':'Cancel a booking'} – Campus Board`);
 });
 test(`PARSA-R006: literal credential entry has hints and no text corrections (${lang})`,async({page})=>{
  await page.goto(`/booking/cancel?lang=${lang}`);
  const id = page.getByLabel(lang==='de'?'Buchungsnummer':'Booking ID',{exact:true});
  const code = page.getByLabel(lang==='de'?'Stornierungscode':'Cancellation code',{exact:true});
  for (const field of [id,code]) {
   await expect(field).toHaveAttribute('autocapitalize','none');
   await expect(field).toHaveAttribute('autocorrect','off');
   await expect(field).toHaveAttribute('spellcheck','false');
   await expect(field).toHaveAttribute('aria-describedby','cancel-credential-hint');
  }
  await expect(page.locator('#cancel-credential-hint')).toContainText(lang==='de'?'36 Zeichen':'36 characters');
  await expect(page.locator('#cancel-credential-hint')).toContainText(lang==='de'?'43 Zeichen':'43 characters');
 });
}

test('PARSA-R003: a removed room clears its stale schedule; a network failure keeps last good data',async({page})=>{
 let status=200;
 await page.route('**/api/public/schedule?*',async route=>{
  if(status===0) { await route.abort('failed'); return; }
  if(status===404) { await route.fulfill({status:404,json:{error:'not_found'}}); return; }
  await route.continue();
 });
 await page.clock.install();
 await page.goto('/schedule?raum=lcc-demo-room-k1-120&lang=en');
 const main=page.getByRole('main');
 await expect(main.getByRole('link',{name:'On the map',exact:true})).toBeVisible();
 status=0; await page.clock.fastForward(5_500);
 await expect(main.getByRole('button',{name:'Try again'})).toBeVisible();
 await expect(main.getByRole('link',{name:'On the map',exact:true})).toBeVisible();
 status=404; await main.getByRole('button',{name:'Try again'}).click();
 await expect(main.getByRole('alert')).toContainText('unavailable');
 await expect(main.getByRole('link',{name:'On the map',exact:true})).toHaveCount(0);
 status=0; await page.clock.fastForward(5_500);
 await expect(main.getByRole('button',{name:'Try again'})).toBeVisible();
 await expect(main.getByRole('link',{name:'On the map',exact:true})).toHaveCount(0);
 status=200; await page.clock.fastForward(5_500);
 await expect(main.getByRole('link',{name:'On the map',exact:true})).toBeVisible();
});

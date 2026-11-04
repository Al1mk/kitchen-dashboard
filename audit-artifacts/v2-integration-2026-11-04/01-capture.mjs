// Technical emulation only. Requires the existing isolated-server helper;
// reads its private admin.json and never exports credentials or booking IDs.
// node 01-capture.mjs <isolated-app> <private-work> <evidence-output>
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

const [app, work, output] = process.argv.slice(2);
const { chromium, expect } = createRequire(join(app, "package.json"))("@playwright/test");
const auth = JSON.parse(await readFile(join(work, "admin.json"), "utf8"));
const origin = "http://127.0.0.1:3405";
const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date(Date.now() + 4 * 86400000));
const browser = await chromium.launch();
await mkdir(join(output, "screens"), { recursive: true });
const observations = [];
try {
  for (const viewport of [{ width: 1080, height: 1920 }, { width: 540, height: 960 }]) {
    for (const lang of ["de", "en"]) {
      const context = await browser.newContext({ viewport, hasTouch: true, baseURL: origin, timezoneId: "Europe/Berlin" });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", e => errors.push(e.name));
      const prefix = `${viewport.width}x${viewport.height}-${lang}`;
      const capture = async name => page.screenshot({ path: join(output, "screens", `${prefix}-${name}.png`), mask: [page.getByTestId("receipt-id"), page.getByTestId("receipt-code")] });
      await page.goto(`/?lang=${lang}`);
      await expect(page.getByTestId("home-card")).toHaveCount(6);
      await capture("home");
      await page.goto(`/newcomers?lang=${lang}`);
      await expect(page.getByTestId("prototype-marker")).toBeVisible();
      await capture("newcomers");
      await page.goto(`/rooms?suche=HCI&lang=${lang}`);
      await capture("rooms-search");
      await page.goto(`/schedule?raum=lcc-demo-room-k1-120&datum=${date}&lang=${lang}`);
      await expect(page.getByRole("link", { name: lang === "de" ? "Diesen Raum reservieren (Demo)" : "Book this room (demo)", exact: true })).toBeVisible();
      await capture("schedule");
      await page.goto(`/schedule?raum=invalid-review-room&datum=${date}&lang=${lang}`);
      await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
      await capture("schedule-invalid");
      await page.goto(`/booking/cancel?lang=${lang}`);
      const title = await page.title();
      await capture("cancel");

      const login = await context.request.post("/api/auth/login", { headers: { Origin: origin }, data: auth });
      expect(login.ok()).toBe(true);
      const created = await context.request.post("/api/admin/rooms", { headers: { Origin: origin }, data: { code: `V2-${randomBytes(3).toString("hex")}`, name: "Prüfraum", nameEn: "Review room", floorId: "1OG", type: "study", reservable: true, description: "" } });
      expect(created.status()).toBe(201);
      const room = (await created.json()).room;
      await page.clock.install();
      await page.goto(`/booking?raum=${room.id}&datum=${date}&lang=${lang}`);
      await page.getByRole("button", { name: "10:00", exact: true }).click();
      await page.getByRole("button", { name: lang === "de" ? "Weiter zur Bestätigung" : "Review booking", exact: true }).click();
      const confirm = page.getByRole("button", { name: lang === "de" ? "Demo-Reservierung bestätigen" : "Confirm demo booking", exact: true });
      const confirmBox = await confirm.boundingBox();
      await capture("booking-review");
      await confirm.click();
      const receipt = page.getByTestId("booking-receipt");
      await expect(receipt).toBeVisible();
      const more = receipt.getByRole("button", { name: lang === "de" ? "Mehr Zeit" : "More time", exact: true });
      const measure = () => more.evaluate(el => ({ top: el.getBoundingClientRect().top, bottom: el.getBoundingClientRect().bottom, dockTop: document.querySelector("[data-public-dock]").getBoundingClientRect().top, scrollY: window.scrollY, doneBottom: el.parentElement.querySelectorAll("button")[1].getBoundingClientRect().bottom }));
      const initial = await measure();
      await capture("receipt-initial");
      await page.clock.fastForward(46_000);
      await expect(receipt.getByRole("alert")).toBeVisible();
      const warning = await measure();
      await capture("receipt-warning");
      expect(warning.bottom).toBeLessThanOrEqual(warning.dockTop);
      expect(warning.doneBottom).toBeLessThanOrEqual(warning.dockTop);
      expect(Math.abs(warning.top - initial.top)).toBeLessThanOrEqual(1);
      observations.push({ viewport, lang, cancellationTitle: title, confirmBottom: confirmBox.y + confirmBox.height, initial, warning, pageErrors: errors });
      await context.close();
    }
  }
  await writeFile(join(output, "observations.json"), JSON.stringify(observations, null, 2) + "\n");
  console.log(`Captured ${observations.length} contexts; numeric observations only, receipt credentials masked.`);
} finally {
  await browser.close();
}

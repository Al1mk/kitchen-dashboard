# V2 audit evidence — 3 November 2026

Evidence for the V2 audit-first run (T43). Reports: [`docs/hci/v2-audit-2026-11-03/`](../../hci/v2-audit-2026-11-03/README.md). Everything here comes from **headless Chromium 156 in nominal emulation** against an **isolated copy** of `a7903db` with a **fresh disposable SQLite database** (synthetic seed data, seeded "today" = Tuesday 2026-11-03) and a temporary admin credential. It is not a measurement of the physical Elo screen and not a human usability study.

## Sanitisation

- No tracing, video or HAR. Receipt and cancel-form screenshots mask booking numbers, cancellation codes and every form input; text logs pass through a redaction filter.
- A scan of every retained file found **no** audit password, password-hash fragment, cookie/authorization header or booking value. The only token-like strings are class patterns such as `9a9999a9-…` that record a code's *shape*.
- No `.env.local`, real or demo database, original device photo or serial number is included. About 23 MB, 180 files; the PNG sets can be pruned without affecting the reports (cited files are listed below).

## Layout

| Folder | Content |
| --- | --- |
| `kiosk-1080x1920/` | Viewport (`*.viewport.png`) and full-page (`*.full.png`) screenshot of each of the 8 public routes in DE and EN, nominal kiosk context (1080×1920, DPR 1, touch on) |
| `laptop-1440x900/`, `sensitivity-1080x1700/`, `sensitivity-540x960/` | Viewport screenshots of the same routes. The two sensitivity sets are **assumptions** (browser chrome, 200 % zoom), not measurements |
| `journeys/` | Task-journey screenshots (prefixes below) |
| `data/` | DOM measurements per route/language (`kiosk-*.json`: targets with size and nearest gap, text sizes and contrast, headings, landmarks, tab stops), ARIA snapshots (`*.aria.txt`), route indexes for all contexts, journey logs (`_*.json`) |
| `logs/` | Script output, build log, UX-query output, lint result |

Journey prefixes: `A1` find room → map → schedule, `A2` map marker/floor/list, `A3` lecturer/course search, `A4` newcomer, `A5` schedule edge cases, `B1`–`B3` booking (slot grid, confirm step, receipt, conflict, expiry, cancel), `B4` English booking and cancel, `B5` controlled errors, `B6` cancel with wrong values, `D1`–`D3` `/display` many/empty/scroll, `M1` map crop at DPR 2, `T1`/`T4` touch swipe, map zoom/drag and slow load.

## Finding → evidence

| Finding | Evidence |
| --- | --- |
| A-01 map markers | `kiosk-1080x1920/map-de.viewport.png`, `journeys/M1-map-plan-crop-dpr2.png`, `data/kiosk-map-de.json` |
| A-02 room list length | `kiosk-1080x1920/rooms-de.full.png`, `data/kiosk-rooms-de.json` (document 16,440 px), `data/_touch-history-idle.json` |
| A-03 receipt leave | `data/_receipt-guard-errors.json` (S3.x), `logs/03d.log`, `data/_booking-guard-en.json` |
| A-04 credentials/typing | `journeys/B6-*.png`, `journeys/B4-en-cancel-wellformed-wrong.png`, `data/_cancel-wrong-wellformed.json` |
| A-05 confirm below fold | `journeys/B2-de-confirm-step.png` |
| A-06 idle | `logs/05b.log` |
| A-07 `/display` | `journeys/D1-*.png`, `D2-*.png`, `D3-display-after-swipe.png`, `data/_display-scroll-probe.json`, `data/_display-notices.json` |
| A-08, A-09 scale and hierarchy | `kiosk-1080x1920/home-de.viewport.png`, `newcomers-de.viewport.png`, `data/kiosk-*.json` |
| A-12 search wording | `journeys/A3-search-people-de-16-rooms-zagel.png`, `…-22-search-typo-zagl.png` |
| A-13 accessibility cluster | `data/_small-checks.json` (titles, `lang`, placeholders, disabled button, logo), `data/kiosk-*.json`, `logs/uiux-ux-queries.txt` |
| Booking conflict, pending guard, errors (positive) | `journeys/B3-conflict-A-after-confirm.png`, `B5-S4-*.png`, `B5-S6-*.png`, `B5-S7-*.png`, `data/_booking-conflict-cancel.json` |
| Addendum (after the freeze) | `data/_addendum-checks.json` (CW-01 links, `lang` wrapper, image sizes), `logs/08-media-features.log` (pointer media with/without touch) |

## What this evidence cannot show

The real browser viewport, zoom, DPR, mounting height, reach, viewing distance, USB/touch behaviour, native `select`/date pop-up appearance, on-screen keyboard, screen-reader output, Firefox/WebKit rendering and any human comprehension. `logs/uiux-design-system-REJECTED.txt` is kept only to show what the design-system generator returned and why it was not used.

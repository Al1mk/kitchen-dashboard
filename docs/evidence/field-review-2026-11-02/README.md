# Field review received — 2 November 2026

## Evidence and provenance

| ID | Source | What is established | Limits |
| --- | --- | --- | --- |
| FR-01 | Ali's message describing his review at the display | Touch failure via USB/USB-C adapter is reported; upper controls difficult to reach; small/excess text; page-specific preferences and requested changes | Team-member report; no independent touch diagnosis, formal participant session, measured reach, timings or post-change results |
| FR-02 | [Supplied display-settings screenshot](display-settings.png) | ELO ET4363L; selected 1080 × 1920; extended display; 60 Hz; rotation 90° | Does not show application layout, browser CSS viewport/zoom, touch operation or physical height |
| FR-03 | Ali's local `IMG_9463.DNG`, inspected through a temporary macOS Quick Look preview | Device label ET4363L / part E344056 and connected cabling visible | Original/preview not copied into Git: label includes serial information. End-to-end USB/data routing, connected host, touch events and working driver not established by the photo |
| FR-04 | [Official 4363L specification](https://docs.elotouch.com/Elo_4363L.pdf), [installation manual](https://docs.elotouch.com/UM600456.pdf), [macOS driver page](https://elosupport.elotouch.com/hc/en-us/p/Driver-macOS), read 2 November 2026 | Native landscape 1920 × 1080 @ 60; USB-B interface for touch; official macOS touch-driver support information exists | Vendor documentation is not a diagnostic result for this connected unit/macOS installation |

## Work performed in this checkpoint

Codex read instructions, existing source/docs and the evidence above; recorded [tasks T35–T42](../../hci/requests/2026-11-02-physical-kiosk-review.md), updated the screen-specification record and linked the existing V2 planning record. A temporary `sips` conversion was black and an extracted embedded JPEG was not readable; neither was used as visual evidence. The subsequent Quick Look preview was readable and used for FR-03. Original photos were unchanged.

**No application code, DB, credentials, driver or macOS settings changed. No product tests, new browser screenshots, hardware tests, commit, push or deployment were performed.** Documentation/link checks are separate from product acceptance.

Documentation checks executed: `git diff --check` passed; 28 local Markdown/vault links checked with no missing targets; T35–T42 each have one board row; the settings screenshot copy has the same SHA-256 as Ali's supplied PNG. No product acceptance result is inferred from these checks.

Next: Ali starts the implementation round when ready; T35 needs physical access, T36–T41 remain TODO, and T42 records actual before/after checks. T20 is only partially documented. The outside-participant round T22 remains open.

# DESIGN.md — LCC Campus Board (V1, provisional)

Status: **provisional**. Tokens live centrally in `src/app/globals.css` (CSS custom properties exposed to Tailwind via `@theme`). Components use semantic names (`bg-brand`, `text-ink-muted`, `bg-danger-soft` …), never raw hex, so official brand values can replace these without touching components.

## Brand source and limits

On 2026-10-24 Ali supplied two screenshots: the Hochschule Coburg logo and the mycampus website header. Colours were **sampled from those screenshots** (pixel values, affected by screen rendering and compression). They are not verified against an official brand manual, and no official font file was used.

| Token | Value | Sampled from |
| --- | --- | --- |
| `--brand-red` | `#cd4026` | Logo pixels (dominant non-white colour) |
| `--brand-red-strong` | `#a8321c` | Derived (darker hover state), not sampled |
| `--brand-orange` | `#ec962b` | Website "Mensa" tile / header gradient |
| `--brand-cream` | `#f6d8aa` | Left end of website header gradient |
| `--brand-purple` | `#4c0e74` | Website "Dies academicus" tile |

The logo image `public/brand/hs-coburg-logo-screenshot.png` is a crop of Ali's screenshot, not an official vector asset. Replace it with the official file once available and check the university's usage rules before any public use.

## Neutral and state tokens (own choice)

`--ink #23252b`, `--ink-muted #5b5f69`, `--canvas #f6f4f2`, `--surface #ffffff`, `--line #ddd8d3`, `--focus #1b4fd8`; states `success`, `warning`, `danger`, `info` each with a `-soft` background. Text pairs were chosen for ≥ 4.5:1 contrast (not yet measured with a tool; to be audited in V2).

## Typography (provisional)

- Headings: Roboto Condensed (similar in character to the condensed headings on the university website; not confirmed as the official face).
- Body: Source Sans 3.
- Loaded via `next/font` (self-hosted at build time).

## Layout principles used in V1

- **Admin (laptop-first):** left sidebar (≥ 1024 px), one primary action per view (red), secondary actions outlined, withdraw separated and styled as danger with confirmation dialog. Status always visible as text badge (not colour only). Live portrait preview beside the form.
- **Display (portrait, touch-first):** fixed 9:16 frame, all sizes in container query units (`cqw`) so the same component renders the admin preview. Large type (title ≈ 50 px, body ≈ 33 px at 1080 px width), ≥ 44 px touch target for the only control (retry). No hover-dependent actions.
- Category is shown as text chip plus coloured bar (red = Wichtig, purple = Veranstaltung, orange = Allgemein).
- States: loading, empty, first-load error with retry, stale data banner with time of last successful load, validation errors next to fields with focus on first error, unsaved-change warning.
- `prefers-reduced-motion` respected; there are no decorative animations.

## Guidance used

UI/UX Pro Max skill (Quick Reference rules: accessibility, touch targets, forms & feedback, semantic tokens) was consulted by Claude Code during V1. Its search CLI and other installed design skills were not run. V2 changes should be evidence-led (user tests) and recorded with before/after screenshots.

## Team integration additions (2026-10-31, V1)

- Map, booking and newcomer pages reuse the existing tokens (`brand`, `ink`, `surface`, `line`, state colours) and the `PublicShell`; no new palette was introduced.
- Public touch targets keep the ≥ 56 px rule (`min-h-14`/`min-h-16`) for buttons and links. **Exception:** map markers are small code labels (≈ 20–24 px high) taken over from Aryan's design so that 47 labels fit on the illustration; the room list below the map offers the same selection with large targets. Marker size/overlap on the 540 px wide view is an open analytical finding for V2 (T23), not yet tested with people.
- State is never shown by colour alone: booking and admin states use text ("Bestätigt", "Storniert", "Vorbei"), selected markers also change size and `aria-pressed`.
- The map illustrations are AI-generated drawings from Aryan's delivery and are labelled on the page as not verified plans.

## V2 Stage 1 additions (2026-11-03, provisional, not yet tried on the physical screen)

- **Public kiosk mode** (portrait window ≥ 520 CSS px, chosen by viewport/orientation, never by pointer type): the language switch and the seven-destination navigation form a dock fixed to the bottom edge (four tiles, then three centred), and the public root size rises from 16 px to 22 px at 1080 px width (text, tiles, spacing and column grow together; admin and other pages keep 16 px). The announcement board keeps its container-unit scale and carries the same dock inside its frame. Contract and limits: `docs/contracts.md` C10.
- The active destination has a bar and the active language an underline in addition to the red/dark fill (non-colour cue). No token, colour or font changed; the provisional palette above stands, and no colour is called official.
- All kiosk sizes (22 px root, 77 px tiles, 0.75 rem gaps, 520 px threshold) are design choices pending the measurement of the real panel (V2-P0); they are not standards and not tested with people.

## V2 Stage 2 additions (2026-11-04, provisional, not yet tried on the physical screen)

- **Pictograms:** simple 24×24 line drawings (inline SVG in `src/components/public/Pictograms.tsx`) in `brand-strong` on a `brand-cream` tile; decorative, always beside a visible text label. No new colour, token or icon library.
- **Home/Newcomers cards:** large cards (Home 2 × 3 filling the space above the dock; Newcomers 2 × 2 plus a full-width help card with an outlined secondary action). Contract and limits: `docs/contracts.md` C11.

## V2 Stage 3 additions (2026-11-05, provisional, not yet tried on the physical screen)

- **Skip link:** white text on `--ink`, at least 56 px high at the 16 px root (larger in kiosk mode), shown at the top left only while it has keyboard focus. It uses the existing focus ring and no new colour or token.
- **Placeholders** in public pages use `--ink-muted` at full opacity (6.39:1 on white); typed text stays `--ink`.
- The active-state cue (bar and underline), the 3 px `--focus` ring and every colour of the provisional palette are unchanged. Contract and limits: `docs/contracts.md` C14.

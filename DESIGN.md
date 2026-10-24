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

/**
 * Public kiosk mode (V2 Stage 1, docs/contracts.md C10). One rule, chosen by viewport and orientation
 * only: a portrait window at least 520 CSS px wide. It is deliberately NOT based on `pointer: coarse` or
 * `hover: none`, which are true only when touch is emulated or detected and say nothing about the screen.
 *
 * The same string is written once in `src/app/globals.css` (the `kiosk` Tailwind variant and the root
 * scale); `tests/unit/public-kiosk-layout.test.ts` fails if the two drift apart.
 * The 520 px threshold is a provisional design choice: the real browser viewport of the Elo screen is
 * not yet measured (task V2-P0).
 */
export const PUBLIC_KIOSK_MEDIA = "(orientation: portrait) and (min-width: 520px)";

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PUBLIC_KIOSK_MEDIA } from "../../src/lib/public-layout.ts";

// V2 Stage 1 (AL-02): the public kiosk mode is chosen by ONE media rule (viewport + orientation, never
// pointer type). It is written once in CSS (custom variant + root scale) and once in TypeScript (dock
// measurement). These checks keep the copies from drifting apart. docs/contracts.md C10.
const css = readFileSync(new URL("../../src/app/globals.css", import.meta.url), "utf8");

describe("public kiosk layout rule", () => {
  it("is portrait and at least 520 CSS px wide, with no pointer or hover condition", () => {
    expect(PUBLIC_KIOSK_MEDIA).toBe("(orientation: portrait) and (min-width: 520px)");
    expect(PUBLIC_KIOSK_MEDIA).not.toMatch(/pointer|hover/);
  });

  it("is the same rule in the CSS custom variant and the root scale block", () => {
    expect(css).toContain(`@custom-variant kiosk (@media ${PUBLIC_KIOSK_MEDIA});`);
    expect(css).toContain(`@media ${PUBLIC_KIOSK_MEDIA} {`);
    // every portrait @media block in the file (not the @custom-variant line, which ends in ";") is exactly the rule
    const mediaBlocks = css.match(/@media \(orientation: portrait\)[^{;]*\{/g) ?? [];
    expect(mediaBlocks.length).toBeGreaterThanOrEqual(1);
    expect(mediaBlocks.every((block) => block === `@media ${PUBLIC_KIOSK_MEDIA} {`)).toBe(true);
  });

  it("scales only pages that opt in with data-public-shell, so admin pages keep the ordinary size", () => {
    const scale = css.match(/@media \(orientation: portrait\) and \(min-width: 520px\) \{([\s\S]*?)\n\}/)?.[1] ?? "";
    expect(scale).toMatch(/:root:has\(\[data-public-shell\]\)/);
    expect(scale).toMatch(/font-size:/);
    expect(scale).toMatch(/--public-dock-h:/);
    expect(scale).toMatch(/scroll-padding-bottom:/);
    // nothing in the kiosk block styles the bare root or body
    expect(scale).not.toMatch(/^\s*(html|:root|body)\s*\{/m);
  });
});

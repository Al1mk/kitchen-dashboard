// Stage 3 mutation checks (4 Nov 2026). Each mutation deliberately breaks ONE accessibility behaviour in a throw-away
// clone of the validated copy, builds it and runs the new spec; a mutation the spec does not catch means the spec is too
// weak. Tooling only, not product code; it never touches the real project, its .next, data or credentials.
//
//   node 04-mutations.mjs <validated-copy> <work-dir>
import { spawnSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [source, work] = process.argv.slice(2);
if (!source || !work) throw new Error("usage: node 04-mutations.mjs <validated-copy> <work-dir>");

const MUTATIONS = [
  ["M1-no-skip-link", "src/components/public/PublicShell.tsx", [["      <SkipLink label={t.skipLink} />\n", ""]]],
  ["M2-no-top-scroll-padding", "src/app/globals.css", [["    scroll-padding-top: var(--public-sticky-top, 0px);\n", ""]]],
  ["M3-no-room-code-in-link-names", "src/components/public/RoomDirectory.tsx", [[`<span className="sr-only"> – {room.code}</span>`, ""], [`<span className="sr-only"> – {s.room.code}</span>`, ""]]],
  ["M4-placeholder-back-to-half-alpha", "src/app/globals.css", [["  color: var(--ink-muted);\n  opacity: 1;\n", "  color: color-mix(in srgb, var(--ink) 50%, transparent);\n  opacity: 1;\n"]]],
  ["M5-no-document-language-sync", "src/components/public/PublicShell.tsx", [["      <DocumentLang lang={lang} />\n", ""]]],
  ["M6-board-keeps-h2-h3", "src/components/display/DisplayBoard.tsx", [["          pageHeading\n", ""]]],
  ["M7-skip-link-as-plain-hash-navigation", "src/components/public/SkipLink.tsx", [["      event.preventDefault();\n      document.getElementById(\"main-content\")?.focus();\n", ""]]],
];

const results = [];
for (const [name, file, edits] of MUTATIONS) {
  const dir = join(work, `mut-${name}`);
  rmSync(dir, { recursive: true, force: true });
  if (spawnSync("cp", ["-cR", source, dir]).status !== 0) throw new Error("clone failed");
  rmSync(join(dir, "test-results"), { recursive: true, force: true });
  rmSync(join(dir, "playwright-report"), { recursive: true, force: true });
  let text = readFileSync(join(dir, file), "utf8");
  let applied = 0;
  for (const [from, to] of edits) {
    if (!text.includes(from)) continue; // an edit may legitimately match nothing when another one of the same mutation applies (M3)
    text = text.split(from).join(to);
    applied++;
  }
  if (applied === 0) {
    results.push(`${name}: NOT APPLIED (pattern not found) - result invalid`);
    console.log(results.at(-1));
    continue;
  }
  writeFileSync(join(dir, file), text);
  const run = spawnSync(process.execPath, ["node_modules/@playwright/test/cli.js", "test", "tests/e2e/stage3-accessibility.spec.ts", "--reporter=list"], {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1", PLAYWRIGHT_NO_COPY_PROMPT: "1" },
    maxBuffer: 64 * 1024 * 1024,
  });
  const out = (run.stdout || "") + (run.stderr || "");
  writeFileSync(join(work, `mutation-${name}.log`), out);
  const failed = /(\d+) failed/.exec(out)?.[1] ?? "0";
  const passed = /(\d+) passed/.exec(out)?.[1] ?? "0";
  results.push(`${name}: edits applied ${applied}/${edits.length}; ${failed} failed, ${passed} passed (exit ${run.status})`);
  console.log(results.at(-1));
  rmSync(dir, { recursive: true, force: true });
}
writeFileSync(join(work, "mutation-summary.txt"), results.join("\n") + "\n");
console.log("DONE");

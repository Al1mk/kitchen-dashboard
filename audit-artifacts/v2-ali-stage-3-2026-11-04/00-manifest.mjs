// Stage 3 tooling (4 Nov 2026): runtime manifest of a source tree, so "the copy that was tested" can be shown to equal
// "the working tree that is reviewed". SHA-256 over the sorted per-file SHA-256 of the files that determine the build and
// the tests. Not product code. Usage: node 00-manifest.mjs <dir> [--list]
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.argv[2];
if (!root) throw new Error("usage: node 00-manifest.mjs <dir> [--list]");
const PARTS = ["src", "public", "scripts", "tests", "package.json", "package-lock.json", "next.config.ts", "tsconfig.json", "eslint.config.mjs", "vitest.config.mts", "playwright.config.ts"];
const files = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else files.push(path);
  }
};
for (const part of PARTS) {
  const path = join(root, part);
  if (!existsSync(path)) continue;
  if (statSync(path).isDirectory()) walk(path);
  else files.push(path);
}
const lines = files.map((file) => `${relative(root, file)} ${createHash("sha256").update(readFileSync(file)).digest("hex")}`).sort();
console.log(createHash("sha256").update(lines.join("\n")).digest("hex").slice(0, 16), lines.length, "files");
if (process.argv.includes("--list")) console.log(lines.join("\n"));

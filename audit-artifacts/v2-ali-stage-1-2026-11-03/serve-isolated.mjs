// Stage 1 (3 Nov 2026) helper — tooling only, not product code and not part of the test suite.
// Starts an ISOLATED, already built copy of the app on localhost with a fresh disposable SQLite
// database (base demo seed + team demo seed) and a random temporary admin credential.
//
//   node serve-isolated.mjs <copy-dir> <port> <work-dir>
//
// - refuses ports 3000 (manual server) and 3100 (E2E), and any copy that is the real project
// - writes <work-dir>/admin.json (mode 600): temporary credential for synthetic data only; delete it afterwards
// - keeps running in the foreground (stop it with SIGTERM); prints only "ready" lines, never the credential
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const [copyArg, portArg, workArg] = process.argv.slice(2);
if (!copyArg || !portArg || !workArg) {
  console.error("usage: node serve-isolated.mjs <copy-dir> <port> <work-dir>");
  process.exit(2);
}
const copy = resolve(copyArg);
const work = resolve(workArg);
const port = Number(portArg);
if (!Number.isInteger(port) || port < 1024 || port === 3000 || port === 3100) {
  console.error("refusing port " + portArg + " (3000 = manual server, 3100 = E2E)");
  process.exit(2);
}
if (/campus-board\/?$/.test(copy)) {
  console.error("refusing to serve the real project directory; use an isolated copy");
  process.exit(2);
}

mkdirSync(work, { recursive: true });
const db = join(work, "stage1.sqlite");
const password = randomBytes(18).toString("base64url");
const { hashPassword } = await import(pathToFileURL(join(copy, "src/lib/auth/password.ts")).href);
const hash = await hashPassword(password);
writeFileSync(join(work, "admin.json"), JSON.stringify({ username: "stage1-admin", password }), { mode: 0o600 });
chmodSync(join(work, "admin.json"), 0o600);

const env = { ...process.env, CAMPUS_BOARD_DB_PATH: db, NODE_ENV: "production" };
for (const [script, args] of [["scripts/seed-demo.ts", []], ["scripts/seed-team-demo.ts", ["--yes"]]]) {
  const r = spawnSync(process.execPath, [script, ...args], { cwd: copy, env, encoding: "utf8" });
  if (r.status !== 0) {
    console.error(script + " failed:\n" + (r.stdout || "") + (r.stderr || ""));
    process.exit(1);
  }
}

const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port), "-H", "127.0.0.1"], {
  cwd: copy,
  env: { ...env, ADMIN_USERNAME: "stage1-admin", ADMIN_PASSWORD_HASH: hash },
  stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.on("data", (d) => process.stdout.write(String(d)));
server.stderr.on("data", (d) => process.stderr.write(String(d)));
server.on("exit", (code) => process.exit(code ?? 0));
for (const sig of ["SIGTERM", "SIGINT"]) process.on(sig, () => server.kill("SIGTERM"));
console.log(`stage1-serve: copy=${copy} port=${port} db=${db}`);

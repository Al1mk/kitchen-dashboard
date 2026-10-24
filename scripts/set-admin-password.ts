// Usage: npm run admin:set-password
// Asks for a username and password and writes ADMIN_USERNAME and
// ADMIN_PASSWORD_HASH to .env.local (git-ignored). The password itself is
// never printed or stored; only its scrypt hash.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { Writable } from "node:stream";
import { hashPassword } from "../src/lib/auth/password.ts";

const ENV_FILE = ".env.local";

// Output stream that can be muted so typed passwords are not echoed.
let muted = false;
const output = new Writable({
  write(chunk, _encoding, callback) {
    if (!muted) stdout.write(chunk);
    callback();
  },
});

async function main() {
  const rl = createInterface({ input: stdin, output, terminal: stdin.isTTY });
  // The async iterator buffers lines, so piped input is not lost between prompts.
  const lines = rl[Symbol.asyncIterator]();
  const ask = async (question: string, hidden = false) => {
    stdout.write(question);
    muted = hidden;
    const { value, done } = await lines.next();
    muted = false;
    if (hidden) stdout.write("\n");
    if (done) {
      console.error("\nEingabe abgebrochen.");
      process.exit(1);
    }
    return value as string;
  };

  const username = (await ask("Benutzername für die Demo-Verwaltung: ")).trim();
  if (!/^[A-Za-z0-9._-]{3,40}$/.test(username)) {
    console.error("Ungültiger Benutzername (3–40 Zeichen: Buchstaben, Ziffern, . _ -).");
    process.exit(1);
  }
  const password = await ask("Passwort (mind. 12 Zeichen, Eingabe unsichtbar): ", true);
  const repeat = await ask("Passwort wiederholen: ", true);
  rl.close();
  if (password.length < 12) {
    console.error("Das Passwort muss mindestens 12 Zeichen lang sein.");
    process.exit(1);
  }
  if (password !== repeat) {
    console.error("Die Passwörter stimmen nicht überein.");
    process.exit(1);
  }

  const hash = await hashPassword(password);
  const keep = existsSync(ENV_FILE)
    ? readFileSync(ENV_FILE, "utf8")
        .split("\n")
        .filter((line) => line.trim() && !/^(ADMIN_USERNAME|ADMIN_PASSWORD_HASH)=/.test(line))
    : [];
  writeFileSync(ENV_FILE, [...keep, `ADMIN_USERNAME=${username}`, `ADMIN_PASSWORD_HASH=${hash}`, ""].join("\n"), { mode: 0o600 });
  console.log(`Gespeichert in ${ENV_FILE}. Bitte den Server neu starten, damit die Änderung wirkt.`);
}

void main();

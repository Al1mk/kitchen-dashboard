// crypto.randomUUID only exists in secure contexts (HTTPS or localhost); the admin
// may also be opened over plain HTTP via a LAN IP, where getRandomValues still works.
export function newRequestId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
}

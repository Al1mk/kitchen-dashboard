/** True for SQLite lock contention that outlasted busy_timeout; safe to retry with the same request. */
export function isBusyError(error: unknown): boolean {
  return !!error && typeof error === "object" && "code" in error && typeof error.code === "string" && /^(SQLITE_BUSY|SQLITE_LOCKED)/.test(error.code);
}

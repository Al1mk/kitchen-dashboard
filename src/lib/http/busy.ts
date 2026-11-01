import { jsonError } from "../auth/request.ts";
import { isBusyError } from "../db/busy.ts";

/** Maps lock contention to a retryable 503; anything else is rethrown. Never echoes bodies, tokens or SQL. */
export function busyResponse(error: unknown): Response {
  if (isBusyError(error)) return jsonError(503, "temporarily_unavailable", "System beschäftigt. Bitte erneut versuchen.");
  throw error;
}

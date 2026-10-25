// Small client helpers shared by the room and class-session forms.

export type ApiFailure = { message?: string; fieldErrors?: Record<string, string[]> };

/** JSON request to the admin API. status 0 means the server was not reachable. */
export async function adminFetch<T>(url: string, method: string, body?: unknown): Promise<{ ok: boolean; status: number; data: Partial<T> & ApiFailure }> {
  try {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = (await response.json().catch(() => ({}))) as Partial<T> & ApiFailure;
    return { ok: response.ok, status: response.status, data };
  } catch {
    return { ok: false, status: 0, data: {} };
  }
}

export function failureText(status: number, data: ApiFailure): string {
  if (status === 0) return "Keine Verbindung zum Server. Nichts wurde gespeichert – bitte erneut versuchen.";
  if (status === 401) return "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich in einem neuen Tab erneut an und versuchen Sie es dann noch einmal.";
  return data.message ?? "Aktion fehlgeschlagen.";
}

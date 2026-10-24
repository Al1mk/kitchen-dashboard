// CSRF defence for state-changing requests: the browser-sent Origin header must
// match the host the request was addressed to. Requests without Origin are
// rejected (all current browsers send it on fetch POST/PUT).

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

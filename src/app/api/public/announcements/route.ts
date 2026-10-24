import { services } from "@/lib/server.ts";

// Public, read-only. Returns only the allowlisted projection of announcements
// that are published and inside their window according to the server clock.
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    { serverTime: new Date().toISOString(), announcements: services().announcements.listPublic() },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}

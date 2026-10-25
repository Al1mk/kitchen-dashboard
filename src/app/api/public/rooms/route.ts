import { services } from "@/lib/server.ts";

// Public, read-only. Active rooms only, allowlisted fields (see docs/contracts.md).
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    { serverTime: new Date().toISOString(), rooms: services().rooms.listPublic() },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}

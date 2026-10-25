import type { Metadata } from "next";
import { PublicShell } from "@/components/public/PublicShell.tsx";
import { RoomDirectory } from "@/components/public/RoomDirectory.tsx";

// Public, read-only room directory. Same data as the admin, refreshed by polling.
export const metadata: Metadata = { title: "Räume – Campus Board" };

export default function RoomsPage() {
  return (
    <PublicShell active="rooms" title="Räume">
      <RoomDirectory />
    </PublicShell>
  );
}

import type { Metadata } from "next";
import { DaySchedule } from "@/components/public/DaySchedule.tsx";
import { PublicShell } from "@/components/public/PublicShell.tsx";
import { isCalendarDate } from "@/lib/time/berlin.ts";

// Public, read-only daily schedule. ?datum=JJJJ-MM-TT selects a day (default:
// today by the server clock), ?raum=<id> limits it to one room.
export const metadata: Metadata = { title: "Stundenplan – Campus Board" };

export default async function SchedulePage({ searchParams }: PageProps<"/schedule">) {
  const { datum, raum } = await searchParams;
  const date = typeof datum === "string" && isCalendarDate(datum) ? datum : null;
  const roomId = typeof raum === "string" && raum.length <= 100 ? raum : null;
  return (
    <PublicShell active="schedule" title="Stundenplan">
      <DaySchedule key={`${date}-${roomId}`} date={date} roomId={roomId} />
    </PublicShell>
  );
}

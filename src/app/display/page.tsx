import type { Metadata, Viewport } from "next";
import { DisplayBoard } from "@/components/display/DisplayBoard.tsx";

// Public kiosk route: no admin navigation, no session, read-only data.
export const metadata: Metadata = { title: "Campus Board – Anzeige" };
export const viewport: Viewport = { themeColor: "#23252b" };

export default function DisplayPage() {
  return <DisplayBoard />;
}

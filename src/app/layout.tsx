import type { Metadata } from "next";
import { Roboto_Condensed, Source_Sans_3 } from "next/font/google";
import "./globals.css";

// Provisional typography (see DESIGN.md): a condensed heading face similar in
// character to the university website, and a highly legible body face.
const heading = Roboto_Condensed({ variable: "--font-heading", subsets: ["latin"], weight: ["500", "700"] });
const body = Source_Sans_3({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LCC Campus Board",
  description: "Prototyp: Mitteilungen für den Bildschirm im Lucas-Cranach-Campus Kronach",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${heading.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Übersicht", exact: true },
  { href: "/admin/rooms", label: "Räume", exact: false },
  { href: "/admin/schedule", label: "Stundenplan", exact: false },
  { href: "/admin/announcements", label: "Mitteilungen", exact: false },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Verwaltung">
      <ul className="flex flex-col gap-1">
        {LINKS.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center rounded-lg px-3 font-semibold ${
                  active ? "bg-brand text-white" : "text-ink hover:bg-canvas"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

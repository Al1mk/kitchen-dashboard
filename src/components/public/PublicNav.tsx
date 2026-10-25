import Link from "next/link";
import { PUBLIC_TEXT, publicHref, type Lang, type PublicSection } from "@/lib/i18n/public.ts";

// Navigation shared by every public page (start, announcement board, rooms,
// schedule). No admin links. "page" sizes fit the normal pages; "board" uses
// container units like the portrait announcement board.

const SECTIONS: { key: PublicSection; path: string }[] = [
  { key: "start", path: "/" },
  { key: "display", path: "/display" },
  { key: "rooms", path: "/rooms" },
  { key: "schedule", path: "/schedule" },
];

type Variant = "page" | "board";

const styles = {
  page: {
    list: "grid grid-cols-2 gap-2 sm:grid-cols-4",
    item: "min-h-14 rounded-xl px-3 font-semibold",
    idle: "bg-canvas text-ink hover:bg-neutral-soft",
    switch: "rounded-xl border border-line p-1 gap-1",
    lang: "min-h-12 rounded-lg px-3 font-semibold",
  },
  board: {
    list: "grid grid-cols-4 gap-[1.4cqw]",
    item: "min-h-[7cqw] rounded-[1cqw] px-[1.4cqw] text-[2.8cqw] font-semibold",
    idle: "bg-canvas text-ink active:bg-neutral-soft",
    switch: "rounded-[1cqw] border border-line p-[0.5cqw] gap-[0.5cqw]",
    lang: "min-h-[6cqw] rounded-[0.8cqw] px-[2cqw] text-[2.6cqw] font-semibold",
  },
} as const;

export function PublicNav({ active, lang, variant = "page" }: { active: PublicSection; lang: Lang; variant?: Variant }) {
  const t = PUBLIC_TEXT[lang];
  const s = styles[variant];
  return (
    <nav aria-label={t.navLabel}>
      <ul className={s.list}>
        {SECTIONS.map(({ key, path }) => (
          <li key={key}>
            <Link
              href={publicHref(path, lang)}
              aria-current={key === active ? "page" : undefined}
              className={`flex h-full touch-manipulation items-center justify-center text-center ${s.item} ${
                key === active ? "bg-brand text-white" : s.idle
              }`}
            >
              {t.sections[key]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Deutsch / English switch. Links to the same page and keeps its context
 * (`params`, e.g. the selected day and room); only the language changes.
 */
export function LanguageSwitch({
  lang,
  path,
  params = {},
  variant = "page",
}: {
  lang: Lang;
  path: string;
  params?: Record<string, string | null | undefined>;
  variant?: Variant;
}) {
  const s = styles[variant];
  const options = [
    { code: "de", label: "Deutsch" },
    { code: "en", label: "English" },
  ] as const;
  return (
    <div role="group" aria-label={PUBLIC_TEXT[lang].languageLabel} className={`flex w-fit bg-surface ${s.switch}`}>
      {options.map((option) => (
        <Link
          key={option.code}
          href={publicHref(path, option.code, params)}
          hrefLang={option.code}
          lang={option.code}
          aria-current={option.code === lang ? "true" : undefined}
          className={`flex touch-manipulation items-center ${s.lang} ${option.code === lang ? "bg-ink text-white" : "text-ink"}`}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}

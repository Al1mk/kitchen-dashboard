import Link from "next/link";
import { PUBLIC_TEXT, publicHref, type Lang, type PublicSection } from "@/lib/i18n/public.ts";

// Navigation shared by every public page (start, newcomers, map, rooms,
// schedule, booking, announcement board). No admin links. Seven entries.
//
// "page" is the variant of the normal pages: two columns on narrow phones, four columns from the `sm`
// breakpoint, and in public kiosk mode (portrait, ≥ 520 px; see docs/contracts.md C10) the dock
// layout: first row four tiles, second row three centred as a group. "board" is the announcement
// board's dock; it sizes everything in container units (cqw) like the rest of the board.
// The active entry and the active language carry a bar / underline in addition to their colour.

const SECTIONS: { key: PublicSection; path: string }[] = [
  { key: "start", path: "/" },
  { key: "newcomers", path: "/newcomers" },
  { key: "map", path: "/map" },
  { key: "rooms", path: "/rooms" },
  { key: "schedule", path: "/schedule" },
  { key: "booking", path: "/booking" },
  { key: "display", path: "/display" },
];

type Variant = "page" | "board";

const styles = {
  page: {
    list: "grid grid-cols-2 gap-2 sm:grid-cols-4 kiosk:flex kiosk:flex-wrap kiosk:justify-center kiosk:gap-[var(--public-dock-gap)]",
    // 4 per row: (100 % − 3 gaps) / 4. The last row (3 tiles) is centred by justify-center.
    cell: "kiosk:basis-[calc((100%_-_3*var(--public-dock-gap))/4)]",
    item: "min-h-14 rounded-xl px-3 font-semibold kiosk:leading-tight",
    idle: "bg-canvas text-ink hover:bg-neutral-soft kiosk:bg-neutral-soft",
    active: "bg-brand text-white shadow-[inset_0_-0.375rem_0_0_var(--ink)]",
    switch: "rounded-xl border border-line p-1 gap-2 kiosk:gap-[var(--public-dock-gap)]",
    lang: "min-h-12 rounded-lg px-3 font-semibold kiosk:min-h-14 kiosk:px-5",
    langIdle: "text-ink",
    langActive: "bg-ink text-white underline decoration-2 underline-offset-4",
  },
  board: {
    list: "flex flex-wrap justify-center gap-[1.4cqw]",
    cell: "basis-[calc((100%_-_4.2cqw)/4)]",
    item: "min-h-[7cqw] rounded-[1cqw] px-[1cqw] text-[2.7cqw] leading-tight font-semibold",
    idle: "bg-neutral-soft text-ink active:bg-line",
    active: "bg-brand text-white shadow-[inset_0_-0.8cqw_0_0_var(--ink)]",
    switch: "rounded-[1cqw] border border-line p-[0.5cqw] gap-[1.5cqw]",
    lang: "min-h-[6cqw] rounded-[0.8cqw] px-[2cqw] text-[2.6cqw] font-semibold",
    langIdle: "text-ink",
    langActive: "bg-ink text-white underline decoration-[0.3cqw] underline-offset-[0.8cqw]",
  },
} as const;

export function PublicNav({ active, lang, variant = "page" }: { active: PublicSection; lang: Lang; variant?: Variant }) {
  const t = PUBLIC_TEXT[lang];
  const s = styles[variant];
  return (
    <nav aria-label={t.navLabel}>
      <ul className={s.list}>
        {SECTIONS.map(({ key, path }) => (
          <li key={key} className={s.cell}>
            <Link
              href={publicHref(path, lang)}
              aria-current={key === active ? "page" : undefined}
              className={`flex h-full touch-manipulation items-center justify-center text-center ${s.item} ${key === active ? s.active : s.idle}`}
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
  prefetch,
}: {
  lang: Lang;
  path: string;
  params?: Record<string, string | null | undefined>;
  variant?: Variant;
  /** false for links whose target changes while the visitor types (no prefetch per keystroke). */
  prefetch?: false;
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
          prefetch={prefetch}
          hrefLang={option.code}
          lang={option.code}
          aria-current={option.code === lang ? "true" : undefined}
          className={`flex touch-manipulation items-center ${s.lang} ${option.code === lang ? s.langActive : s.langIdle}`}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}

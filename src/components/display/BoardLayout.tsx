import Link from "next/link";
import type { ReactNode } from "react";
import type { Category, PublicAnnouncement } from "@/lib/announcements/schema.ts";
import { fallbackLevel, localize, PUBLIC_TEXT, type Lang } from "@/lib/i18n/public.ts";
import { formatBerlinDateTime, formatBerlinLongDate, formatBerlinTime } from "@/lib/time/berlin.ts";

// Presentational portrait board shared by the public display and the admin
// preview. All sizes use container query units (cqw), so the same layout
// scales from a 1080×1920 screen down to a small preview frame. The admin
// preview passes no navigation and stays German. The public navigation and language switch form a dock
// at the bottom of the frame (V2 Stage 1, docs/contracts.md C10). Stage 3 (AL-05, C14): on the public page the
// board's title is the page's h1 and the announcement titles are h2 (`pageHeading`), and the logo links to Home
// (`logoHref`); the admin preview, which sits inside an admin page that has its own h1, keeps h2/h3 and no link.
// Sizes and classes are unchanged: only the heading level and the link wrapper differ.

const categoryStyle: Record<Category, { bar: string; chip: string }> = {
  important: { bar: "bg-brand", chip: "bg-danger-soft text-danger" },
  event: { bar: "bg-brand-purple", chip: "bg-info-soft text-info" },
  general: { bar: "bg-brand-orange", chip: "bg-neutral-soft text-ink" },
};

export type BoardItem = PublicAnnouncement & { isPreview?: boolean };

export function AnnouncementCard({ item, lang = "de", titleAs: Title = "h3" }: { item: BoardItem; lang?: Lang; titleAs?: "h2" | "h3" }) {
  const style = categoryStyle[item.category];
  const text = PUBLIC_TEXT[lang];
  const t = text.board;
  const title = localize(item.title, item.titleEn, lang);
  const body = localize(item.body, item.bodyEn, lang);
  const fallback = fallbackLevel([title, body]);
  return (
    <article
      className={`relative flex shrink-0 overflow-hidden rounded-[1.2cqw] bg-surface shadow-[0_0.2cqw_0.8cqw_rgba(35,37,43,0.08)] ${
        item.isPreview ? "outline-[0.5cqw] outline-dashed outline-brand-purple" : ""
      }`}
    >
      <div className={`w-[1.1cqw] shrink-0 ${style.bar}`} aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-[1.4cqw] p-[3.4cqw]">
        <div className="flex flex-wrap items-center gap-[1.4cqw] text-[2.3cqw] font-semibold uppercase tracking-wide">
          <span className={`rounded-full px-[1.8cqw] py-[0.5cqw] ${style.chip}`}>{t.categories[item.category]}</span>
          {item.pinned && <span className="rounded-full bg-brand-cream px-[1.8cqw] py-[0.5cqw] text-ink">{t.pinned}</span>}
          {fallback && (
            <span className="rounded-full border-[0.2cqw] border-ink-muted px-[1.8cqw] py-[0.4cqw] text-ink-muted">{text.fallback[fallback]}</span>
          )}
          {item.isPreview && (
            <span lang="de" className="rounded-full bg-brand-purple px-[1.8cqw] py-[0.5cqw] text-white">
              Vorschau
            </span>
          )}
        </div>
        <Title lang={title.lang} className="font-display text-[4.6cqw] leading-[1.15] font-bold text-ink [overflow-wrap:anywhere]">
          {title.text}
        </Title>
        <p lang={body.lang} className="text-[3.1cqw] leading-[1.45] whitespace-pre-line text-ink [overflow-wrap:anywhere]">
          {body.text}
        </p>
        {item.endsAt && (
          <p className="text-[2.4cqw] text-ink-muted">{t.validUntil(formatBerlinDateTime(item.endsAt, lang))}</p>
        )}
      </div>
    </article>
  );
}

export function BoardLayout({
  items,
  now,
  banner,
  emptyState,
  footerNote,
  lang = "de",
  nav,
  languageSwitch,
  pageHeading = false,
  logoHref,
}: {
  items: BoardItem[] | null;
  now: Date | null;
  banner?: ReactNode;
  emptyState?: ReactNode;
  footerNote?: ReactNode;
  lang?: Lang;
  /** Public navigation, shown in the dock at the bottom of the frame (not in the admin preview). */
  nav?: ReactNode;
  languageSwitch?: ReactNode;
  /** The board is a whole public page: its title is the h1 and the announcement titles are h2. */
  pageHeading?: boolean;
  /** Makes the logo a link (to Home on the public page). */
  logoHref?: string;
}) {
  const t = PUBLIC_TEXT[lang];
  const Heading = pageHeading ? "h1" : "h2";
  const logo = (
    // eslint-disable-next-line @next/next/no-img-element -- static asset, sized by container units
    <img
      src="/brand/hs-coburg-logo-screenshot.png"
      alt={logoHref ? `Hochschule Coburg – ${t.sections.start}` : "Hochschule Coburg"}
      className="h-auto w-[34cqw]"
      width={445}
      height={118}
    />
  );
  return (
    <div className="@container h-full w-full">
      <div className="flex h-full w-full flex-col bg-canvas text-ink">
        <header className="bg-surface">
          <div className="flex items-center justify-between gap-[3cqw] px-[4.5cqw] py-[3.6cqw]">
            {logoHref ? (
              <Link href={logoHref} className="block shrink-0 rounded-[1cqw]">
                {logo}
              </Link>
            ) : (
              logo
            )}
            <div className="text-right">
              <p className="font-display text-[7.4cqw] leading-none font-bold tabular-nums" aria-label={t.board.clock}>
                {now ? formatBerlinTime(now) : " "}
              </p>
              <p className="mt-[0.8cqw] text-[2.6cqw] text-ink-muted">{now ? formatBerlinLongDate(now, lang) : " "}</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-[3cqw] px-[4.5cqw] pb-[2.4cqw]">
            <p className="text-[2.6cqw] font-semibold text-ink-muted">Lucas-Cranach-Campus Kronach</p>
          </div>
          <div className="brand-stripe h-[0.7cqw]" aria-hidden="true" />
        </header>

        {banner}

        <main className="flex min-h-0 flex-1 flex-col px-[4.5cqw] pt-[4cqw]">
          <Heading className="font-display text-[5.4cqw] font-bold">{t.sections.display}</Heading>
        {/* Cards never shrink (that would clip their text); extra content scrolls this list. */}
          <div className="mt-[3cqw] flex min-h-0 flex-1 flex-col gap-[3cqw] overflow-y-auto pb-[4cqw]">
            {items && items.length > 0 ? items.map((item) => <AnnouncementCard key={item.id} item={item} lang={lang} titleAs={pageHeading ? "h2" : "h3"} />) : emptyState}
          </div>
        </main>

        <footer className="border-t border-line bg-surface px-[4.5cqw] py-[2.4cqw] text-[2.1cqw] text-ink-muted">{footerNote ?? t.footer}</footer>

        {/* Public dock: language switch above the 4 + 3 navigation, last child of the portrait frame, so the
            scrolling list above it can never run underneath it. Absent in the admin preview (no nav). */}
        {(nav || languageSwitch) && (
          <div
            data-public-dock
            className="flex shrink-0 flex-col items-center gap-[1.4cqw] border-t border-line bg-surface px-[4.5cqw] py-[1.8cqw] shadow-[0_-0.5cqw_1.5cqw_rgba(35,37,43,0.1)]"
          >
            {languageSwitch}
            {nav && <div className="w-full">{nav}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

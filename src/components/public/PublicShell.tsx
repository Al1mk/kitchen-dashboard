import Link from "next/link";
import type { ReactNode } from "react";
import { PUBLIC_TEXT, publicHref, type Lang, type PublicSection } from "@/lib/i18n/public.ts";
import { formatBerlinTime } from "@/lib/time/berlin.ts";
import { DockHeightSync } from "./DockHeightSync.tsx";
import { DocumentLang } from "./DocumentLang.tsx";
import { LiveLanguageSwitch } from "./LiveLanguageSwitch.tsx";
import { LanguageSwitch, PublicNav } from "./PublicNav.tsx";
import { SkipLink } from "./SkipLink.tsx";

// Frame of the public pages (start, newcomers, map, rooms, schedule, booking). No admin links
// or session. Sized for the portrait kiosk (≥ 56 px touch targets) and usable on laptops and phones.
//
// Public kiosk mode (portrait, ≥ 520 CSS px; docs/contracts.md C10): the language switch and the one
// navigation form a dock fixed to the bottom edge (data-public-dock). Outside kiosk mode that wrapper is
// `display: contents`, so both stay in the header exactly where they were. There is only ever one
// <nav>; CSS moves it, nothing is duplicated. DockHeightSync reserves the dock's real height.
// Known consequence: the dock comes first in DOM/tab order although it is drawn last. The skip link (Stage 3,
// AL-05, docs/contracts.md C14) is the first tab stop and jumps over it to <main id="main-content">; DocumentLang
// keeps <html lang> in step with the page, and the logo links to Home in the visitor's language.

/** Sections that show class titles/lecturers; only there the "entered by campus staff" note helps. */
const SECTIONS_WITH_CLASS_TITLES: PublicSection[] = ["schedule", "rooms"];

export function PublicShell({
  active,
  lang,
  path,
  params,
  liveParams,
  title,
  children,
}: {
  active: PublicSection;
  lang: Lang;
  /** Current path and context for the language switch. */
  path: string;
  params?: Record<string, string | null | undefined>;
  /** Query keys the page itself changes in the browser; the language switch reads them live. */
  liveParams?: string[];
  title: string;
  children: ReactNode;
}) {
  const t = PUBLIC_TEXT[lang];
  return (
    <div lang={lang} data-public-shell className="flex min-h-dvh flex-col bg-canvas text-lg text-ink kiosk:pb-[var(--public-dock-h)]">
      <SkipLink label={t.skipLink} />
      <DocumentLang lang={lang} />
      <header className="bg-surface">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-4 px-5 pt-5 pb-3">
          <div>
            {/* The logo is a link to Home; its image alt names the destination, so the link has a name of its own. */}
            <Link href={publicHref("/", lang)} className="block w-fit rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element -- small static logo */}
              <img src="/brand/hs-coburg-logo-screenshot.png" alt={`Hochschule Coburg – ${t.sections.start}`} width={445} height={118} className="h-auto w-44" />
            </Link>
            <p className="mt-1 font-semibold text-ink-muted">Lucas-Cranach-Campus Kronach</p>
          </div>
          <div
            data-public-dock
            className="contents kiosk:fixed kiosk:inset-x-0 kiosk:bottom-0 kiosk:z-40 kiosk:flex kiosk:flex-col kiosk:items-center kiosk:gap-[var(--public-dock-gap)] kiosk:border-t kiosk:border-line kiosk:bg-surface kiosk:py-[var(--public-dock-gap)] kiosk:shadow-[0_-0.25rem_1rem_rgba(35,37,43,0.12)]"
          >
            {liveParams ? <LiveLanguageSwitch lang={lang} path={path} keys={liveParams} /> : <LanguageSwitch lang={lang} path={path} params={params} />}
            {/* same column as the page content (max-w-3xl + px-5), so tiles line up with the cards above */}
            <div className="basis-full kiosk:w-full kiosk:max-w-3xl kiosk:px-5">
              <PublicNav active={active} lang={lang} />
            </div>
          </div>
        </div>
        <div className="brand-stripe h-1.5" aria-hidden="true" />
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-5 py-6">
        <h1 className="font-display text-4xl font-bold">{title}</h1>
        {t.contentNote && SECTIONS_WITH_CLASS_TITLES.includes(active) && <p className="text-base text-ink-muted">{t.contentNote}</p>}
        {children}
      </main>
      <footer className="border-t border-line bg-surface px-5 py-3 text-center text-sm text-ink-muted">{t.footer}</footer>
      <DockHeightSync />
    </div>
  );
}

/** Loading, error and stale states shared by the public pages. */
export function LoadState({
  loading,
  failed,
  receivedAt,
  retry,
  what,
  lang,
}: {
  loading: boolean;
  failed: boolean;
  receivedAt: Date | null;
  retry: () => void;
  what: "rooms" | "sessions";
  lang: Lang;
}) {
  const t = PUBLIC_TEXT[lang].load;
  const retryButton = (
    <button type="button" onClick={retry} className="min-h-14 touch-manipulation rounded-xl bg-ink px-5 font-semibold text-white active:bg-black">
      {t.retry}
    </button>
  );
  if (loading && !failed) {
    return (
      <p role="status" className="py-10 text-center text-ink-muted">
        {t.loading[what]}
      </p>
    );
  }
  if (failed && !receivedAt) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="font-semibold">{t.failed[what]}</p>
        <p className="text-ink-muted">{t.retrying}</p>
        {retryButton}
      </div>
    );
  }
  if (failed && receivedAt) {
    return (
      <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-warning-soft px-4 py-3 text-warning">
        <p className="font-semibold">{t.stale(formatBerlinTime(receivedAt))}</p>
        {retryButton}
      </div>
    );
  }
  return null;
}

export function DemoNotice({ lang }: { lang: Lang }) {
  const t = PUBLIC_TEXT[lang].demoNotice;
  return (
    <p className="rounded-xl border border-info/30 bg-info-soft px-4 py-3 text-info">
      <span className="font-semibold">{t.lead}</span> {t.text}
    </p>
  );
}

/** Marks an item shown (partly) in German in the English interface. */
export function FallbackTag({ lang, level }: { lang: Lang; level: "partial" | "all" | null }) {
  if (!level) return null;
  return <span className="rounded-full border border-ink-muted px-2.5 py-0.5 text-sm font-semibold text-ink-muted">{PUBLIC_TEXT[lang].fallback[level]}</span>;
}

export function DemoTag({ lang }: { lang: Lang }) {
  return <span className="rounded-full bg-info-soft px-2.5 py-0.5 text-sm font-semibold text-info">{PUBLIC_TEXT[lang].demoTag}</span>;
}

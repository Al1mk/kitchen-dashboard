import type { ReactNode } from "react";
import { PUBLIC_TEXT, type Lang, type PublicSection } from "@/lib/i18n/public.ts";
import { formatBerlinTime } from "@/lib/time/berlin.ts";
import { LanguageSwitch, PublicNav } from "./PublicNav.tsx";

// Frame of the public start page, room directory and schedule. No admin links
// or session. Sized for the portrait kiosk (large text, ≥ 56 px touch targets)
// and usable on laptops and phones. How these pages join the team's map is
// still open (see docs/contracts.md).

export function PublicShell({
  active,
  lang,
  path,
  params,
  title,
  children,
}: {
  active: PublicSection;
  lang: Lang;
  /** Current path and context for the language switch. */
  path: string;
  params?: Record<string, string | null | undefined>;
  title: string;
  children: ReactNode;
}) {
  const t = PUBLIC_TEXT[lang];
  return (
    <div lang={lang} className="flex min-h-dvh flex-col bg-canvas text-lg text-ink">
      <header className="bg-surface">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-4 px-5 pt-5 pb-3">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element -- small static logo */}
            <img src="/brand/hs-coburg-logo-screenshot.png" alt="Hochschule Coburg" width={445} height={118} className="h-auto w-44" />
            <p className="mt-1 font-semibold text-ink-muted">Lucas-Cranach-Campus Kronach</p>
          </div>
          <LanguageSwitch lang={lang} path={path} params={params} />
        </div>
        <div className="mx-auto w-full max-w-3xl px-5 pb-3">
          <PublicNav active={active} lang={lang} />
        </div>
        <div className="brand-stripe h-1.5" aria-hidden="true" />
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-5 py-6">
        <h1 className="font-display text-4xl font-bold">{title}</h1>
        {t.contentNote && active !== "start" && <p className="text-base text-ink-muted">{t.contentNote}</p>}
        {children}
      </main>
      <footer className="border-t border-line bg-surface px-5 py-3 text-center text-sm text-ink-muted">{t.footer}</footer>
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

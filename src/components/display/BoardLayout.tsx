import type { ReactNode } from "react";
import { CATEGORY_LABELS, type Category, type PublicAnnouncement } from "@/lib/announcements/schema.ts";
import { formatBerlinDateTime, formatBerlinLongDate, formatBerlinTime } from "@/lib/time/berlin.ts";

// Presentational portrait board shared by the public display and the admin
// preview. All sizes use container query units (cqw), so the same layout
// scales from a 1080×1920 screen down to a small preview frame.

const categoryStyle: Record<Category, { bar: string; chip: string }> = {
  important: { bar: "bg-brand", chip: "bg-danger-soft text-danger" },
  event: { bar: "bg-brand-purple", chip: "bg-info-soft text-info" },
  general: { bar: "bg-brand-orange", chip: "bg-neutral-soft text-ink" },
};

export type BoardItem = PublicAnnouncement & { isPreview?: boolean };

export function AnnouncementCard({ item }: { item: BoardItem }) {
  const style = categoryStyle[item.category];
  return (
    <article
      className={`relative flex overflow-hidden rounded-[1.2cqw] bg-surface shadow-[0_0.2cqw_0.8cqw_rgba(35,37,43,0.08)] ${
        item.isPreview ? "outline-[0.5cqw] outline-dashed outline-brand-purple" : ""
      }`}
    >
      <div className={`w-[1.1cqw] shrink-0 ${style.bar}`} aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-[1.4cqw] p-[3.4cqw]">
        <div className="flex flex-wrap items-center gap-[1.4cqw] text-[2.3cqw] font-semibold uppercase tracking-wide">
          <span className={`rounded-full px-[1.8cqw] py-[0.5cqw] ${style.chip}`}>{CATEGORY_LABELS[item.category]}</span>
          {item.pinned && <span className="rounded-full bg-brand-cream px-[1.8cqw] py-[0.5cqw] text-ink">Hervorgehoben</span>}
          {item.isPreview && (
            <span className="rounded-full bg-brand-purple px-[1.8cqw] py-[0.5cqw] text-white">Vorschau</span>
          )}
        </div>
        <h3 className="font-display text-[4.6cqw] leading-[1.15] font-bold text-ink [overflow-wrap:anywhere]">
          {item.title}
        </h3>
        <p className="text-[3.1cqw] leading-[1.45] whitespace-pre-line text-ink [overflow-wrap:anywhere]">{item.body}</p>
        {item.endsAt && (
          <p className="text-[2.4cqw] text-ink-muted">Gültig bis {formatBerlinDateTime(item.endsAt)} Uhr</p>
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
}: {
  items: BoardItem[] | null;
  now: Date | null;
  banner?: ReactNode;
  emptyState?: ReactNode;
  footerNote?: ReactNode;
}) {
  return (
    <div className="@container h-full w-full">
      <div className="flex h-full w-full flex-col bg-canvas text-ink">
        <header className="bg-surface">
          <div className="flex items-center justify-between gap-[3cqw] px-[4.5cqw] py-[3.6cqw]">
            {/* eslint-disable-next-line @next/next/no-img-element -- static asset, sized by container units */}
            <img
              src="/brand/hs-coburg-logo-screenshot.png"
              alt="Hochschule Coburg"
              className="h-auto w-[34cqw]"
              width={445}
              height={118}
            />
            <div className="text-right">
              <p className="font-display text-[7.4cqw] leading-none font-bold tabular-nums" aria-label="Uhrzeit">
                {now ? formatBerlinTime(now) : " "}
              </p>
              <p className="mt-[0.8cqw] text-[2.6cqw] text-ink-muted">{now ? formatBerlinLongDate(now) : " "}</p>
            </div>
          </div>
          <p className="px-[4.5cqw] pb-[2.4cqw] text-[2.6cqw] font-semibold text-ink-muted">
            Lucas-Cranach-Campus Kronach
          </p>
          <div className="brand-stripe h-[0.7cqw]" aria-hidden="true" />
        </header>

        {banner}

        <main className="flex min-h-0 flex-1 flex-col px-[4.5cqw] pt-[4cqw]">
          <h2 className="font-display text-[5.4cqw] font-bold">Mitteilungen</h2>
          <div className="mt-[3cqw] flex min-h-0 flex-1 flex-col gap-[3cqw] overflow-y-auto pb-[4cqw]">
            {items && items.length > 0 ? items.map((item) => <AnnouncementCard key={item.id} item={item} />) : emptyState}
          </div>
        </main>

        <footer className="border-t border-line bg-surface px-[4.5cqw] py-[2.4cqw] text-[2.1cqw] text-ink-muted">
          {footerNote ?? "Prototyp im Kurs Mensch-Maschine-Interaktion – keine offizielle Anzeige der Hochschule Coburg."}
        </footer>
      </div>
    </div>
  );
}

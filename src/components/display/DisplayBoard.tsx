"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { PublicAnnouncement } from "@/lib/announcements/schema.ts";
import { PUBLIC_TEXT, type Lang } from "@/lib/i18n/public.ts";
import { formatBerlinTime } from "@/lib/time/berlin.ts";
import { BoardLayout } from "./BoardLayout.tsx";

// Public kiosk client: polls the public API every POLL_MS without reloading
// the page. On failure the last known content stays visible, clearly marked
// as possibly outdated, and polling continues automatically.

export const POLL_MS = 5000;
const REQUEST_TIMEOUT_MS = 4000;

type Snapshot = { announcements: PublicAnnouncement[]; receivedAt: Date };

export function DisplayBoard({ lang, nav, languageSwitch }: { lang: Lang; nav?: ReactNode; languageSwitch?: ReactNode }) {
  const t = PUBLIC_TEXT[lang];
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [failed, setFailed] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const clockOffset = useRef(0);
  const loadNow = useRef<() => void>(() => {});

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let inFlight = false;
    let stopped = false;

    async function load() {
      if (inFlight || stopped) return;
      inFlight = true;
      clearTimeout(timer);
      try {
        const response = await fetch("/api/public/announcements", {
          cache: "no-store",
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as { serverTime: string; announcements: PublicAnnouncement[] };
        clockOffset.current = Date.parse(data.serverTime) - Date.now();
        if (!stopped) {
          setSnapshot({ announcements: data.announcements, receivedAt: new Date(data.serverTime) });
          setFailed(false);
        }
      } catch {
        if (!stopped) setFailed(true);
      } finally {
        inFlight = false;
        if (!stopped) timer = setTimeout(load, POLL_MS);
      }
    }

    loadNow.current = () => void load();
    void load();
    const onOnline = () => void load();
    window.addEventListener("online", onOnline);
    return () => {
      stopped = true;
      clearTimeout(timer);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  useEffect(() => {
    // Clock follows the server time (offset from the last response), not only the kiosk clock.
    const tick = () => setNow(new Date(Date.now() + clockOffset.current));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const retryButton = (
    <button
      type="button"
      onClick={() => loadNow.current()}
      className="min-h-[6cqw] min-w-[6cqw] touch-manipulation rounded-[1cqw] bg-ink px-[3cqw] py-[1.4cqw] text-[2.8cqw] font-semibold text-white active:bg-black"
    >
      {t.load.retry}
    </button>
  );

  let banner = null;
  let emptyState = null;

  if (!snapshot && !failed) {
    emptyState = (
      <p role="status" className="py-[8cqw] text-center text-[3.4cqw] text-ink-muted">
        {t.load.loading.announcements}
      </p>
    );
  } else if (!snapshot && failed) {
    emptyState = (
      <div role="alert" className="flex flex-col items-center gap-[3cqw] py-[8cqw] text-center">
        <p className="text-[3.6cqw] font-semibold">{t.load.failed.announcements}</p>
        <p className="text-[2.8cqw] text-ink-muted">{t.load.retrying}</p>
        {retryButton}
      </div>
    );
  } else {
    emptyState = (
      <div role="status" className="py-[8cqw] text-center">
        <p className="text-[3.6cqw] font-semibold">{t.board.empty}</p>
        <p className="mt-[1.5cqw] text-[2.8cqw] text-ink-muted">{t.board.emptyHint}</p>
      </div>
    );
    if (failed && snapshot) {
      banner = (
        <div
          role="alert"
          className="flex items-center justify-between gap-[3cqw] bg-warning-soft px-[4.5cqw] py-[2.4cqw] text-warning"
        >
          <p className="text-[2.8cqw] font-semibold">
            {t.load.stale(formatBerlinTime(snapshot.receivedAt))}
          </p>
          {retryButton}
        </div>
      );
    }
  }

  return (
    <div lang={lang} className="flex h-dvh w-full items-start justify-center bg-ink">
      {/* Portrait frame: fills a portrait screen; letterboxed on landscape devices. */}
      <div className="h-dvh w-[min(100vw,calc(100dvh*9/16))]" data-testid="display-board" data-stale={failed && !!snapshot}>
        <BoardLayout
          items={snapshot?.announcements ?? null}
          now={now}
          banner={banner}
          emptyState={emptyState}
          lang={lang}
          nav={nav}
          languageSwitch={languageSwitch}
        />
      </div>
    </div>
  );
}

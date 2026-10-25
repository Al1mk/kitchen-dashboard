"use client";

import { useEffect, useRef, useState } from "react";

// Polls a public JSON endpoint like the announcement display (ADR-011): every
// POLL_MS without reloading the page; on failure the last good data stays and
// is marked stale. Changing the URL (e.g. another day) starts a fresh load.

export const POLL_MS = 5000;
const REQUEST_TIMEOUT_MS = 4000;

type State<T> = { url: string; data: T | null; failed: boolean; receivedAt: Date | null };

export function usePolledJson<T extends { serverTime: string }>(url: string) {
  const [state, setState] = useState<State<T>>({ url, data: null, failed: false, receivedAt: null });
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
        const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as T;
        if (!stopped) setState({ url, data, failed: false, receivedAt: new Date(data.serverTime) });
      } catch {
        if (!stopped) setState((s) => (s.url === url ? { ...s, failed: true } : { url, data: null, failed: true, receivedAt: null }));
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
  }, [url]);

  // Data from a previous URL is never shown for the new one.
  const current = state.url === url ? state : { url, data: null, failed: false, receivedAt: null };
  return { ...current, retry: () => loadNow.current() };
}

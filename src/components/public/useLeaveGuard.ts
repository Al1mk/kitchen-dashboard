"use client";

import { useEffect, useState } from "react";

/**
 * While `active`, intercepts in-page link clicks (shared navigation, language
 * switch, Home, map, cancel) before Next.js handles them, and asks first.
 * Also asks the browser to confirm reload/close (best effort only: a forced
 * reload, closed tab or browser back cannot be prevented, and memory-only
 * credentials are then gone). Used by the booking flow while a request is in
 * flight or its outcome is unknown (T08).
 */
export function useLeaveGuard(active: boolean, allowLanguageSwitch = false) {
  const [blockedHref, setBlockedHref] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!link) return;
      // AP-02: a same-page DE/EN switch must not destroy a settled receipt.
      if (allowLanguageSwitch) {
        const target = new URL(link.getAttribute("href") ?? "", window.location.href);
        const current = new URL(window.location.href);
        const withoutLang = (url: URL) => {
          const query = new URLSearchParams(url.searchParams);
          query.delete("lang");
          query.sort();
          return query.toString();
        };
        if (target.origin === current.origin && target.pathname === current.pathname &&
            withoutLang(target) === withoutLang(current) &&
            target.searchParams.get("lang") !== current.searchParams.get("lang")) return;
      }
      // Capture phase on document: runs before React/Next.js, so the Link never navigates.
      event.preventDefault();
      event.stopPropagation();
      setBlockedHref(link.getAttribute("href"));
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [active, allowLanguageSwitch]);

  return {
    /** Link the visitor tried to follow; only meaningful while the guard is active. */
    blockedHref: active ? blockedHref : null,
    stay: () => setBlockedHref(null),
  };
}

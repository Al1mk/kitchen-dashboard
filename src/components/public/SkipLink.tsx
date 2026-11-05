"use client";

import { useEffect } from "react";

// First tab stop of every public page: jumps over the dock (which comes first in DOM and tab order although it
// is drawn at the bottom in kiosk mode) to <main id="main-content">. Off screen until it has keyboard focus.
//
// It stays a real link (works before hydration, shows in link lists), but its click is handled here instead of
// being a fragment navigation: no `#main-content` in the URL, no extra history entry, and the booking leave
// guard (useLeaveGuard, which asks before ANY link click while a request is pending or a receipt is shown) does
// not mistake an in-page skip for leaving the page. The window listener runs in the capture phase before the
// guard's document listener and marks the click as handled, which the guard already respects
// (`event.defaultPrevented`). docs/contracts.md C14.
export function SkipLink({ label }: { label: string }) {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a[data-skip-link]") : null;
      if (!link) return;
      event.preventDefault();
      document.getElementById("main-content")?.focus();
    };
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, []);

  return (
    <a
      href="#main-content"
      data-skip-link
      className="fixed top-4 left-4 z-[60] inline-flex min-h-14 -translate-y-[250%] items-center rounded-xl bg-ink px-5 text-lg font-bold text-white focus:translate-y-0"
    >
      {label}
    </a>
  );
}

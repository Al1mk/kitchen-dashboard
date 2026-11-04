"use client";

import { useEffect } from "react";
import { PUBLIC_KIOSK_MEDIA } from "@/lib/public-layout.ts";

/**
 * Publishes the real height of the fixed public dock as `--public-dock-h` on the root element, so the
 * page can reserve exactly that much space (bottom padding of the shell, `scroll-padding-bottom` for
 * keyboard focus and in-page jumps). The dock grows when labels wrap (English, narrow windows), so a
 * constant would let content slip under it. Renders nothing.
 *
 * Outside kiosk mode the dock is not fixed: the property is removed and nothing is reserved. Until this
 * runs, globals.css provides an estimate. Docs: docs/contracts.md C10.
 */
export function DockHeightSync() {
  useEffect(() => {
    const dock = document.querySelector<HTMLElement>("[data-public-dock]");
    if (!dock) return;
    const root = document.documentElement;
    const kiosk = window.matchMedia(PUBLIC_KIOSK_MEDIA);
    const sync = () => {
      if (kiosk.matches && getComputedStyle(dock).position === "fixed") {
        root.style.setProperty("--public-dock-h", `${Math.ceil(dock.getBoundingClientRect().height)}px`);
      } else {
        root.style.removeProperty("--public-dock-h");
      }
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(dock);
    kiosk.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      kiosk.removeEventListener("change", sync);
      root.style.removeProperty("--public-dock-h");
    };
  }, []);
  return null;
}

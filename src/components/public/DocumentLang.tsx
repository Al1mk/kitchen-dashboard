"use client";

import { useEffect } from "react";
import type { Lang } from "@/lib/i18n/public.ts";

// The root layout cannot read `?lang=` (layouts receive no search params and do not re-render on navigation), and
// the installed Next.js docs only give per-request `lang` through a `[lang]` path segment, which would rewrite
// every URL. So the page that knows its language keeps `<html lang>` in step after hydration. The server HTML
// of an English route therefore still says `lang="de"` until then; the wrapper element in PublicShell and
// DisplayBoard carries the correct `lang` from the first byte. docs/contracts.md C14.
const ROOT_DEFAULT: Lang = "de"; // the static value in src/app/layout.tsx

export function DocumentLang({ lang }: { lang: Lang }) {
  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    return () => {
      root.lang = ROOT_DEFAULT;
    };
  }, [lang]);
  return null;
}

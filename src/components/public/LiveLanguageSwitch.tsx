"use client";

import { useSearchParams } from "next/navigation";
import type { Lang } from "@/lib/i18n/public.ts";
import { LanguageSwitch } from "./PublicNav.tsx";

/**
 * Language switch for pages that change their own query string in the browser
 * (the /rooms search writes ?suche= and ?datum= with history.replaceState). The
 * listed keys are read from the current URL on every change, so switching the
 * language keeps the search as it is now, not as it was when the page loaded.
 * No prefetch: the target changes with every keystroke.
 */
export function LiveLanguageSwitch({ lang, path, keys }: { lang: Lang; path: string; keys: string[] }) {
  const searchParams = useSearchParams();
  const params = Object.fromEntries(keys.map((key) => [key, searchParams.get(key)]));
  return <LanguageSwitch lang={lang} path={path} params={params} prefetch={false} />;
}

import { AdminNav } from "@/components/admin/AdminNav.tsx";
import { LogoutButton } from "@/components/admin/LogoutButton.tsx";
import { requireAdmin } from "@/lib/auth/request.ts";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <a href="#inhalt" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-surface focus:p-3">
        Zum Inhalt springen
      </a>
      <aside className="flex flex-col gap-6 border-b border-line bg-surface p-5 lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element -- small static logo */}
          <img src="/brand/hs-coburg-logo-screenshot.png" alt="Hochschule Coburg" width={445} height={118} className="h-auto w-40" />
          <p className="mt-3 font-display text-lg font-bold leading-tight">Campus Board</p>
          <p className="text-sm text-ink-muted">Verwaltung</p>
        </div>
        <AdminNav />
        <a
          href="/display"
          target="_blank"
          rel="noopener"
          className="flex min-h-11 items-center rounded-lg px-3 font-semibold text-ink underline underline-offset-4 hover:bg-canvas"
        >
          Öffentliche Anzeige öffnen
          <span className="sr-only"> (neues Fenster)</span>
          <span aria-hidden="true">&nbsp;↗</span>
        </a>
        <div className="mt-auto flex flex-col gap-2 border-t border-line pt-4">
          <p className="text-sm text-ink-muted">
            Angemeldet als <span className="font-semibold text-ink">{session.username}</span>
          </p>
          <LogoutButton />
        </div>
      </aside>
      <main id="inhalt" className="min-w-0 flex-1 px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

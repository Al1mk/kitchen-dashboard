import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm.tsx";
import { getAdminSession } from "@/lib/auth/request.ts";
import { getAdminCredentials } from "@/lib/config.ts";

export const metadata: Metadata = { title: "Anmelden – Campus Board Verwaltung" };

export default async function LoginPage() {
  if (await getAdminSession()) redirect("/admin");
  const configured = getAdminCredentials() !== null;

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-lg">
        <div className="brand-stripe h-1.5" aria-hidden="true" />
        <div className="p-8">
          {/* eslint-disable-next-line @next/next/no-img-element -- small static logo */}
          <img src="/brand/hs-coburg-logo-screenshot.png" alt="Hochschule Coburg" width={445} height={118} className="h-auto w-44" />
          <h1 className="mt-6 font-display text-2xl font-bold">Campus Board – Verwaltung</h1>
          <p className="mt-1 text-ink-muted">Mitteilungen für den Bildschirm im Lucas-Cranach-Campus verwalten.</p>
          <div className="mt-6">
            {configured ? (
              <LoginForm />
            ) : (
              <p role="alert" className="rounded-lg bg-warning-soft px-4 py-3 font-semibold text-warning">
                Die Anmeldung ist noch nicht eingerichtet. Bitte zuerst <code>npm run admin:set-password</code> ausführen
                (siehe README).
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

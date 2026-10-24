"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
      });
      if (response.ok) {
        router.replace("/admin");
        router.refresh();
        return;
      }
      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      setError(data?.message ?? "Anmeldung fehlgeschlagen.");
    } catch {
      setError("Keine Verbindung zum Server. Bitte erneut versuchen.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      {error && (
        <p role="alert" className="rounded-lg bg-danger-soft px-4 py-3 font-semibold text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="username" className="font-semibold">
          Benutzername
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          required
          className="min-h-11 rounded-lg border border-line bg-surface px-3 text-base"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="font-semibold">
          Passwort
        </label>
        <div className="flex gap-2">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-base"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-pressed={showPassword}
            aria-controls="password"
            className="min-h-11 rounded-lg border border-line px-3 text-sm font-semibold hover:bg-canvas"
          >
            {showPassword ? "Verbergen" : "Anzeigen"}
          </button>
        </div>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="min-h-11 rounded-lg bg-brand px-4 font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
      >
        {busy ? "Anmeldung läuft …" : "Anmelden"}
      </button>
    </form>
  );
}

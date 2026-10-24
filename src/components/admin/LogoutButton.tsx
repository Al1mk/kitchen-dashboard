"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      className="min-h-11 w-full rounded-lg border border-line px-3 text-left font-semibold hover:bg-canvas disabled:opacity-60"
    >
      {busy ? "Abmelden …" : "Abmelden"}
    </button>
  );
}

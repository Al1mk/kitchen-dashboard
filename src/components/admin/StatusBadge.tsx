import type { AdminState } from "@/lib/announcements/policy.ts";

const STATE: Record<AdminState, { label: string; className: string }> = {
  draft: { label: "Entwurf", className: "bg-neutral-soft text-ink" },
  live: { label: "Öffentlich sichtbar", className: "bg-success-soft text-success" },
  scheduled: { label: "Geplant", className: "bg-info-soft text-info" },
  expired: { label: "Abgelaufen", className: "bg-neutral-soft text-ink-muted" },
  withdrawn: { label: "Zurückgezogen", className: "bg-neutral-soft text-ink-muted" },
};

export function stateLabel(state: AdminState): string {
  return STATE[state].label;
}

export function StatusBadge({ state, pending }: { state: AdminState; pending?: boolean }) {
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${STATE[state].className}`}>
        {STATE[state].label}
      </span>
      {pending && (
        <span className="rounded-full bg-warning-soft px-2.5 py-0.5 text-sm font-semibold text-warning">
          Änderungen nicht veröffentlicht
        </span>
      )}
    </span>
  );
}

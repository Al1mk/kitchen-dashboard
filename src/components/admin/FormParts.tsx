import type { ReactNode } from "react";

// Building blocks for the room and class-session forms: visible labels, hints
// and errors next to the field, wired up with aria-describedby.

type ControlProps = { id: string; "aria-invalid": boolean; "aria-describedby"?: string; className: string };

export function Field({
  id,
  label,
  required,
  hint,
  error,
  counter,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string[];
  counter?: string;
  children: (props: ControlProps) => ReactNode;
}) {
  const hasError = !!error?.length;
  const describedBy = [hint ? `${id}-hint` : null, hasError ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-semibold">
          {label} {required && <span aria-hidden="true">*</span>}
        </label>
        {counter && (
          <span className="text-sm text-ink-muted" aria-hidden="true">
            {counter}
          </span>
        )}
      </div>
      {children({
        id,
        "aria-invalid": hasError,
        "aria-describedby": describedBy,
        className: `min-h-11 w-full rounded-lg border bg-surface px-3 text-base ${hasError ? "border-danger" : "border-line"}`,
      })}
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-ink-muted">
          {hint}
        </p>
      )}
      {hasError && (
        <p id={`${id}-error`} className="text-sm font-semibold text-danger">
          {error!.join(" ")}
        </p>
      )}
    </div>
  );
}

export type FormMessageValue = { kind: "success" | "error"; text: string } | null;

export function FormMessage({ message }: { message: FormMessageValue }) {
  return (
    <div aria-live="polite">
      {message && (
        <p
          role={message.kind === "error" ? "alert" : "status"}
          className={`rounded-lg px-4 py-3 font-semibold ${message.kind === "error" ? "bg-danger-soft text-danger" : "bg-success-soft text-success"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}

/** Rooms and sessions have no draft step; the forms say so explicitly. */
export function LiveNotice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-info/30 bg-info-soft px-4 py-3 text-info">
      <span className="font-semibold">Hinweis:</span> {children}
    </p>
  );
}

export function Pill({ tone, children }: { tone: "neutral" | "muted" | "success" | "warning" | "danger" | "info"; children: ReactNode }) {
  const tones = {
    neutral: "bg-neutral-soft text-ink",
    muted: "bg-neutral-soft text-ink-muted",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
    info: "bg-info-soft text-info",
  };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-sm font-semibold ${tones[tone]}`}>{children}</span>;
}

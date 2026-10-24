"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

/** Accessible modal confirmation based on the native <dialog> element. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = "Abbrechen",
  tone = "danger",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "neutral";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="m-auto w-[min(92vw,30rem)] rounded-xl bg-surface p-0 text-ink shadow-xl backdrop:bg-ink/50"
    >
      <div className="p-6">
        <h2 id={titleId} className="font-display text-xl font-bold">
          {title}
        </h2>
        <div className="mt-3 text-base text-ink-muted">{children}</div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            className="min-h-11 rounded-lg border border-line bg-surface px-4 font-semibold hover:bg-canvas"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-11 rounded-lg px-4 font-semibold text-white ${
              tone === "danger" ? "bg-danger hover:bg-[#8f1c13]" : "bg-ink hover:bg-black"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

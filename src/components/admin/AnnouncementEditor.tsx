"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { AdminAnnouncement } from "@/lib/announcements/repository.ts";
import {
  BODY_MAX,
  CATEGORIES,
  CATEGORY_LABELS,
  TITLE_MAX,
  type AnnouncementContent,
  type Category,
  type FieldErrors,
} from "@/lib/announcements/schema.ts";
import { newRequestId } from "@/lib/request-id.ts";
import { berlinLocalToUtcIso, formatBerlinDateTime, utcIsoToBerlinLocal } from "@/lib/time/berlin.ts";
import { BoardLayout } from "../display/BoardLayout.tsx";
import { ConfirmDialog } from "./ConfirmDialog.tsx";
import { StatusBadge } from "./StatusBadge.tsx";

type FormValues = {
  title: string;
  body: string;
  category: Category;
  pinned: boolean;
  startsAt: string;
  endsAt: string;
};

type Message = { kind: "success" | "error"; text: string } | null;
type Busy = null | "save" | "publish" | "withdraw";

const EMPTY: FormValues = { title: "", body: "", category: "general", pinned: false, startsAt: "", endsAt: "" };

function toForm(content: AnnouncementContent): FormValues {
  return {
    title: content.title,
    body: content.body,
    category: content.category,
    pinned: content.pinned,
    startsAt: content.startsAt ? utcIsoToBerlinLocal(content.startsAt) : "",
    endsAt: content.endsAt ? utcIsoToBerlinLocal(content.endsAt) : "",
  };
}

function sameValues(a: FormValues, b: FormValues) {
  return (
    a.title.trim() === b.title.trim() &&
    a.body.trim() === b.body.trim() &&
    a.category === b.category &&
    a.pinned === b.pinned &&
    a.startsAt === b.startsAt &&
    a.endsAt === b.endsAt
  );
}

const PUBLISHED_HINT ="Die Mitteilung erscheint innerhalb von etwa 5 Sekunden auf dem Bildschirm.";

function publishedMessage(record: AdminAnnouncement): string {
  if (record.state === "scheduled" && record.published?.startsAt) {
    return `Veröffentlicht. Sichtbar ab ${formatBerlinDateTime(record.published.startsAt)} Uhr.`;
  }
  return `Veröffentlicht. ${PUBLISHED_HINT}`;
}

export function AnnouncementEditor({ initial, flash }: { initial: AdminAnnouncement | null; flash?: string }) {
  const router = useRouter();
  const ids = useId();
  const [record, setRecord] = useState<AdminAnnouncement | null>(initial);
  const [values, setValues] = useState<FormValues>(initial ? toForm(initial.draft) : EMPTY);
  const [saved, setSaved] = useState<FormValues>(initial ? toForm(initial.draft) : EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<Message>(flash ? { kind: "success", text: flash } : null);
  const [busy, setBusy] = useState<Busy>(null);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [requestId] = useState(newRequestId);
  const busyRef = useRef<Busy>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const dirty = !sameValues(values, saved);

  // Warn before leaving with unsaved changes: browser navigation and in-app links.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      setPendingHref(url.pathname + url.search);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function focusFirstError(fieldErrors: FieldErrors) {
    const order: (keyof FormValues)[] = ["title", "body", "category", "pinned", "startsAt", "endsAt"];
    const first = order.find((k) => fieldErrors[k]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }

  async function request(url: string, method: string, body?: unknown) {
    try {
      const response = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = (await response.json().catch(() => ({}))) as {
        announcement?: AdminAnnouncement;
        message?: string;
        fieldErrors?: FieldErrors;
      };
      return { ok: response.ok, status: response.status, data };
    } catch {
      return { ok: false, status: 0, data: {} as { message?: string; fieldErrors?: FieldErrors; announcement?: undefined } };
    }
  }

  function failure(status: number, data: { message?: string; fieldErrors?: FieldErrors }) {
    if (status === 0) {
      setMessage({ kind: "error", text: "Keine Verbindung zum Server. Nichts wurde gespeichert – bitte erneut versuchen." });
    } else if (status === 401) {
      setMessage({ kind: "error", text: "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich in einem neuen Tab erneut an und versuchen Sie es dann noch einmal." });
    } else {
      setMessage({ kind: "error", text: data.message ?? "Aktion fehlgeschlagen." });
    }
    if (data.fieldErrors) {
      setErrors(data.fieldErrors);
      focusFirstError(data.fieldErrors);
    }
  }

  /** Saves the current form as draft. Returns the saved record or null on failure. */
  async function saveDraft(): Promise<AdminAnnouncement | null> {
    const payload = { ...values, requestId };
    const result = record
      ? await request(`/api/admin/announcements/${record.id}`, "PUT", payload)
      : await request("/api/admin/announcements", "POST", payload);
    if (!result.ok || !result.data.announcement) {
      failure(result.status, result.data);
      return null;
    }
    const next = result.data.announcement;
    setRecord(next);
    setSaved(values);
    setErrors({});
    return next;
  }

  async function run(kind: Exclude<Busy, null>, action: () => Promise<void>) {
    if (busyRef.current) return; // reject duplicate in-flight submissions
    busyRef.current = kind;
    setBusy(kind);
    setMessage(null);
    try {
      await action();
    } finally {
      busyRef.current = null;
      setBusy(null);
    }
  }

  function onSave(event?: FormEvent) {
    event?.preventDefault();
    void run("save", async () => {
      const wasNew = !record;
      const next = await saveDraft();
      if (!next) return;
      if (wasNew) {
        setSaved(values);
        router.replace(`/admin/announcements/${next.id}?hinweis=gespeichert`);
        return;
      }
      setMessage({
        kind: "success",
        text: next.hasPendingChanges
          ? "Entwurf gespeichert. Auf dem Bildschirm ist weiterhin die zuletzt veröffentlichte Fassung zu sehen."
          : "Entwurf gespeichert. Auf dem Bildschirm ändert sich dadurch nichts.",
      });
      router.refresh();
    });
  }

  function onPublish() {
    void run("publish", async () => {
      const wasNew = !record;
      let current = record;
      if (!current || dirty) {
        current = await saveDraft();
        if (!current) return;
      }
      const result = await request(`/api/admin/announcements/${current.id}/publish`, "POST");
      if (!result.ok || !result.data.announcement) {
        failure(result.status, result.data);
        return;
      }
      setRecord(result.data.announcement);
      if (wasNew) {
        router.replace(`/admin/announcements/${current.id}?hinweis=veroeffentlicht`);
        return;
      }
      setMessage({ kind: "success", text: publishedMessage(result.data.announcement) });
      router.refresh();
    });
  }

  function onWithdraw() {
    setConfirmWithdraw(false);
    if (!record) return;
    void run("withdraw", async () => {
      const result = await request(`/api/admin/announcements/${record.id}/withdraw`, "POST");
      if (!result.ok || !result.data.announcement) {
        failure(result.status, result.data);
        return;
      }
      setRecord(result.data.announcement);
      setMessage({
        kind: "success",
        text: "Veröffentlichung zurückgenommen. Die Mitteilung verschwindet innerhalb von etwa 5 Sekunden vom Bildschirm. Der Inhalt bleibt als Entwurf erhalten.",
      });
      router.refresh();
    });
  }

  const isPublished = record?.status === "published";
  const nothingToPublish = isPublished && !dirty && !record?.hasPendingChanges;
  const publishLabel = isPublished ? "Änderungen veröffentlichen" : "Veröffentlichen";

  const previewEndsAt = values.endsAt ? berlinLocalToUtcIso(values.endsAt) : null;
  const previewItem = {
    id: record?.id ?? "neu",
    title: values.title.trim() || "Titel der Mitteilung",
    body: values.body.trim() || "Hier erscheint der Text der Mitteilung.",
    category: values.category,
    pinned: values.pinned,
    publishedAt: new Date(0).toISOString(),
    endsAt: previewEndsAt,
    isPreview: true,
  };

  const fieldId = (name: string) => `${ids}-${name}`;
  const errorText = (name: keyof FieldErrors) =>
    errors[name]?.length ? (
      <p id={fieldId(`${name}-error`)} className="text-sm font-semibold text-danger">
        {errors[name]!.join(" ")}
      </p>
    ) : null;
  const describedBy = (name: keyof FieldErrors, hint?: string) =>
    [hint, errors[name]?.length ? fieldId(`${name}-error`) : null].filter(Boolean).join(" ") || undefined;

  const inputClass = "min-h-11 w-full rounded-lg border bg-surface px-3 text-base";
  const borderFor = (name: keyof FieldErrors) => (errors[name]?.length ? "border-danger" : "border-line");

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <form ref={formRef} onSubmit={onSave} noValidate className="flex flex-col gap-6" aria-describedby={fieldId("status")}>
        <section
          id={fieldId("status")}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-5 py-4"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold">Status:</span>
            {record ? <StatusBadge state={record.state} pending={record.hasPendingChanges} /> : <span>Neu – noch nicht gespeichert</span>}
          </div>
          {dirty && <span className="text-sm font-semibold text-warning">Ungespeicherte Änderungen</span>}
        </section>

        <div aria-live="polite">
          {message && (
            <p
              role={message.kind === "error" ? "alert" : "status"}
              className={`rounded-lg px-4 py-3 font-semibold ${
                message.kind === "error" ? "bg-danger-soft text-danger" : "bg-success-soft text-success"
              }`}
            >
              {message.text}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <label htmlFor={fieldId("title")} className="font-semibold">
              Titel <span aria-hidden="true">*</span>
            </label>
            <span className="text-sm text-ink-muted" aria-hidden="true">
              {values.title.length} / {TITLE_MAX}
            </span>
          </div>
          <input
            id={fieldId("title")}
            name="title"
            value={values.title}
            onChange={(e) => update("title", e.target.value)}
            maxLength={TITLE_MAX + 20}
            required
            aria-invalid={!!errors.title?.length}
            aria-describedby={describedBy("title")}
            className={`${inputClass} ${borderFor("title")}`}
          />
          {errorText("title")}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <label htmlFor={fieldId("body")} className="font-semibold">
              Text <span aria-hidden="true">*</span>
            </label>
            <span className="text-sm text-ink-muted" aria-hidden="true">
              {values.body.length} / {BODY_MAX}
            </span>
          </div>
          <textarea
            id={fieldId("body")}
            name="body"
            value={values.body}
            onChange={(e) => update("body", e.target.value)}
            rows={6}
            required
            aria-invalid={!!errors.body?.length}
            aria-describedby={describedBy("body", fieldId("body-hint"))}
            className={`w-full rounded-lg border bg-surface px-3 py-2 text-base leading-relaxed ${borderFor("body")}`}
          />
          <p id={fieldId("body-hint")} className="text-sm text-ink-muted">
            Nur Text. Zeilenumbrüche werden übernommen.
          </p>
          {errorText("body")}
        </div>

        <fieldset className="flex flex-col gap-2" aria-describedby={describedBy("category")}>
          <legend className="mb-1.5 font-semibold">Kategorie</legend>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((category) => (
              <label
                key={category}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface px-4 has-[:checked]:border-ink has-[:checked]:bg-canvas"
              >
                <input
                  type="radio"
                  name="category"
                  value={category}
                  checked={values.category === category}
                  onChange={() => update("category", category)}
                  className="size-4 accent-[var(--brand-red)]"
                />
                {CATEGORY_LABELS[category]}
              </label>
            ))}
          </div>
          {errorText("category")}
        </fieldset>

        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            name="pinned"
            checked={values.pinned}
            onChange={(e) => update("pinned", e.target.checked)}
            className="size-5 accent-[var(--brand-red)]"
          />
          <span>
            <span className="font-semibold">Hervorheben</span>
            <span className="text-ink-muted"> – erscheint oben auf dem Bildschirm</span>
          </span>
        </label>

        <fieldset className="flex flex-col gap-3">
          <legend className="font-semibold">Zeitraum (optional)</legend>
          <p id={fieldId("time-hint")} className="text-sm text-ink-muted">
            Deutsche Zeit. Leer lassen = ab Veröffentlichung sichtbar bzw. ohne Ablaufdatum.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["startsAt", "endsAt"] as const).map((name) => (
              <div key={name} className="flex flex-col gap-1.5">
                <label htmlFor={fieldId(name)} className="font-semibold">
                  {name === "startsAt" ? "Sichtbar ab" : "Sichtbar bis"}
                </label>
                <div className="flex gap-2">
                  <input
                    id={fieldId(name)}
                    name={name}
                    type="datetime-local"
                    value={values[name]}
                    onChange={(e) => update(name, e.target.value)}
                    aria-invalid={!!errors[name]?.length}
                    aria-describedby={describedBy(name, fieldId("time-hint"))}
                    className={`${inputClass} ${borderFor(name)}`}
                  />
                  {values[name] && (
                    <button
                      type="button"
                      onClick={() => update(name, "")}
                      className="min-h-11 shrink-0 rounded-lg border border-line px-3 text-sm font-semibold hover:bg-canvas"
                      aria-label={`${name === "startsAt" ? "Sichtbar ab" : "Sichtbar bis"} leeren`}
                    >
                      Leeren
                    </button>
                  )}
                </div>
                {errorText(name)}
              </div>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
          <button
            type="submit"
            disabled={busy !== null}
            className="min-h-11 rounded-lg border border-ink bg-surface px-5 font-semibold hover:bg-canvas disabled:opacity-60"
          >
            {busy === "save" ? "Wird gespeichert …" : "Entwurf speichern"}
          </button>
          <button
            type="button"
            onClick={onPublish}
            disabled={busy !== null || nothingToPublish}
            className="min-h-11 rounded-lg bg-brand px-5 font-semibold text-white hover:bg-brand-strong disabled:opacity-50"
          >
            {busy === "publish" ? "Wird veröffentlicht …" : nothingToPublish ? "Aktuell veröffentlicht" : publishLabel}
          </button>
          {isPublished && (
            <button
              type="button"
              onClick={() => setConfirmWithdraw(true)}
              disabled={busy !== null}
              className="min-h-11 rounded-lg border border-danger px-5 font-semibold text-danger hover:bg-danger-soft disabled:opacity-60 sm:ml-auto"
            >
              {busy === "withdraw" ? "Wird zurückgenommen …" : "Veröffentlichung zurücknehmen"}
            </button>
          )}
        </div>
        {dirty && !busy && (
          <p className="-mt-3 text-sm text-ink-muted">
            „{publishLabel}“ speichert Ihre Änderungen und veröffentlicht sie in einem Schritt.
          </p>
        )}
      </form>

      <aside className="flex flex-col gap-4" aria-labelledby={fieldId("preview-title")}>
        <div>
          <h2 id={fieldId("preview-title")} className="font-display text-lg font-bold">
            Vorschau
          </h2>
          <p className="text-sm text-ink-muted">So erscheint der aktuelle Entwurf (inkl. ungespeicherter Änderungen). Nicht öffentlich.</p>
        </div>
        <div className="aspect-[9/16] w-full max-w-[22rem] overflow-hidden rounded-xl border-4 border-ink shadow-lg" aria-hidden="true">
          <BoardLayout items={[previewItem]} now={null} />
        </div>
        {record ? (
          <Link
            href={`/admin/announcements/${record.id}/preview`}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-surface px-4 font-semibold hover:bg-canvas"
          >
            Große Vorschau öffnen
          </Link>
        ) : (
          <p className="text-sm text-ink-muted">Die große Vorschau ist nach dem ersten Speichern verfügbar.</p>
        )}
        {record?.status === "published" && record.published && (
          <div className="rounded-xl border border-line bg-surface p-4 text-sm">
            <p className="font-semibold">Zurzeit veröffentlichte Fassung</p>
            <p className="mt-1 [overflow-wrap:anywhere]">„{record.published.title}“</p>
            {record.publishedAt && <p className="mt-1 text-ink-muted">Veröffentlicht am {formatBerlinDateTime(record.publishedAt)} Uhr</p>}
          </div>
        )}
      </aside>

      <ConfirmDialog
        open={confirmWithdraw}
        title="Veröffentlichung zurücknehmen?"
        confirmLabel="Zurücknehmen"
        onConfirm={onWithdraw}
        onCancel={() => setConfirmWithdraw(false)}
      >
        Die Mitteilung wird vom öffentlichen Bildschirm entfernt. Der Inhalt bleibt als Entwurf erhalten und kann später erneut
        veröffentlicht werden.
      </ConfirmDialog>

      <ConfirmDialog
        open={pendingHref !== null}
        title="Ungespeicherte Änderungen verwerfen?"
        confirmLabel="Verwerfen und verlassen"
        cancelLabel="Weiter bearbeiten"
        onConfirm={() => {
          const href = pendingHref!;
          setPendingHref(null);
          setSaved(values); // disarm the guard before navigating
          router.push(href);
        }}
        onCancel={() => setPendingHref(null)}
      >
        Ihre Änderungen an dieser Mitteilung wurden noch nicht gespeichert.
      </ConfirmDialog>
    </div>
  );
}

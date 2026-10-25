"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, type FormEvent } from "react";
import type { AdminRoom } from "@/lib/rooms/repository.ts";
import {
  FLOORS,
  ROOM_CODE_MAX,
  ROOM_DESCRIPTION_MAX,
  ROOM_NAME_MAX,
  ROOM_TYPE_LABELS,
  ROOM_TYPES,
  type RoomContent,
  type RoomFieldErrors,
} from "@/lib/rooms/schema.ts";
import { adminFetch, failureText } from "./adminFetch.ts";
import { ConfirmDialog } from "./ConfirmDialog.tsx";
import { Field, FormMessage, LiveNotice, Pill, type FormMessageValue } from "./FormParts.tsx";
import { useUnsavedChangesGuard } from "./useUnsavedChangesGuard.ts";

type Values = { code: string; name: string; floorId: string; type: string; description: string; reservable: boolean };
type Busy = null | "save" | "archive" | "restore";

const EMPTY: Values = { code: "", name: "", floorId: "", type: "", description: "", reservable: false };

const toValues = (room: RoomContent): Values => ({ ...room });

function same(a: Values, b: Values) {
  return (
    a.code.trim() === b.code.trim() &&
    a.name.trim() === b.name.trim() &&
    a.floorId === b.floorId &&
    a.type === b.type &&
    a.description.trim() === b.description.trim() &&
    a.reservable === b.reservable
  );
}

export function RoomForm({ initial, flash }: { initial: AdminRoom | null; flash?: string }) {
  const router = useRouter();
  const ids = useId();
  const [record, setRecord] = useState<AdminRoom | null>(initial);
  const [values, setValues] = useState<Values>(initial ? toValues(initial) : EMPTY);
  const [saved, setSaved] = useState<Values>(initial ? toValues(initial) : EMPTY);
  const [errors, setErrors] = useState<RoomFieldErrors>({});
  const [message, setMessage] = useState<FormMessageValue>(flash ? { kind: "success", text: flash } : null);
  const [busy, setBusy] = useState<Busy>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const busyRef = useRef<Busy>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const dirty = !same(values, saved);
  const { pendingHref, setPendingHref } = useUnsavedChangesGuard(dirty);
  const archived = !!record?.archivedAt;
  const id = (name: string) => `${ids}-${name}`;

  function update<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
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

  function onSave(event: FormEvent) {
    event.preventDefault();
    void run("save", async () => {
      const result = record
        ? await adminFetch<{ room: AdminRoom }>(`/api/admin/rooms/${record.id}`, "PUT", values)
        : await adminFetch<{ room: AdminRoom }>("/api/admin/rooms", "POST", values);
      if (!result.ok || !result.data.room) {
        setMessage({ kind: "error", text: failureText(result.status, result.data) });
        if (result.data.fieldErrors) {
          setErrors(result.data.fieldErrors);
          const first = (["code", "name", "floorId", "type", "description"] as const).find((k) => result.data.fieldErrors?.[k]);
          if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
        }
        return;
      }
      const room = result.data.room;
      setSaved(values);
      setErrors({});
      if (!record) {
        router.replace(`/admin/rooms/${room.id}?hinweis=gespeichert`);
        return;
      }
      setRecord(room);
      setMessage({ kind: "success", text: "Gespeichert. Die Änderungen sind jetzt öffentlich sichtbar." });
      router.refresh();
    });
  }

  function onArchive() {
    setConfirmArchive(false);
    if (!record) return;
    void run("archive", async () => {
      const result = await adminFetch<{ room: AdminRoom }>(`/api/admin/rooms/${record.id}/archive`, "POST");
      if (!result.ok || !result.data.room) {
        setMessage({ kind: "error", text: failureText(result.status, result.data) });
        return;
      }
      setRecord(result.data.room);
      setMessage({ kind: "success", text: "Raum archiviert. Er erscheint nicht mehr im öffentlichen Raumverzeichnis und kann keinen neuen Terminen zugeordnet werden." });
      router.refresh();
    });
  }

  function onRestore() {
    if (!record) return;
    void run("restore", async () => {
      const result = await adminFetch<{ room: AdminRoom }>(`/api/admin/rooms/${record.id}/restore`, "POST");
      if (!result.ok || !result.data.room) {
        setMessage({ kind: "error", text: failureText(result.status, result.data) });
        return;
      }
      setRecord(result.data.room);
      setMessage({ kind: "success", text: "Raum wiederhergestellt. Er ist wieder öffentlich sichtbar." });
      router.refresh();
    });
  }

  const codeChanged = !!record && values.code.trim() !== saved.code.trim();

  return (
    <form ref={formRef} onSubmit={onSave} noValidate className="flex max-w-3xl flex-col gap-6">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">Status:</span>
          {!record ? <span>Neu – noch nicht gespeichert</span> : archived ? <Pill tone="muted">Archiviert</Pill> : <Pill tone="success">Aktiv</Pill>}
          {record?.isDemo && <Pill tone="info">Beispieldaten</Pill>}
        </div>
        {dirty && <span className="text-sm font-semibold text-warning">Ungespeicherte Änderungen</span>}
      </section>

      <LiveNotice>Raumdaten haben keinen Entwurf. Nach dem Speichern sind Änderungen sofort im öffentlichen Raumverzeichnis und im Stundenplan sichtbar.</LiveNotice>

      <FormMessage message={message} />

      <div className="grid gap-6 sm:grid-cols-[12rem_minmax(0,1fr)]">
        <Field
          id={id("code")}
          label="Raumnummer"
          required
          error={errors.code}
          counter={`${values.code.length} / ${ROOM_CODE_MAX}`}
          hint={codeChanged ? "Die Raumnummer ist öffentlich sichtbar (und ggf. für die Karte wichtig). Termine bleiben mit dem Raum verknüpft." : "Wie am Türschild, z. B. „1.12“."}
        >
          {(p) => <input {...p} name="code" value={values.code} onChange={(e) => update("code", e.target.value)} maxLength={ROOM_CODE_MAX + 10} autoComplete="off" />}
        </Field>
        <Field id={id("name")} label="Name" required error={errors.name} counter={`${values.name.length} / ${ROOM_NAME_MAX}`}>
          {(p) => <input {...p} name="name" value={values.name} onChange={(e) => update("name", e.target.value)} maxLength={ROOM_NAME_MAX + 20} autoComplete="off" />}
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id={id("floorId")} label="Stockwerk" required error={errors.floorId}>
          {(p) => (
            <select {...p} name="floorId" value={values.floorId} onChange={(e) => update("floorId", e.target.value)}>
              <option value="">Bitte wählen …</option>
              {FLOORS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field id={id("type")} label="Raumart" required error={errors.type}>
          {(p) => (
            <select {...p} name="type" value={values.type} onChange={(e) => update("type", e.target.value)}>
              <option value="">Bitte wählen …</option>
              {ROOM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ROOM_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <Field
        id={id("description")}
        label="Beschreibung (optional)"
        error={errors.description}
        counter={`${values.description.length} / ${ROOM_DESCRIPTION_MAX}`}
        hint="Nur Text, z. B. Ausstattung oder Wegbeschreibung."
      >
        {(p) => (
          <textarea
            {...p}
            name="description"
            rows={4}
            value={values.description}
            onChange={(e) => update("description", e.target.value)}
            className={`${p.className} py-2 leading-relaxed`}
          />
        )}
      </Field>

      <label className="flex min-h-11 cursor-pointer items-center gap-3">
        <input type="checkbox" name="reservable" checked={values.reservable} onChange={(e) => update("reservable", e.target.checked)} className="size-5 accent-[var(--brand-red)]" />
        <span>
          <span className="font-semibold">Reservierbar</span>
          <span className="text-ink-muted"> – für die spätere Reservierungsfunktion vorgemerkt (noch nicht verfügbar)</span>
        </span>
      </label>
      {errors.reservable && <p className="-mt-4 text-sm font-semibold text-danger">{errors.reservable.join(" ")}</p>}

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
        <button type="submit" disabled={busy !== null} className="min-h-11 rounded-lg bg-brand px-5 font-semibold text-white hover:bg-brand-strong disabled:opacity-60">
          {busy === "save" ? "Wird gespeichert …" : record ? "Änderungen speichern" : "Raum anlegen"}
        </button>
        {record && (
          <Link href={`/admin/schedule?raum=${record.id}`} className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 font-semibold hover:bg-canvas">
            Termine in diesem Raum ({record.upcomingSessions} geplant)
          </Link>
        )}
        {record && !archived && (
          <button
            type="button"
            onClick={() => setConfirmArchive(true)}
            disabled={busy !== null}
            className="min-h-11 rounded-lg border border-danger px-5 font-semibold text-danger hover:bg-danger-soft disabled:opacity-60 sm:ml-auto"
          >
            {busy === "archive" ? "Wird archiviert …" : "Raum archivieren"}
          </button>
        )}
        {record && archived && (
          <button type="button" onClick={onRestore} disabled={busy !== null} className="min-h-11 rounded-lg border border-ink px-5 font-semibold hover:bg-canvas disabled:opacity-60 sm:ml-auto">
            {busy === "restore" ? "Wird wiederhergestellt …" : "Raum wiederherstellen"}
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmArchive}
        title="Raum archivieren?"
        confirmLabel="Archivieren"
        onConfirm={onArchive}
        onCancel={() => setConfirmArchive(false)}
      >
        <p>
          „{record?.code} – {record?.name}“ verschwindet aus dem öffentlichen Raumverzeichnis und kann keinen neuen Terminen zugeordnet werden. Vergangene Termine
          bleiben erhalten. Das ist nur möglich, wenn keine Termine mehr geplant sind. Sie können den Raum später wiederherstellen.
        </p>
      </ConfirmDialog>
      <ConfirmDialog
        open={pendingHref !== null}
        title="Ungespeicherte Änderungen verwerfen?"
        confirmLabel="Verwerfen und verlassen"
        cancelLabel="Weiter bearbeiten"
        onConfirm={() => {
          const href = pendingHref!;
          setSaved(values);
          setPendingHref(null);
          router.push(href);
        }}
        onCancel={() => setPendingHref(null)}
      >
        <p>Ihre Änderungen an diesem Raum wurden noch nicht gespeichert.</p>
      </ConfirmDialog>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, type FormEvent } from "react";
import { newRequestId } from "@/lib/request-id.ts";
import { FLOORS, type FloorId } from "@/lib/rooms/schema.ts";
import type { AdminClassSession } from "@/lib/sessions/repository.ts";
import { COHORT_MAX, INSTRUCTOR_MAX, SESSION_TITLE_MAX, termForDate, termOptions, type SessionFieldErrors } from "@/lib/sessions/schema.ts";
import { formatBerlinDateTime, isCalendarDate, utcIsoToBerlinLocal } from "@/lib/time/berlin.ts";
import { adminFetch, failureText } from "./adminFetch.ts";
import { ConfirmDialog } from "./ConfirmDialog.tsx";
import { Field, FormMessage, LiveNotice, Pill, type FormMessageValue } from "./FormParts.tsx";
import { useUnsavedChangesGuard } from "./useUnsavedChangesGuard.ts";

export type RoomOption = { id: string; code: string; name: string; floorId: FloorId; archived: boolean };

type Values = { title: string; instructor: string; cohort: string; term: string; roomId: string; date: string; startTime: string; endTime: string };
type Busy = null | "save" | "cancel" | "reinstate";

const FIELD_ORDER = ["title", "instructor", "cohort", "term", "roomId", "date", "startTime", "endTime"] as const;

function toValues(session: AdminClassSession): Values {
  const start = utcIsoToBerlinLocal(session.startsAt);
  return {
    title: session.title,
    instructor: session.instructor,
    cohort: session.cohort,
    term: session.term,
    roomId: session.roomId,
    date: start.slice(0, 10),
    startTime: start.slice(11),
    endTime: utcIsoToBerlinLocal(session.endsAt).slice(11),
  };
}

const same = (a: Values, b: Values) => FIELD_ORDER.every((k) => a[k].trim() === b[k].trim());

export function SessionForm({
  initial,
  rooms,
  defaults,
  flash,
}: {
  initial: AdminClassSession | null;
  rooms: RoomOption[];
  defaults: { date: string; roomId: string };
  flash?: string;
}) {
  const router = useRouter();
  const ids = useId();
  const empty: Values = {
    title: "",
    instructor: "",
    cohort: "",
    term: termForDate(defaults.date),
    roomId: defaults.roomId,
    date: defaults.date,
    startTime: "",
    endTime: "",
  };
  const [record, setRecord] = useState<AdminClassSession | null>(initial);
  const [values, setValues] = useState<Values>(initial ? toValues(initial) : empty);
  const [saved, setSaved] = useState<Values>(initial ? toValues(initial) : empty);
  const [termTouched, setTermTouched] = useState(!!initial);
  const [errors, setErrors] = useState<SessionFieldErrors>({});
  const [message, setMessage] = useState<FormMessageValue>(flash ? { kind: "success", text: flash } : null);
  const [busy, setBusy] = useState<Busy>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [requestId] = useState(newRequestId);
  const busyRef = useRef<Busy>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const dirty = !same(values, saved);
  const { pendingHref, setPendingHref } = useUnsavedChangesGuard(dirty);
  const cancelled = record?.status === "cancelled";
  const id = (name: string) => `${ids}-${name}`;

  function update<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((v) => {
      const next = { ...v, [key]: value };
      // Follow the date with the suggested term until the admin picks one.
      if (key === "date" && !termTouched && isCalendarDate(value)) next.term = termForDate(value);
      return next;
    });
    if (key === "term") setTermTouched(true);
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

  function showFailure(status: number, data: { message?: string; fieldErrors?: Record<string, string[]> }) {
    setMessage({ kind: "error", text: failureText(status, data) });
    if (data.fieldErrors) {
      setErrors(data.fieldErrors);
      const first = FIELD_ORDER.find((k) => data.fieldErrors?.[k]);
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    }
  }

  function onSave(event: FormEvent) {
    event.preventDefault();
    void run("save", async () => {
      const result = record
        ? await adminFetch<{ session: AdminClassSession }>(`/api/admin/sessions/${record.id}`, "PUT", values)
        : await adminFetch<{ session: AdminClassSession }>("/api/admin/sessions", "POST", { ...values, requestId });
      if (!result.ok || !result.data.session) {
        showFailure(result.status, result.data);
        return;
      }
      setSaved(values);
      setErrors({});
      if (!record) {
        router.replace(`/admin/schedule/${result.data.session.id}?hinweis=gespeichert`);
        return;
      }
      setRecord(result.data.session);
      setMessage({ kind: "success", text: "Gespeichert. Die Änderungen sind jetzt im öffentlichen Stundenplan sichtbar." });
      router.refresh();
    });
  }

  function onCancelSession() {
    setConfirmCancel(false);
    if (!record) return;
    void run("cancel", async () => {
      const result = await adminFetch<{ session: AdminClassSession }>(`/api/admin/sessions/${record.id}/cancel`, "POST");
      if (!result.ok || !result.data.session) return showFailure(result.status, result.data);
      setRecord(result.data.session);
      setMessage({ kind: "success", text: "Termin abgesagt. Er bleibt im öffentlichen Stundenplan sichtbar, markiert als „Entfällt“." });
      router.refresh();
    });
  }

  function onReinstate() {
    if (!record) return;
    void run("reinstate", async () => {
      const result = await adminFetch<{ session: AdminClassSession }>(`/api/admin/sessions/${record.id}/reinstate`, "POST");
      if (!result.ok || !result.data.session) return showFailure(result.status, result.data);
      setRecord(result.data.session);
      setMessage({ kind: "success", text: "Absage zurückgenommen. Der Termin findet laut Stundenplan wieder statt." });
      router.refresh();
    });
  }

  const terms = termOptions(isCalendarDate(values.date) ? values.date : defaults.date);
  if (values.term && !terms.includes(values.term)) terms.push(values.term);
  const selectable = rooms.filter((r) => !r.archived || r.id === values.roomId);

  return (
    <form ref={formRef} onSubmit={onSave} noValidate className="flex max-w-3xl flex-col gap-6">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">Status:</span>
          {!record ? <span>Neu – noch nicht gespeichert</span> : cancelled ? <Pill tone="danger">Abgesagt</Pill> : <Pill tone="success">Geplant</Pill>}
          {record?.isDemo && <Pill tone="info">Beispieldaten</Pill>}
          {record?.cancelledAt && <span className="text-sm text-ink-muted">seit {formatBerlinDateTime(record.cancelledAt)}</span>}
        </div>
        {dirty && <span className="text-sm font-semibold text-warning">Ungespeicherte Änderungen</span>}
      </section>

      <LiveNotice>Termine haben keinen Entwurf. Nach dem Speichern sind Änderungen sofort im öffentlichen Stundenplan sichtbar.</LiveNotice>

      <FormMessage message={message} />

      <Field id={id("title")} label="Lehrveranstaltung / Modul" required error={errors.title} counter={`${values.title.length} / ${SESSION_TITLE_MAX}`}>
        {(p) => <input {...p} name="title" value={values.title} onChange={(e) => update("title", e.target.value)} maxLength={SESSION_TITLE_MAX + 20} />}
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id={id("instructor")} label="Lehrperson" required error={errors.instructor} counter={`${values.instructor.length} / ${INSTRUCTOR_MAX}`}>
          {(p) => <input {...p} name="instructor" value={values.instructor} onChange={(e) => update("instructor", e.target.value)} maxLength={INSTRUCTOR_MAX + 20} />}
        </Field>
        <Field
          id={id("cohort")}
          label="Studiengang / Semester"
          required
          error={errors.cohort}
          counter={`${values.cohort.length} / ${COHORT_MAX}`}
          hint="z. B. „Wirtschaftsinformatik 2.0, 1. Semester“"
        >
          {(p) => <input {...p} name="cohort" value={values.cohort} onChange={(e) => update("cohort", e.target.value)} maxLength={COHORT_MAX + 20} />}
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id={id("roomId")} label="Raum" required error={errors.roomId}>
          {(p) => (
            <select {...p} name="roomId" value={values.roomId} onChange={(e) => update("roomId", e.target.value)}>
              <option value="">Bitte wählen …</option>
              {FLOORS.map((floor) => {
                const options = selectable.filter((r) => r.floorId === floor.id);
                return options.length ? (
                  <optgroup key={floor.id} label={floor.label}>
                    {options.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.code} – {r.name}
                        {r.archived ? " (archiviert)" : ""}
                      </option>
                    ))}
                  </optgroup>
                ) : null;
              })}
            </select>
          )}
        </Field>
        <Field id={id("term")} label="Semester (Studienjahr)" required error={errors.term} hint="Wird aus dem Datum vorgeschlagen.">
          {(p) => (
            <select {...p} name="term" value={values.term} onChange={(e) => update("term", e.target.value)}>
              {terms.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="font-semibold">Datum und Uhrzeit</legend>
        <p className="-mt-2 text-sm text-ink-muted">Deutsche Zeit. Ein Termin beginnt und endet am selben Tag.</p>
        <div className="grid gap-6 sm:grid-cols-3">
          <Field id={id("date")} label="Datum" required error={errors.date}>
            {(p) => <input {...p} type="date" name="date" value={values.date} onChange={(e) => update("date", e.target.value)} />}
          </Field>
          <Field id={id("startTime")} label="Beginn" required error={errors.startTime}>
            {(p) => <input {...p} type="time" name="startTime" value={values.startTime} onChange={(e) => update("startTime", e.target.value)} />}
          </Field>
          <Field id={id("endTime")} label="Ende" required error={errors.endTime}>
            {(p) => <input {...p} type="time" name="endTime" value={values.endTime} onChange={(e) => update("endTime", e.target.value)} />}
          </Field>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
        <button type="submit" disabled={busy !== null} className="min-h-11 rounded-lg bg-brand px-5 font-semibold text-white hover:bg-brand-strong disabled:opacity-60">
          {busy === "save" ? "Wird gespeichert …" : record ? "Änderungen speichern" : "Termin anlegen"}
        </button>
        {record && !cancelled && (
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            disabled={busy !== null}
            className="min-h-11 rounded-lg border border-danger px-5 font-semibold text-danger hover:bg-danger-soft disabled:opacity-60 sm:ml-auto"
          >
            {busy === "cancel" ? "Wird abgesagt …" : "Termin absagen"}
          </button>
        )}
        {record && cancelled && (
          <button type="button" onClick={onReinstate} disabled={busy !== null} className="min-h-11 rounded-lg border border-ink px-5 font-semibold hover:bg-canvas disabled:opacity-60 sm:ml-auto">
            {busy === "reinstate" ? "Wird zurückgenommen …" : "Absage zurücknehmen"}
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title="Termin absagen?"
        confirmLabel="Termin absagen"
        onConfirm={onCancelSession}
        onCancel={() => setConfirmCancel(false)}
      >
        <p>
          „{record?.title}“ wird im öffentlichen Stundenplan als „Entfällt“ angezeigt. Der Raum wird für diesen Zeitraum wieder frei. Die Absage lässt sich
          zurücknehmen.
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
        <p>Ihre Änderungen an diesem Termin wurden noch nicht gespeichert.</p>
      </ConfirmDialog>
    </form>
  );
}

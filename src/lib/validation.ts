import type { z } from "zod";

/** Field name → German messages; "form" holds errors that belong to no single field. */
export type FieldErrorMap<K extends string> = Partial<Record<K | "form", string[]>>;

export function toFieldErrors<K extends string>(issues: z.core.$ZodIssue[]): FieldErrorMap<K> {
  const fieldErrors: FieldErrorMap<K> = {};
  for (const issue of issues) {
    const key = (issue.path[0] as K | undefined) ?? "form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  if (Object.keys(fieldErrors).length === 0) fieldErrors.form = ["Ungültige Eingabe."];
  return fieldErrors;
}

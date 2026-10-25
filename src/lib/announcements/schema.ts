import { z } from "zod";
import { berlinLocalToUtcIso } from "../time/berlin.ts";

// Shared announcement contract. Safe to import from client and server code.

export const CATEGORIES = ["general", "event", "important"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  general: "Allgemein",
  event: "Veranstaltung",
  important: "Wichtig",
};

export const TITLE_MAX = 120;
export const BODY_MAX = 1200;

/** Stored content of one revision (draft or published). Times are UTC ISO or null. */
export type AnnouncementContent = {
  title: string;
  body: string;
  category: Category;
  pinned: boolean;
  startsAt: string | null;
  endsAt: string | null;
  /** Optional English version for the public English interface; "" = none (German is shown instead). */
  titleEn: string;
  bodyEn: string;
};

export type AnnouncementStatus = "draft" | "published" | "withdrawn";

/** Public projection: the only fields the display (or anyone anonymous) receives. */
export type PublicAnnouncement = {
  id: string;
  title: string;
  body: string;
  category: Category;
  pinned: boolean;
  publishedAt: string;
  endsAt: string | null;
  /** null = no English version; the English interface shows the German text and says so. */
  titleEn: string | null;
  bodyEn: string | null;
};

const localDateTime = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value, ctx) => {
    if (value === undefined || value === null || value.trim() === "") return null;
    const iso = berlinLocalToUtcIso(value.trim());
    if (!iso) {
      ctx.addIssue({ code: "custom", message: "Bitte ein gültiges Datum mit Uhrzeit angeben." });
      return z.NEVER;
    }
    return iso;
  });

const inputSchema = z
  .object({
    title: z
      .string({ error: "Bitte einen Titel eingeben." })
      .trim()
      .min(1, "Bitte einen Titel eingeben.")
      .max(TITLE_MAX, `Der Titel darf höchstens ${TITLE_MAX} Zeichen lang sein.`),
    body: z
      .string({ error: "Bitte einen Text eingeben." })
      .trim()
      .min(1, "Bitte einen Text eingeben.")
      .max(BODY_MAX, `Der Text darf höchstens ${BODY_MAX} Zeichen lang sein.`),
    category: z.enum(CATEGORIES, { error: "Bitte eine gültige Kategorie wählen." }),
    pinned: z.boolean({ error: "Ungültiger Wert für „Hervorheben“." }),
    startsAt: localDateTime,
    endsAt: localDateTime,
    titleEn: z
      .string({ error: "Ungültiger englischer Titel." })
      .trim()
      .max(TITLE_MAX, `Der englische Titel darf höchstens ${TITLE_MAX} Zeichen lang sein.`)
      .optional()
      .default(""),
    bodyEn: z
      .string({ error: "Ungültiger englischer Text." })
      .trim()
      .max(BODY_MAX, `Der englische Text darf höchstens ${BODY_MAX} Zeichen lang sein.`)
      .optional()
      .default(""),
  })
  .superRefine((value, ctx) => {
    if (value.startsAt && value.endsAt && value.endsAt <= value.startsAt) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "„Sichtbar bis“ muss nach „Sichtbar ab“ liegen.",
      });
    }
  });

/** Admin form input: times are Berlin wall-clock strings ("YYYY-MM-DDTHH:mm") or empty. */
export type AnnouncementInput = z.input<typeof inputSchema>;

export type FieldErrors = Partial<Record<keyof AnnouncementContent | "form", string[]>>;

export type ParseResult =
  | { ok: true; content: AnnouncementContent }
  | { ok: false; fieldErrors: FieldErrors };

export function parseAnnouncementInput(raw: unknown): ParseResult {
  const result = inputSchema.safeParse(raw);
  if (result.success) {
    const v = result.data;
    // Fixed key order keeps stored JSON comparable between draft and published.
    return {
      ok: true,
      content: {
        title: v.title,
        body: v.body,
        category: v.category,
        pinned: v.pinned,
        startsAt: v.startsAt,
        endsAt: v.endsAt,
        titleEn: v.titleEn,
        bodyEn: v.bodyEn,
      },
    };
  }
  const fieldErrors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = (issue.path[0] as keyof FieldErrors | undefined) ?? "form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  if (Object.keys(fieldErrors).length === 0) fieldErrors.form = ["Ungültige Eingabe."];
  return { ok: false, fieldErrors };
}

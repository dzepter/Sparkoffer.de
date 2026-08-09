/**
 * Zod-Schemas für App- und Admin-Formulare.
 * Feldnamen camelCase (Client), CSV-Import snake_case (Dateiformat).
 */
import { z } from "zod";

/* ------------------------------ Bausteine ----------------------------- */

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Bitte eine gültige E-Mail-Adresse angeben");

/** Passwort-Mindestlänge lt. Vorgabe: 10 Zeichen. */
const passwordSchema = z
  .string()
  .min(10, "Das Passwort muss mindestens 10 Zeichen lang sein");

const uuid = z.string().uuid();
const dateString = z.string().date("Datum im Format JJJJ-MM-TT erwartet");
const dateTimeString = z.string().datetime({ offset: true, message: "Zeitstempel (ISO 8601 mit Zeitzone) erwartet" });
const nonEmpty = (msg: string) => z.string().trim().min(1, msg);

const memberRoleSchema = z.enum(["org_admin", "trainer", "participant"]);
const orgStatusSchema = z.enum(["active", "inactive", "archived"]);
const visibilitySchema = z.enum(["private", "trainer"]);
const planItemStatusSchema = z.enum(["planned", "started", "implemented", "reflected"]);

/* -------------------------------- Auth -------------------------------- */

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Passwort erforderlich"),
});

/** Einladung annehmen: Passwort setzen + Datenschutz-Einwilligung (Pflicht). */
export const invitationAcceptSchema = z
  .object({
    token: nonEmpty("Einladungstoken erforderlich"),
    firstName: nonEmpty("Vorname erforderlich"),
    lastName: nonEmpty("Nachname erforderlich"),
    password: passwordSchema,
    passwordConfirm: z.string(),
    consentPrivacy: z.literal(true, {
      errorMap: () => ({ message: "Die Datenschutzerklärung muss akzeptiert werden" }),
    }),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    message: "Die Passwörter stimmen nicht überein",
    path: ["passwordConfirm"],
  });

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Aktuelles Passwort erforderlich"),
    newPassword: passwordSchema,
    newPasswordConfirm: z.string(),
  })
  .refine((v) => v.newPassword === v.newPasswordConfirm, {
    message: "Die Passwörter stimmen nicht überein",
    path: ["newPasswordConfirm"],
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: "Das neue Passwort muss sich vom aktuellen unterscheiden",
    path: ["newPassword"],
  });

/* ------------------------------ Admin/Orga ---------------------------- */

export const organizationSchema = z.object({
  name: nonEmpty("Name erforderlich"),
  shortName: z.string().trim().optional(),
  contactName: z.string().trim().optional(),
  contactEmail: emailSchema.optional(),
  contactPhone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  status: orgStatusSchema.default("active"),
  internalNotes: z.string().optional(),
});

export const cohortSchema = z
  .object({
    organizationId: uuid,
    programId: uuid,
    name: nonEmpty("Name erforderlich"),
    startDate: dateString.optional(),
    endDate: dateString.optional(),
    status: orgStatusSchema.default("active"),
  })
  .refine(
    (v) => v.startDate === undefined || v.endDate === undefined || v.startDate <= v.endDate,
    { message: "Enddatum darf nicht vor dem Startdatum liegen", path: ["endDate"] },
  );

/** Präsenztermin (cohort_sessions). */
export const sessionSchema = z
  .object({
    cohortId: uuid,
    moduleId: uuid.optional(),
    title: nonEmpty("Titel erforderlich"),
    startsAt: dateTimeString,
    endsAt: dateTimeString.optional(),
    timezone: z.string().min(1).default("Europe/Berlin"),
    venue: z.string().trim().optional(),
    address: z.string().trim().optional(),
    room: z.string().trim().optional(),
    trainerProfileId: uuid.optional(),
    notes: z.string().optional(),
    directions: z.string().optional(),
  })
  .refine(
    (v) => v.endsAt === undefined || new Date(v.endsAt) > new Date(v.startsAt),
    { message: "Ende muss nach dem Beginn liegen", path: ["endsAt"] },
  );

export const invitationCreateSchema = z.object({
  email: emailSchema,
  organizationId: uuid,
  cohortId: uuid.optional(),
  role: memberRoleSchema.default("participant"),
});

/* ------------------------------ Teilnehmer ----------------------------- */

/** Antwort auf einen Reflexionsblock. */
export const reflectionAnswerSchema = z.object({
  contentBlockId: uuid,
  cohortId: uuid,
  body: nonEmpty("Die Antwort darf nicht leer sein"),
  visibility: visibilitySchema.default("private"),
});

/** Abgabe zu einer Transferaufgabe: Text und/oder Datei, mind. eines. */
export const submissionSchema = z
  .object({
    contentBlockId: uuid,
    cohortId: uuid,
    noteText: z.string().trim().optional(),
    filePath: z.string().min(1).optional(),
    visibility: visibilitySchema.default("private"),
  })
  .refine((v) => (v.noteText !== undefined && v.noteText.length > 0) || v.filePath !== undefined, {
    message: "Text oder Datei erforderlich",
    path: ["noteText"],
  });

/** Eintrag im Umsetzungs-/90-Tage-Plan (action_plan_items). */
export const actionPlanItemSchema = z.object({
  position: z.number().int().min(0).optional(),
  insight: z.string().trim().optional(),
  behavior: z.string().trim().optional(),
  action: nonEmpty("Maßnahme erforderlich"),
  team: z.string().trim().optional(),
  result: z.string().trim().optional(),
  status: planItemStatusSchema.default("planned"),
  dueAt: dateTimeString.optional(),
});

/** Antwort auf eine einzelne Quizfrage, diskriminiert nach question_kind. */
export const quizAttemptAnswerSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("single"), questionId: uuid, optionId: uuid }),
  z.object({
    kind: z.literal("multiple"),
    questionId: uuid,
    optionIds: z.array(uuid).min(1, "Mindestens eine Option wählen"),
  }),
  z.object({ kind: z.literal("truefalse"), questionId: uuid, value: z.boolean() }),
  z.object({
    kind: z.literal("freetext"),
    questionId: uuid,
    text: nonEmpty("Antwort darf nicht leer sein"),
  }),
]);

/* ------------------------------ CSV-Import ----------------------------- */

/** Eine Zeile des Teilnehmer-CSV-Imports (Spalten wie im Dateiformat). */
export const csvParticipantRowSchema = z.object({
  first_name: nonEmpty("Vorname erforderlich"),
  last_name: nonEmpty("Nachname erforderlich"),
  email: emailSchema,
});

/* -------------------------------- Typen -------------------------------- */

export type LoginInput = z.infer<typeof loginSchema>;
export type InvitationAcceptInput = z.infer<typeof invitationAcceptSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type OrganizationInput = z.infer<typeof organizationSchema>;
export type CohortInput = z.infer<typeof cohortSchema>;
export type SessionInput = z.infer<typeof sessionSchema>;
export type InvitationCreateInput = z.infer<typeof invitationCreateSchema>;
export type ReflectionAnswerInput = z.infer<typeof reflectionAnswerSchema>;
export type SubmissionInput = z.infer<typeof submissionSchema>;
export type ActionPlanItemInput = z.infer<typeof actionPlanItemSchema>;
export type QuizAttemptAnswerInput = z.infer<typeof quizAttemptAnswerSchema>;
export type CsvParticipantRow = z.infer<typeof csvParticipantRowSchema>;

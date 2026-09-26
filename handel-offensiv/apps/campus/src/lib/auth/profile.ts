/**
 * Fachliche Konstanten und Schemas fuer den Bereich /profil.
 * (Server- und Client-tauglich: keine Server-Imports.)
 */

import { z } from "zod";

import { NOTIFICATION_KINDS, type DeletionStatus, type NotificationKind } from "@handel-offensiv/types";

/* --------------------------- Benachrichtigungen --------------------------- */

export { NOTIFICATION_KINDS };

export const NOTIFICATION_KIND_LABELS: Record<NotificationKind, string> = {
  release: "Neue Freischaltungen",
  session_reminder: "Erinnerung an Offensivtage",
  task_due: "Fällige Aufgaben",
  announcement: "Nachrichten der Trainer",
  feedback: "Trainer-Feedback",
};

/** Kanaele, die der Campus verwaltet (Push kommt spaeter ueber Web-Push). */
export type NotificationChannel = "in_app" | "email";
export const NOTIFICATION_CHANNELS: NotificationChannel[] = ["in_app", "email"];
export const NOTIFICATION_CHANNEL_LABELS: Record<NotificationChannel, string> = {
  in_app: "Im Campus",
  email: "Per E-Mail",
};

/**
 * Voreinstellung, wenn noch keine Zeile in notification_preferences existiert:
 * im Campus an, E-Mail als Opt-in (IMPLEMENTATION_PLAN Phase 6).
 */
export const NOTIFICATION_DEFAULTS: Record<NotificationChannel, boolean> = { in_app: true, email: false };

/** Feldname einer Checkbox im Formular. */
export function preferenceFieldName(kind: NotificationKind, channel: NotificationChannel): string {
  return `pref__${kind}__${channel}`;
}

/* ------------------------------ Loeschantrag ------------------------------ */

export const DELETION_STATUS_LABELS: Record<DeletionStatus, string> = {
  requested: "Eingegangen",
  confirmed: "Bestätigt",
  processing: "In Bearbeitung",
  done: "Abgeschlossen",
  rejected: "Abgelehnt",
};

/* --------------------------------- Schemas -------------------------------- */

const nameField = (msg: string) => z.string().trim().min(1, msg).max(100, "Bitte höchstens 100 Zeichen.");

export const profileNameSchema = z.object({
  firstName: nameField("Bitte geben Sie Ihren Vornamen an."),
  lastName: nameField("Bitte geben Sie Ihren Nachnamen an."),
});

export const cohortSwitchSchema = z.object({
  cohortId: z.string().uuid("Bitte wählen Sie eine Gruppe."),
});

export const accountDeletionSchema = z.object({
  reason: z.string().trim().max(1000, "Bitte höchstens 1000 Zeichen.").optional(),
  confirm: z.literal(true, {
    errorMap: () => ({ message: "Bitte bestätigen Sie, dass Sie die Löschung Ihres Kontos beantragen möchten." }),
  }),
});

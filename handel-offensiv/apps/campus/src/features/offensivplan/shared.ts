/**
 * Gemeinsame Definitionen fuer den Offensivplan (Seite, Formulare, Actions):
 * deutsche Feld- und Statuslabels sowie Hilfen fuer "Bis wann" (due_at).
 * Port von apps/mobile/src/features/offensivplan/shared.ts – reine
 * Funktionen, keine IO; in Server- und Client-Komponenten nutzbar.
 */

import type { ActionPlanItemRow, ActionPlanRow, PlanItemStatus, TrainerFeedbackRow } from "@handel-offensiv/types";

/** Nested-Select-Form: Plan inkl. Items (RLS: nur eigene bzw. geteilte). */
export type PlanWithItems = ActionPlanRow & { action_plan_items: ActionPlanItemRow[] };

/** Trainer-Feedback zu einem Vorhaben (RLS: nur als Empfaenger lesbar). */
export type ItemFeedback = Pick<TrainerFeedbackRow, "id" | "action_plan_item_id" | "body" | "created_at">;

/** Die fuenf Planfelder in Anzeige-Reihenfolge. */
export const PLAN_FIELDS = [
  { key: "insight", label: "Meine Erkenntnis", hint: "Was habe ich für mich erkannt?" },
  { key: "behavior", label: "Mein Verhalten", hint: "Was ändere ich an meinem Verhalten?" },
  { key: "action", label: "Meine Maßnahme", hint: "Was setze ich konkret um – mein nächster Schritt?" },
  { key: "team", label: "Meine Mannschaft", hint: "Wen beziehe ich ein – wer unterstützt mich?" },
  { key: "result", label: "Mein Ergebnis", hint: "Woran erkenne ich den Erfolg?" },
] as const;

export type PlanFieldKey = (typeof PLAN_FIELDS)[number]["key"];

/** Status-Stepper geplant → begonnen → umgesetzt → reflektiert. */
export const STATUS_STEPS: readonly { value: PlanItemStatus; label: string }[] = [
  { value: "planned", label: "Geplant" },
  { value: "started", label: "Begonnen" },
  { value: "implemented", label: "Umgesetzt" },
  { value: "reflected", label: "Reflektiert" },
] as const;

export function statusLabel(status: PlanItemStatus): string {
  return STATUS_STEPS.find((s) => s.value === status)?.label ?? "Geplant";
}

/** Werte der fuenf Textfelder (Formularzustand). */
export type PlanFieldValues = Record<PlanFieldKey, string>;

export function emptyFieldValues(): PlanFieldValues {
  return { insight: "", behavior: "", action: "", team: "", result: "" };
}

export function fieldValuesFromItem(item: ActionPlanItemRow | null): PlanFieldValues {
  return {
    insight: item?.insight ?? "",
    behavior: item?.behavior ?? "",
    action: item?.action ?? "",
    team: item?.team ?? "",
    result: item?.result ?? "",
  };
}

/** Items eines Plans in Positionsreihenfolge. */
export function sortedItems(plan: PlanWithItems | undefined): ActionPlanItemRow[] {
  if (!plan) return [];
  return [...plan.action_plan_items].sort((a, b) => a.position - b.position);
}

/** Erstes (primaeres) Item eines Plans – fuer die konsolidierte 90-Tage-Sicht. */
export function primaryItem(plan: PlanWithItems | undefined): ActionPlanItemRow | null {
  return sortedItems(plan)[0] ?? null;
}

/* ------------------------------- Bis wann -------------------------------- */

const TZ = "Europe/Berlin";

/** ISO -> "YYYY-MM-DD" (Kalendertag in Europe/Berlin) fuer <input type="date">. */
export function dueDateInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/**
 * "YYYY-MM-DD" -> ISO-Zeitpunkt 12:00 UTC desselben Kalendertags. Mittag UTC
 * liegt in Europe/Berlin immer am selben Tag (13/14 Uhr) – die Anzeige als
 * Datum bleibt damit stabil, unabhaengig von Sommer-/Winterzeit.
 */
export function dueDateToIso(date: string): string {
  return `${date}T12:00:00.000Z`;
}

/** "12.03.2027" bzw. "Bis 12.03.2027" */
export function formatDueDate(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));
}

/** Ist das Faelligkeitsdatum ueberschritten (Kalendertag, Europe/Berlin)? */
export function isOverdue(iso: string | null, status: PlanItemStatus, now: Date = new Date()): boolean {
  if (!iso) return false;
  if (status === "implemented" || status === "reflected") return false;
  return dueDateInputValue(iso) < dueDateInputValue(now.toISOString());
}

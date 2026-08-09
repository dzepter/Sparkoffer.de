/**
 * Gemeinsame Definitionen für den Offensivplan (Screen + PDF-Export):
 * deutsche Feld- und Statuslabels (§14) sowie Draft-Schlüssel für die
 * lokale Pufferung von Eingaben vor dem Submit (§34).
 */
import type { ActionPlanItemRow, ActionPlanRow, PlanItemStatus } from "@handel-offensiv/types";

/** Nested-Select-Form: Plan inkl. Items (RLS: nur eigene bzw. geteilte). */
export type PlanWithItems = ActionPlanRow & { action_plan_items: ActionPlanItemRow[] };

/** Die fünf Planfelder in Anzeige-Reihenfolge (§14). */
export const PLAN_FIELDS = [
  { key: "insight", label: "Meine Erkenntnis", hint: "Was habe ich für mich erkannt?" },
  { key: "behavior", label: "Mein Verhalten", hint: "Was ändere ich an meinem Verhalten?" },
  { key: "action", label: "Meine Maßnahme", hint: "Was setze ich konkret um?" },
  { key: "team", label: "Meine Mannschaft", hint: "Wen beziehe ich ein – wer unterstützt mich?" },
  { key: "result", label: "Mein Ergebnis", hint: "Woran erkenne ich den Erfolg?" },
] as const;

export type PlanFieldKey = (typeof PLAN_FIELDS)[number]["key"];

/** Status-Stepper geplant → begonnen → umgesetzt → reflektiert (§14). */
export const STATUS_STEPS: readonly { value: PlanItemStatus; label: string }[] = [
  { value: "planned", label: "Geplant" },
  { value: "started", label: "Begonnen" },
  { value: "implemented", label: "Umgesetzt" },
  { value: "reflected", label: "Reflektiert" },
] as const;

export function statusLabel(status: PlanItemStatus): string {
  return STATUS_STEPS.find((s) => s.value === status)?.label ?? "Geplant";
}

/** Werte der fünf Textfelder (Editor-Zustand). */
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

/**
 * AsyncStorage-Schlüssel für Entwürfe (unkritischer Cache, NIE Tokens).
 * moduleId null = 90-Tage-Plan; itemId null = neues Vorhaben.
 */
export function draftKey(cohortId: string, moduleId: string | null, itemId: string | null): string {
  return `handel-offensiv.offensivplan-draft.${cohortId}.${moduleId ?? "90tage"}.${itemId ?? "neu"}`;
}

/** Erstes (primäres) Item eines Plans – Modulkarten zeigen genau eines. */
export function primaryItem(plan: PlanWithItems | undefined): ActionPlanItemRow | null {
  if (!plan) return null;
  const sorted = [...plan.action_plan_items].sort((a, b) => a.position - b.position);
  return sorted[0] ?? null;
}

/** Items eines Plans in Positionsreihenfolge. */
export function sortedItems(plan: PlanWithItems | undefined): ActionPlanItemRow[] {
  if (!plan) return [];
  return [...plan.action_plan_items].sort((a, b) => a.position - b.position);
}

/**
 * Datenlayer OFFENSIVPLAN – Port von fetchOffensivplan aus
 * apps/mobile/src/features/offensivplan/screen.tsx auf Server Components.
 *
 * REGELN:
 *  - Alle Zugriffe ueber den Supabase-Client der NUTZERSITZUNG (RLS:
 *    modules_select_published, action_plans_select, action_plan_items_select,
 *    trainer_feedback_select, cohort_sessions_select).
 *  - Trainer-Feedback ist nur als Empfaenger lesbar; der Autorname bleibt
 *    aussen vor (Trainerprofile sind fuer Teilnehmer nicht lesbar).
 *  - Fehler werden nicht geworfen, sondern als `error` (deutsch) geliefert.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ModuleRow, Uuid } from "@handel-offensiv/types";

import { ERROR_MESSAGES } from "@/lib/errors";

import type { ItemFeedback, PlanWithItems } from "./shared";

type Db = SupabaseClient;

export type PlanModule = Pick<ModuleRow, "id" | "number_label" | "title" | "position">;

export interface OffensivplanData {
  modules: PlanModule[];
  plans: PlanWithItems[];
  /** Feedback je Vorhaben (item_id -> Liste, aelteste zuerst) */
  feedbackByItem: Record<Uuid, ItemFeedback[]>;
  /** 90-Tage-Bereich sichtbar: Modul 05 hat begonnen ODER 90-Tage-Plan existiert */
  show90: boolean;
  error: string | null;
}

export async function loadOffensivplan(
  supabase: Db,
  cohortId: Uuid,
  programId: Uuid | null,
  profileId: Uuid,
  now: Date = new Date(),
): Promise<OffensivplanData> {
  const empty: OffensivplanData = { modules: [], plans: [], feedbackByItem: {}, show90: false, error: null };

  const [modulesRes, plansRes] = await Promise.all([
    programId !== null
      ? supabase.from("modules").select("id, number_label, title, position").eq("program_id", programId).order("position", { ascending: true })
      : Promise.resolve({ data: [] as PlanModule[], error: null }),
    supabase.from("action_plans").select("*, action_plan_items(*)").eq("cohort_id", cohortId).eq("profile_id", profileId),
  ]);
  if (modulesRes.error || plansRes.error) return { ...empty, error: ERROR_MESSAGES.load };

  const modules = (modulesRes.data as PlanModule[] | null) ?? [];
  const plans = (plansRes.data as unknown as PlanWithItems[] | null) ?? [];

  // Trainer-Feedback zu den eigenen Vorhaben
  const itemIds = plans.flatMap((p) => p.action_plan_items.map((i) => i.id));
  const feedbackByItem: Record<Uuid, ItemFeedback[]> = {};
  if (itemIds.length > 0) {
    const { data } = await supabase
      .from("trainer_feedback")
      .select("id, action_plan_item_id, body, created_at")
      .in("action_plan_item_id", itemIds)
      .order("created_at", { ascending: true });
    for (const fb of (data as ItemFeedback[] | null) ?? []) {
      if (fb.action_plan_item_id === null) continue;
      (feedbackByItem[fb.action_plan_item_id] ??= []).push(fb);
    }
  }

  // Freischaltung des 90-Tage-Bereichs: letzter Praesenztag (Modul 05) hat
  // begonnen ODER es existiert bereits ein 90-Tage-Plan.
  let show90 = plans.some((p) => p.module_id === null);
  const lastModule = modules[modules.length - 1];
  if (!show90 && lastModule !== undefined) {
    const { data } = await supabase.from("cohort_sessions").select("starts_at").eq("cohort_id", cohortId).eq("module_id", lastModule.id);
    const nowMs = now.getTime();
    show90 = ((data as { starts_at: string }[] | null) ?? []).some((s) => Date.parse(s.starts_at) <= nowMs);
  }

  return { modules, plans, feedbackByItem, show90, error: null };
}

"use server";

/**
 * Server Actions OFFENSIVPLAN (action_plans + action_plan_items).
 *
 * Regeln (fuer JEDE Action):
 *  1. Sitzung erneut pruefen; die aktive Gruppe kommt IMMER aus der Sitzung –
 *     die cohortId aus dem Formular dient nur der Gleichheitspruefung
 *     (Schutz vor veralteten Tabs).
 *  2. Eingaben mit zod validieren.
 *  3. Schreiben NUR ueber den Client der NUTZERSITZUNG (RLS: nur eigene
 *     Plaene; Trainer lesen nur bei share_with_trainer = true).
 *  4. Betroffene Pfade revalidieren. Fehlermeldungen deutsch.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { PLAN_ITEM_STATUSES } from "@handel-offensiv/types";
import type { Uuid } from "@handel-offensiv/types";

import { fieldErrorsFromZod, formString, type FormState } from "@/lib/auth/form-state";
import { ERROR_MESSAGES, mapSupabaseError } from "@/lib/errors";
import { requireCampusSession, type CampusSession } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { dueDateToIso } from "./shared";

/* ------------------------------- Helfer ---------------------------------- */

const uuid = z.string().uuid();

/** Plan-Bezug: Modul-UUID oder "" fuer den 90-Tage-Plan (module_id null). */
const moduleIdSchema = z.union([uuid, z.literal("")]).transform((v) => (v === "" ? null : v));

const STALE_COHORT = "Ihre aktive Gruppe hat sich geändert. Bitte laden Sie die Seite neu.";
const NO_COHORT = "Sie sind noch keiner Gruppe zugeordnet.";
const MAX_FIELD = 2000;

interface ActionContext {
  session: CampusSession;
  cohortId: Uuid;
  programId: Uuid | null;
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
}

async function actionContext(formCohortId: string): Promise<ActionContext | { error: string }> {
  const session = await requireCampusSession();
  if (session.cohort === null) return { error: NO_COHORT };
  if (session.cohort.id !== formCohortId) return { error: STALE_COHORT };
  const supabase = await createSupabaseServerClient();
  return { session, cohortId: session.cohort.id, programId: session.cohort.program_id, supabase };
}

function isError(ctx: ActionContext | { error: string }): ctx is { error: string } {
  return "error" in ctx;
}

function revalidate(): void {
  revalidatePath("/offensivplan");
  revalidatePath("/heute");
}

/** Modul muss zum Programm der aktiven Gruppe gehoeren (per RLS sichtbar). */
async function moduleBelongsToProgram(ctx: ActionContext, moduleId: Uuid): Promise<boolean> {
  if (ctx.programId === null) return false;
  const { data } = await ctx.supabase.from("modules").select("id").eq("id", moduleId).eq("program_id", ctx.programId).maybeSingle();
  return data !== null;
}

/**
 * Plan sicherstellen – Upsert auf (profile_id, cohort_id, module_id);
 * die Unique-Regel behandelt NULL (90-Tage-Plan) wie einen Wert.
 */
async function ensurePlan(ctx: ActionContext, moduleId: Uuid | null, extra: { share_with_trainer?: boolean } = {}): Promise<{ id: Uuid } | { error: string }> {
  const { data, error } = await ctx.supabase
    .from("action_plans")
    .upsert({ profile_id: ctx.session.userId, cohort_id: ctx.cohortId, module_id: moduleId, ...extra }, { onConflict: "profile_id,cohort_id,module_id" })
    .select("id")
    .single();
  if (error || !data) return { error: mapSupabaseError(error, ERROR_MESSAGES.save) };
  return data as { id: Uuid };
}

/* --------------------------- Vorhaben speichern --------------------------- */

const optionalText = z
  .string()
  .trim()
  .max(MAX_FIELD, `Maximal ${MAX_FIELD} Zeichen.`)
  .transform((v) => (v.length > 0 ? v : null));

const itemSchema = z.object({
  cohortId: uuid,
  moduleId: moduleIdSchema,
  itemId: z.union([uuid, z.literal("")]).transform((v) => (v === "" ? null : v)),
  insight: optionalText,
  behavior: optionalText,
  action: z.string().trim().min(1, "Bitte beschreiben Sie Ihre Maßnahme – Ihren konkreten nächsten Schritt.").max(MAX_FIELD, `Maximal ${MAX_FIELD} Zeichen.`),
  team: optionalText,
  result: optionalText,
  dueAt: z
    .string()
    .trim()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Bitte geben Sie ein gültiges Datum an.")
    .transform((v) => (v.length > 0 ? v : null)),
});

/** Vorhaben anlegen (itemId leer) oder bearbeiten. */
export async function saveItemAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = itemSchema.safeParse({
    cohortId: formString(formData, "cohortId"),
    moduleId: formString(formData, "moduleId"),
    itemId: formString(formData, "itemId"),
    insight: formString(formData, "insight"),
    behavior: formString(formData, "behavior"),
    action: formString(formData, "action"),
    team: formString(formData, "team"),
    result: formString(formData, "result"),
    dueAt: formString(formData, "dueAt"),
  });
  if (!parsed.success) return { error: ERROR_MESSAGES.invalidInput, fieldErrors: fieldErrorsFromZod(parsed.error) };

  const ctx = await actionContext(parsed.data.cohortId);
  if (isError(ctx)) return { error: ctx.error };

  const { moduleId, itemId } = parsed.data;
  if (moduleId !== null && !(await moduleBelongsToProgram(ctx, moduleId))) return { error: ERROR_MESSAGES.notFound };

  const dueAt = parsed.data.dueAt ? dueDateToIso(parsed.data.dueAt) : null;
  if (dueAt !== null && Number.isNaN(Date.parse(dueAt))) {
    return { error: ERROR_MESSAGES.invalidInput, fieldErrors: { dueAt: "Bitte geben Sie ein gültiges Datum an." } };
  }

  const row = {
    insight: parsed.data.insight,
    behavior: parsed.data.behavior,
    action: parsed.data.action,
    team: parsed.data.team,
    result: parsed.data.result,
    due_at: dueAt,
  };

  if (itemId !== null) {
    // RLS: Update nur auf Items eigener Plaene – 0 Zeilen = nicht gefunden
    const { data, error } = await ctx.supabase.from("action_plan_items").update(row).eq("id", itemId).select("id");
    if (error) return { error: mapSupabaseError(error, ERROR_MESSAGES.save) };
    if (!data || data.length === 0) return { error: ERROR_MESSAGES.notFound };
  } else {
    const plan = await ensurePlan(ctx, moduleId);
    if ("error" in plan) return { error: plan.error };

    const { data: last } = await ctx.supabase
      .from("action_plan_items")
      .select("position")
      .eq("action_plan_id", plan.id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const position = ((last as { position: number } | null)?.position ?? -1) + 1;

    const { error } = await ctx.supabase.from("action_plan_items").insert({ action_plan_id: plan.id, position, status: "planned", ...row });
    if (error) return { error: mapSupabaseError(error, ERROR_MESSAGES.save) };
  }

  revalidate();
  return { error: null, success: "Ihr Plan wurde gespeichert." };
}

/* ------------------------------- Status ---------------------------------- */

const statusSchema = z.object({
  cohortId: uuid,
  itemId: uuid,
  status: z.enum(PLAN_ITEM_STATUSES),
});

export async function setItemStatusAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = statusSchema.safeParse({
    cohortId: formString(formData, "cohortId"),
    itemId: formString(formData, "itemId"),
    status: formString(formData, "status"),
  });
  if (!parsed.success) return { error: ERROR_MESSAGES.invalidInput };

  const ctx = await actionContext(parsed.data.cohortId);
  if (isError(ctx)) return { error: ctx.error };

  const { data, error } = await ctx.supabase.from("action_plan_items").update({ status: parsed.data.status }).eq("id", parsed.data.itemId).select("id");
  if (error) return { error: mapSupabaseError(error, "Der Status konnte gerade nicht geändert werden. Bitte versuchen Sie es erneut.") };
  if (!data || data.length === 0) return { error: ERROR_MESSAGES.notFound };

  revalidate();
  return { error: null, success: null };
}

/* ------------------------------- Loeschen -------------------------------- */

const deleteSchema = z.object({ cohortId: uuid, itemId: uuid });

export async function deleteItemAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = deleteSchema.safeParse({
    cohortId: formString(formData, "cohortId"),
    itemId: formString(formData, "itemId"),
  });
  if (!parsed.success) return { error: ERROR_MESSAGES.invalidInput };

  const ctx = await actionContext(parsed.data.cohortId);
  if (isError(ctx)) return { error: ctx.error };

  const { error } = await ctx.supabase.from("action_plan_items").delete().eq("id", parsed.data.itemId);
  if (error) return { error: mapSupabaseError(error, "Das Vorhaben konnte gerade nicht entfernt werden. Bitte versuchen Sie es erneut.") };

  revalidate();
  return { error: null, success: "Das Vorhaben wurde entfernt." };
}

/* ---------------------------- Mit Trainer teilen -------------------------- */

const shareSchema = z.object({
  cohortId: uuid,
  moduleId: moduleIdSchema,
  share: z.enum(["true", "false"]).transform((v) => v === "true"),
});

/** Freigabe je Plan (Upsert legt den Plan bei Bedarf an). */
export async function toggleShareAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = shareSchema.safeParse({
    cohortId: formString(formData, "cohortId"),
    moduleId: formString(formData, "moduleId"),
    share: formString(formData, "share"),
  });
  if (!parsed.success) return { error: ERROR_MESSAGES.invalidInput };

  const ctx = await actionContext(parsed.data.cohortId);
  if (isError(ctx)) return { error: ctx.error };

  const { moduleId, share } = parsed.data;
  if (moduleId !== null && !(await moduleBelongsToProgram(ctx, moduleId))) return { error: ERROR_MESSAGES.notFound };

  const plan = await ensurePlan(ctx, moduleId, { share_with_trainer: share });
  if ("error" in plan) return { error: "Die Freigabe konnte gerade nicht geändert werden. Bitte versuchen Sie es erneut." };

  revalidate();
  return { error: null, success: share ? "Ihr Trainer kann diesen Plan jetzt sehen." : "Dieser Plan ist wieder privat." };
}

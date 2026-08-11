"use server";

/**
 * Server Actions – Bereich GRUPPEN (Cohorts, §18/§55).
 *
 * Jede Operation folgt der Regel aus src/lib/supabase/admin.ts:
 *  1. Akteur aufloesen, 2. can(actor, 'cohorts.manage') pruefen,
 *  3. Operation ueber den Service-Role-Client, 4. Audit-Log schreiben.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { can } from "@handel-offensiv/domain";
import { RELEASE_MODES } from "@handel-offensiv/types";
import { cohortSchema, sessionSchema } from "@handel-offensiv/validation";

import { writeAuditLog } from "@/lib/audit";
import { getActorContext, type SessionActor } from "@/lib/auth";
import { ERROR_MESSAGES, mapSupabaseError } from "@/lib/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { berlinLocalToIso } from "./datetime-local";

export interface CohortFormState {
  error: string | null;
  fieldErrors?: Record<string, string>;
}

/** Ergebnis fuer Dialog-Formulare (Termine, Freischaltungen). */
export interface DialogFormState {
  error: string | null;
  fieldErrors?: Record<string, string>;
  /** true = erfolgreich, Dialog kann schliessen */
  done: boolean;
}

const uuid = z.string().uuid();

function optional(fd: FormData, name: string): string | undefined {
  const v = fd.get(name);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

function firstFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

/** Gemeinsames Gate: Session + cohorts.manage. Gibt null bei fehlendem Recht. */
async function requireCohortManager(): Promise<SessionActor | null> {
  const session = await getActorContext();
  if (!session) redirect("/login");
  return can(session.actor, "cohorts.manage") ? session : null;
}

/* ------------------------------- Cohorts ------------------------------- */

const cohortFormSchema = z.object({ id: uuid.optional() });

export async function saveCohortAction(
  _prev: CohortFormState,
  formData: FormData,
): Promise<CohortFormState> {
  const session = await requireCohortManager();
  if (!session) return { error: ERROR_MESSAGES.forbidden };

  const idParsed = cohortFormSchema.safeParse({ id: optional(formData, "id") });
  const parsed = cohortSchema.safeParse({
    organizationId: formData.get("organizationId"),
    programId: formData.get("programId"),
    name: formData.get("name"),
    startDate: optional(formData, "startDate"),
    endDate: optional(formData, "endDate"),
    status: formData.get("status") ?? "active",
  });

  if (!idParsed.success || !parsed.success) {
    return {
      error: ERROR_MESSAGES.invalidInput,
      fieldErrors: parsed.success ? {} : firstFieldErrors(parsed.error),
    };
  }

  const input = parsed.data;
  const row = {
    organization_id: input.organizationId,
    program_id: input.programId,
    name: input.name,
    start_date: input.startDate ?? null,
    end_date: input.endDate ?? null,
    status: input.status,
  };

  const admin = createSupabaseAdminClient();
  let targetId = idParsed.data.id;

  if (targetId !== undefined) {
    const { error } = await admin.from("cohorts").update(row).eq("id", targetId);
    if (error) return { error: mapSupabaseError(error, ERROR_MESSAGES.save) };
  } else {
    const { data, error } = await admin.from("cohorts").insert(row).select("id").single();
    if (error) return { error: mapSupabaseError(error, ERROR_MESSAGES.save) };
    targetId = (data as { id: string }).id;
  }

  await writeAuditLog({
    actorProfileId: session.actor.profileId,
    action: idParsed.data.id !== undefined ? "cohorts.update" : "cohorts.create",
    targetType: "cohort",
    targetId,
    metadata: { name: input.name, status: input.status },
  });

  revalidatePath("/gruppen");
  redirect(`/gruppen/${targetId}`);
}

/* ------------------------------- Trainer ------------------------------- */

const trainerSchema = z.object({ cohortId: uuid, trainerProfileId: uuid });

export async function assignTrainerAction(formData: FormData): Promise<void> {
  const session = await requireCohortManager();
  const parsed = trainerSchema.safeParse({
    cohortId: formData.get("cohortId"),
    trainerProfileId: formData.get("trainerProfileId"),
  });
  if (!parsed.success) redirect("/gruppen");
  const back = `/gruppen/${parsed.data.cohortId}?tab=mitglieder`;
  if (!session) redirect(`${back}&fehler=recht`);

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("cohort_trainers")
    .upsert(
      { cohort_id: parsed.data.cohortId, profile_id: parsed.data.trainerProfileId },
      { onConflict: "cohort_id,profile_id", ignoreDuplicates: true },
    );
  if (error) redirect(`${back}&fehler=1`);

  await writeAuditLog({
    actorProfileId: session.actor.profileId,
    action: "cohorts.trainer_assign",
    targetType: "cohort",
    targetId: parsed.data.cohortId,
    metadata: { trainer_profile_id: parsed.data.trainerProfileId },
  });

  revalidatePath(`/gruppen/${parsed.data.cohortId}`);
  redirect(back);
}

const trainerRemoveSchema = z.object({ cohortId: uuid, cohortTrainerId: uuid });

export async function removeTrainerAction(formData: FormData): Promise<void> {
  const session = await requireCohortManager();
  const parsed = trainerRemoveSchema.safeParse({
    cohortId: formData.get("cohortId"),
    cohortTrainerId: formData.get("cohortTrainerId"),
  });
  if (!parsed.success) redirect("/gruppen");
  const back = `/gruppen/${parsed.data.cohortId}?tab=mitglieder`;
  if (!session) redirect(`${back}&fehler=recht`);

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("cohort_trainers")
    .delete()
    .eq("id", parsed.data.cohortTrainerId)
    .eq("cohort_id", parsed.data.cohortId);
  if (error) redirect(`${back}&fehler=1`);

  await writeAuditLog({
    actorProfileId: session.actor.profileId,
    action: "cohorts.trainer_remove",
    targetType: "cohort",
    targetId: parsed.data.cohortId,
    metadata: { cohort_trainer_id: parsed.data.cohortTrainerId },
  });

  revalidatePath(`/gruppen/${parsed.data.cohortId}`);
  redirect(back);
}

/* ------------------------------- Termine ------------------------------- */

const sessionIdSchema = z.object({ sessionId: uuid.optional() });

export async function saveSessionAction(
  _prev: DialogFormState,
  formData: FormData,
): Promise<DialogFormState> {
  const session = await requireCohortManager();
  if (!session) return { error: ERROR_MESSAGES.forbidden, done: false };

  const idParsed = sessionIdSchema.safeParse({ sessionId: optional(formData, "sessionId") });
  // datetime-local (Berlin) -> ISO mit Offset, damit sessionSchema greift
  const parsed = sessionSchema.safeParse({
    cohortId: formData.get("cohortId"),
    moduleId: optional(formData, "moduleId"),
    title: formData.get("title"),
    startsAt: berlinLocalToIso(optional(formData, "startsAt")),
    endsAt: berlinLocalToIso(optional(formData, "endsAt")),
    timezone: "Europe/Berlin",
    venue: optional(formData, "venue"),
    address: optional(formData, "address"),
    room: optional(formData, "room"),
    trainerProfileId: optional(formData, "trainerProfileId"),
    notes: optional(formData, "notes"),
    directions: optional(formData, "directions"),
  });

  if (!idParsed.success || !parsed.success) {
    return {
      error: ERROR_MESSAGES.invalidInput,
      fieldErrors: parsed.success ? {} : firstFieldErrors(parsed.error),
      done: false,
    };
  }

  const input = parsed.data;
  const row = {
    cohort_id: input.cohortId,
    module_id: input.moduleId ?? null,
    title: input.title,
    starts_at: input.startsAt,
    ends_at: input.endsAt ?? null,
    timezone: input.timezone,
    venue: input.venue ?? null,
    address: input.address ?? null,
    room: input.room ?? null,
    trainer_profile_id: input.trainerProfileId ?? null,
    notes: input.notes ?? null,
    directions: input.directions ?? null,
  };

  const admin = createSupabaseAdminClient();
  let targetId = idParsed.data.sessionId;

  if (targetId !== undefined) {
    const { error } = await admin
      .from("cohort_sessions")
      .update(row)
      .eq("id", targetId)
      .eq("cohort_id", input.cohortId);
    if (error) return { error: mapSupabaseError(error, ERROR_MESSAGES.save), done: false };
  } else {
    const { data, error } = await admin.from("cohort_sessions").insert(row).select("id").single();
    if (error) return { error: mapSupabaseError(error, ERROR_MESSAGES.save), done: false };
    targetId = (data as { id: string }).id;
  }

  await writeAuditLog({
    actorProfileId: session.actor.profileId,
    action: idParsed.data.sessionId !== undefined ? "sessions.update" : "sessions.create",
    targetType: "cohort_session",
    targetId,
    metadata: { cohort_id: input.cohortId, title: input.title, starts_at: input.startsAt },
  });

  revalidatePath(`/gruppen/${input.cohortId}`);
  return { error: null, done: true };
}

const sessionDeleteSchema = z.object({ cohortId: uuid, sessionId: uuid });

export async function deleteSessionAction(formData: FormData): Promise<void> {
  const session = await requireCohortManager();
  const parsed = sessionDeleteSchema.safeParse({
    cohortId: formData.get("cohortId"),
    sessionId: formData.get("sessionId"),
  });
  if (!parsed.success) redirect("/gruppen");
  const back = `/gruppen/${parsed.data.cohortId}?tab=termine`;
  if (!session) redirect(`${back}&fehler=recht`);

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("cohort_sessions")
    .delete()
    .eq("id", parsed.data.sessionId)
    .eq("cohort_id", parsed.data.cohortId);
  if (error) redirect(`${back}&fehler=1`);

  await writeAuditLog({
    actorProfileId: session.actor.profileId,
    action: "sessions.delete",
    targetType: "cohort_session",
    targetId: parsed.data.sessionId,
    metadata: { cohort_id: parsed.data.cohortId },
  });

  revalidatePath(`/gruppen/${parsed.data.cohortId}`);
  redirect(back);
}

/* --------------------------- Freischaltungen --------------------------- */

/**
 * Freischaltungsregel (lesson_releases) – lokales Zod-Schema, da das
 * validation-Paket (noch) kein Release-Schema mitbringt. Pflichtfelder je
 * Modus via superRefine (dynamische Felder im Editor).
 */
const releaseFormSchema = z
  .object({
    cohortId: uuid,
    lessonId: uuid,
    releaseId: uuid.optional(),
    mode: z.enum(RELEASE_MODES),
    releaseAt: z.string().datetime({ offset: true }).optional(),
    dueAt: z.string().datetime({ offset: true }).optional(),
    expiresAt: z.string().datetime({ offset: true }).optional(),
    offsetDays: z.coerce.number().int().min(0).max(365).optional(),
    sessionId: uuid.optional(),
    prerequisiteLessonId: uuid.optional(),
    prerequisiteModuleId: uuid.optional(),
    releaseNow: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const req = (path: string, msg: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message: msg });
    if (v.mode === "at_datetime" && v.releaseAt === undefined) {
      req("releaseAt", "Zeitpunkt erforderlich");
    }
    if (v.mode === "days_after_session" || v.mode === "days_before_session") {
      if (v.sessionId === undefined) req("sessionId", "Termin erforderlich");
      if (v.offsetDays === undefined) req("offsetDays", "Anzahl Tage erforderlich");
    }
    if (v.mode === "after_lesson" && v.prerequisiteLessonId === undefined) {
      req("prerequisiteLessonId", "Vorgänger-Lektion erforderlich");
    }
    if (v.mode === "after_module" && v.prerequisiteModuleId === undefined) {
      req("prerequisiteModuleId", "Vorgänger-Modul erforderlich");
    }
  });

export async function saveReleaseAction(
  _prev: DialogFormState,
  formData: FormData,
): Promise<DialogFormState> {
  const session = await requireCohortManager();
  if (!session) return { error: ERROR_MESSAGES.forbidden, done: false };

  const parsed = releaseFormSchema.safeParse({
    cohortId: formData.get("cohortId"),
    lessonId: formData.get("lessonId"),
    releaseId: optional(formData, "releaseId"),
    mode: formData.get("mode"),
    releaseAt: berlinLocalToIso(optional(formData, "releaseAt")),
    dueAt: berlinLocalToIso(optional(formData, "dueAt")),
    expiresAt: berlinLocalToIso(optional(formData, "expiresAt")),
    offsetDays: optional(formData, "offsetDays"),
    sessionId: optional(formData, "sessionId"),
    prerequisiteLessonId: optional(formData, "prerequisiteLessonId"),
    prerequisiteModuleId: optional(formData, "prerequisiteModuleId"),
    releaseNow: formData.get("releaseNow") === "on",
  });

  if (!parsed.success) {
    return {
      error: ERROR_MESSAGES.invalidInput,
      fieldErrors: firstFieldErrors(parsed.error),
      done: false,
    };
  }

  const v = parsed.data;
  // Nur die zum Modus passenden Felder persistieren, Rest bewusst null
  const row = {
    lesson_id: v.lessonId,
    cohort_id: v.cohortId,
    profile_id: null,
    release_mode: v.mode,
    release_at: v.mode === "at_datetime" ? (v.releaseAt ?? null) : null,
    due_at: v.dueAt ?? null,
    expires_at: v.expiresAt ?? null,
    offset_days:
      v.mode === "days_after_session" || v.mode === "days_before_session"
        ? (v.offsetDays ?? 0)
        : null,
    session_id:
      v.mode === "days_after_session" || v.mode === "days_before_session"
        ? (v.sessionId ?? null)
        : null,
    prerequisite_lesson_id: v.mode === "after_lesson" ? (v.prerequisiteLessonId ?? null) : null,
    prerequisite_module_id: v.mode === "after_module" ? (v.prerequisiteModuleId ?? null) : null,
    released_at: v.mode === "manual" && v.releaseNow ? new Date().toISOString() : null,
    created_by: session.actor.profileId,
  };

  const admin = createSupabaseAdminClient();
  let targetId = v.releaseId;

  if (targetId !== undefined) {
    const { error } = await admin
      .from("lesson_releases")
      .update(row)
      .eq("id", targetId)
      .eq("cohort_id", v.cohortId);
    if (error) return { error: mapSupabaseError(error, ERROR_MESSAGES.save), done: false };
  } else {
    // Kein Unique-Constraint auf (lesson, cohort, profile NULL) – vorhandene
    // Cohort-Regel derselben Lektion daher zuerst suchen und aktualisieren.
    const { data: existing, error: findError } = await admin
      .from("lesson_releases")
      .select("id")
      .eq("lesson_id", v.lessonId)
      .eq("cohort_id", v.cohortId)
      .is("profile_id", null)
      .maybeSingle();
    if (findError) return { error: mapSupabaseError(findError, ERROR_MESSAGES.save), done: false };

    if (existing) {
      targetId = (existing as { id: string }).id;
      const { error } = await admin.from("lesson_releases").update(row).eq("id", targetId);
      if (error) return { error: mapSupabaseError(error, ERROR_MESSAGES.save), done: false };
    } else {
      const { data, error } = await admin.from("lesson_releases").insert(row).select("id").single();
      if (error) return { error: mapSupabaseError(error, ERROR_MESSAGES.save), done: false };
      targetId = (data as { id: string }).id;
    }
  }

  await writeAuditLog({
    actorProfileId: session.actor.profileId,
    action: "releases.save",
    targetType: "lesson_release",
    targetId,
    metadata: { cohort_id: v.cohortId, lesson_id: v.lessonId, mode: v.mode },
  });

  revalidatePath(`/gruppen/${v.cohortId}`);
  return { error: null, done: true };
}

const releaseDeleteSchema = z.object({ cohortId: uuid, releaseId: uuid });

export async function deleteReleaseAction(
  _prev: DialogFormState,
  formData: FormData,
): Promise<DialogFormState> {
  const session = await requireCohortManager();
  if (!session) return { error: ERROR_MESSAGES.forbidden, done: false };

  const parsed = releaseDeleteSchema.safeParse({
    cohortId: formData.get("cohortId"),
    releaseId: formData.get("releaseId"),
  });
  if (!parsed.success) return { error: ERROR_MESSAGES.invalidInput, done: false };

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("lesson_releases")
    .delete()
    .eq("id", parsed.data.releaseId)
    .eq("cohort_id", parsed.data.cohortId);
  if (error) return { error: mapSupabaseError(error, ERROR_MESSAGES.save), done: false };

  await writeAuditLog({
    actorProfileId: session.actor.profileId,
    action: "releases.delete",
    targetType: "lesson_release",
    targetId: parsed.data.releaseId,
    metadata: { cohort_id: parsed.data.cohortId },
  });

  revalidatePath(`/gruppen/${parsed.data.cohortId}`);
  return { error: null, done: true };
}

"use server";

/**
 * Server Actions Bereich PROGRAMME (§55): Programme, Module, Lernphasen,
 * Lektions-Metadaten. Jede Mutation: 1. Session + can() pruefen,
 * 2. Zod-Validierung, 3. Operation via Service Role, 4. audit_logs-Eintrag.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { CONTENT_STATUSES, PHASE_TYPES } from "@handel-offensiv/types";

import { writeAuditLog } from "@/lib/audit";
import { requireCapability } from "@/lib/content-guard";
import type { DialogActionState } from "@/lib/content-meta";
import { ERROR_MESSAGES, mapSupabaseError } from "@/lib/errors";
import { moveRow, nextPosition, type MoveDirection } from "@/lib/reorder";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/* ------------------------------- Helfer -------------------------------- */

const uuidSchema = z.string().uuid();
const directionSchema = z.enum(["hoch", "runter"]);

function fd(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function fail(error: string): DialogActionState {
  return { ok: false, error, ts: Date.now() };
}

function success(): DialogActionState {
  return { ok: true, error: null, ts: Date.now() };
}

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? ERROR_MESSAGES.invalidInput;
}

/** Fehler-/Erfolgsmeldung fuer Nicht-Dialog-Forms per Redirect transportieren. */
function redirectWithNotice(path: string, kind: "fehler" | "erfolg", message: string): never {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}${kind}=${encodeURIComponent(message)}`);
}

/* ------------------------------ Programme ------------------------------ */

const programSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Der Slug darf nur Kleinbuchstaben, Ziffern und Bindestriche enthalten",
    ),
  title: z.string().trim().min(1, "Titel erforderlich"),
  subtitle: z.string().trim().optional(),
  description: z.string().trim().optional(),
  status: z.enum(CONTENT_STATUSES),
});

export async function createProgramAction(
  _prev: DialogActionState,
  formData: FormData,
): Promise<DialogActionState> {
  const guard = await requireCapability("content.edit");
  if (!guard.ok) return fail(guard.error);

  const parsed = programSchema.safeParse({
    slug: fd(formData, "slug"),
    title: fd(formData, "titel"),
    subtitle: fd(formData, "untertitel"),
    description: fd(formData, "beschreibung"),
    status: fd(formData, "status") ?? "draft",
  });
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("programs")
    .insert({
      slug: parsed.data.slug,
      title: parsed.data.title,
      subtitle: parsed.data.subtitle ?? null,
      description: parsed.data.description ?? null,
      status: parsed.data.status,
      created_by: guard.profileId,
      published_at: parsed.data.status === "published" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error || data === null) return fail(mapSupabaseError(error, ERROR_MESSAGES.save));
  const programId = (data as { id: string }).id;

  await writeAuditLog({
    actorProfileId: guard.profileId,
    action: "programs.create",
    targetType: "program",
    targetId: programId,
    metadata: { slug: parsed.data.slug, title: parsed.data.title },
  });

  revalidatePath("/programme");
  redirect(`/programme/${programId}`);
}

export async function updateProgramAction(
  _prev: DialogActionState,
  formData: FormData,
): Promise<DialogActionState> {
  const guard = await requireCapability("content.edit");
  if (!guard.ok) return fail(guard.error);

  const idParse = uuidSchema.safeParse(fd(formData, "programmId"));
  if (!idParse.success) return fail(ERROR_MESSAGES.invalidInput);
  const programId = idParse.data;

  const parsed = programSchema.safeParse({
    slug: fd(formData, "slug"),
    title: fd(formData, "titel"),
    subtitle: fd(formData, "untertitel"),
    description: fd(formData, "beschreibung"),
    status: fd(formData, "status") ?? "draft",
  });
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const admin = createSupabaseAdminClient();
  const { data: existing, error: loadError } = await admin
    .from("programs")
    .select("id, published_at")
    .eq("id", programId)
    .maybeSingle();
  if (loadError) return fail(mapSupabaseError(loadError, ERROR_MESSAGES.save));
  if (existing === null) return fail(ERROR_MESSAGES.notFound);

  const publishedAt =
    parsed.data.status === "published"
      ? ((existing as { published_at: string | null }).published_at ?? new Date().toISOString())
      : (existing as { published_at: string | null }).published_at;

  const { error } = await admin
    .from("programs")
    .update({
      slug: parsed.data.slug,
      title: parsed.data.title,
      subtitle: parsed.data.subtitle ?? null,
      description: parsed.data.description ?? null,
      status: parsed.data.status,
      published_at: publishedAt,
    })
    .eq("id", programId);
  if (error) return fail(mapSupabaseError(error, ERROR_MESSAGES.save));

  await writeAuditLog({
    actorProfileId: guard.profileId,
    action: "programs.update",
    targetType: "program",
    targetId: programId,
    metadata: { slug: parsed.data.slug, status: parsed.data.status },
  });

  revalidatePath("/programme");
  revalidatePath(`/programme/${programId}`);
  redirect(`/programme/${programId}`);
}

/* -------------------------------- Module ------------------------------- */

const moduleSchema = z.object({
  numberLabel: z
    .string()
    .trim()
    .min(1, "Modulnummer erforderlich (z. B. 01)")
    .max(4, "Modulnummer: maximal 4 Zeichen"),
  title: z.string().trim().min(1, "Titel erforderlich"),
  claim: z.string().trim().optional(),
  description: z.string().trim().optional(),
  status: z.enum(CONTENT_STATUSES),
});

export async function createModuleAction(
  _prev: DialogActionState,
  formData: FormData,
): Promise<DialogActionState> {
  const guard = await requireCapability("content.edit");
  if (!guard.ok) return fail(guard.error);

  const idParse = uuidSchema.safeParse(fd(formData, "programmId"));
  if (!idParse.success) return fail(ERROR_MESSAGES.invalidInput);
  const programId = idParse.data;

  const parsed = moduleSchema.safeParse({
    numberLabel: fd(formData, "nummer"),
    title: fd(formData, "titel"),
    claim: fd(formData, "claim"),
    description: fd(formData, "beschreibung"),
    status: fd(formData, "status") ?? "draft",
  });
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const admin = createSupabaseAdminClient();
  const position = await nextPosition("modules", "program_id", programId);
  const { data, error } = await admin
    .from("modules")
    .insert({
      program_id: programId,
      position,
      number_label: parsed.data.numberLabel,
      title: parsed.data.title,
      claim: parsed.data.claim ?? null,
      description: parsed.data.description ?? null,
      status: parsed.data.status,
    })
    .select("id")
    .single();
  if (error || data === null) return fail(mapSupabaseError(error, ERROR_MESSAGES.save));

  await writeAuditLog({
    actorProfileId: guard.profileId,
    action: "modules.create",
    targetType: "module",
    targetId: (data as { id: string }).id,
    metadata: { programId, title: parsed.data.title, position },
  });

  revalidatePath(`/programme/${programId}`);
  return success();
}

export async function updateModuleAction(
  _prev: DialogActionState,
  formData: FormData,
): Promise<DialogActionState> {
  const guard = await requireCapability("content.edit");
  if (!guard.ok) return fail(guard.error);

  const ids = z
    .object({ programId: uuidSchema, moduleId: uuidSchema })
    .safeParse({ programId: fd(formData, "programmId"), moduleId: fd(formData, "modulId") });
  if (!ids.success) return fail(ERROR_MESSAGES.invalidInput);

  const parsed = moduleSchema.safeParse({
    numberLabel: fd(formData, "nummer"),
    title: fd(formData, "titel"),
    claim: fd(formData, "claim"),
    description: fd(formData, "beschreibung"),
    status: fd(formData, "status") ?? "draft",
  });
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("modules")
    .update({
      number_label: parsed.data.numberLabel,
      title: parsed.data.title,
      claim: parsed.data.claim ?? null,
      description: parsed.data.description ?? null,
      status: parsed.data.status,
    })
    .eq("id", ids.data.moduleId)
    .eq("program_id", ids.data.programId);
  if (error) return fail(mapSupabaseError(error, ERROR_MESSAGES.save));

  await writeAuditLog({
    actorProfileId: guard.profileId,
    action: "modules.update",
    targetType: "module",
    targetId: ids.data.moduleId,
    metadata: { programId: ids.data.programId, title: parsed.data.title },
  });

  revalidatePath(`/programme/${ids.data.programId}`);
  revalidatePath(`/programme/${ids.data.programId}/module/${ids.data.moduleId}`);
  return success();
}

export async function moveModuleAction(formData: FormData): Promise<void> {
  const parsed = z
    .object({ programId: uuidSchema, moduleId: uuidSchema, richtung: directionSchema })
    .safeParse({
      programId: fd(formData, "programmId"),
      moduleId: fd(formData, "modulId"),
      richtung: fd(formData, "richtung"),
    });
  if (!parsed.success) return;
  const back = `/programme/${parsed.data.programId}`;

  const guard = await requireCapability("content.edit");
  if (!guard.ok) redirectWithNotice(back, "fehler", guard.error);

  const moveError = await moveRow(
    "modules",
    "program_id",
    parsed.data.programId,
    parsed.data.moduleId,
    parsed.data.richtung as MoveDirection,
  );
  if (moveError !== null) redirectWithNotice(back, "fehler", moveError);

  await writeAuditLog({
    actorProfileId: guard.profileId,
    action: "modules.reorder",
    targetType: "module",
    targetId: parsed.data.moduleId,
    metadata: { programId: parsed.data.programId, richtung: parsed.data.richtung },
  });

  revalidatePath(back);
}

/* ------------------------------ Lernphasen ----------------------------- */

const phaseSchema = z.object({
  phaseType: z.enum(PHASE_TYPES),
  title: z.string().trim().min(1, "Titel erforderlich"),
});

export async function createPhaseAction(
  _prev: DialogActionState,
  formData: FormData,
): Promise<DialogActionState> {
  const guard = await requireCapability("content.edit");
  if (!guard.ok) return fail(guard.error);

  const ids = z
    .object({ programId: uuidSchema, moduleId: uuidSchema })
    .safeParse({ programId: fd(formData, "programmId"), moduleId: fd(formData, "modulId") });
  if (!ids.success) return fail(ERROR_MESSAGES.invalidInput);

  const parsed = phaseSchema.safeParse({
    phaseType: fd(formData, "phasenTyp"),
    title: fd(formData, "titel"),
  });
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const admin = createSupabaseAdminClient();
  const position = await nextPosition("learning_phases", "module_id", ids.data.moduleId);
  const { data, error } = await admin
    .from("learning_phases")
    .insert({
      module_id: ids.data.moduleId,
      position,
      phase_type: parsed.data.phaseType,
      title: parsed.data.title,
    })
    .select("id")
    .single();
  if (error || data === null) return fail(mapSupabaseError(error, ERROR_MESSAGES.save));

  await writeAuditLog({
    actorProfileId: guard.profileId,
    action: "learning_phases.create",
    targetType: "learning_phase",
    targetId: (data as { id: string }).id,
    metadata: { moduleId: ids.data.moduleId, title: parsed.data.title },
  });

  revalidatePath(`/programme/${ids.data.programId}/module/${ids.data.moduleId}`);
  return success();
}

export async function updatePhaseAction(
  _prev: DialogActionState,
  formData: FormData,
): Promise<DialogActionState> {
  const guard = await requireCapability("content.edit");
  if (!guard.ok) return fail(guard.error);

  const ids = z
    .object({ programId: uuidSchema, moduleId: uuidSchema, phaseId: uuidSchema })
    .safeParse({
      programId: fd(formData, "programmId"),
      moduleId: fd(formData, "modulId"),
      phaseId: fd(formData, "phaseId"),
    });
  if (!ids.success) return fail(ERROR_MESSAGES.invalidInput);

  const parsed = phaseSchema.safeParse({
    phaseType: fd(formData, "phasenTyp"),
    title: fd(formData, "titel"),
  });
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("learning_phases")
    .update({ phase_type: parsed.data.phaseType, title: parsed.data.title })
    .eq("id", ids.data.phaseId)
    .eq("module_id", ids.data.moduleId);
  if (error) return fail(mapSupabaseError(error, ERROR_MESSAGES.save));

  await writeAuditLog({
    actorProfileId: guard.profileId,
    action: "learning_phases.update",
    targetType: "learning_phase",
    targetId: ids.data.phaseId,
    metadata: { moduleId: ids.data.moduleId, title: parsed.data.title },
  });

  revalidatePath(`/programme/${ids.data.programId}/module/${ids.data.moduleId}`);
  return success();
}

export async function movePhaseAction(formData: FormData): Promise<void> {
  const parsed = z
    .object({
      programId: uuidSchema,
      moduleId: uuidSchema,
      phaseId: uuidSchema,
      richtung: directionSchema,
    })
    .safeParse({
      programId: fd(formData, "programmId"),
      moduleId: fd(formData, "modulId"),
      phaseId: fd(formData, "phaseId"),
      richtung: fd(formData, "richtung"),
    });
  if (!parsed.success) return;
  const back = `/programme/${parsed.data.programId}/module/${parsed.data.moduleId}`;

  const guard = await requireCapability("content.edit");
  if (!guard.ok) redirectWithNotice(back, "fehler", guard.error);

  const moveError = await moveRow(
    "learning_phases",
    "module_id",
    parsed.data.moduleId,
    parsed.data.phaseId,
    parsed.data.richtung as MoveDirection,
  );
  if (moveError !== null) redirectWithNotice(back, "fehler", moveError);

  await writeAuditLog({
    actorProfileId: guard.profileId,
    action: "learning_phases.reorder",
    targetType: "learning_phase",
    targetId: parsed.data.phaseId,
    metadata: { moduleId: parsed.data.moduleId, richtung: parsed.data.richtung },
  });

  revalidatePath(back);
}

export async function deletePhaseAction(formData: FormData): Promise<void> {
  const parsed = z
    .object({ programId: uuidSchema, moduleId: uuidSchema, phaseId: uuidSchema })
    .safeParse({
      programId: fd(formData, "programmId"),
      moduleId: fd(formData, "modulId"),
      phaseId: fd(formData, "phaseId"),
    });
  if (!parsed.success) return;
  const back = `/programme/${parsed.data.programId}/module/${parsed.data.moduleId}`;

  const guard = await requireCapability("content.edit");
  if (!guard.ok) redirectWithNotice(back, "fehler", guard.error);

  const admin = createSupabaseAdminClient();
  const { count, error: countError } = await admin
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("learning_phase_id", parsed.data.phaseId);
  if (countError) redirectWithNotice(back, "fehler", ERROR_MESSAGES.save);
  if ((count ?? 0) > 0) {
    redirectWithNotice(
      back,
      "fehler",
      "Diese Lernphase enthält noch Lektionen und kann nicht gelöscht werden.",
    );
  }

  const { error } = await admin.from("learning_phases").delete().eq("id", parsed.data.phaseId);
  if (error) redirectWithNotice(back, "fehler", mapSupabaseError(error, ERROR_MESSAGES.save));

  await writeAuditLog({
    actorProfileId: guard.profileId,
    action: "learning_phases.delete",
    targetType: "learning_phase",
    targetId: parsed.data.phaseId,
    metadata: { moduleId: parsed.data.moduleId },
  });

  revalidatePath(back);
  redirectWithNotice(back, "erfolg", "Die Lernphase wurde gelöscht.");
}

/* ------------------------------ Lektionen ------------------------------ */

const lessonMetaSchema = z.object({
  title: z.string().trim().min(1, "Titel erforderlich"),
  summary: z.string().trim().optional(),
  estimatedMinutes: z
    .number({ invalid_type_error: "Geschätzte Minuten: bitte eine Zahl angeben" })
    .int("Geschätzte Minuten: bitte eine ganze Zahl angeben")
    .min(1, "Geschätzte Minuten: mindestens 1")
    .max(600, "Geschätzte Minuten: maximal 600")
    .optional(),
});

function parseLessonMeta(formData: FormData) {
  const minutesRaw = fd(formData, "minuten");
  return lessonMetaSchema.safeParse({
    title: fd(formData, "titel"),
    summary: fd(formData, "zusammenfassung"),
    estimatedMinutes: minutesRaw === undefined ? undefined : Number(minutesRaw),
  });
}

export async function createLessonAction(
  _prev: DialogActionState,
  formData: FormData,
): Promise<DialogActionState> {
  const guard = await requireCapability("content.edit");
  if (!guard.ok) return fail(guard.error);

  const ids = z
    .object({ programId: uuidSchema, moduleId: uuidSchema, phaseId: uuidSchema })
    .safeParse({
      programId: fd(formData, "programmId"),
      moduleId: fd(formData, "modulId"),
      phaseId: fd(formData, "phaseId"),
    });
  if (!ids.success) return fail(ERROR_MESSAGES.invalidInput);

  const parsed = parseLessonMeta(formData);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const admin = createSupabaseAdminClient();
  const position = await nextPosition("lessons", "learning_phase_id", ids.data.phaseId);
  const { data, error } = await admin
    .from("lessons")
    .insert({
      learning_phase_id: ids.data.phaseId,
      position,
      title: parsed.data.title,
      summary: parsed.data.summary ?? null,
      estimated_minutes: parsed.data.estimatedMinutes ?? null,
      status: "draft",
      created_by: guard.profileId,
      updated_by: guard.profileId,
    })
    .select("id")
    .single();
  if (error || data === null) return fail(mapSupabaseError(error, ERROR_MESSAGES.save));

  await writeAuditLog({
    actorProfileId: guard.profileId,
    action: "lessons.create",
    targetType: "lesson",
    targetId: (data as { id: string }).id,
    metadata: { phaseId: ids.data.phaseId, title: parsed.data.title },
  });

  revalidatePath(`/programme/${ids.data.programId}/module/${ids.data.moduleId}`);
  revalidatePath("/inhalte");
  return success();
}

export async function updateLessonAction(
  _prev: DialogActionState,
  formData: FormData,
): Promise<DialogActionState> {
  const guard = await requireCapability("content.edit");
  if (!guard.ok) return fail(guard.error);

  const ids = z
    .object({ programId: uuidSchema, moduleId: uuidSchema, lessonId: uuidSchema })
    .safeParse({
      programId: fd(formData, "programmId"),
      moduleId: fd(formData, "modulId"),
      lessonId: fd(formData, "lektionId"),
    });
  if (!ids.success) return fail(ERROR_MESSAGES.invalidInput);

  const parsed = parseLessonMeta(formData);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("lessons")
    .update({
      title: parsed.data.title,
      summary: parsed.data.summary ?? null,
      estimated_minutes: parsed.data.estimatedMinutes ?? null,
      updated_by: guard.profileId,
    })
    .eq("id", ids.data.lessonId);
  if (error) return fail(mapSupabaseError(error, ERROR_MESSAGES.save));

  await writeAuditLog({
    actorProfileId: guard.profileId,
    action: "lessons.update",
    targetType: "lesson",
    targetId: ids.data.lessonId,
    metadata: { title: parsed.data.title },
  });

  revalidatePath(`/programme/${ids.data.programId}/module/${ids.data.moduleId}`);
  revalidatePath(`/inhalte/${ids.data.lessonId}`);
  revalidatePath("/inhalte");
  return success();
}

export async function moveLessonAction(formData: FormData): Promise<void> {
  const parsed = z
    .object({
      programId: uuidSchema,
      moduleId: uuidSchema,
      phaseId: uuidSchema,
      lessonId: uuidSchema,
      richtung: directionSchema,
    })
    .safeParse({
      programId: fd(formData, "programmId"),
      moduleId: fd(formData, "modulId"),
      phaseId: fd(formData, "phaseId"),
      lessonId: fd(formData, "lektionId"),
      richtung: fd(formData, "richtung"),
    });
  if (!parsed.success) return;
  const back = `/programme/${parsed.data.programId}/module/${parsed.data.moduleId}`;

  const guard = await requireCapability("content.edit");
  if (!guard.ok) redirectWithNotice(back, "fehler", guard.error);

  const moveError = await moveRow(
    "lessons",
    "learning_phase_id",
    parsed.data.phaseId,
    parsed.data.lessonId,
    parsed.data.richtung as MoveDirection,
  );
  if (moveError !== null) redirectWithNotice(back, "fehler", moveError);

  await writeAuditLog({
    actorProfileId: guard.profileId,
    action: "lessons.reorder",
    targetType: "lesson",
    targetId: parsed.data.lessonId,
    metadata: { phaseId: parsed.data.phaseId, richtung: parsed.data.richtung },
  });

  revalidatePath(back);
}

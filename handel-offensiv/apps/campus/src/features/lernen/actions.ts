"use server";

/**
 * Server Actions des Lernkerns (Bloecke, Quiz, Uploads, Lektionsabschluss).
 *
 * Regeln (fuer JEDE Action):
 *  1. Sitzung erneut pruefen (requireCampusSession) – die aktive Gruppe kommt
 *     IMMER aus der Sitzung; eine cohortId aus dem Formular dient nur der
 *     Gleichheitspruefung (Schutz vor veralteten Tabs).
 *  2. Eingaben mit zod validieren.
 *  3. Schreiben ausschliesslich ueber den Client der NUTZERSITZUNG (RLS).
 *  4. Betroffene Pfade revalidieren.
 *  Fehlermeldungen sind deutsch – nie technische Codes.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { JsonObject, Uuid } from "@handel-offensiv/types";
import { safeParseBlockConfig } from "@handel-offensiv/validation";

import { ERROR_MESSAGES, mapSupabaseError } from "@/lib/errors";
import { requireCampusSession, type CampusSession } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { findMissingRequiredBlocks, missingBlocksMessage } from "./complete";
import { loadLesson } from "./data";
import { isOwnUploadPath, PARTICIPANT_UPLOADS_BUCKET, UPLOAD_ALLOWED_MIME, UPLOAD_MAX_BYTES, uploadPrefix } from "./upload-path";

/* ------------------------------------------------------------------------ */
/* Typen                                                                     */
/* ------------------------------------------------------------------------ */

export interface BlockActionState {
  ok: boolean;
  error: string | null;
  fieldErrors?: Record<string, string>;
  /** ISO-Zeitpunkt der letzten erfolgreichen Speicherung (fuer "Gespeichert") */
  savedAt?: string;
}

export interface QuizQuestionResult {
  question_id: Uuid;
  kind: "single" | "multiple" | "truefalse" | "freetext";
  correct: boolean | null;
  selected_option_ids: Uuid[];
  correct_option_ids: Uuid[];
  explanation: string | null;
}

export interface QuizSubmitResult {
  attempt_id: Uuid;
  attempt_no: number;
  score: number;
  max_score: number;
  passed: boolean | null;
  results: QuizQuestionResult[];
}

export interface QuizActionState extends BlockActionState {
  result?: QuizSubmitResult;
}

export interface UploadRegisterInput {
  blockId: string;
  lessonId: string;
  cohortId: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  originalName: string;
}

/* ------------------------------------------------------------------------ */
/* Helfer                                                                    */
/* ------------------------------------------------------------------------ */

const uuid = z.string().uuid();

const baseSchema = z.object({
  blockId: uuid,
  lessonId: uuid,
  cohortId: uuid,
});

const visibilitySchema = z.enum(["private", "trainer"]);

const STALE_COHORT = "Ihre aktive Gruppe hat sich geändert. Bitte laden Sie die Seite neu.";
const NO_COHORT = "Sie sind noch keiner Gruppe zugeordnet.";

interface ActionContext {
  session: CampusSession;
  cohortId: Uuid;
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
}

/** Sitzung + aktive Gruppe; prueft die Gleichheit mit der cohortId des Formulars. */
async function actionContext(formCohortId: string): Promise<ActionContext | { error: string }> {
  const session = await requireCampusSession();
  if (session.cohort === null) return { error: NO_COHORT };
  if (session.cohort.id !== formCohortId) return { error: STALE_COHORT };
  const supabase = await createSupabaseServerClient();
  return { session, cohortId: session.cohort.id, supabase };
}

function isError(ctx: ActionContext | { error: string }): ctx is { error: string } {
  return "error" in ctx;
}

function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

function revalidateLesson(lessonId: string): void {
  revalidatePath(`/lektionen/${lessonId}`);
  revalidatePath("/heute");
  revalidatePath("/programm");
}

function text(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}

function ok(): BlockActionState {
  return { ok: true, error: null, savedAt: new Date().toISOString() };
}

function failed(error: string, fieldErrors?: Record<string, string>): BlockActionState {
  return fieldErrors ? { ok: false, error, fieldErrors } : { ok: false, error };
}

/** Lektion beim ersten Speichern als begonnen markieren – ohne Abschluss zu ueberschreiben. */
async function markLessonInProgress(ctx: ActionContext, lessonId: Uuid): Promise<void> {
  await ctx.supabase.from("lesson_progress").upsert(
    { lesson_id: lessonId, profile_id: ctx.session.userId, cohort_id: ctx.cohortId, status: "in_progress" },
    { onConflict: "lesson_id,profile_id,cohort_id", ignoreDuplicates: true },
  );
}

/** Block-Konfiguration (ueber RLS) fuer serverseitige Regeln laden. */
async function loadBlockConfig(ctx: ActionContext, blockId: Uuid): Promise<{ block_type: string; config: unknown } | null> {
  const { data } = await ctx.supabase.from("content_blocks").select("block_type, config").eq("id", blockId).maybeSingle();
  return (data as { block_type: string; config: unknown } | null) ?? null;
}

/** block_responses upsert (PK profile_id, cohort_id, content_block_id) */
async function saveBlockResponse(ctx: ActionContext, blockId: Uuid, lessonId: Uuid, response: JsonObject): Promise<BlockActionState> {
  const { error } = await ctx.supabase.from("block_responses").upsert(
    { profile_id: ctx.session.userId, cohort_id: ctx.cohortId, content_block_id: blockId, response },
    { onConflict: "profile_id,cohort_id,content_block_id" },
  );
  if (error) return failed(mapSupabaseError(error, ERROR_MESSAGES.save));
  await markLessonInProgress(ctx, lessonId);
  revalidateLesson(lessonId);
  return ok();
}

/* ------------------------------------------------------------------------ */
/* Checkliste                                                                */
/* ------------------------------------------------------------------------ */

const checklistSchema = baseSchema.extend({
  checked: z.array(z.string().min(1).max(120)).max(100),
});

export async function saveChecklistAction(_prev: BlockActionState, formData: FormData): Promise<BlockActionState> {
  const parsed = checklistSchema.safeParse({
    blockId: formData.get("blockId"),
    lessonId: formData.get("lessonId"),
    cohortId: formData.get("cohortId"),
    checked: formData.getAll("items").filter((v): v is string => typeof v === "string"),
  });
  if (!parsed.success) return failed(ERROR_MESSAGES.invalidInput, fieldErrorsOf(parsed.error));

  const ctx = await actionContext(parsed.data.cohortId);
  if (isError(ctx)) return failed(ctx.error);

  // Nur bekannte Item-IDs speichern
  const block = await loadBlockConfig(ctx, parsed.data.blockId);
  const config = block ? safeParseBlockConfig("checklist", block.config) : null;
  if (!config || !config.success) return failed(ERROR_MESSAGES.notFound);
  const known = new Set(config.data.items.map((i) => i.id));
  const checked = parsed.data.checked.filter((id) => known.has(id));

  return saveBlockResponse(ctx, parsed.data.blockId, parsed.data.lessonId, { checked });
}

/* ------------------------------------------------------------------------ */
/* Skala                                                                     */
/* ------------------------------------------------------------------------ */

const scaleSchema = baseSchema.extend({
  value: z.coerce.number().int().min(0).max(10),
});

export async function saveScaleAction(_prev: BlockActionState, formData: FormData): Promise<BlockActionState> {
  const parsed = scaleSchema.safeParse({
    blockId: formData.get("blockId"),
    lessonId: formData.get("lessonId"),
    cohortId: formData.get("cohortId"),
    value: formData.get("value"),
  });
  if (!parsed.success) return failed("Bitte wählen Sie einen Wert auf der Skala.", fieldErrorsOf(parsed.error));

  const ctx = await actionContext(parsed.data.cohortId);
  if (isError(ctx)) return failed(ctx.error);

  const block = await loadBlockConfig(ctx, parsed.data.blockId);
  const config = block ? safeParseBlockConfig("scale", block.config) : null;
  if (!config || !config.success) return failed(ERROR_MESSAGES.notFound);
  if (parsed.data.value < config.data.min || parsed.data.value > config.data.max) {
    return failed("Bitte wählen Sie einen Wert auf der Skala.");
  }

  return saveBlockResponse(ctx, parsed.data.blockId, parsed.data.lessonId, { value: parsed.data.value });
}

/* ------------------------------------------------------------------------ */
/* Single / Multiple Choice                                                  */
/* ------------------------------------------------------------------------ */

const choiceSchema = baseSchema.extend({
  kind: z.enum(["single_choice", "multiple_choice"]),
  selected: z.array(z.string().min(1).max(120)).min(1, "Bitte wählen Sie eine Antwort.").max(50),
});

export async function saveChoiceAction(_prev: BlockActionState, formData: FormData): Promise<BlockActionState> {
  const parsed = choiceSchema.safeParse({
    blockId: formData.get("blockId"),
    lessonId: formData.get("lessonId"),
    cohortId: formData.get("cohortId"),
    kind: formData.get("kind"),
    selected: formData.getAll("selected").filter((v): v is string => typeof v === "string"),
  });
  if (!parsed.success) return failed("Bitte wählen Sie eine Antwort.", fieldErrorsOf(parsed.error));

  const ctx = await actionContext(parsed.data.cohortId);
  if (isError(ctx)) return failed(ctx.error);

  const block = await loadBlockConfig(ctx, parsed.data.blockId);
  if (!block || block.block_type !== parsed.data.kind) return failed(ERROR_MESSAGES.notFound);
  const config = safeParseBlockConfig(parsed.data.kind, block.config);
  if (!config.success) return failed(ERROR_MESSAGES.notFound);
  const known = new Set(config.data.options.map((o) => o.id));
  let selected = parsed.data.selected.filter((id) => known.has(id));
  if (parsed.data.kind === "single_choice") selected = selected.slice(0, 1);
  if (selected.length === 0) return failed("Bitte wählen Sie eine Antwort.");

  return saveBlockResponse(ctx, parsed.data.blockId, parsed.data.lessonId, { selected });
}

/* ------------------------------------------------------------------------ */
/* Praxisaufgabe (Erledigt-Schalter)                                         */
/* ------------------------------------------------------------------------ */

const practiceSchema = baseSchema.extend({
  done: z.enum(["true", "false"]),
});

export async function savePracticeTaskAction(_prev: BlockActionState, formData: FormData): Promise<BlockActionState> {
  const parsed = practiceSchema.safeParse({
    blockId: formData.get("blockId"),
    lessonId: formData.get("lessonId"),
    cohortId: formData.get("cohortId"),
    done: formData.get("done"),
  });
  if (!parsed.success) return failed(ERROR_MESSAGES.invalidInput);

  const ctx = await actionContext(parsed.data.cohortId);
  if (isError(ctx)) return failed(ctx.error);

  return saveBlockResponse(ctx, parsed.data.blockId, parsed.data.lessonId, {
    done: parsed.data.done === "true",
    doneAt: parsed.data.done === "true" ? new Date().toISOString() : null,
  });
}

/* ------------------------------------------------------------------------ */
/* Reflexion                                                                 */
/* ------------------------------------------------------------------------ */

const reflectionSchema = baseSchema.extend({
  body: z.string().trim().min(1, "Bitte schreiben Sie Ihre Gedanken auf.").max(5000, "Maximal 5000 Zeichen."),
  visibility: visibilitySchema.optional(),
});

export async function saveReflectionAction(_prev: BlockActionState, formData: FormData): Promise<BlockActionState> {
  const parsed = reflectionSchema.safeParse({
    blockId: formData.get("blockId"),
    lessonId: formData.get("lessonId"),
    cohortId: formData.get("cohortId"),
    body: formData.get("body"),
    visibility: formData.get("visibility") ?? undefined,
  });
  if (!parsed.success) return failed(ERROR_MESSAGES.invalidInput, fieldErrorsOf(parsed.error));

  const ctx = await actionContext(parsed.data.cohortId);
  if (isError(ctx)) return failed(ctx.error);

  // Sichtbarkeit: Wahl nur, wenn der Block sie erlaubt – sonst Standard (Default privat)
  const block = await loadBlockConfig(ctx, parsed.data.blockId);
  const config = block ? safeParseBlockConfig("reflection", block.config) : null;
  if (!config || !config.success) return failed(ERROR_MESSAGES.notFound);
  const visibility = config.data.allowVisibilityChoice
    ? (parsed.data.visibility ?? config.data.visibilityDefault)
    : config.data.visibilityDefault;

  const { error } = await ctx.supabase.from("reflection_entries").upsert(
    {
      content_block_id: parsed.data.blockId,
      profile_id: ctx.session.userId,
      cohort_id: ctx.cohortId,
      body: parsed.data.body,
      visibility,
    },
    { onConflict: "content_block_id,profile_id,cohort_id" },
  );
  if (error) return failed(mapSupabaseError(error, ERROR_MESSAGES.save));

  await markLessonInProgress(ctx, parsed.data.lessonId);
  revalidateLesson(parsed.data.lessonId);
  return ok();
}

/* ------------------------------------------------------------------------ */
/* Transferaufgabe                                                           */
/* ------------------------------------------------------------------------ */

const transferSchema = baseSchema.extend({
  noteText: z.string().trim().max(5000, "Maximal 5000 Zeichen.").optional(),
  visibility: visibilitySchema.default("private"),
});

export async function saveTransferTaskAction(_prev: BlockActionState, formData: FormData): Promise<BlockActionState> {
  const parsed = transferSchema.safeParse({
    blockId: formData.get("blockId"),
    lessonId: formData.get("lessonId"),
    cohortId: formData.get("cohortId"),
    noteText: formData.get("noteText") ?? undefined,
    visibility: formData.get("visibility") ?? undefined,
  });
  if (!parsed.success) return failed(ERROR_MESSAGES.invalidInput, fieldErrorsOf(parsed.error));

  const ctx = await actionContext(parsed.data.cohortId);
  if (isError(ctx)) return failed(ctx.error);

  const block = await loadBlockConfig(ctx, parsed.data.blockId);
  const config = block ? safeParseBlockConfig("transfer_task", block.config) : null;
  if (!config || !config.success) return failed(ERROR_MESSAGES.notFound);

  // Transfer-Nachfragen (§11): nur konfigurierte Fragen, je max. 2000 Zeichen
  const answers: JsonObject = {};
  const fieldErrors: Record<string, string> = {};
  for (const q of config.data.followUpQuestions ?? []) {
    const value = text(formData, `fq_${q.id}`).trim();
    if (value.length > 2000) fieldErrors[`fq_${q.id}`] = "Maximal 2000 Zeichen.";
    if (value.length > 0) answers[q.id] = value;
  }
  if (Object.keys(fieldErrors).length > 0) return failed(ERROR_MESSAGES.invalidInput, fieldErrors);

  const noteText = parsed.data.noteText !== undefined && parsed.data.noteText.length > 0 ? parsed.data.noteText : null;
  if (config.data.evidence.text && noteText === null && Object.keys(answers).length === 0) {
    return failed("Bitte beschreiben Sie kurz, was Sie umgesetzt haben.", { noteText: "Bitte einen Text eingeben." });
  }

  const { error } = await ctx.supabase.from("assignment_submissions").upsert(
    {
      content_block_id: parsed.data.blockId,
      profile_id: ctx.session.userId,
      cohort_id: ctx.cohortId,
      note_text: noteText,
      answers,
      visibility: parsed.data.visibility,
    },
    { onConflict: "content_block_id,profile_id,cohort_id" },
  );
  if (error) return failed(mapSupabaseError(error, ERROR_MESSAGES.save));

  await markLessonInProgress(ctx, parsed.data.lessonId);
  revalidateLesson(parsed.data.lessonId);
  return ok();
}

/* ------------------------------------------------------------------------ */
/* Datei-Nachweise (participant-uploads -> submission_files)                 */
/* ------------------------------------------------------------------------ */

const uploadRegisterSchema = baseSchema.extend({
  storagePath: z.string().min(1).max(600),
  mimeType: z.string().min(1).max(120),
  sizeBytes: z.number().int().positive().max(UPLOAD_MAX_BYTES),
  originalName: z.string().trim().min(1).max(255),
});

/**
 * Nach dem Browser-Upload in den Bucket: Abgabe-Zeile sicherstellen und die
 * Datei in submission_files eintragen. Der Pfad MUSS im eigenen Ordner der
 * aktiven Gruppe liegen (Gegenpruefung zur Storage-RLS).
 */
export async function registerUploadAction(input: UploadRegisterInput): Promise<BlockActionState> {
  const parsed = uploadRegisterSchema.safeParse(input);
  if (!parsed.success) return failed(ERROR_MESSAGES.invalidInput);

  const ctx = await actionContext(parsed.data.cohortId);
  if (isError(ctx)) return failed(ctx.error);
  if (ctx.session.organization === null) return failed(NO_COHORT);

  const prefix = uploadPrefix(ctx.session.organization.id, ctx.cohortId, ctx.session.userId);
  if (!isOwnUploadPath(parsed.data.storagePath, prefix)) return failed(ERROR_MESSAGES.forbidden);
  if (!UPLOAD_ALLOWED_MIME.includes(parsed.data.mimeType)) return failed("Dieses Dateiformat wird nicht unterstützt.");

  const block = await loadBlockConfig(ctx, parsed.data.blockId);
  if (!block || !["transfer_task", "file_upload", "photo_upload"].includes(block.block_type)) {
    return failed(ERROR_MESSAGES.notFound);
  }

  // Abgabe-Zeile sicherstellen (unique je Block/Profil/Gruppe)
  const existing = await ctx.supabase
    .from("assignment_submissions")
    .select("id")
    .eq("content_block_id", parsed.data.blockId)
    .eq("profile_id", ctx.session.userId)
    .eq("cohort_id", ctx.cohortId)
    .maybeSingle();
  if (existing.error) return failed(mapSupabaseError(existing.error, ERROR_MESSAGES.save));

  let submissionId = (existing.data as { id: Uuid } | null)?.id ?? null;
  if (submissionId === null) {
    const created = await ctx.supabase
      .from("assignment_submissions")
      .insert({ content_block_id: parsed.data.blockId, profile_id: ctx.session.userId, cohort_id: ctx.cohortId, visibility: "private" })
      .select("id")
      .single();
    if (created.error) return failed(mapSupabaseError(created.error, ERROR_MESSAGES.save));
    submissionId = (created.data as { id: Uuid }).id;
  }

  // Limit je Block (file_upload.maxFiles, sonst 5)
  const files = await ctx.supabase.from("submission_files").select("id").eq("submission_id", submissionId);
  if (files.error) return failed(mapSupabaseError(files.error, ERROR_MESSAGES.save));
  let maxFiles = 5;
  if (block.block_type === "file_upload") {
    const cfg = safeParseBlockConfig("file_upload", block.config);
    if (cfg.success) maxFiles = cfg.data.maxFiles;
  }
  if ((files.data ?? []).length >= maxFiles) {
    await ctx.supabase.storage.from(PARTICIPANT_UPLOADS_BUCKET).remove([parsed.data.storagePath]);
    return failed(maxFiles === 1 ? "Es ist nur eine Datei möglich. Bitte entfernen Sie zuerst die vorhandene." : `Es sind maximal ${maxFiles} Dateien möglich.`);
  }

  const { error } = await ctx.supabase.from("submission_files").insert({
    submission_id: submissionId,
    storage_path: parsed.data.storagePath,
    mime_type: parsed.data.mimeType,
    size_bytes: parsed.data.sizeBytes,
    original_name: parsed.data.originalName,
  });
  if (error) return failed(mapSupabaseError(error, ERROR_MESSAGES.save));

  await markLessonInProgress(ctx, parsed.data.lessonId);
  revalidateLesson(parsed.data.lessonId);
  return ok();
}

const deleteFileSchema = z.object({ fileId: uuid, lessonId: uuid, cohortId: uuid });

/** Eigene Datei entfernen (submission_files + Storage-Objekt). */
export async function deleteUploadAction(_prev: BlockActionState, formData: FormData): Promise<BlockActionState> {
  const parsed = deleteFileSchema.safeParse({
    fileId: formData.get("fileId"),
    lessonId: formData.get("lessonId"),
    cohortId: formData.get("cohortId"),
  });
  if (!parsed.success) return failed(ERROR_MESSAGES.invalidInput);

  const ctx = await actionContext(parsed.data.cohortId);
  if (isError(ctx)) return failed(ctx.error);

  const file = await ctx.supabase.from("submission_files").select("id, storage_path").eq("id", parsed.data.fileId).maybeSingle();
  if (file.error) return failed(mapSupabaseError(file.error, ERROR_MESSAGES.save));
  const row = file.data as { id: Uuid; storage_path: string } | null;
  if (row === null) return failed(ERROR_MESSAGES.notFound);

  const { error } = await ctx.supabase.from("submission_files").delete().eq("id", row.id);
  if (error) return failed(mapSupabaseError(error, ERROR_MESSAGES.save));
  await ctx.supabase.storage.from(PARTICIPANT_UPLOADS_BUCKET).remove([row.storage_path]);

  revalidateLesson(parsed.data.lessonId);
  return ok();
}

/* ------------------------------------------------------------------------ */
/* Quiz (RPC submit_quiz_attempt, Migration 0007)                            */
/* ------------------------------------------------------------------------ */

const quizBaseSchema = baseSchema.extend({ quizId: uuid });

const quizResultSchema = z.object({
  attempt_id: uuid,
  attempt_no: z.number().int(),
  score: z.number(),
  max_score: z.number(),
  passed: z.boolean().nullable(),
  results: z.array(
    z.object({
      question_id: uuid,
      kind: z.enum(["single", "multiple", "truefalse", "freetext"]),
      correct: z.boolean().nullable(),
      selected_option_ids: z.array(uuid).nullable().transform((v) => v ?? []),
      correct_option_ids: z.array(uuid).nullable().transform((v) => v ?? []),
      explanation: z.string().nullable(),
    }),
  ),
});

/**
 * Antworten aus dem Formular:
 *  q_<questionId>  = eine Option (single/truefalse) bzw. Freitext
 *  qm_<questionId> = mehrere Optionen (multiple)
 */
function collectQuizAnswers(formData: FormData): { answers: Record<string, string | string[]>; error: string | null } {
  const answers: Record<string, string | string[]> = {};
  for (const key of new Set(formData.keys())) {
    if (key.startsWith("qm_")) {
      const questionId = key.slice(3);
      if (!uuid.safeParse(questionId).success) continue;
      const ids = formData.getAll(key).filter((v): v is string => typeof v === "string" && uuid.safeParse(v).success);
      if (ids.length > 0) answers[questionId] = ids;
    } else if (key.startsWith("q_")) {
      const questionId = key.slice(2);
      if (!uuid.safeParse(questionId).success) continue;
      const value = text(formData, key).trim();
      if (value.length > 4000) return { answers, error: "Eine Antwort ist zu lang (maximal 4000 Zeichen)." };
      if (value.length > 0) answers[questionId] = value;
    }
  }
  return { answers, error: null };
}

export async function submitQuizAction(_prev: QuizActionState, formData: FormData): Promise<QuizActionState> {
  const parsed = quizBaseSchema.safeParse({
    blockId: formData.get("blockId"),
    lessonId: formData.get("lessonId"),
    cohortId: formData.get("cohortId"),
    quizId: formData.get("quizId"),
  });
  if (!parsed.success) return failed(ERROR_MESSAGES.invalidInput);

  const ctx = await actionContext(parsed.data.cohortId);
  if (isError(ctx)) return failed(ctx.error);

  const { answers, error: answersError } = collectQuizAnswers(formData);
  if (answersError !== null) return failed(answersError);
  if (Object.keys(answers).length === 0) return failed("Bitte beantworten Sie mindestens eine Frage.");

  const { data, error } = await ctx.supabase.rpc("submit_quiz_attempt", {
    p_quiz_id: parsed.data.quizId,
    p_cohort_id: ctx.cohortId,
    p_answers: answers,
  });
  if (error) {
    const message = (error.message ?? "").toLowerCase();
    if (message.includes("versuch") || message.includes("attempt")) {
      return failed("Sie haben die maximale Anzahl an Versuchen erreicht.");
    }
    return failed(mapSupabaseError(error, ERROR_MESSAGES.save));
  }
  const result = quizResultSchema.safeParse(data);
  if (!result.success) return failed(ERROR_MESSAGES.generic);

  await markLessonInProgress(ctx, parsed.data.lessonId);
  revalidateLesson(parsed.data.lessonId);
  return { ...ok(), result: result.data };
}

/* ------------------------------------------------------------------------ */
/* Lektion abschliessen                                                      */
/* ------------------------------------------------------------------------ */

const completeSchema = z.object({ lessonId: uuid, cohortId: uuid });

export async function completeLessonAction(_prev: BlockActionState, formData: FormData): Promise<BlockActionState> {
  const parsed = completeSchema.safeParse({
    lessonId: formData.get("lessonId"),
    cohortId: formData.get("cohortId"),
  });
  if (!parsed.success) return failed(ERROR_MESSAGES.invalidInput);

  const ctx = await actionContext(parsed.data.cohortId);
  if (isError(ctx)) return failed(ctx.error);

  // Bearbeitungsstand serverseitig ermitteln (Port von findMissingRequiredBlocks)
  const bundle = await loadLesson(ctx.supabase, ctx.session.userId, ctx.cohortId, parsed.data.lessonId);
  if (bundle === null) return failed(ERROR_MESSAGES.notFound);
  const missing = findMissingRequiredBlocks(bundle.blocks, bundle.done);
  if (missing.length > 0) return failed(missingBlocksMessage(missing));

  const { error } = await ctx.supabase.from("lesson_progress").upsert(
    {
      lesson_id: parsed.data.lessonId,
      profile_id: ctx.session.userId,
      cohort_id: ctx.cohortId,
      status: "completed",
      completed_at: new Date().toISOString(),
    },
    { onConflict: "lesson_id,profile_id,cohort_id" },
  );
  if (error) return failed(mapSupabaseError(error, "Der Abschluss konnte gerade nicht gespeichert werden. Bitte versuchen Sie es erneut."));

  revalidateLesson(parsed.data.lessonId);
  return ok();
}

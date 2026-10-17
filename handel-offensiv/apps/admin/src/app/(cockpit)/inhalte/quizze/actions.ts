"use server";

/**
 * Server Actions Quiz-Verwaltung: Quiz (Titel, Bestehensgrenze, Versuche,
 * Zufallsreihenfolge), Fragen (single/multiple/truefalse/freetext) inkl.
 * Optionen und Erklärung. Regel je Mutation: can() -> Zod -> Service Role
 * -> audit_logs.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { QUESTION_KINDS, type QuestionKind } from "@handel-offensiv/types";

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

function redirectWithNotice(path: string, kind: "fehler" | "erfolg", message: string): never {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}${kind}=${encodeURIComponent(message)}`);
}

/* -------------------------------- Quiz --------------------------------- */

const quizSchema = z.object({
  title: z.string().trim().min(1, "Titel erforderlich"),
  description: z.string().trim().optional(),
  passScore: z
    .number({ invalid_type_error: "Bestehensgrenze: bitte eine Zahl angeben" })
    .int("Bestehensgrenze: bitte eine ganze Zahl angeben")
    .min(0, "Bestehensgrenze: mindestens 0")
    .optional(),
  maxAttempts: z
    .number({ invalid_type_error: "Versuche: bitte eine Zahl angeben" })
    .int("Versuche: bitte eine ganze Zahl angeben")
    .min(1, "Versuche: mindestens 1")
    .optional(),
  shuffle: z.boolean(),
});

function parseQuiz(formData: FormData) {
  const passRaw = fd(formData, "bestehensgrenze");
  const attemptsRaw = fd(formData, "versuche");
  return quizSchema.safeParse({
    title: fd(formData, "titel"),
    description: fd(formData, "beschreibung"),
    passScore: passRaw === undefined ? undefined : Number(passRaw),
    maxAttempts: attemptsRaw === undefined ? undefined : Number(attemptsRaw),
    shuffle: formData.get("zufall") === "on",
  });
}

export async function createQuizAction(
  _prev: DialogActionState,
  formData: FormData,
): Promise<DialogActionState> {
  const guard = await requireCapability("content.edit");
  if (!guard.ok) return fail(guard.error);

  const parsed = parseQuiz(formData);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? ERROR_MESSAGES.invalidInput);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("quizzes")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      pass_score: parsed.data.passScore ?? null,
      max_attempts: parsed.data.maxAttempts ?? null,
      shuffle: parsed.data.shuffle,
    })
    .select("id")
    .single();
  if (error || data === null) return fail(mapSupabaseError(error, ERROR_MESSAGES.save));
  const quizId = (data as { id: string }).id;

  await writeAuditLog({
    actorProfileId: guard.profileId,
    action: "quizzes.create",
    targetType: "quiz",
    targetId: quizId,
    metadata: { title: parsed.data.title },
  });

  revalidatePath("/inhalte/quizze");
  redirect(`/inhalte/quizze/${quizId}`);
}

export async function updateQuizAction(
  _prev: DialogActionState,
  formData: FormData,
): Promise<DialogActionState> {
  const guard = await requireCapability("content.edit");
  if (!guard.ok) return fail(guard.error);

  const idParse = uuidSchema.safeParse(fd(formData, "quizId"));
  if (!idParse.success) return fail(ERROR_MESSAGES.invalidInput);

  const parsed = parseQuiz(formData);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? ERROR_MESSAGES.invalidInput);

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("quizzes")
    .update({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      pass_score: parsed.data.passScore ?? null,
      max_attempts: parsed.data.maxAttempts ?? null,
      shuffle: parsed.data.shuffle,
    })
    .eq("id", idParse.data);
  if (error) return fail(mapSupabaseError(error, ERROR_MESSAGES.save));

  await writeAuditLog({
    actorProfileId: guard.profileId,
    action: "quizzes.update",
    targetType: "quiz",
    targetId: idParse.data,
    metadata: { title: parsed.data.title },
  });

  revalidatePath("/inhalte/quizze");
  revalidatePath(`/inhalte/quizze/${idParse.data}`);
  return success();
}

export async function deleteQuizAction(formData: FormData): Promise<void> {
  const idParse = uuidSchema.safeParse(fd(formData, "quizId"));
  if (!idParse.success) return;
  const quizId = idParse.data;
  const back = "/inhalte/quizze";

  const guard = await requireCapability("content.edit");
  if (!guard.ok) redirectWithNotice(back, "fehler", guard.error);

  const admin = createSupabaseAdminClient();

  // Verweise pruefen: Quiz-Bloecke referenzieren config.quizId (jsonb, kein FK)
  const { count, error: usageError } = await admin
    .from("content_blocks")
    .select("id", { count: "exact", head: true })
    .eq("block_type", "quiz")
    .contains("config", { quizId });
  if (usageError) redirectWithNotice(back, "fehler", ERROR_MESSAGES.save);
  if ((count ?? 0) > 0) {
    redirectWithNotice(
      back,
      "fehler",
      "Dieses Quiz wird noch in mindestens einer Lektion verwendet und kann nicht gelöscht werden.",
    );
  }

  const { error } = await admin.from("quizzes").delete().eq("id", quizId);
  if (error) redirectWithNotice(back, "fehler", mapSupabaseError(error, ERROR_MESSAGES.save));

  await writeAuditLog({
    actorProfileId: guard.profileId,
    action: "quizzes.delete",
    targetType: "quiz",
    targetId: quizId,
  });

  revalidatePath(back);
  redirectWithNotice(back, "erfolg", "Das Quiz wurde gelöscht.");
}

/* -------------------------------- Fragen -------------------------------- */

const questionSchema = z.object({
  kind: z.enum(QUESTION_KINDS),
  body: z.string().trim().min(1, "Fragetext erforderlich"),
  explanation: z.string().trim().optional(),
  points: z
    .number({ invalid_type_error: "Punkte: bitte eine Zahl angeben" })
    .int("Punkte: bitte eine ganze Zahl angeben")
    .min(1, "Punkte: mindestens 1")
    .max(100, "Punkte: maximal 100"),
});

interface ParsedOption {
  body: string;
  is_correct: boolean;
}

/** Optionen je Fragetyp aus dem Formular ableiten und fachlich pruefen. */
function buildOptions(
  kind: QuestionKind,
  formData: FormData,
): { options: ParsedOption[] } | { error: string } {
  if (kind === "freetext") return { options: [] };

  if (kind === "truefalse") {
    const correct = fd(formData, "richtigFalsch") === "falsch" ? "falsch" : "richtig";
    return {
      options: [
        { body: "Richtig", is_correct: correct === "richtig" },
        { body: "Falsch", is_correct: correct === "falsch" },
      ],
    };
  }

  const lines = (fd(formData, "optionen") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
  const options = lines.map((line) => ({
    body: line.replace(/^\*\s*/, ""),
    is_correct: /^\*\s*/.test(line),
  }));

  if (options.length < 2) {
    return { error: "Bitte mindestens zwei Antwortoptionen angeben (eine pro Zeile)." };
  }
  const correctCount = options.filter((o) => o.is_correct).length;
  if (correctCount === 0) {
    return { error: 'Bitte mindestens eine richtige Antwort mit "* " am Zeilenanfang markieren.' };
  }
  if (kind === "single" && correctCount > 1) {
    return { error: "Bei Single Choice darf genau eine Antwort richtig sein." };
  }
  return { options };
}

export async function createQuestionAction(
  _prev: DialogActionState,
  formData: FormData,
): Promise<DialogActionState> {
  const guard = await requireCapability("content.edit");
  if (!guard.ok) return fail(guard.error);

  const idParse = uuidSchema.safeParse(fd(formData, "quizId"));
  if (!idParse.success) return fail(ERROR_MESSAGES.invalidInput);
  const quizId = idParse.data;

  const pointsRaw = fd(formData, "punkte");
  const parsed = questionSchema.safeParse({
    kind: fd(formData, "fragetyp"),
    body: fd(formData, "fragetext"),
    explanation: fd(formData, "erklaerung"),
    points: pointsRaw === undefined ? 1 : Number(pointsRaw),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? ERROR_MESSAGES.invalidInput);

  const built = buildOptions(parsed.data.kind, formData);
  if ("error" in built) return fail(built.error);

  const admin = createSupabaseAdminClient();
  const position = await nextPosition("quiz_questions", "quiz_id", quizId);
  const { data, error } = await admin
    .from("quiz_questions")
    .insert({
      quiz_id: quizId,
      position,
      kind: parsed.data.kind,
      body: parsed.data.body,
      explanation: parsed.data.explanation ?? null,
      points: parsed.data.points,
    })
    .select("id")
    .single();
  if (error || data === null) return fail(mapSupabaseError(error, ERROR_MESSAGES.save));
  const questionId = (data as { id: string }).id;

  if (built.options.length > 0) {
    const { error: optionsError } = await admin.from("quiz_options").insert(
      built.options.map((option, index) => ({
        question_id: questionId,
        position: index + 1,
        body: option.body,
        is_correct: option.is_correct,
      })),
    );
    if (optionsError) {
      await admin.from("quiz_questions").delete().eq("id", questionId);
      return fail(mapSupabaseError(optionsError, ERROR_MESSAGES.save));
    }
  }

  await writeAuditLog({
    actorProfileId: guard.profileId,
    action: "quiz_questions.create",
    targetType: "quiz_question",
    targetId: questionId,
    metadata: { quizId, kind: parsed.data.kind },
  });

  revalidatePath(`/inhalte/quizze/${quizId}`);
  return success();
}

export async function updateQuestionAction(
  _prev: DialogActionState,
  formData: FormData,
): Promise<DialogActionState> {
  const guard = await requireCapability("content.edit");
  if (!guard.ok) return fail(guard.error);

  const ids = z
    .object({ quizId: uuidSchema, questionId: uuidSchema })
    .safeParse({ quizId: fd(formData, "quizId"), questionId: fd(formData, "frageId") });
  if (!ids.success) return fail(ERROR_MESSAGES.invalidInput);

  const pointsRaw = fd(formData, "punkte");
  const parsed = questionSchema.safeParse({
    kind: fd(formData, "fragetyp"),
    body: fd(formData, "fragetext"),
    explanation: fd(formData, "erklaerung"),
    points: pointsRaw === undefined ? 1 : Number(pointsRaw),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? ERROR_MESSAGES.invalidInput);

  const built = buildOptions(parsed.data.kind, formData);
  if ("error" in built) return fail(built.error);

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("quiz_questions")
    .update({
      kind: parsed.data.kind,
      body: parsed.data.body,
      explanation: parsed.data.explanation ?? null,
      points: parsed.data.points,
    })
    .eq("id", ids.data.questionId)
    .eq("quiz_id", ids.data.quizId);
  if (error) return fail(mapSupabaseError(error, ERROR_MESSAGES.save));

  // Optionen ersetzen (Hinweis: bestehende Antwort-Referenzen in
  // quiz_attempts verlieren dadurch ihren Bezug – bewusst einfach gehalten)
  const { error: deleteError } = await admin
    .from("quiz_options")
    .delete()
    .eq("question_id", ids.data.questionId);
  if (deleteError) return fail(mapSupabaseError(deleteError, ERROR_MESSAGES.save));

  if (built.options.length > 0) {
    const { error: optionsError } = await admin.from("quiz_options").insert(
      built.options.map((option, index) => ({
        question_id: ids.data.questionId,
        position: index + 1,
        body: option.body,
        is_correct: option.is_correct,
      })),
    );
    if (optionsError) return fail(mapSupabaseError(optionsError, ERROR_MESSAGES.save));
  }

  await writeAuditLog({
    actorProfileId: guard.profileId,
    action: "quiz_questions.update",
    targetType: "quiz_question",
    targetId: ids.data.questionId,
    metadata: { quizId: ids.data.quizId, kind: parsed.data.kind },
  });

  revalidatePath(`/inhalte/quizze/${ids.data.quizId}`);
  return success();
}

export async function moveQuestionAction(formData: FormData): Promise<void> {
  const parsed = z
    .object({ quizId: uuidSchema, questionId: uuidSchema, richtung: directionSchema })
    .safeParse({
      quizId: fd(formData, "quizId"),
      questionId: fd(formData, "frageId"),
      richtung: fd(formData, "richtung"),
    });
  if (!parsed.success) return;
  const back = `/inhalte/quizze/${parsed.data.quizId}`;

  const guard = await requireCapability("content.edit");
  if (!guard.ok) redirectWithNotice(back, "fehler", guard.error);

  const moveError = await moveRow(
    "quiz_questions",
    "quiz_id",
    parsed.data.quizId,
    parsed.data.questionId,
    parsed.data.richtung as MoveDirection,
  );
  if (moveError !== null) redirectWithNotice(back, "fehler", moveError);

  await writeAuditLog({
    actorProfileId: guard.profileId,
    action: "quiz_questions.reorder",
    targetType: "quiz_question",
    targetId: parsed.data.questionId,
    metadata: { quizId: parsed.data.quizId, richtung: parsed.data.richtung },
  });

  revalidatePath(back);
}

export async function deleteQuestionAction(formData: FormData): Promise<void> {
  const parsed = z
    .object({ quizId: uuidSchema, questionId: uuidSchema })
    .safeParse({ quizId: fd(formData, "quizId"), questionId: fd(formData, "frageId") });
  if (!parsed.success) return;
  const back = `/inhalte/quizze/${parsed.data.quizId}`;

  const guard = await requireCapability("content.edit");
  if (!guard.ok) redirectWithNotice(back, "fehler", guard.error);

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("quiz_questions")
    .delete()
    .eq("id", parsed.data.questionId)
    .eq("quiz_id", parsed.data.quizId);
  if (error) redirectWithNotice(back, "fehler", mapSupabaseError(error, ERROR_MESSAGES.save));

  await writeAuditLog({
    actorProfileId: guard.profileId,
    action: "quiz_questions.delete",
    targetType: "quiz_question",
    targetId: parsed.data.questionId,
    metadata: { quizId: parsed.data.quizId },
  });

  revalidatePath(back);
  redirectWithNotice(back, "erfolg", "Die Frage wurde gelöscht.");
}

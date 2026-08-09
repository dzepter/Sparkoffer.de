"use server";

/**
 * Server Actions Bereich INHALTE (§24): Lektions-Editor mit Content-Blöcken.
 * Jede Block-Konfiguration wird serverseitig ueber parseBlockConfig
 * (@handel-offensiv/validation) gegen das Zod-Schema des Blocktyps geprueft.
 * Regel je Mutation: can() -> Zod -> Service Role -> audit_logs.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { BlockType, ContentBlockRow, JsonObject } from "@handel-offensiv/types";
import { blockTypeSchema, safeParseBlockConfig } from "@handel-offensiv/validation";

import { writeAuditLog } from "@/lib/audit";
import { requireCapability } from "@/lib/content-guard";
import { berlinLocalToIso, BLOCK_TYPE_LABELS, type DialogActionState } from "@/lib/content-meta";
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

function fdChecked(formData: FormData, name: string): boolean {
  return formData.get(name) === "on";
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

function revalidateEditor(lessonId: string): void {
  revalidatePath("/inhalte");
  revalidatePath(`/inhalte/${lessonId}`);
}

/* --------------------- Config aus Formularfeldern bauen ----------------- */

interface IdLabel {
  id: string;
  label: string;
}

/** Vorhandene IDs anhand identischer Labels weiterverwenden (stabile IDs). */
function withStableIds(labels: string[], previous: IdLabel[]): IdLabel[] {
  const used = new Set<string>();
  return labels.map((label) => {
    const prev = previous.find((p) => p.label === label && !used.has(p.id));
    const id = prev?.id ?? crypto.randomUUID();
    used.add(id);
    return { id, label };
  });
}

function readPreviousItems(existing: JsonObject | null, key: "items" | "options"): IdLabel[] {
  const raw = existing?.[key];
  if (!Array.isArray(raw)) return [];
  const result: IdLabel[] = [];
  for (const entry of raw) {
    if (
      entry !== null &&
      typeof entry === "object" &&
      !Array.isArray(entry) &&
      typeof (entry as JsonObject).id === "string" &&
      typeof (entry as JsonObject).label === "string"
    ) {
      result.push({ id: (entry as JsonObject).id as string, label: (entry as JsonObject).label as string });
    }
  }
  return result;
}

function splitLines(raw: string | undefined): string[] {
  return (raw ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

/**
 * Baut aus den (typspezifischen) Formularfeldern das config-Objekt.
 * Die fachliche Validierung uebernimmt danach parseBlockConfig.
 */
function buildConfig(
  blockType: BlockType,
  formData: FormData,
  existing: JsonObject | null,
): { config: unknown } | { error: string } {
  switch (blockType) {
    case "text": {
      const mode = fd(formData, "modus") === "markdown" ? "markdown" : "html";
      const content = fd(formData, "inhalt") ?? "";
      return { config: mode === "markdown" ? { markdown: content } : { html: content } };
    }

    case "video": {
      const provider = fd(formData, "provider") === "storage" ? "storage" : "external";
      const durationRaw = fd(formData, "dauerSekunden");
      const base: Record<string, unknown> = {
        title: fd(formData, "titel"),
        description: fd(formData, "beschreibung"),
        durationSeconds: durationRaw === undefined ? undefined : Number(durationRaw),
      };
      return {
        config:
          provider === "storage"
            ? { provider, storagePath: fd(formData, "storagePfad"), ...base }
            : { provider, url: fd(formData, "url"), ...base },
      };
    }

    case "audio": {
      const durationRaw = fd(formData, "dauerSekunden");
      return {
        config: {
          storagePath: fd(formData, "storagePfad"),
          title: fd(formData, "titel"),
          durationSeconds: durationRaw === undefined ? undefined : Number(durationRaw),
        },
      };
    }

    case "pdf":
      return { config: { storagePath: fd(formData, "storagePfad"), title: fd(formData, "titel") } };

    case "image":
      return {
        config: {
          storagePath: fd(formData, "storagePfad"),
          alt: fd(formData, "alt"),
          caption: fd(formData, "bildunterschrift"),
        },
      };

    case "checklist": {
      const items = withStableIds(
        splitLines(fd(formData, "punkte")),
        readPreviousItems(existing, "items"),
      );
      return { config: { items } };
    }

    case "reflection":
      return {
        config: {
          question: fd(formData, "frage"),
          visibilityDefault: fd(formData, "sichtbarkeit") === "trainer" ? "trainer" : "private",
          allowVisibilityChoice: fdChecked(formData, "sichtbarkeitWaehlbar"),
        },
      };

    case "single_choice":
    case "multiple_choice": {
      const lines = splitLines(fd(formData, "optionen"));
      const labels = lines.map((line) => line.replace(/^\*\s*/, ""));
      const withIds = withStableIds(labels, readPreviousItems(existing, "options"));
      const options = withIds.map((option, index) => ({
        ...option,
        correct: /^\*\s*/.test(lines[index] ?? ""),
      }));
      return {
        config: {
          question: fd(formData, "frage"),
          options,
          explanation: fd(formData, "erklaerung"),
        },
      };
    }

    case "quiz":
      return { config: { quizId: fd(formData, "quizId") } };

    case "scale": {
      const minRaw = fd(formData, "min");
      const maxRaw = fd(formData, "max");
      return {
        config: {
          question: fd(formData, "frage"),
          min: minRaw === undefined ? 1 : Number(minRaw),
          max: maxRaw === undefined ? 10 : Number(maxRaw),
          minLabel: fd(formData, "minLabel"),
          maxLabel: fd(formData, "maxLabel"),
        },
      };
    }

    case "transfer_task": {
      const dueMode = fd(formData, "faelligkeit");
      const config: Record<string, unknown> = {
        title: fd(formData, "titel"),
        description: fd(formData, "beschreibung"),
        evidence: {
          text: fdChecked(formData, "nachweisText"),
          image: fdChecked(formData, "nachweisBild"),
          file: fdChecked(formData, "nachweisDatei"),
        },
      };
      if (dueMode === "fixed") {
        const local = fd(formData, "faelligAm");
        const iso = local === undefined ? null : berlinLocalToIso(local);
        if (iso === null) {
          return { error: "Bitte geben Sie ein gültiges Fälligkeitsdatum an." };
        }
        config.dueMode = "fixed";
        config.dueAt = iso;
      } else if (dueMode === "days_after_release") {
        const daysRaw = fd(formData, "faelligTage");
        config.dueMode = "days_after_release";
        config.dueDays = daysRaw === undefined ? undefined : Number(daysRaw);
      }
      return { config };
    }

    case "download":
      return {
        config: {
          storagePath: fd(formData, "storagePfad"),
          title: fd(formData, "titel"),
          description: fd(formData, "beschreibung"),
        },
      };

    case "external_link":
      return {
        config: {
          url: fd(formData, "url"),
          label: fd(formData, "label"),
          note: fd(formData, "hinweis"),
        },
      };
  }
}

/** Validiert die Config und liefert eine deutsche Sammel-Fehlermeldung. */
function validateConfig(
  blockType: BlockType,
  config: unknown,
): { config: JsonObject } | { error: string } {
  const result = safeParseBlockConfig(blockType, config);
  if (!result.success) {
    const details = result.error.issues.map((issue) => issue.message).join("; ");
    return { error: `Bitte prüfen Sie die Eingaben: ${details}` };
  }
  return { config: result.data as unknown as JsonObject };
}

/* ------------------------------- Bloecke ------------------------------- */

export async function addBlockAction(
  _prev: DialogActionState,
  formData: FormData,
): Promise<DialogActionState> {
  const guard = await requireCapability("content.edit");
  if (!guard.ok) return fail(guard.error);

  const ids = z
    .object({ lessonId: uuidSchema, blockType: blockTypeSchema })
    .safeParse({ lessonId: fd(formData, "lektionId"), blockType: fd(formData, "blockTyp") });
  if (!ids.success) return fail(ERROR_MESSAGES.invalidInput);

  const built = buildConfig(ids.data.blockType, formData, null);
  if ("error" in built) return fail(built.error);
  const validated = validateConfig(ids.data.blockType, built.config);
  if ("error" in validated) return fail(validated.error);

  const admin = createSupabaseAdminClient();
  const position = await nextPosition("content_blocks", "lesson_id", ids.data.lessonId);
  const { data, error } = await admin
    .from("content_blocks")
    .insert({
      lesson_id: ids.data.lessonId,
      position,
      block_type: ids.data.blockType,
      config: validated.config,
      required: fdChecked(formData, "pflicht"),
    })
    .select("id")
    .single();
  if (error || data === null) return fail(mapSupabaseError(error, ERROR_MESSAGES.save));

  await admin
    .from("lessons")
    .update({ updated_by: guard.profileId })
    .eq("id", ids.data.lessonId);

  await writeAuditLog({
    actorProfileId: guard.profileId,
    action: "content_blocks.create",
    targetType: "content_block",
    targetId: (data as { id: string }).id,
    metadata: { lessonId: ids.data.lessonId, blockType: ids.data.blockType, position },
  });

  revalidateEditor(ids.data.lessonId);
  return success();
}

export async function updateBlockAction(
  _prev: DialogActionState,
  formData: FormData,
): Promise<DialogActionState> {
  const guard = await requireCapability("content.edit");
  if (!guard.ok) return fail(guard.error);

  const ids = z
    .object({ lessonId: uuidSchema, blockId: uuidSchema })
    .safeParse({ lessonId: fd(formData, "lektionId"), blockId: fd(formData, "blockId") });
  if (!ids.success) return fail(ERROR_MESSAGES.invalidInput);

  const admin = createSupabaseAdminClient();
  const { data: existingData, error: loadError } = await admin
    .from("content_blocks")
    .select("id, lesson_id, block_type, config")
    .eq("id", ids.data.blockId)
    .maybeSingle();
  if (loadError) return fail(mapSupabaseError(loadError, ERROR_MESSAGES.save));
  const existing = existingData as Pick<
    ContentBlockRow,
    "id" | "lesson_id" | "block_type" | "config"
  > | null;
  if (existing === null || existing.lesson_id !== ids.data.lessonId) {
    return fail(ERROR_MESSAGES.notFound);
  }

  const built = buildConfig(existing.block_type, formData, existing.config);
  if ("error" in built) return fail(built.error);
  const validated = validateConfig(existing.block_type, built.config);
  if ("error" in validated) return fail(validated.error);

  const { error } = await admin
    .from("content_blocks")
    .update({ config: validated.config, required: fdChecked(formData, "pflicht") })
    .eq("id", existing.id);
  if (error) return fail(mapSupabaseError(error, ERROR_MESSAGES.save));

  await admin
    .from("lessons")
    .update({ updated_by: guard.profileId })
    .eq("id", ids.data.lessonId);

  await writeAuditLog({
    actorProfileId: guard.profileId,
    action: "content_blocks.update",
    targetType: "content_block",
    targetId: existing.id,
    metadata: { lessonId: ids.data.lessonId, blockType: existing.block_type },
  });

  revalidateEditor(ids.data.lessonId);
  return success();
}

export async function moveBlockAction(formData: FormData): Promise<void> {
  const parsed = z
    .object({ lessonId: uuidSchema, blockId: uuidSchema, richtung: directionSchema })
    .safeParse({
      lessonId: fd(formData, "lektionId"),
      blockId: fd(formData, "blockId"),
      richtung: fd(formData, "richtung"),
    });
  if (!parsed.success) return;
  const back = `/inhalte/${parsed.data.lessonId}`;

  const guard = await requireCapability("content.edit");
  if (!guard.ok) redirectWithNotice(back, "fehler", guard.error);

  const moveError = await moveRow(
    "content_blocks",
    "lesson_id",
    parsed.data.lessonId,
    parsed.data.blockId,
    parsed.data.richtung as MoveDirection,
  );
  if (moveError !== null) redirectWithNotice(back, "fehler", moveError);

  await writeAuditLog({
    actorProfileId: guard.profileId,
    action: "content_blocks.reorder",
    targetType: "content_block",
    targetId: parsed.data.blockId,
    metadata: { lessonId: parsed.data.lessonId, richtung: parsed.data.richtung },
  });

  revalidateEditor(parsed.data.lessonId);
}

export async function duplicateBlockAction(formData: FormData): Promise<void> {
  const parsed = z
    .object({ lessonId: uuidSchema, blockId: uuidSchema })
    .safeParse({ lessonId: fd(formData, "lektionId"), blockId: fd(formData, "blockId") });
  if (!parsed.success) return;
  const back = `/inhalte/${parsed.data.lessonId}`;

  const guard = await requireCapability("content.edit");
  if (!guard.ok) redirectWithNotice(back, "fehler", guard.error);

  const admin = createSupabaseAdminClient();
  const { data, error: loadError } = await admin
    .from("content_blocks")
    .select("id, lesson_id, block_type, config, required")
    .eq("id", parsed.data.blockId)
    .maybeSingle();
  if (loadError) redirectWithNotice(back, "fehler", ERROR_MESSAGES.save);
  const source = data as Pick<
    ContentBlockRow,
    "id" | "lesson_id" | "block_type" | "config" | "required"
  > | null;
  if (source === null || source.lesson_id !== parsed.data.lessonId) {
    redirectWithNotice(back, "fehler", ERROR_MESSAGES.notFound);
  }

  const position = await nextPosition("content_blocks", "lesson_id", parsed.data.lessonId);
  const { data: inserted, error } = await admin
    .from("content_blocks")
    .insert({
      lesson_id: source.lesson_id,
      position,
      block_type: source.block_type,
      config: source.config,
      required: source.required,
    })
    .select("id")
    .single();
  if (error || inserted === null) {
    redirectWithNotice(back, "fehler", mapSupabaseError(error, ERROR_MESSAGES.save));
  }

  await writeAuditLog({
    actorProfileId: guard.profileId,
    action: "content_blocks.duplicate",
    targetType: "content_block",
    targetId: (inserted as { id: string }).id,
    metadata: { lessonId: parsed.data.lessonId, sourceBlockId: source.id },
  });

  revalidateEditor(parsed.data.lessonId);
  redirectWithNotice(back, "erfolg", "Der Block wurde ans Ende der Lektion dupliziert.");
}

export async function deleteBlockAction(formData: FormData): Promise<void> {
  const parsed = z
    .object({ lessonId: uuidSchema, blockId: uuidSchema })
    .safeParse({ lessonId: fd(formData, "lektionId"), blockId: fd(formData, "blockId") });
  if (!parsed.success) return;
  const back = `/inhalte/${parsed.data.lessonId}`;

  const guard = await requireCapability("content.edit");
  if (!guard.ok) redirectWithNotice(back, "fehler", guard.error);

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("content_blocks")
    .delete()
    .eq("id", parsed.data.blockId)
    .eq("lesson_id", parsed.data.lessonId);
  if (error) redirectWithNotice(back, "fehler", mapSupabaseError(error, ERROR_MESSAGES.save));

  await writeAuditLog({
    actorProfileId: guard.profileId,
    action: "content_blocks.delete",
    targetType: "content_block",
    targetId: parsed.data.blockId,
    metadata: { lessonId: parsed.data.lessonId },
  });

  revalidateEditor(parsed.data.lessonId);
  redirectWithNotice(back, "erfolg", "Der Block wurde gelöscht.");
}

/* --------------------- Lektion: Status & Metadaten ---------------------- */

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

export async function updateLessonMetaAction(
  _prev: DialogActionState,
  formData: FormData,
): Promise<DialogActionState> {
  const guard = await requireCapability("content.edit");
  if (!guard.ok) return fail(guard.error);

  const idParse = uuidSchema.safeParse(fd(formData, "lektionId"));
  if (!idParse.success) return fail(ERROR_MESSAGES.invalidInput);

  const minutesRaw = fd(formData, "minuten");
  const parsed = lessonMetaSchema.safeParse({
    title: fd(formData, "titel"),
    summary: fd(formData, "zusammenfassung"),
    estimatedMinutes: minutesRaw === undefined ? undefined : Number(minutesRaw),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? ERROR_MESSAGES.invalidInput);

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("lessons")
    .update({
      title: parsed.data.title,
      summary: parsed.data.summary ?? null,
      estimated_minutes: parsed.data.estimatedMinutes ?? null,
      updated_by: guard.profileId,
    })
    .eq("id", idParse.data);
  if (error) return fail(mapSupabaseError(error, ERROR_MESSAGES.save));

  await writeAuditLog({
    actorProfileId: guard.profileId,
    action: "lessons.update",
    targetType: "lesson",
    targetId: idParse.data,
    metadata: { title: parsed.data.title },
  });

  revalidateEditor(idParse.data);
  return success();
}

async function changeLessonStatus(
  formData: FormData,
  target: "published" | "archived" | "draft",
): Promise<void> {
  const idParse = uuidSchema.safeParse(fd(formData, "lektionId"));
  if (!idParse.success) return;
  const lessonId = idParse.data;
  const back = `/inhalte/${lessonId}`;

  // Veroeffentlichen erfordert content.publish, alles andere content.edit
  const guard = await requireCapability(target === "published" ? "content.publish" : "content.edit");
  if (!guard.ok) redirectWithNotice(back, "fehler", guard.error);

  const admin = createSupabaseAdminClient();

  if (target === "published") {
    // Qualitaetsschranke: alle Block-Configs muessen dem Schema entsprechen
    const { data: blocksData, error: blocksError } = await admin
      .from("content_blocks")
      .select("id, position, block_type, config")
      .eq("lesson_id", lessonId)
      .order("position", { ascending: true });
    if (blocksError) redirectWithNotice(back, "fehler", ERROR_MESSAGES.save);
    const blocks = (blocksData ?? []) as Array<
      Pick<ContentBlockRow, "id" | "position" | "block_type" | "config">
    >;
    for (const [index, block] of blocks.entries()) {
      const check = safeParseBlockConfig(block.block_type, block.config);
      if (!check.success) {
        redirectWithNotice(
          back,
          "fehler",
          `Veröffentlichen nicht möglich: Block ${index + 1} (${BLOCK_TYPE_LABELS[block.block_type]}) ist unvollständig konfiguriert.`,
        );
      }
    }
  }

  const update: Record<string, unknown> = { status: target, updated_by: guard.profileId };
  if (target === "published") update.published_at = new Date().toISOString();

  const { error } = await admin.from("lessons").update(update).eq("id", lessonId);
  if (error) redirectWithNotice(back, "fehler", mapSupabaseError(error, ERROR_MESSAGES.save));

  const actionName =
    target === "published"
      ? "lessons.publish"
      : target === "archived"
        ? "lessons.archive"
        : "lessons.unpublish";
  await writeAuditLog({
    actorProfileId: guard.profileId,
    action: actionName,
    targetType: "lesson",
    targetId: lessonId,
    metadata: { status: target },
  });

  revalidateEditor(lessonId);
  const message =
    target === "published"
      ? "Die Lektion wurde veröffentlicht."
      : target === "archived"
        ? "Die Lektion wurde archiviert."
        : "Die Lektion wurde in den Entwurf zurückgesetzt.";
  redirectWithNotice(back, "erfolg", message);
}

export async function publishLessonAction(formData: FormData): Promise<void> {
  await changeLessonStatus(formData, "published");
}

export async function archiveLessonAction(formData: FormData): Promise<void> {
  await changeLessonStatus(formData, "archived");
}

export async function revertLessonToDraftAction(formData: FormData): Promise<void> {
  await changeLessonStatus(formData, "draft");
}

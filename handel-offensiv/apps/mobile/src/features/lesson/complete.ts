/**
 * Abschlusslogik einer Lektion (§13).
 *
 * "Bearbeitet" je Blocktyp:
 * - Interaktive Blöcke (checklist, reflection, single/multiple_choice, quiz,
 *   scale, transfer_task) melden ihren Zustand an den Lektions-Screen
 *   (done-Map). Checklisten zählen rein lokal (AsyncStorage) – bewusst
 *   KEINE lesson_progress-Persistenz je Block.
 * - Rezeptive Blöcke (text, video, audio, pdf, image, download,
 *   external_link) gelten mit dem Lesen der Lektion als bearbeitet.
 *
 * LEKTION ABSCHLIESSEN schreibt lesson_progress (status completed) –
 * verbindlich prüft die DB via RLS, can() wäre hier nur UX.
 */
import type { BlockType, ContentBlockRow, Uuid } from "@handel-offensiv/types";
import { supabase } from "../../lib/supabase";

/** Blocktypen, die aktive Bearbeitung erfordern */
export const INTERACTIVE_BLOCK_TYPES: readonly BlockType[] = [
  "checklist",
  "reflection",
  "single_choice",
  "multiple_choice",
  "quiz",
  "scale",
  "transfer_task",
] as const;

export function isInteractiveBlock(blockType: BlockType): boolean {
  return INTERACTIVE_BLOCK_TYPES.includes(blockType);
}

/** Deutsche Bezeichnung je Blocktyp – für Hinweise "Es fehlt noch: …" */
export function blockTypeLabel(blockType: BlockType): string {
  switch (blockType) {
    case "text":
      return "Textabschnitt";
    case "video":
      return "Video";
    case "audio":
      return "Audio";
    case "pdf":
      return "PDF";
    case "image":
      return "Bild";
    case "checklist":
      return "Checkliste";
    case "reflection":
      return "Reflexionsfrage";
    case "single_choice":
    case "multiple_choice":
      return "Frage";
    case "quiz":
      return "Quiz";
    case "scale":
      return "Einschätzung";
    case "transfer_task":
      return "Transferaufgabe";
    case "download":
      return "Download";
    case "external_link":
      return "Externer Link";
  }
}

/**
 * Ermittelt die required-Blöcke, die noch nicht bearbeitet sind.
 * `done` enthält die Meldung der interaktiven Block-Komponenten
 * (blockId -> bearbeitet); rezeptive Blöcke gelten als bearbeitet.
 */
export function findMissingRequiredBlocks(
  blocks: readonly ContentBlockRow[],
  done: Readonly<Record<string, boolean>>,
): ContentBlockRow[] {
  return blocks.filter(
    (b) =>
      b.required &&
      isInteractiveBlock(b.block_type) &&
      done[b.id] !== true,
  );
}

/** Hinweistext, welche Bearbeitung noch fehlt (nummeriert nach Reihenfolge). */
export function missingBlocksMessage(missing: readonly ContentBlockRow[]): string {
  const sorted = [...missing].sort((a, b) => a.position - b.position);
  const labels = sorted.map((b) => blockTypeLabel(b.block_type));
  if (labels.length === 1) {
    return `Bitte bearbeiten Sie zuerst: ${labels[0] ?? ""}.`;
  }
  return `Bitte bearbeiten Sie zuerst: ${labels.join(", ")}.`;
}

/**
 * Lektion beim Öffnen als begonnen markieren (in_progress),
 * ohne einen bestehenden Abschluss zu überschreiben.
 */
export async function markLessonInProgress(params: {
  lessonId: Uuid;
  profileId: Uuid;
  cohortId: Uuid;
}): Promise<void> {
  const existing = await supabase
    .from("lesson_progress")
    .select("id, status")
    .eq("lesson_id", params.lessonId)
    .eq("profile_id", params.profileId)
    .maybeSingle();
  if (existing.error) return; // unkritisch (z. B. offline) – kein Nutzerfehler
  if (existing.data !== null) return; // bereits begonnen/abgeschlossen

  await supabase.from("lesson_progress").insert({
    lesson_id: params.lessonId,
    profile_id: params.profileId,
    cohort_id: params.cohortId,
    status: "in_progress",
  });
}

/** Lektion abschließen (upsert auf unique lesson_id+profile_id). */
export async function completeLesson(params: {
  lessonId: Uuid;
  profileId: Uuid;
  cohortId: Uuid;
}): Promise<void> {
  const { error } = await supabase.from("lesson_progress").upsert(
    {
      lesson_id: params.lessonId,
      profile_id: params.profileId,
      cohort_id: params.cohortId,
      status: "completed",
      completed_at: new Date().toISOString(),
    },
    { onConflict: "lesson_id,profile_id" },
  );
  if (error !== null) {
    throw new Error(
      "Der Abschluss konnte gerade nicht gespeichert werden. Bitte versuchen Sie es erneut.",
    );
  }
}

/**
 * Abschlusslogik einer Lektion (§13) – Port aus
 * apps/mobile/src/features/lesson/complete.ts, ohne IO.
 *
 * "Bearbeitet" je Blocktyp:
 * - Interaktive Bloecke (checklist, reflection, single/multiple_choice, quiz,
 *   scale, transfer_task, practice_task, file_upload) gelten als bearbeitet,
 *   sobald ein eigener Datensatz (block_responses / reflection_entries /
 *   assignment_submissions / abgeschlossener quiz_attempt) vorliegt.
 * - photo_upload ist per Definition FREIWILLIG (§12) und blockiert den
 *   Abschluss nie.
 * - Rezeptive Bloecke (text, video, audio, pdf, image, download,
 *   external_link, announcement) gelten mit dem Lesen als bearbeitet.
 *
 * LEKTION ABSCHLIESSEN schreibt lesson_progress (status completed) –
 * verbindlich prueft die Datenbank via RLS.
 */

import type { BlockType, ContentBlockRow } from "@handel-offensiv/types";

/** Blocktypen, die aktive Bearbeitung erfordern */
export const INTERACTIVE_BLOCK_TYPES: readonly BlockType[] = [
  "checklist",
  "reflection",
  "single_choice",
  "multiple_choice",
  "quiz",
  "scale",
  "transfer_task",
  "practice_task",
  "file_upload",
] as const;

export function isInteractiveBlock(blockType: BlockType): boolean {
  return INTERACTIVE_BLOCK_TYPES.includes(blockType);
}

/** Deutsche Bezeichnung je Blocktyp – fuer Rahmen-Label und "Es fehlt noch: …" */
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
    case "practice_task":
      return "Praxisaufgabe";
    case "file_upload":
      return "Datei-Nachweis";
    case "photo_upload":
      return "Foto";
    case "announcement":
      return "Hinweis";
  }
}

/**
 * Ermittelt die required-Bloecke, die noch nicht bearbeitet sind.
 * `done` enthaelt den serverseitig ermittelten Bearbeitungsstand
 * (blockId -> bearbeitet); rezeptive Bloecke gelten als bearbeitet.
 */
export function findMissingRequiredBlocks(
  blocks: readonly ContentBlockRow[],
  done: Readonly<Record<string, boolean>>,
): ContentBlockRow[] {
  return blocks.filter((b) => b.required && isInteractiveBlock(b.block_type) && done[b.id] !== true);
}

/** Hinweistext, welche Bearbeitung noch fehlt (in Reihenfolge der Lektion). */
export function missingBlocksMessage(missing: readonly ContentBlockRow[]): string {
  const sorted = [...missing].sort((a, b) => a.position - b.position);
  const labels = sorted.map((b) => blockTypeLabel(b.block_type));
  if (labels.length === 1) {
    return `Bitte bearbeiten Sie zuerst: ${labels[0] ?? ""}.`;
  }
  return `Bitte bearbeiten Sie zuerst: ${labels.join(", ")}.`;
}

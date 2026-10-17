/**
 * Umsortieren per Auf-/Ab-Pfeil (§24, KEIN Drag-and-drop) fuer alle Tabellen
 * mit unique (scope, position). Da die Unique-Constraints nicht deferrable
 * sind, laeuft der Tausch ueber eine temporaere negative Position.
 * NUR aus Server Actions verwenden (Service Role).
 */

import "server-only";

import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type PositionedTable =
  | "modules"
  | "learning_phases"
  | "lessons"
  | "content_blocks"
  | "quiz_questions";

export type MoveDirection = "hoch" | "runter";

interface PositionedRow {
  id: string;
  position: number;
}

/**
 * Verschiebt die Zeile `id` innerhalb ihres Scopes um eine Position.
 * Rueckgabe: deutsche Fehlermeldung oder null bei Erfolg
 * (auch wenn die Zeile bereits am Rand steht – dann No-op).
 */
export async function moveRow(
  table: PositionedTable,
  scopeColumn: string,
  scopeValue: string,
  id: string,
  direction: MoveDirection,
): Promise<string | null> {
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from(table)
    .select("id, position")
    .eq(scopeColumn, scopeValue)
    .order("position", { ascending: true });

  if (error || data === null) return ERROR_MESSAGES.save;

  const rows = data as PositionedRow[];
  const index = rows.findIndex((r) => r.id === id);
  if (index === -1) return ERROR_MESSAGES.notFound;

  const targetIndex = direction === "hoch" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= rows.length) return null;

  const a = rows[index];
  const b = rows[targetIndex];
  if (a === undefined || b === undefined) return ERROR_MESSAGES.save;

  // Temporaere, sicher unbelegte Position (regulaere Positionen sind >= 1)
  const temp = -(Math.floor(Math.random() * 1_000_000_000) + 1);

  const step1 = await admin.from(table).update({ position: temp }).eq("id", a.id);
  if (step1.error) return ERROR_MESSAGES.save;

  const step2 = await admin.from(table).update({ position: a.position }).eq("id", b.id);
  if (step2.error) {
    await admin.from(table).update({ position: a.position }).eq("id", a.id);
    return ERROR_MESSAGES.save;
  }

  const step3 = await admin.from(table).update({ position: b.position }).eq("id", a.id);
  if (step3.error) {
    // Best-effort-Ruecknahme
    await admin.from(table).update({ position: b.position }).eq("id", b.id);
    await admin.from(table).update({ position: a.position }).eq("id", a.id);
    return ERROR_MESSAGES.save;
  }

  return null;
}

/** Naechste freie Position (max + 1) innerhalb eines Scopes. */
export async function nextPosition(
  table: PositionedTable,
  scopeColumn: string,
  scopeValue: string,
): Promise<number> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from(table)
    .select("position")
    .eq(scopeColumn, scopeValue)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  return ((data as PositionedRow | null)?.position ?? 0) + 1;
}

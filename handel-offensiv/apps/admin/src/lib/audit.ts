/**
 * Revisionslog (audit_logs, INSERT-only, nur Service Role).
 * Jede privilegierte Server Action MUSS nach erfolgreicher Operation einen
 * Eintrag schreiben (siehe Regel in src/lib/supabase/admin.ts).
 */

import "server-only";

import type { JsonObject, Uuid } from "@handel-offensiv/types";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface AuditLogEntry {
  /** Ausfuehrende Person (null nur fuer Systemvorgaenge) */
  actorProfileId: Uuid | null;
  /** Kurzform "bereich.verb", z. B. "invitations.create", "lessons.publish" */
  action: string;
  /** Zieltyp, z. B. "invitation", "lesson", "organization" */
  targetType?: string;
  targetId?: Uuid;
  /** Fachlicher Kontext – KEINE Passwoerter, Tokens oder Klartext-Secrets */
  metadata?: JsonObject;
}

export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  const admin = createSupabaseAdminClient();

  const { error } = await admin.from("audit_logs").insert({
    actor_profile_id: entry.actorProfileId,
    action: entry.action,
    target_type: entry.targetType ?? null,
    target_id: entry.targetId ?? null,
    metadata: entry.metadata ?? {},
  });

  if (error) {
    // Bewusst hart: eine privilegierte Operation ohne Audit-Eintrag soll
    // auffallen. Aufrufer fangen den Fehler und melden ihn deutsch.
    throw new Error(`Audit-Log konnte nicht geschrieben werden (${entry.action}).`);
  }
}

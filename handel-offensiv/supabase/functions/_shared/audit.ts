/**
 * Audit-Log-Helfer: schreibt in public.audit_logs (INSERT-only, Service Role).
 *
 * Ein fehlgeschlagener Audit-Eintrag darf die fachliche Operation nicht
 * abbrechen – Fehler werden geloggt, nicht geworfen. Metadata NIEMALS mit
 * sensiblen Werten (Passwoerter, Tokens im Klartext) befuellen.
 */

import type { AdminClient } from "./supabaseAdmin.ts";

export interface AuditEntry {
  /** Ausloesendes Profil; null bei System-Aktionen (z. B. Cron). */
  actorProfileId: string | null;
  /** Aktionsschluessel, z. B. "invitation.created". */
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

export async function writeAudit(admin: AdminClient, entry: AuditEntry): Promise<void> {
  const { error } = await admin.from("audit_logs").insert({
    actor_profile_id: entry.actorProfileId,
    action: entry.action,
    target_type: entry.targetType ?? null,
    target_id: entry.targetId ?? null,
    metadata: entry.metadata ?? {},
  });
  if (error) {
    console.error(`Audit-Log fehlgeschlagen (${entry.action}):`, error);
  }
}

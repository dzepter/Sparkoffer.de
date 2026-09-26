/**
 * Service-Role-Client – AUSSCHLIESSLICH fuer Server Actions / Route Handler.
 *
 * WARUM NIEMALS IM CLIENT:
 * Der Service-Role-Key umgeht saemtliche Row-Level-Security-Regeln der
 * Datenbank. Gelangt er in ein Client-Bundle, kann jeder Besucher alle Daten
 * aller Unternehmen lesen und schreiben. Deshalb:
 *  - Import von "server-only": ein versehentlicher Import aus Client-Code
 *    bricht den Build sofort ab.
 *  - Der Key kommt aus SUPABASE_SERVICE_ROLE_KEY (ohne NEXT_PUBLIC_-Praefix,
 *    wird also nie ins Bundle eingebettet).
 *
 * REGEL fuer jede privilegierte Operation (Einladungen, Rollenwechsel,
 * Publish, ...):
 *  1. Eingeloggten Nutzer via getActorContext() aufloesen,
 *  2. Berechtigung mit can() aus @handel-offensiv/domain pruefen,
 *  3. Operation ausfuehren,
 *  4. audit_logs-Eintrag via writeAuditLog() schreiben.
 */

import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { supabaseServiceRoleKey, supabaseUrl } from "@/lib/env";

export function createSupabaseAdminClient(): SupabaseClient {
  return createClient(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: {
      // Kein Session-Handling: reiner Server-zu-Server-Client
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

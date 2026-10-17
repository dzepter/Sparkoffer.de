/**
 * Service-Role-Client fuer Edge Functions.
 *
 * SICHERHEIT: Der Service-Role-Key existiert AUSSCHLIESSLICH hier auf dem
 * Server (Function Secrets). Er umgeht RLS vollstaendig – jede Function muss
 * daher VOR jedem Schreib-/Lesezugriff selbst autorisieren (auth.ts / can()).
 * Der Key darf niemals in Antworten, Logs oder Client-Bundles auftauchen.
 */

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";

export type AdminClient = SupabaseClient;

let cached: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    // Interner Konfigurationsfehler – Meldung bleibt generisch beim Client
    // (toErrorResponse), Details stehen im Function-Log.
    throw new Error("SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY fehlt (Function Secrets).");
  }

  cached = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}

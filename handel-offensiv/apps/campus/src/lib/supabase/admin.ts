/**
 * Service-Role-Client – AUSSCHLIESSLICH fuer wenige serverseitige Helfer
 * (z. B. persistentes Rate Limit ueber app.rate_limit_take), NIEMALS fuer
 * Lerndaten. Der Campus liest und schreibt Lerndaten nur ueber die
 * Nutzersitzung (RLS). Import von "server-only" bricht einen versehentlichen
 * Client-Import im Build ab.
 */

import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { supabaseServiceRoleKey, supabaseUrl } from "@/lib/env";

export function createSupabaseAdminClient(): SupabaseClient {
  return createClient(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

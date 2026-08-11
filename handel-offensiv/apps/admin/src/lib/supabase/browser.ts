"use client";

/**
 * Supabase-Client fuer den BROWSER (anon key + Session-Cookie via @supabase/ssr).
 * Wird ausschliesslich dort gebraucht, wo eine Client-Interaktion mit
 * supabase.auth unvermeidbar ist – aktuell nur das TOTP-Enrollment
 * (supabase.auth.mfa) unter /system/einstellungen/mfa.
 *
 * WICHTIG: Hier stehen die process.env-Zugriffe woertlich (nicht ueber
 * lib/env.ts), damit Next.js die NEXT_PUBLIC_*-Werte zur Buildzeit ins
 * Client-Bundle einsetzen kann. Es wird NUR der anon key verwendet – RLS
 * bleibt vollstaendig wirksam.
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function createSupabaseBrowserClient(): SupabaseClient {
  if (client !== null) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url === undefined || url === "" || anonKey === undefined || anonKey === "") {
    throw new Error(
      "Konfigurationsfehler: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY fehlen.",
    );
  }

  client = createBrowserClient(url, anonKey);
  return client;
}

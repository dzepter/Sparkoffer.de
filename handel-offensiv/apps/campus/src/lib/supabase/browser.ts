"use client";

/**
 * Supabase-Client fuer den BROWSER (anon key + Session-Cookie via @supabase/ssr).
 * Nur dort einsetzen, wo eine Client-Interaktion unvermeidbar ist (z. B.
 * Datei-Upload in den Bucket participant-uploads, Auto-Save von Entwuerfen).
 * Es wird NUR der anon key verwendet – RLS bleibt vollstaendig wirksam.
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { AUTH_COOKIE_OPTIONS } from "@/lib/supabase/cookie";

let client: SupabaseClient | null = null;

export function createSupabaseBrowserClient(): SupabaseClient {
  if (client !== null) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url === undefined || url === "" || anonKey === undefined || anonKey === "") {
    throw new Error("Konfigurationsfehler: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY fehlen.");
  }

  client = createBrowserClient(url, anonKey, { cookieOptions: AUTH_COOKIE_OPTIONS });
  return client;
}

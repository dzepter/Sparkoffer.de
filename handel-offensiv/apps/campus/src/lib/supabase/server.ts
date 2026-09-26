/**
 * Supabase-Client im NUTZER-Kontext (anon key + Session-Cookie).
 * ALLE Lese- und Schreibzugriffe des Campus auf Lerndaten laufen hierueber –
 * Row Level Security der Datenbank ist damit immer wirksam.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabaseAnonKey, supabaseUrl } from "@/lib/env";
import { AUTH_COOKIE_OPTIONS } from "@/lib/supabase/cookie";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookieOptions: AUTH_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Aufruf aus einer Server Component: Cookies koennen dort nicht
          // gesetzt werden. Session-Refresh uebernimmt die Middleware.
        }
      },
    },
  });
}

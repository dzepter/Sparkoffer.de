/**
 * Supabase-Client im NUTZER-Kontext (anon key + Session-Cookie).
 * Alle Lesezugriffe des Cockpits laufen hierueber – RLS der Datenbank ist
 * damit immer wirksam. Fuer privilegierte Operationen siehe admin.ts.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabaseAnonKey, supabaseUrl } from "@/lib/env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
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

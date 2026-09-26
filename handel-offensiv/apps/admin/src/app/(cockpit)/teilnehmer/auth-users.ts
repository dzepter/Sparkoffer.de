/**
 * E-Mail-Adresse und letzter Login liegen in auth.users und sind per RLS/
 * PostgREST nicht abfragbar. Fuer die Teilnehmerliste (§23) werden sie daher
 * serverseitig ueber die Admin-API (Service Role) gelesen – NUR lesend, NUR
 * nach vorheriger can(actor, 'users.read')-Pruefung im Aufrufer, niemals im
 * Client-Bundle ("server-only").
 */

import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface AuthUserInfo {
  email: string | null;
  /** Letzter Login (ISO) – null, wenn nie angemeldet */
  lastSignInAt: string | null;
}

/**
 * Map profile_id -> {email, lastSignInAt}. Tolerant: bei Fehlern bleibt die
 * Map (teil-)leer, die Liste zeigt dann "n/a" statt eines Fehlers.
 */
export async function loadAuthUserMap(): Promise<Map<string, AuthUserInfo>> {
  const admin = createSupabaseAdminClient();
  const map = new Map<string, AuthUserInfo>();

  // Seitenweise (max. 10.000 Konten) – fuer das Praesenzprogramm ausreichend.
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) break;
    for (const u of data.users) {
      map.set(u.id, { email: u.email ?? null, lastSignInAt: u.last_sign_in_at ?? null });
    }
    if (data.users.length < 1000) break;
  }

  return map;
}

/**
 * Aufruf von Supabase Edge Functions im NUTZER-Kontext (Befund I-1 / S-14).
 *
 * Warum nicht mit dem Service-Role-Key?
 *  - Die Functions validieren den Aufrufer per requireActor() ueber ein
 *    NUTZER-JWT (auth.getUser). Der Service-Role-Key ist kein Nutzer-JWT und
 *    wird dort mit 401 abgewiesen – zudem wuerde er die Berechtigungspruefung
 *    der Function (can/requireCan) auf den Server-Prozess statt auf die
 *    handelnde Person beziehen.
 *  - Mit dem Nutzer-JWT prueft die Function selbst, was DIESE Person darf; das
 *    Cockpit reicht nur durch. Audit-Logs enthalten damit den echten Akteur.
 *
 * Region: Alle Aufrufe werden per x-region an eu-central-1 (Frankfurt)
 * gebunden (Vorgabe K-5: personenbezogene Campusdaten nur in Frankfurt).
 */

import "server-only";

import { supabaseAnonKey, supabaseUrl } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Supabase-Region fuer Edge Functions (Frankfurt). */
export const SUPABASE_FUNCTIONS_REGION = "eu-central-1";

export interface EdgeFunctionResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  /** Deutsche Fehlermeldung der Function (falls vorhanden) */
  error: string | null;
}

/**
 * Ruft eine Edge Function mit dem Access-Token der angemeldeten Person auf.
 * Liefert niemals eine Exception nach aussen – Netzfehler werden als
 * status 0 gemeldet.
 */
export async function callEdgeFunctionAsUser<T = unknown>(
  name: string,
  payload: unknown,
): Promise<EdgeFunctionResult<T>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  if (!accessToken) {
    return { ok: false, status: 401, data: null, error: "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an." };
  }

  try {
    const res = await fetch(`${supabaseUrl()}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey(),
        Authorization: `Bearer ${accessToken}`,
        "x-region": SUPABASE_FUNCTIONS_REGION,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    const errorText =
      typeof body === "object" && body !== null && typeof (body as { error?: unknown }).error === "string"
        ? ((body as { error: string }).error)
        : null;

    return {
      ok: res.ok,
      status: res.status,
      data: res.ok ? (body as T) : null,
      error: res.ok ? null : errorText,
    };
  } catch {
    return { ok: false, status: 0, data: null, error: null };
  }
}

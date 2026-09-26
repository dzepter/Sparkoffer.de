/**
 * Aufruf von Supabase Edge Functions aus dem Campus.
 *
 *  - callPublicEdgeFunction: ohne Nutzer-JWT (accept-invitation: Token-basiert)
 *  - callEdgeFunctionAsUser: mit dem JWT der angemeldeten Person
 *
 * Region: alle Aufrufe per x-region an eu-central-1 (Frankfurt) gebunden.
 * Antworten der Functions: { ok: true, ... } | { ok: false, error, code? }.
 */

import "server-only";

import { supabaseAnonKey, supabaseUrl } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const SUPABASE_FUNCTIONS_REGION = "eu-central-1";

export interface EdgeFunctionResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  /** Deutsche Fehlermeldung der Function (falls vorhanden) */
  error: string | null;
  /** Maschinenlesbarer Code, z. B. "expired" | "revoked" | "accepted" | "invalid" */
  code: string | null;
}

async function call<T>(name: string, payload: unknown, bearer: string): Promise<EdgeFunctionResult<T>> {
  try {
    const res = await fetch(`${supabaseUrl()}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey(),
        Authorization: `Bearer ${bearer}`,
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
    const obj = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    return {
      ok: res.ok && obj.ok !== false,
      status: res.status,
      data: res.ok ? (body as T) : null,
      error: typeof obj.error === "string" ? obj.error : null,
      code: typeof obj.code === "string" ? obj.code : null,
    };
  } catch {
    return { ok: false, status: 0, data: null, error: null, code: "network" };
  }
}

/** Oeffentliche Function (z. B. accept-invitation) – Auth ueber den Token im Body. */
export function callPublicEdgeFunction<T = unknown>(name: string, payload: unknown): Promise<EdgeFunctionResult<T>> {
  return call<T>(name, payload, supabaseAnonKey());
}

/** Function mit dem Access-Token der angemeldeten Person. */
export async function callEdgeFunctionAsUser<T = unknown>(name: string, payload: unknown): Promise<EdgeFunctionResult<T>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    return { ok: false, status: 401, data: null, error: "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.", code: "unauthenticated" };
  }
  return call<T>(name, payload, token);
}

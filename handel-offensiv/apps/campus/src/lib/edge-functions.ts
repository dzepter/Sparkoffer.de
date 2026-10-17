/**
 * Aufruf von Supabase Edge Functions aus dem Campus.
 *
 *  - callPublicEdgeFunction: ohne Nutzer-JWT (accept-invitation: Token-basiert)
 *  - callEdgeFunctionAsUser: mit dem JWT der angemeldeten Person
 *
 * Region: alle Aufrufe per x-region an eu-central-1 (Frankfurt) gebunden.
 * Antworten der Functions: { ok: true, ... } | { ok: false, error, code? }.
 *
 * BESUCHER-IP: Die Aufrufe erfolgen serverseitig – die Function saehe sonst
 * nur die Egress-IP des Campus (ein gemeinsamer Rate-Limit-Bucket fuer alle
 * Web-Besucher). Oeffentliche Functions erhalten deshalb die echte Besucher-IP
 * signiert (x-campus-client-ip + x-campus-signature = HMAC-SHA-256 mit
 * CAMPUS_CLIENT_IP_SECRET, dasselbe Secret als Function Secret). Ohne Secret
 * wird nichts weitergereicht (die Function faellt auf x-forwarded-for zurueck).
 */

import "server-only";

import { createHmac } from "node:crypto";

import { supabaseAnonKey, supabaseUrl } from "@/lib/env";
import { clientIp } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const SUPABASE_FUNCTIONS_REGION = "eu-central-1";

let clientIpSecretWarned = false;

/** Signierte Besucher-IP-Header fuer oeffentliche Functions (leer ohne Secret/IP). */
async function clientIpHeaders(): Promise<Record<string, string>> {
  const secret = process.env.CAMPUS_CLIENT_IP_SECRET;
  if (secret === undefined || secret === "") {
    if (!clientIpSecretWarned) {
      clientIpSecretWarned = true;
      console.warn(
        "CAMPUS_CLIENT_IP_SECRET ist nicht gesetzt – die Besucher-IP wird nicht an Edge Functions weitergereicht (gemeinsames Rate Limit fuer alle Web-Besucher). Siehe apps/campus/.env.example.",
      );
    }
    return {};
  }
  const ip = await clientIp();
  if (ip === "unbekannt") return {};
  const signature = createHmac("sha256", secret).update(ip).digest("hex");
  return { "x-campus-client-ip": ip, "x-campus-signature": signature };
}

export interface EdgeFunctionResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  /** Deutsche Fehlermeldung der Function (falls vorhanden) */
  error: string | null;
  /** Maschinenlesbarer Code, z. B. "expired" | "revoked" | "accepted" | "invalid" */
  code: string | null;
}

async function call<T>(
  name: string,
  payload: unknown,
  bearer: string,
  extraHeaders: Record<string, string> = {},
): Promise<EdgeFunctionResult<T>> {
  try {
    const res = await fetch(`${supabaseUrl()}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey(),
        Authorization: `Bearer ${bearer}`,
        "x-region": SUPABASE_FUNCTIONS_REGION,
        ...extraHeaders,
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

/**
 * Oeffentliche Function (z. B. accept-invitation) – Auth ueber den Token im
 * Body; die Besucher-IP wird signiert mitgegeben (Rate Limit je Besucher).
 */
export async function callPublicEdgeFunction<T = unknown>(name: string, payload: unknown): Promise<EdgeFunctionResult<T>> {
  return call<T>(name, payload, supabaseAnonKey(), await clientIpHeaders());
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

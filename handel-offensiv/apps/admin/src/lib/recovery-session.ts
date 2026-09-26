/**
 * Erkennung einer Passwort-Wiederherstellungs-Sitzung (Spiegel von
 * apps/campus/src/lib/auth/recovery.ts).
 *
 * /passwort-neu darf ein Passwort NUR setzen, wenn die Sitzung ueber den
 * Recovery-Link entstanden ist (/auth/callback). Eine normale Sitzung – etwa
 * ein gestohlenes Session-Cookie – darf das Passwort nicht ohne Re-
 * Authentifizierung aendern.
 *
 * Grundlage ist der amr-Claim ("Authentication Methods Reference") im
 * Access-Token von Supabase Auth: fuer Recovery-/Magic-Links traegt er
 * method "otp" (aeltere Versionen "recovery"/"magiclink") mit Zeitstempel.
 * Der Token wurde zuvor per supabase.auth.getUser() serverseitig validiert.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

const RECOVERY_METHODS = new Set(["recovery", "otp", "magiclink"]);

/** Zeitfenster nach dem Klick auf den Recovery-Link, in dem das Passwort gesetzt werden darf. */
export const RECOVERY_WINDOW_SECONDS = 15 * 60;

interface AmrEntry {
  method?: unknown;
  timestamp?: unknown;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const json = Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const parsed: unknown = JSON.parse(json);
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Reine Claim-Pruefung: amr enthaelt Recovery/OTP innerhalb des Zeitfensters. */
export function isRecentRecoveryToken(accessToken: string, nowMs: number = Date.now()): boolean {
  const payload = decodeJwtPayload(accessToken);
  const amr = payload?.amr;
  if (!Array.isArray(amr)) return false;
  const nowSec = Math.floor(nowMs / 1000);
  return (amr as AmrEntry[]).some((entry) => {
    if (typeof entry?.method !== "string" || !RECOVERY_METHODS.has(entry.method)) return false;
    if (typeof entry.timestamp !== "number") return false;
    const age = nowSec - entry.timestamp;
    return age >= -60 && age <= RECOVERY_WINDOW_SECONDS;
  });
}

/**
 * true, wenn die aktuelle Sitzung innerhalb der letzten 15 Minuten ueber
 * einen Recovery-Link entstanden ist. Vorher getUser() aufrufen (Validierung).
 */
export async function hasRecentRecoverySession(supabase: SupabaseClient): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return false;
  return isRecentRecoveryToken(token);
}

/**
 * Persistentes Rate Limit fuer Server Actions (Login, Passwort-Reset,
 * Einladungen) – Token-Bucket in Postgres ueber public.rate_limit_take
 * (Migration 0008, nur Service Role). Gilt damit global ueber alle
 * Server-Instanzen (im Gegensatz zu In-Memory-Zaehlern).
 *
 * DATENSCHUTZ: Schluessel enthalten NIE Klartext-IPs oder E-Mail-Adressen,
 * sondern SHA-256-Hashes mit Salt (RATE_LIMIT_SALT). Ohne Salt wird einmalig
 * gewarnt und ein Entwicklungs-Fallback benutzt.
 *
 * VERHALTEN: RPC liefert false -> Limit erreicht (RATE_LIMIT_MESSAGE).
 *  - VORUEBERGEHENDE Fehler (Netz, Timeout, DB kurz nicht erreichbar):
 *    FAIL-OPEN mit console.error – ein Datenbankproblem darf die Anmeldung
 *    nicht komplett sperren (Supabase Auth hat eigene Grundlimits).
 *  - DAUERHAFTE Fehlkonfiguration (SUPABASE_SERVICE_ROLE_KEY fehlt, Migration
 *    0008 nicht eingespielt, Funktion nicht ausfuehrbar, ungueltiger Key):
 *    FAIL-CLOSED mit console.error – sonst liefe das Cockpit unbemerkt ohne
 *    jedes Limit. Zusaetzlich prueft src/instrumentation.ts die Umgebung
 *    beim Serverstart (in Produktion Abbruch).
 */

import "server-only";

import { createHash } from "node:crypto";

import { headers } from "next/headers";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface RateLimitRule {
  /** Maximale Anzahl Versuche im vollen Bucket. */
  capacity: number;
  /** Nachfuell-Rate in Tokens pro Minute. */
  refillPerMinute: number;
}

/** Deutsche Meldung bei erreichtem Limit (Spiegel von ERROR_MESSAGES.rateLimited im Campus). */
export const RATE_LIMIT_MESSAGE =
  "Zu viele Versuche. Bitte warten Sie einen Moment und versuchen Sie es dann erneut.";

/** Vordefinierte Regeln (Kapazitaet / Nachfuellen pro Minute). */
export const RATE_LIMITS = {
  /** Anmeldung je E-Mail-Hash: 10 Versuche in 10 Minuten */
  loginEmail: { capacity: 10, refillPerMinute: 1 },
  /** Anmeldung je IP-Hash: 30 Versuche in 10 Minuten */
  loginIp: { capacity: 30, refillPerMinute: 3 },
  /** Passwort vergessen je E-Mail-Hash: 5 in 15 Minuten */
  passwordReset: { capacity: 5, refillPerMinute: 1 / 3 },
  /** Einladungs-Aktionen je Akteur: 60 pro Stunde */
  invite: { capacity: 60, refillPerMinute: 1 },
} as const satisfies Record<string, RateLimitRule>;

const DEV_SALT = "handel-offensiv-dev-salt";
let saltWarned = false;

function rateLimitSalt(): string {
  const salt = process.env.RATE_LIMIT_SALT;
  if (salt !== undefined && salt !== "") return salt;
  if (!saltWarned) {
    saltWarned = true;
    console.warn(
      "RATE_LIMIT_SALT ist nicht gesetzt – Entwicklungs-Fallback aktiv. In Staging/Produktion setzen (apps/admin/.env.example).",
    );
  }
  return DEV_SALT;
}

/**
 * Schluessel "<prefix>:<sha256(salt|subject)>" – subject ist E-Mail, IP oder
 * Profil-ID und landet nie im Klartext in der Datenbank.
 */
export function clientKey(prefix: string, subject: string): string {
  const digest = createHash("sha256")
    .update(`${rateLimitSalt()}|${subject.trim().toLowerCase()}`)
    .digest("hex");
  return `${prefix}:${digest.slice(0, 40)}`;
}

/** Client-IP aus x-forwarded-for (erster Eintrag); Fallback "unbekannt". */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip")?.trim() || "unbekannt";
}

/**
 * Fehlercodes, die auf eine DAUERHAFTE Fehlkonfiguration hindeuten:
 *  42883   function does not exist   (Migration 0008 nicht eingespielt)
 *  42501   permission denied         (execute fehlt / falscher Key)
 *  PGRST202 PostgREST: Funktion im Schema-Cache nicht gefunden
 *  PGRST301 PostgREST: JWT ungueltig (falscher Service-Role-Key)
 */
const CONFIG_ERROR_CODES = new Set(["42883", "42501", "PGRST202", "PGRST301"]);

function isConfigError(error: { code?: string | null; message?: string | null }): boolean {
  if (error.code && CONFIG_ERROR_CODES.has(error.code)) return true;
  const msg = (error.message ?? "").toLowerCase();
  return msg.includes("could not find the function") || msg.includes("permission denied for function");
}

/**
 * Entnimmt ein Token aus dem Bucket `key`.
 * @returns true = Anfrage zulaessig, false = Limit erreicht (oder Limiter
 *          dauerhaft fehlkonfiguriert – fail-closed)
 */
export async function takeRateLimit(
  key: string,
  capacity: number,
  refillPerMinute: number,
): Promise<boolean> {
  // Konfiguration ausserhalb des Netz-Try: ein fehlender Service-Role-Key ist
  // kein voruebergehender Fehler, sondern eine kaputte Installation.
  let admin: ReturnType<typeof createSupabaseAdminClient>;
  try {
    admin = createSupabaseAdminClient();
  } catch (err) {
    console.error(
      "Rate Limit nicht konfiguriert (fail-closed):",
      err instanceof Error ? err.message : err,
    );
    return false;
  }

  try {
    const { data, error } = await admin.rpc("rate_limit_take", {
      p_key: key,
      p_capacity: capacity,
      p_refill_per_minute: refillPerMinute,
    });
    if (error) {
      if (isConfigError(error)) {
        console.error(
          `rate_limit_take dauerhaft nicht verfuegbar (fail-closed, Code ${error.code ?? "?"}): ${error.message}. Migration 0008 eingespielt und SUPABASE_SERVICE_ROLE_KEY korrekt?`,
        );
        return false;
      }
      console.error("rate_limit_take voruebergehend fehlgeschlagen (fail-open):", error.message);
      return true;
    }
    return data === true;
  } catch (err) {
    console.error("rate_limit_take nicht erreichbar (fail-open):", err);
    return true;
  }
}

/** Kurzform mit vordefinierter Regel. */
export function takeRateLimitRule(key: string, rule: RateLimitRule): Promise<boolean> {
  return takeRateLimit(key, rule.capacity, rule.refillPerMinute);
}

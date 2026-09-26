/**
 * Rate Limiting fuer Edge Functions – zwei Schichten:
 *
 * 1. In-Memory-Token-Bucket je IP + Route (rateLimit): schnell, ohne
 *    Datenbankzugriff, faengt naive Wiederholungen innerhalb eines Isolates ab.
 *    GRENZEN: Der Speicher lebt nur im aktuellen Isolate – bei Cold Starts
 *    oder mehreren Instanzen hat jede Instanz eigene Buckets ("Best Effort").
 *
 * 2. Persistenter Token-Bucket in Postgres (rateLimitPersistent): ruft
 *    public.rate_limit_take (Migration 0008, nur Service Role) ueber den
 *    Admin-Client auf. Damit gilt das Limit global ueber alle Instanzen.
 *    - RPC liefert false  -> Limit erreicht -> HttpError 429 (deutsche Meldung)
 *    - RPC-Fehler         -> FAIL-OPEN mit console.error (Verfuegbarkeit vor
 *      Haerte: ein DB-Ausfall darf Einladungen nicht komplett blockieren;
 *      Schicht 1 bleibt aktiv)
 *
 * DATENSCHUTZ: Es werden NIE Klartext-IPs oder E-Mail-Adressen gespeichert.
 * Schluessel werden mit SHA-256 + Salt (RATE_LIMIT_SALT) gehasht; fehlt der
 * Salt, wird einmalig gewarnt und ein Entwicklungs-Fallback benutzt.
 */

import { HttpError } from "./errors.ts";
import { sha256Hex } from "./tokens.ts";
import type { AdminClient } from "./supabaseAdmin.ts";

interface Bucket {
  tokens: number;
  lastRefillMs: number;
}

export interface RateLimitOptions {
  /** Maximale Anzahl Anfragen im "vollen" Bucket. */
  capacity: number;
  /** Nachfuell-Rate: Tokens pro Minute. */
  refillPerMinute: number;
}

export const RATE_LIMIT_MESSAGE =
  "Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut.";

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

/** Client-IP bestimmen (erste Adresse in x-forwarded-for). */
export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unbekannt"
  );
}

/* ------------------ Weitergereichte Client-IP (Web-Campus) ----------------- */

/**
 * Der Web-Campus ruft oeffentliche Functions SERVERSEITIG auf (Next.js Server
 * Actions). x-forwarded-for enthaelt dann die Egress-IP des Campus-Servers –
 * alle Web-Besucher teilten sich damit EINEN Bucket (Sammelsperre) und ein
 * Angreifer koennte die Einladungsannahme fuer alle blockieren.
 *
 * Deshalb reicht der Campus die echte Besucher-IP weiter:
 *   x-campus-client-ip: <ip>
 *   x-campus-signature: hex(HMAC-SHA-256(CAMPUS_CLIENT_IP_SECRET, ip))
 * Die Header werden NUR akzeptiert, wenn das Secret gesetzt ist und die
 * Signatur passt (konstante Vergleichszeit). Andernfalls – und fuer alle
 * anderen Aufrufer (Mobile-App, Browser) – gilt x-forwarded-for.
 */
export const CLIENT_IP_HEADER = "x-campus-client-ip";
export const CLIENT_IP_SIGNATURE_HEADER = "x-campus-signature";

/** Nur syntaktisch plausible IPv4/IPv6-Adressen (kein Header-Muell in Logs/Keys). */
const IP_PATTERN = /^[0-9a-fA-F:.]{3,45}$/;

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Vergleich in konstanter Zeit (gleiche Laenge vorausgesetzt). */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Effektive Client-IP: signierte Weiterleitung des Campus, sonst
 * x-forwarded-for. Ungueltige Signaturen werden protokolliert (ohne IP) und
 * ignoriert – kein Fehler fuer den Aufrufer (kein Orakel).
 */
export async function resolveClientIp(req: Request): Promise<string> {
  const forwarded = req.headers.get(CLIENT_IP_HEADER)?.trim();
  const signature = req.headers.get(CLIENT_IP_SIGNATURE_HEADER)?.trim().toLowerCase();
  if (!forwarded || !signature) return clientIp(req);

  const secret = Deno.env.get("CAMPUS_CLIENT_IP_SECRET");
  if (!secret) {
    console.error(
      `${CLIENT_IP_HEADER} erhalten, aber CAMPUS_CLIENT_IP_SECRET ist nicht gesetzt – Header wird ignoriert.`,
    );
    return clientIp(req);
  }
  if (!IP_PATTERN.test(forwarded)) return clientIp(req);

  const expected = await hmacSha256Hex(secret, forwarded);
  if (!timingSafeEqual(expected, signature)) {
    console.error(`${CLIENT_IP_HEADER} mit ungueltiger Signatur – Header wird ignoriert.`);
    return clientIp(req);
  }
  return forwarded;
}

/* --------------------------- Schicht 1: In-Memory -------------------------- */

/**
 * Prueft das Limit fuer IP+Route und verbraucht ein Token.
 * Wirft HttpError 429 (deutsche Meldung), wenn das Limit erreicht ist.
 * `source`: Request (IP aus x-forwarded-for) oder bereits aufgeloeste IP
 * (siehe resolveClientIp).
 */
export function rateLimit(source: Request | string, route: string, opts: RateLimitOptions): void {
  const ip = typeof source === "string" ? source : clientIp(source);
  const key = `${ip}:${route}`;
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket) {
    // Simple Speicherbegrenzung: bei Ueberlauf aelteste Eintraege verwerfen.
    if (buckets.size >= MAX_BUCKETS) {
      const oldestKey = buckets.keys().next().value;
      if (oldestKey !== undefined) buckets.delete(oldestKey);
    }
    bucket = { tokens: opts.capacity, lastRefillMs: now };
    buckets.set(key, bucket);
  }

  // Auffuellen anteilig zur vergangenen Zeit
  const elapsedMinutes = (now - bucket.lastRefillMs) / 60_000;
  if (elapsedMinutes > 0) {
    bucket.tokens = Math.min(opts.capacity, bucket.tokens + elapsedMinutes * opts.refillPerMinute);
    bucket.lastRefillMs = now;
  }

  if (bucket.tokens < 1) {
    throw new HttpError(429, RATE_LIMIT_MESSAGE);
  }

  bucket.tokens -= 1;
}

/* ------------------------- Schicht 2: Persistent (DB) ---------------------- */

let saltWarned = false;

/** Salt fuer Schluessel-Hashes; Fallback nur fuer lokale Entwicklung. */
function rateLimitSalt(): string {
  const salt = Deno.env.get("RATE_LIMIT_SALT");
  if (salt && salt.length > 0) return salt;
  if (!saltWarned) {
    saltWarned = true;
    console.error(
      "RATE_LIMIT_SALT ist nicht gesetzt – Entwicklungs-Fallback aktiv. In Staging/Produktion als Function Secret setzen.",
    );
  }
  return "handel-offensiv-dev-salt";
}

/**
 * Schluessel fuer den persistenten Bucket: "<prefix>:<sha256(salt|subject)>".
 * subject = IP, E-Mail, Profil-ID o. ae. – landet nie im Klartext in der DB.
 */
export async function hashedKey(prefix: string, subject: string): Promise<string> {
  const digest = await sha256Hex(`${rateLimitSalt()}|${subject.trim().toLowerCase()}`);
  return `${prefix}:${digest.slice(0, 40)}`;
}

/**
 * Bequemer Schluessel je IP-Hash + Route (fuer oeffentliche Endpunkte).
 * `source`: Request oder bereits aufgeloeste IP (resolveClientIp).
 */
export function ipKey(source: Request | string, route: string): Promise<string> {
  return hashedKey(`ip:${route}`, typeof source === "string" ? source : clientIp(source));
}

/** Schluessel je Akteur (Profil-ID) + Route (fuer authentifizierte Endpunkte). */
export function actorKey(profileId: string, route: string): Promise<string> {
  return hashedKey(`actor:${route}`, profileId);
}

/**
 * Persistentes Limit ueber public.rate_limit_take.
 * - Limit erreicht (false): HttpError 429
 * - RPC-Fehler: fail-open (Log), damit ein DB-Problem den Dienst nicht sperrt
 */
export async function rateLimitPersistent(
  admin: AdminClient,
  key: string,
  opts: RateLimitOptions,
): Promise<void> {
  let allowed: boolean;
  try {
    const { data, error } = await admin.rpc("rate_limit_take", {
      p_key: key,
      p_capacity: opts.capacity,
      p_refill_per_minute: opts.refillPerMinute,
    });
    if (error) {
      console.error("rate_limit_take fehlgeschlagen (fail-open):", error.message);
      return;
    }
    allowed = data === true;
  } catch (err) {
    console.error("rate_limit_take nicht erreichbar (fail-open):", err);
    return;
  }

  if (!allowed) {
    throw new HttpError(429, RATE_LIMIT_MESSAGE);
  }
}

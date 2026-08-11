/**
 * Einfaches Token-Bucket-Rate-Limit, in-memory je IP + Route.
 *
 * GRENZEN DIESES ANSATZES (bewusst dokumentiert):
 * - Der Speicher lebt nur im aktuellen Isolate: bei Cold Starts oder mehreren
 *   parallelen Instanzen (Regionen/Skalierung) hat jede Instanz eigene Buckets.
 *   Das Limit ist damit ein "Best Effort"-Schutz gegen naive Brute-Force- und
 *   Spam-Versuche, KEIN harter globaler Zaehler.
 * - Die Client-IP stammt aus x-forwarded-for und ist hinter Proxies nur so
 *   vertrauenswuerdig wie die Plattform (Supabase setzt den Header selbst).
 * - Fuer harte Garantien (z. B. Login-Schutz) waere ein zentraler Store noetig
 *   (Postgres-Tabelle mit Advisory Locks, Redis/Upstash o. ae.).
 */

import { HttpError } from "./errors.ts";

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

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

/** Client-IP bestimmen (erste Adresse in x-forwarded-for). */
function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unbekannt"
  );
}

/**
 * Prueft das Limit fuer IP+Route und verbraucht ein Token.
 * Wirft HttpError 429 (deutsche Meldung), wenn das Limit erreicht ist.
 */
export function rateLimit(req: Request, route: string, opts: RateLimitOptions): void {
  const key = `${clientIp(req)}:${route}`;
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
    throw new HttpError(
      429,
      "Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut.",
    );
  }

  bucket.tokens -= 1;
}

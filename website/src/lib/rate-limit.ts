/**
 * Einfaches In-Memory-Rate-Limiting pro Absender (Sliding Window).
 * Ausreichend für eine einzelne Server-Instanz; bei horizontaler
 * Skalierung durch einen zentralen Store (z. B. Redis) ersetzen.
 */

const WINDOW_MS = 10 * 60 * 1000; // 10 Minuten
const MAX_KEYS = 20_000;

const envMax = Number(process.env.CONTACT_RATE_LIMIT_MAX);
/** Nicht-numerische Konfiguration fällt sicher auf den Standard zurück. */
const DEFAULT_MAX =
  Number.isFinite(envMax) && envMax > 0 ? Math.floor(envMax) : 5;

const hits = new Map<string, number[]>();

export function isRateLimited(key: string, max: number = DEFAULT_MAX): boolean {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const timestamps = (hits.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= max) {
    hits.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  // Erneutes Setzen verschiebt den Schlüssel ans Ende der Einfüge-Reihenfolge,
  // sodass die Verdrängung unten die ältesten Einträge trifft.
  hits.delete(key);
  hits.set(key, timestamps);

  // Harte Obergrenze gegen Speicherwachstum bei rotierenden Schlüsseln:
  // die ältesten Einträge werden verdrängt.
  while (hits.size > MAX_KEYS) {
    const oldest = hits.keys().next().value;
    if (oldest === undefined) break;
    hits.delete(oldest);
  }

  return false;
}

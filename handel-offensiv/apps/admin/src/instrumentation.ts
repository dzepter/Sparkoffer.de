/**
 * Startpruefung der Serverumgebung (Next.js Instrumentation Hook – laeuft
 * einmal beim Start des Node-Servers, NICHT im Build und nicht im Edge-Runtime).
 *
 * Produktion/Staging: fehlen Pflichtvariablen (SUPABASE_SERVICE_ROLE_KEY,
 * RATE_LIMIT_SALT, ...), startet der Server NICHT – lieber ein sichtbarer
 * Deploy-Fehler als ein Cockpit, das unbemerkt ohne Rate Limit laeuft
 * (src/lib/rate-limit.ts faellt in dem Fall zusaetzlich geschlossen aus).
 * Entwicklung: nur eine deutliche Warnung.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { missingServerEnv } = await import("@/lib/env");
  const missing = missingServerEnv();
  if (missing.length === 0) return;

  const message = `Konfigurationsfehler: Umgebungsvariable(n) ${missing.join(", ")} nicht gesetzt. Siehe apps/admin/.env.example.`;
  if (process.env.NODE_ENV === "production") {
    throw new Error(message);
  }
  console.warn(`${message} (Entwicklung: Server startet trotzdem.)`);
}

/**
 * Zentraler, typisierter Zugriff auf Umgebungsvariablen.
 * Faellt frueh und deutlich, statt zur Laufzeit mit undefined zu arbeiten.
 */

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(
      `Konfigurationsfehler: Umgebungsvariable ${name} ist nicht gesetzt. ` +
        `Siehe apps/admin/.env.example.`,
    );
  }
  return value;
}

export function supabaseUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL");
}

export function supabaseAnonKey(): string {
  return required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

/** NUR serverseitig verwenden – niemals in Client-Bundles importieren. */
export function supabaseServiceRoleKey(): string {
  return required("SUPABASE_SERVICE_ROLE_KEY");
}

/**
 * Oeffentliche Basis-URL dieses Cockpits (fuer Redirects in Auth-Mails, z. B.
 * Passwort-Reset). Muss in Supabase unter additional_redirect_urls stehen.
 * Default fuer die lokale Entwicklung.
 */
export function appBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_APP_URL;
  // INKLUSIVE Pfad-Praefix (z. B. https://www.handel-offensiv.de/admin); Callback: <Basis>/auth/callback
  return (value === undefined || value === "" ? "http://localhost:3000/admin" : value).replace(/\/$/, "");
}

/**
 * Serverseitig PFLICHT (Staging/Produktion) – wird beim Serverstart geprueft
 * (src/instrumentation.ts). Ohne SUPABASE_SERVICE_ROLE_KEY faellt das Rate
 * Limit geschlossen aus; ohne RATE_LIMIT_SALT waeren die Hashes der
 * Rate-Limit-Schluessel vorhersagbar.
 */
export const REQUIRED_SERVER_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RATE_LIMIT_SALT",
] as const;

/** Namen der fehlenden Pflicht-Variablen (leer = alles gesetzt). */
export function missingServerEnv(): string[] {
  return REQUIRED_SERVER_ENV.filter((name) => {
    const value = process.env[name];
    return value === undefined || value === "";
  });
}

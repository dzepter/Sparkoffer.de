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

/**
 * Deutsche, nutzerfreundliche Fehlermeldungen.
 * REGEL: Niemals technische Codes anzeigen – immer eine verstaendliche
 * deutsche Meldung. Technische Details gehoeren ins Server-Log.
 */

export const ERROR_MESSAGES = {
  generic: "Das hat gerade nicht funktioniert. Bitte versuchen Sie es erneut.",
  load: "Der Inhalt konnte gerade nicht geladen werden. Bitte versuchen Sie es erneut.",
  save: "Die Änderungen konnten nicht gespeichert werden. Bitte versuchen Sie es erneut.",
  network:
    "Keine Verbindung zum Server. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.",
  forbidden: "Für diese Aktion fehlt Ihnen die Berechtigung.",
  notFound: "Der angeforderte Inhalt wurde nicht gefunden oder ist noch nicht freigeschaltet.",
  conflict: "Ein Eintrag mit diesen Angaben existiert bereits.",
  invalidInput: "Bitte prüfen Sie Ihre Eingaben.",
  loginFailed: "E-Mail-Adresse oder Passwort ist nicht korrekt.",
  sessionExpired: "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.",
  rateLimited: "Zu viele Versuche. Bitte warten Sie einen Moment und versuchen Sie es dann erneut.",
} as const;

interface SupabaseErrorLike {
  code?: string | null;
  message?: string | null;
  status?: number | null;
}

/** Uebersetzt einen Supabase-/PostgREST-Fehler in eine deutsche Meldung. */
export function mapSupabaseError(error: unknown, fallback: string = ERROR_MESSAGES.generic): string {
  if (error === null || error === undefined) return fallback;
  const e = error as SupabaseErrorLike;
  const code = e.code ?? "";
  const message = (e.message ?? "").toLowerCase();

  if (message.includes("invalid login credentials")) return ERROR_MESSAGES.loginFailed;
  if (message.includes("jwt") || message.includes("refresh token")) return ERROR_MESSAGES.sessionExpired;
  if (code === "PGRST116") return ERROR_MESSAGES.notFound;
  if (code === "PGRST301") return ERROR_MESSAGES.sessionExpired;
  if (code === "23505" || code === "23503") return ERROR_MESSAGES.conflict;
  if (code === "23514" || code === "22P02") return ERROR_MESSAGES.invalidInput;
  if (code === "42501" || code === "P0001") return ERROR_MESSAGES.forbidden;
  if (message.includes("fetch failed") || message.includes("network")) return ERROR_MESSAGES.network;
  return fallback;
}

/**
 * Zentrale, fachliche Konstanten.
 * Geschäftliche Fakten (Preise, Termine, endgültiger App-Name) werden hier
 * NICHT erfunden – Platzhalter sind als DEMO/KONFIGURATION markiert (§63).
 */

export const APP = {
  /** Arbeitstitel – finale App-Bezeichnung folgt vom Auftraggeber (§63) */
  name: "Handel Offensiv",
  claim: "Handel ist Mannschaftssport. Führung entscheidet das Spiel.",
  company: "Aigner Offensiv",
  supportEmail: "info@aigner-offensiv.de",
  /** Öffentliche Route für Store-Löschhinweis (§31) */
  accountDeletionUrl: "https://www.aigner-offensiv.de/account-loeschen",
} as const;

export const PROGRAM_DEFAULTS = {
  slug: "handel-offensiv",
  title: "Handel Offensiv",
  subtitle: "Der Führungsführerschein für den Handel",
  modules: [
    { number: "01", title: "Führung beginnt bei mir" },
    { number: "02", title: "Aus Mitarbeitern wird Mannschaft" },
    { number: "03", title: "Die richtige Aufstellung" },
    { number: "04", title: "Spielintelligenz mit KI" },
    { number: "05", title: "Führen, wenn es darauf ankommt" },
  ],
} as const;

export const LIMITS = {
  /** Datei-Uploads (Storage §29) */
  maxUploadBytes: 25 * 1024 * 1024,
  allowedUploadMime: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "audio/mpeg",
    "audio/mp4",
  ],
  /** Einladungen */
  invitationTtlHours: 14 * 24,
  /** Dashboard: maximal sichtbare offene Aufgaben (§10) */
  dashboardOpenTasks: 3,
} as const;

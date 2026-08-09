/**
 * Deutsche Datums-/Zeitformatierung (Europe/Berlin) für die Lern-Screens.
 * Reine Funktionen, keine IO.
 */

const TZ = "Europe/Berlin";

/** "12.03.2026" */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

/** "Donnerstag, 12.03.2026" */
export function formatDateLong(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: TZ,
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

/** "09:00 Uhr" */
export function formatTime(iso: string): string {
  const time = new Intl.DateTimeFormat("de-DE", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
  return `${time} Uhr`;
}

/** "12.03.2026 um 09:00 Uhr" */
export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} um ${formatTime(iso)}`;
}

/**
 * "heute" / "morgen" / "in 12 Tagen" – Kalendertage in Europe/Berlin.
 * Vergangene Zeitpunkte: "läuft" (Termin hat begonnen).
 */
export function formatInDays(iso: string, now: Date = new Date()): string {
  const dayKey = (d: Date): string =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  const target = new Date(iso);
  const days = Math.round(
    (Date.parse(dayKey(target)) - Date.parse(dayKey(now))) / 86_400_000,
  );
  if (days < 0) return "läuft";
  if (days === 0) return "heute";
  if (days === 1) return "morgen";
  return `in ${days} Tagen`;
}

/** "Fällig bis 12.03.2026" – für Aufgaben mit due_at */
export function formatDue(iso: string): string {
  return `Fällig bis ${formatDate(iso)}`;
}

/** "8 Min." – geschätzte Bearbeitungszeit */
export function formatMinutes(minutes: number): string {
  return `${minutes} Min.`;
}

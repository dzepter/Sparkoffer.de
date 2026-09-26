/**
 * Deutsche Datums-/Zeitformatierung für Termine (Screen + Detailseite).
 * Nutzt Intl (in Hermes/RN 0.76 enthalten) mit der Zeitzone des Termins;
 * bei unbekannter Zeitzone fällt die Formatierung defensiv auf das Gerät zurück.
 */
import type { CohortSessionRow } from "@handel-offensiv/types";

function formatWith(iso: string, timezone: string, options: Intl.DateTimeFormatOptions): string {
  const date = new Date(iso);
  try {
    return new Intl.DateTimeFormat("de-DE", { ...options, timeZone: timezone }).format(date);
  } catch {
    return new Intl.DateTimeFormat("de-DE", options).format(date);
  }
}

/** z. B. "Montag, 14. September 2026" */
export function formatSessionDate(session: CohortSessionRow): string {
  return formatWith(session.starts_at, session.timezone, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** z. B. "Mo., 14.09.2026" */
export function formatSessionDateShort(session: CohortSessionRow): string {
  return formatWith(session.starts_at, session.timezone, {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** z. B. "09:00–17:00 Uhr" bzw. "09:00 Uhr" ohne Endzeit */
export function formatSessionTimeRange(session: CohortSessionRow): string {
  const timeOptions: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
  const start = formatWith(session.starts_at, session.timezone, timeOptions);
  if (!session.ends_at) return `${start} Uhr`;
  const end = formatWith(session.ends_at, session.timezone, timeOptions);
  return `${start}–${end} Uhr`;
}

/**
 * Countdown in ganzen Kalendertagen (Gerätezeit): "heute", "morgen",
 * "in X Tagen". Für vergangene Termine null.
 */
export function countdownLabel(session: CohortSessionRow, now: Date): string | null {
  const start = new Date(session.starts_at);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(start) - startOfDay(now)) / 86_400_000);
  if (diffDays < 0) return null;
  if (diffDays === 0) return "heute";
  if (diffDays === 1) return "morgen";
  return `in ${diffDays} Tagen`;
}

/** Ein Termin gilt als vergangen, wenn Ende (bzw. Beginn) vor jetzt liegt. */
export function isPastSession(session: CohortSessionRow, now: Date): boolean {
  const reference = session.ends_at ?? session.starts_at;
  return new Date(reference).getTime() < now.getTime();
}

/**
 * Deutsche Datums-/Zeitformatierung fuer Praesenztermine.
 * Port von apps/mobile/src/features/termine/format.ts – reine Funktionen,
 * keine IO. Zeitzone: die des Termins (cohort_sessions.timezone), im
 * Zweifel Europe/Berlin.
 */

import type { CohortSessionRow } from "@handel-offensiv/types";

export const DEFAULT_TZ = "Europe/Berlin";

type SessionTime = Pick<CohortSessionRow, "starts_at" | "ends_at" | "timezone">;

function timezoneOf(session: Pick<CohortSessionRow, "timezone">): string {
  const tz = session.timezone?.trim();
  return tz && tz.length > 0 ? tz : DEFAULT_TZ;
}

function formatWith(iso: string, timezone: string, options: Intl.DateTimeFormatOptions): string {
  const date = new Date(iso);
  try {
    return new Intl.DateTimeFormat("de-DE", { ...options, timeZone: timezone }).format(date);
  } catch {
    // Unbekannte Zeitzone in den Daten: defensiv auf Europe/Berlin zurueckfallen
    return new Intl.DateTimeFormat("de-DE", { ...options, timeZone: DEFAULT_TZ }).format(date);
  }
}

/** z. B. "Freitag, 12. März 2027" */
export function formatSessionDate(session: SessionTime): string {
  return formatWith(session.starts_at, timezoneOf(session), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** z. B. "Fr., 12.03.2027" */
export function formatSessionDateShort(session: SessionTime): string {
  return formatWith(session.starts_at, timezoneOf(session), {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** z. B. "09:00–17:00 Uhr" bzw. "09:00 Uhr" ohne Endzeit */
export function formatSessionTimeRange(session: SessionTime): string {
  const tz = timezoneOf(session);
  const timeOptions: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
  const start = formatWith(session.starts_at, tz, timeOptions);
  if (!session.ends_at) return `${start} Uhr`;
  const end = formatWith(session.ends_at, tz, timeOptions);
  return `${start}–${end} Uhr`;
}

/** Kalendertag (YYYY-MM-DD) eines Zeitpunkts in der Zeitzone des Termins. */
function dayKey(date: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-CA", { timeZone: DEFAULT_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  }
}

/**
 * Differenz in ganzen Kalendertagen (Zeitzone des Termins) zwischen jetzt
 * und dem Beginn des Termins. Negativ = Termin hat bereits begonnen.
 */
export function daysUntil(session: SessionTime, now: Date): number {
  const tz = timezoneOf(session);
  const target = Date.parse(dayKey(new Date(session.starts_at), tz));
  const today = Date.parse(dayKey(now, tz));
  return Math.round((target - today) / 86_400_000);
}

/** "heute" / "morgen" / "in X Tagen"; null fuer vergangene Termine. */
export function countdownLabel(session: SessionTime, now: Date): string | null {
  const days = daysUntil(session, now);
  if (days < 0) return null;
  if (days === 0) return "heute";
  if (days === 1) return "morgen";
  return `in ${days} Tagen`;
}

/**
 * Countdown-Satz fuer die Terminuebersicht, z. B.
 * "Noch 12 Tage bis Offensivtag 2" · "Morgen ist Offensivtag 2" ·
 * "Heute ist Offensivtag 2". `dayNumber` = Position des verknuepften Moduls.
 */
export function countdownSentence(session: SessionTime, dayNumber: number | null, now: Date): string {
  const target = dayNumber !== null ? `Offensivtag ${dayNumber}` : "zum nächsten Termin";
  const targetIs = dayNumber !== null ? `Offensivtag ${dayNumber}` : "Ihr nächster Termin";
  const days = daysUntil(session, now);
  if (days < 0) return `${targetIs} läuft`;
  if (days === 0) return `Heute ist ${targetIs}`;
  if (days === 1) return `Noch 1 Tag bis ${target}`;
  return `Noch ${days} Tage bis ${target}`;
}

/** Ein Termin gilt als vergangen, wenn Ende (bzw. Beginn) vor jetzt liegt. */
export function isPastSession(session: SessionTime, now: Date): boolean {
  const reference = session.ends_at ?? session.starts_at;
  return new Date(reference).getTime() < now.getTime();
}

/** "12.03.2027, 14:05 Uhr" – z. B. fuer "Zuletzt gespeichert". */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat("de-DE", { timeZone: DEFAULT_TZ, day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
  const time = new Intl.DateTimeFormat("de-DE", { timeZone: DEFAULT_TZ, hour: "2-digit", minute: "2-digit" }).format(date);
  return `${day}, ${time} Uhr`;
}

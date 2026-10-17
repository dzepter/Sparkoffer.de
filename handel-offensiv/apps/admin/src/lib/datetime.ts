/**
 * Datums-Helfer (deutsche Formate, Europe/Berlin).
 */

const TZ = "Europe/Berlin";

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return `${new Intl.DateTimeFormat("de-DE", {
    timeZone: TZ,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))} Uhr`;
}

export function formatTime(iso: string): string {
  return `${new Intl.DateTimeFormat("de-DE", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))} Uhr`;
}

/** Offset (ms) der Zeitzone gegenueber UTC zum gegebenen Zeitpunkt. */
function tzOffsetMs(date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) parts[p.type] = p.value;
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - date.getTime();
}

/**
 * Beginn und Ende des HEUTIGEN Tages in Europe/Berlin als ISO-Strings (UTC) –
 * fuer timestamptz-Range-Abfragen ("heute relevante Termine").
 * `date` ist das heutige Kalenderdatum in Berlin ('YYYY-MM-DD', fuer
 * date-Spalten wie cohorts.start_date/end_date).
 */
export function todayRangeBerlin(now: Date = new Date()): {
  start: string;
  end: string;
  date: string;
} {
  const offset = tzOffsetMs(now);
  const local = new Date(now.getTime() + offset);
  const startUtcMs =
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - offset;
  const date = local.toISOString().slice(0, 10);
  return {
    start: new Date(startUtcMs).toISOString(),
    end: new Date(startUtcMs + 24 * 60 * 60 * 1000).toISOString(),
    date,
  };
}

/**
 * ICS-Erzeugung (RFC 5545) fuer einen Praesenztermin – VCALENDAR mit einem
 * VEVENT. Port von apps/mobile/src/features/termine/ics.ts; wie die
 * Admin-Route nutzt der Campus eine explizite VTIMEZONE fuer Europe/Berlin
 * und lokale DTSTART/DTEND mit TZID, damit der Termin auch in Kalendern
 * ohne IANA-Datenbank korrekt liegt.
 *
 * Reine Funktion, keine IO – die Route /termine/[sessionId]/kalender.ics
 * laedt den Termin im NUTZER-Kontext (RLS) und liefert diesen String aus.
 */

import type { CohortSessionRow } from "@handel-offensiv/types";

const TZID = "Europe/Berlin";

export type SessionIcsInput = Pick<
  CohortSessionRow,
  "id" | "title" | "starts_at" | "ends_at" | "venue" | "address" | "room" | "notes" | "directions" | "updated_at"
> & {
  /** Gruppenname (optional, landet in der Beschreibung) */
  cohortName?: string | null;
};

/** Text nach RFC 5545 escapen (Backslash, Semikolon, Komma, Zeilenumbruch). */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/** ISO-Zeitstempel -> lokale ICS-Zeit (YYYYMMDDTHHMMSS) in Europe/Berlin. */
export function toIcsLocal(iso: string): string {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TZID,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(new Date(iso))) parts[p.type] = p.value;
  // Einige Engines liefern "24" fuer Mitternacht
  const hour = String(Number(parts.hour) % 24).padStart(2, "0");
  return `${parts.year}${parts.month}${parts.day}T${hour}${parts.minute}${parts.second}`;
}

/** ISO-Zeitstempel -> UTC-ICS-Zeit (YYYYMMDDTHHMMSSZ), z. B. fuer DTSTAMP. */
export function toIcsUtc(iso: string): string {
  return `${new Date(iso).toISOString().slice(0, 19).replace(/[-:]/g, "")}Z`;
}

/** Zeilen laenger als 75 Oktette falten (CRLF + Leerzeichen, RFC 5545 §3.1). */
export function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  const out: string[] = [];
  let current = "";
  let currentBytes = 0;
  for (const ch of line) {
    const chBytes = encoder.encode(ch).length;
    const limit = out.length === 0 ? 75 : 74; // Folgezeilen beginnen mit Leerzeichen
    if (currentBytes + chBytes > limit) {
      out.push(current);
      current = "";
      currentBytes = 0;
    }
    current += ch;
    currentBytes += chBytes;
  }
  if (current !== "") out.push(current);
  return out.join("\r\n ");
}

/** ICS-String (VCALENDAR mit einem VEVENT) fuer einen Praesenztermin. */
export function buildSessionIcs(session: SessionIcsInput): string {
  const location = [session.venue, session.room, session.address]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join(", ");

  const description = [
    session.cohortName ? `Gruppe: ${session.cohortName}` : null,
    session.notes,
    session.directions ? `Anfahrt: ${session.directions}` : null,
  ]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join("\n\n");

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Aigner Offensiv//Handel Offensiv Campus//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VTIMEZONE",
    `TZID:${TZID}`,
    "BEGIN:STANDARD",
    "DTSTART:19961027T030000",
    "TZOFFSETFROM:+0200",
    "TZOFFSETTO:+0100",
    "TZNAME:CET",
    "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
    "END:STANDARD",
    "BEGIN:DAYLIGHT",
    "DTSTART:19810329T020000",
    "TZOFFSETFROM:+0100",
    "TZOFFSETTO:+0200",
    "TZNAME:CEST",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
    "END:DAYLIGHT",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:${session.id}@handel-offensiv`,
    `DTSTAMP:${toIcsUtc(session.updated_at)}`,
    `DTSTART;TZID=${TZID}:${toIcsLocal(session.starts_at)}`,
  ];
  if (session.ends_at) {
    lines.push(`DTEND;TZID=${TZID}:${toIcsLocal(session.ends_at)}`);
  }
  lines.push(`SUMMARY:${escapeIcsText(session.title)}`);
  if (location !== "") lines.push(`LOCATION:${escapeIcsText(location)}`);
  if (description !== "") lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.map(foldIcsLine).join("\r\n") + "\r\n";
}

/** Dateiname fuer den Download, z. B. "termin-offensivtag-2-fuehrung.ics". */
export function icsFileName(title: string): string {
  const safe = title
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `termin-${safe || "offensivtag"}.ics`;
}

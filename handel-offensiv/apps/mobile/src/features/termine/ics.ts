/**
 * ICS-Erzeugung und -Teilen für Präsenztermine (Briefing §18).
 *
 * WICHTIG: Es wird KEINE Kalender-Berechtigung angefragt. Stattdessen wird
 * ein ICS-String lokal erzeugt, als Datei in den App-Cache geschrieben und
 * über das System-Share-Sheet geteilt – der Nutzer entscheidet selbst,
 * in welchen Kalender (oder welche App) der Termin übernommen wird.
 */
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { CohortSessionRow } from "@handel-offensiv/types";

/** Text nach RFC 5545 escapen (Backslash, Semikolon, Komma, Zeilenumbruch). */
function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** ISO-Zeitstempel -> ICS-UTC-Format (YYYYMMDDTHHMMSSZ). */
function toIcsUtc(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

/** Lange Zeilen nach RFC 5545 falten (max. 75 Oktette, Folgezeile " …"). */
function foldIcsLine(line: string): string {
  const max = 74;
  if (line.length <= max) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, max));
  rest = rest.slice(max);
  while (rest.length > 0) {
    parts.push(` ${rest.slice(0, max - 1)}`);
    rest = rest.slice(max - 1);
  }
  return parts.join("\r\n");
}

/** ICS-String (VCALENDAR mit einem VEVENT) für einen Präsenztermin. */
export function buildSessionIcs(session: CohortSessionRow): string {
  const location = [session.venue, session.room, session.address]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join(", ");

  const descriptionParts: string[] = [];
  if (session.notes) descriptionParts.push(session.notes);
  if (session.directions) descriptionParts.push(`Anfahrt: ${session.directions}`);

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Aigner Offensiv//Handel Offensiv//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${session.id}@handel-offensiv`,
    `DTSTAMP:${toIcsUtc(new Date().toISOString())}`,
    `DTSTART:${toIcsUtc(session.starts_at)}`,
  ];
  if (session.ends_at) {
    lines.push(`DTEND:${toIcsUtc(session.ends_at)}`);
  }
  lines.push(`SUMMARY:${escapeIcsText(session.title)}`);
  if (location.length > 0) {
    lines.push(`LOCATION:${escapeIcsText(location)}`);
  }
  if (descriptionParts.length > 0) {
    lines.push(`DESCRIPTION:${escapeIcsText(descriptionParts.join("\n\n"))}`);
  }
  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.map(foldIcsLine).join("\r\n") + "\r\n";
}

export type ShareIcsResult = "shared" | "unavailable" | "error";

/**
 * ICS-Datei in den Cache schreiben und über das System-Share-Sheet anbieten.
 * Gibt "unavailable" zurück, wenn Teilen auf dem Gerät nicht möglich ist –
 * der aufrufende Screen zeigt dann einen verständlichen Hinweis.
 */
export async function shareSessionIcs(session: CohortSessionRow): Promise<ShareIcsResult> {
  try {
    const available = await Sharing.isAvailableAsync();
    if (!available) return "unavailable";

    const safeName = session.title
      .toLowerCase()
      .replace(/[^a-z0-9äöüß]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
    const uri = `${FileSystem.cacheDirectory ?? ""}termin-${safeName || "offensivtag"}.ics`;

    await FileSystem.writeAsStringAsync(uri, buildSessionIcs(session), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    await Sharing.shareAsync(uri, {
      mimeType: "text/calendar",
      UTI: "com.apple.ical.ics",
      dialogTitle: "Termin in Kalender übernehmen",
    });
    return "shared";
  } catch {
    return "error";
  }
}

/**
 * ICS-Export eines Praesenztermins (§18): GET /termine/[id]/ics
 *
 * Laeuft im NUTZER-Kontext (anon key + Session-Cookie) – RLS entscheidet,
 * ob der Termin sichtbar ist. Kein Service-Role-Zugriff noetig.
 *
 * Die Datei nutzt eine explizite VTIMEZONE-Definition fuer Europe/Berlin
 * (CET/CEST inkl. Sommerzeitregeln) und lokale DTSTART/DTEND mit TZID –
 * damit stimmt der Termin auch in Kalendern ohne IANA-Datenbank.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TZID = "Europe/Berlin";

interface SessionIcsRow {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  venue: string | null;
  address: string | null;
  room: string | null;
  notes: string | null;
  directions: string | null;
  updated_at: string;
  cohorts: { name: string } | null;
}

/** ISO-Zeitstempel -> lokale ICS-Zeit (YYYYMMDDTHHMMSS) in Europe/Berlin. */
function toIcsLocal(iso: string): string {
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
  const hour = String(Number(parts.hour) % 24).padStart(2, "0");
  return `${parts.year}${parts.month}${parts.day}T${hour}${parts.minute}${parts.second}`;
}

/** ISO-Zeitstempel -> UTC-ICS-Zeit (YYYYMMDDTHHMMSSZ), z. B. fuer DTSTAMP. */
function toIcsUtc(iso: string): string {
  return `${new Date(iso).toISOString().slice(0, 19).replace(/[-:]/g, "")}Z`;
}

/** Text nach RFC 5545 escapen (Backslash, Semikolon, Komma, Zeilenumbruch). */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/** Zeilen laenger als 75 Oktette falten (CRLF + Leerzeichen, RFC 5545 §3.1). */
function foldLine(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;

  const out: string[] = [];
  let current = "";
  let currentBytes = 0;
  for (const ch of line) {
    const chBytes = new TextEncoder().encode(ch).length;
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

function buildIcs(row: SessionIcsRow): string {
  const location = [row.venue, row.room, row.address]
    .filter((p): p is string => Boolean(p && p.trim()))
    .join(", ");
  const description = [
    row.cohorts ? `Gruppe: ${row.cohorts.name}` : null,
    row.notes,
    row.directions ? `Anfahrt: ${row.directions}` : null,
  ]
    .filter((p): p is string => Boolean(p && p.trim()))
    .join("\n\n");

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Aigner Offensiv//Handel Offensiv//DE",
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
    `UID:${row.id}@handel-offensiv`,
    `DTSTAMP:${toIcsUtc(row.updated_at)}`,
    `DTSTART;TZID=${TZID}:${toIcsLocal(row.starts_at)}`,
  ];
  if (row.ends_at !== null) {
    lines.push(`DTEND;TZID=${TZID}:${toIcsLocal(row.ends_at)}`);
  }
  lines.push(`SUMMARY:${escapeIcsText(row.title)}`);
  if (location !== "") lines.push(`LOCATION:${escapeIcsText(location)}`);
  if (description !== "") lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.map(foldLine).join("\r\n") + "\r\n";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;

  if (!z.string().uuid().safeParse(id).success) {
    return new NextResponse("Der angeforderte Termin wurde nicht gefunden.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", _request.url));
  }

  const { data, error } = await supabase
    .from("cohort_sessions")
    .select(
      "id, title, starts_at, ends_at, venue, address, room, notes, directions, updated_at, cohorts(name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return new NextResponse(
      "Der Termin konnte gerade nicht geladen werden. Bitte versuchen Sie es erneut.",
      { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }
  if (!data) {
    // Auch RLS-verborgene Termine landen hier – bewusst dieselbe Meldung
    return new NextResponse("Der angeforderte Termin wurde nicht gefunden.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const ics = buildIcs(data as unknown as SessionIcsRow);

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="termin-${id}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Umrechnung zwischen <input type="datetime-local"> (lokale Zeit Europe/Berlin,
 * "JJJJ-MM-TTTHH:mm") und ISO-8601 mit Offset (timestamptz). Reine Funktionen –
 * nutzbar in Server Actions und Client-Komponenten.
 */

const TZ = "Europe/Berlin";
const LOCAL_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** Offset von Europe/Berlin ("+01:00"/"+02:00") zum ungefaehren Zeitpunkt. */
function berlinOffset(probe: Date): string {
  const part = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    timeZoneName: "longOffset",
  })
    .formatToParts(probe)
    .find((p) => p.type === "timeZoneName")?.value;
  const m = part?.match(/GMT([+-]\d{2}:\d{2})/);
  return m?.[1] ?? "+00:00";
}

/**
 * "2026-03-12T09:00" (Berlin) -> "2026-03-12T09:00:00+01:00".
 * `undefined` bei leerem/ungueltigem Wert. (Am DST-Wechsel selbst kann der
 * Offset um eine Stunde abweichen – fuer Terminplanung akzeptabel.)
 */
export function berlinLocalToIso(local: string | undefined): string | undefined {
  if (local === undefined || !LOCAL_RE.test(local)) return undefined;
  const offset = berlinOffset(new Date(`${local}:00Z`));
  return `${local}:00${offset}`;
}

/** ISO (beliebige Zone) -> "JJJJ-MM-TTTHH:mm" in Berlin fuer datetime-local. */
export function isoToBerlinLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // sv-SE liefert "2026-03-12 09:00"
  const s = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return s.replace(" ", "T");
}

/**
 * Einfacher CSV-Parser fuer den Teilnehmer-Import (§22) – ohne Fremdbibliothek.
 * Tolerant gegenueber Semikolon UND Komma als Trennzeichen, Anfuehrungszeichen
 * (RFC-4180-artig, inkl. "" als Escape), CRLF/LF und BOM. Reine Funktionen –
 * serverseitig genutzt, aber ohne IO.
 */

export interface CsvRawRow {
  /** 1-basierte Zeilennummer in der Datei (inkl. Kopfzeile) */
  line: number;
  cells: string[];
}

/** Trennzeichen-Erkennung anhand der Kopfzeile: mehr ';' als ',' -> ';'. */
export function detectDelimiter(text: string): ";" | "," {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const semi = (firstLine.match(/;/g) ?? []).length;
  const comma = (firstLine.match(/,/g) ?? []).length;
  return semi >= comma ? ";" : ",";
}

/** Zerlegt den CSV-Text in Zeilen/Zellen (Anfuehrungszeichen-sicher). */
export function parseCsv(text: string, delimiter: ";" | ","): CsvRawRow[] {
  const clean = text.replace(/^\uFEFF/, ""); // BOM entfernen
  const rows: CsvRawRow[] = [];
  let cells: string[] = [];
  let cell = "";
  let inQuotes = false;
  let line = 1;

  const pushCell = () => {
    cells.push(cell.trim());
    cell = "";
  };
  const pushRow = () => {
    pushCell();
    // Komplett leere Zeilen ueberspringen
    if (cells.some((c) => c !== "")) rows.push({ line, cells });
    cells = [];
  };

  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i] as string;

    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          cell += '"';
          i += 1; // Escape ""
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
        if (ch === "\n") line += 1;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      pushCell();
    } else if (ch === "\n") {
      pushRow();
      line += 1;
    } else if (ch === "\r") {
      // CRLF: \n uebernimmt den Zeilenumbruch
    } else {
      cell += ch;
    }
  }
  if (cell !== "" || cells.length > 0) pushRow();

  return rows;
}

/** Spaltenzuordnung: deutsche und englische Kopfbezeichnungen zulassen. */
const HEADER_ALIASES: Record<"first_name" | "last_name" | "email", string[]> = {
  first_name: ["first_name", "firstname", "vorname"],
  last_name: ["last_name", "lastname", "nachname", "name"],
  email: ["email", "e-mail", "e_mail", "mail", "e-mail-adresse"],
};

export interface HeaderMap {
  first_name: number;
  last_name: number;
  email: number;
}

/** Erkennt die Spaltenindizes aus der Kopfzeile; null bei fehlenden Spalten. */
export function mapHeader(cells: string[]): HeaderMap | null {
  const normalized = cells.map((c) => c.trim().toLowerCase());
  const find = (key: keyof typeof HEADER_ALIASES): number =>
    normalized.findIndex((c) => HEADER_ALIASES[key].includes(c));

  const map = { first_name: find("first_name"), last_name: find("last_name"), email: find("email") };
  if (map.first_name < 0 || map.last_name < 0 || map.email < 0) return null;
  return map;
}

export interface ParsedParticipantRow {
  line: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ParticipantCsvResult {
  rows: ParsedParticipantRow[];
  /** Deutsche Fehlermeldung, falls die Datei als Ganzes unbrauchbar ist */
  error?: string;
}

/** Datei-Text -> Teilnehmerzeilen (noch ohne inhaltliche Validierung). */
export function parseParticipantCsv(text: string): ParticipantCsvResult {
  if (text.trim() === "") return { rows: [], error: "Die Datei ist leer." };

  const delimiter = detectDelimiter(text);
  const raw = parseCsv(text, delimiter);
  if (raw.length === 0) return { rows: [], error: "Die Datei enthält keine Daten." };

  const header = mapHeader(raw[0]!.cells);
  if (header === null) {
    return {
      rows: [],
      error:
        "Die Kopfzeile wurde nicht erkannt. Erwartet werden die Spalten Vorname, Nachname und E-Mail (bzw. first_name, last_name, email).",
    };
  }

  const rows: ParsedParticipantRow[] = raw.slice(1).map((r) => ({
    line: r.line,
    firstName: r.cells[header.first_name] ?? "",
    lastName: r.cells[header.last_name] ?? "",
    email: (r.cells[header.email] ?? "").toLowerCase(),
  }));

  if (rows.length === 0) {
    return { rows: [], error: "Die Datei enthält keine Datenzeilen unterhalb der Kopfzeile." };
  }

  return { rows };
}

/**
 * Gemeinsame Metadaten fuer den Bereich Programme & Inhalte:
 * deutsche Labels je DB-Enum, Badge-Toene und kleine, pure Zeit-Helfer.
 * Bewusst ohne IO – nutzbar in Server- UND Client-Komponenten.
 */

import type {
  BlockType,
  ContentStatus,
  PhaseType,
  QuestionKind,
} from "@handel-offensiv/types";

import type { BadgeTone } from "@/components/ui/badge";

/* ------------------------------ Labels -------------------------------- */

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  draft: "Entwurf",
  scheduled: "Geplant",
  published: "Veröffentlicht",
  archived: "Archiviert",
};

export const CONTENT_STATUS_TONES: Record<ContentStatus, BadgeTone> = {
  draft: "neutral",
  scheduled: "warning",
  published: "success",
  archived: "dark",
};

/** Deutsche Bezeichnungen der 14 Blocktypen (§24). */
export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  text: "Text",
  video: "Video",
  audio: "Audio",
  pdf: "PDF",
  image: "Bild",
  checklist: "Checkliste",
  reflection: "Reflexionsfrage",
  single_choice: "Single Choice",
  multiple_choice: "Multiple Choice",
  quiz: "Quiz",
  scale: "Skala",
  transfer_task: "Transferaufgabe",
  download: "Download",
  external_link: "Externer Link",
};

export const PHASE_TYPE_LABELS: Record<PhaseType, string> = {
  before_day: "Vor dem Präsenztag",
  day: "Präsenztag",
  after_day: "Nach dem Präsenztag",
  prep_next: "Vorbereitung auf den nächsten Tag",
  custom: "Frei definiert",
};

export const QUESTION_KIND_LABELS: Record<QuestionKind, string> = {
  single: "Single Choice",
  multiple: "Multiple Choice",
  truefalse: "Richtig/Falsch",
  freetext: "Freitext",
};

/* ------------------------- Dialog-Action-State ------------------------- */

/**
 * Rueckgabeform der Dialog-Server-Actions (useActionState):
 * `ts` aendert sich bei jedem Ergebnis, damit Dialoge zuverlaessig auf
 * Erfolg reagieren (Schliessen per Effekt) – auch bei zwei Erfolgen in Folge.
 */
export interface DialogActionState {
  ok: boolean;
  error: string | null;
  ts: number;
}

export const initialDialogState: DialogActionState = { ok: false, error: null, ts: 0 };

/* ------------------------------ Zeit-Helfer ---------------------------- */

const TZ = "Europe/Berlin";

/** Offset (ms) von Europe/Berlin gegenueber UTC zum gegebenen Zeitpunkt. */
function berlinOffsetMs(date: Date): number {
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
 * Wert eines <input type="datetime-local"> ("JJJJ-MM-TTTHH:MM"),
 * interpretiert als Europe-Berlin-Zeit, in einen ISO-UTC-String.
 * `null` bei unbrauchbarem Format.
 */
export function berlinLocalToIso(local: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const h = Number(m[4]);
  const mi = Number(m[5]);
  const wallUtc = Date.UTC(y, mo - 1, d, h, mi);
  // Zwei Iterationen wegen moeglicher DST-Grenze
  let utc = wallUtc - berlinOffsetMs(new Date(wallUtc));
  utc = wallUtc - berlinOffsetMs(new Date(utc));
  return new Date(utc).toISOString();
}

/** ISO-String -> Wert fuer <input type="datetime-local"> in Europe/Berlin. */
export function isoToBerlinLocal(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) parts[p.type] = p.value;
  return `${parts.year}-${parts.month}-${parts.day}T${(parts.hour === "24" ? "00" : parts.hour) ?? "00"}:${parts.minute ?? "00"}`;
}

/** Sekunden -> "MM:SS" bzw. "H:MM:SS" fuer Video-/Audio-Dauern. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const two = (n: number): string => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${two(m)}:${two(sec)}` : `${m}:${two(sec)}`;
}

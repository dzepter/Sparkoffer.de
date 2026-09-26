/**
 * Labels und Zeitformatierung fuer Nachrichten (Benachrichtigungen +
 * Ankuendigungen). Port aus apps/mobile/src/features/benachrichtigungen.
 * Reine Funktionen, in Server- und Client-Komponenten nutzbar.
 */

import type { NotificationKind } from "@handel-offensiv/types";

const TZ = "Europe/Berlin";

export const KIND_LABELS: Record<NotificationKind, string> = {
  release: "Neue Inhalte",
  session_reminder: "Offensivtag",
  task_due: "Fällige Aufgabe",
  announcement: "Ankündigung",
  feedback: "Trainer-Feedback",
};

/** "12.03.2027" */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));
}

/** "Freitag, 12. März 2027" */
export function formatDateLong(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", { timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}

/** Verstaendliche deutsche Zeitangabe relativ zu jetzt. */
export function relativeTime(iso: string, now: Date): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Gerade eben";
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Gestern";
  if (days < 7) return `vor ${days} Tagen`;
  return formatDate(iso);
}

/** Nur interne Pfade ("/...") duerfen verlinkt werden – niemals fremde URLs. */
export function safeInternalLink(link: string | null): string | null {
  if (typeof link !== "string") return null;
  if (!link.startsWith("/") || link.startsWith("//")) return null;
  return link;
}

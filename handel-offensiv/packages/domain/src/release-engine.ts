/**
 * §9 Release-Engine: reine Auswertung der Freischaltungsregeln (lesson_releases).
 *
 * Keine IO – der Aufrufer laedt Regeln, Sessions und Fortschritt und uebergibt
 * sie als Kontext. Zeitfenster halboffen: [freigeschaltet, expires_at) –
 * exakt am Stichtag ist eine Lektion frei, exakt bei expires_at bereits gesperrt.
 */

import type { CohortSessionRow, LessonReleaseRow, Uuid } from '@handel-offensiv/types';

// --------------------------------------------------------------------------
// Typen
// --------------------------------------------------------------------------

/** Eingangsdaten fuer die Auswertung einer Regel */
export interface ReleaseEvaluationContext {
  /** Bezugszeitpunkt der Auswertung */
  now: Date;
  /** Praesenztermine der Cohort (fuer days_after/before_session) */
  sessions: CohortSessionRow[];
  /** Vom Profil abgeschlossene Lektionen (fuer after_lesson) */
  completedLessonIds: Set<Uuid>;
  /** Vom Profil vollstaendig abgeschlossene Module (fuer after_module) */
  completedModuleIds: Set<Uuid>;
}

/** Ergebnis der Auswertung */
export interface ReleaseDecision {
  released: boolean;
  /** Maschinen-lesbarer Grund, falls gesperrt */
  reason?: string;
  /** Bekannter Freischaltzeitpunkt (falls berechenbar) */
  availableAt?: Date;
  /** Deutscher Anzeigetext fuer den Sperr-Zustand */
  lockedLabel?: string;
}

// --------------------------------------------------------------------------
// Auswertung
// --------------------------------------------------------------------------

/**
 * Wertet genau eine Freischaltungsregel gegen den Kontext aus.
 * Alle 7 release_modes werden unterstuetzt; expires_at dominiert alles.
 */
export function isLessonReleased(
  release: LessonReleaseRow,
  ctx: ReleaseEvaluationContext,
): ReleaseDecision {
  const nowMs = ctx.now.getTime();

  // Ablauf dominiert: ab expires_at (einschliesslich) ist die Lektion gesperrt
  if (release.expires_at !== null && nowMs >= Date.parse(release.expires_at)) {
    return locked('expired', 'Diese Lektion ist nicht mehr verfügbar.');
  }

  switch (release.release_mode) {
    case 'immediate':
      return { released: true };

    case 'at_datetime': {
      if (release.release_at === null) {
        // Fehlkonfiguration: ohne Zeitpunkt bleibt die Lektion gesperrt
        return locked('config_invalid', 'Diese Lektion ist noch gesperrt.');
      }
      const at = new Date(release.release_at);
      if (nowMs >= at.getTime()) return { released: true };
      return locked('awaiting_datetime', `Wird am ${formatBerlin(at)} freigeschaltet.`, at);
    }

    case 'days_after_session':
    case 'days_before_session': {
      const after = release.release_mode === 'days_after_session';
      const session =
        release.session_id !== null
          ? ctx.sessions.find((s) => s.id === release.session_id)
          : undefined;
      if (session === undefined) {
        return locked(
          'session_missing',
          after
            ? 'Wird nach dem Präsenztag freigeschaltet.'
            : 'Wird vor dem Präsenztag freigeschaltet.',
        );
      }
      const offset = release.offset_days ?? 0;
      const availableAt = addDays(new Date(session.starts_at), after ? offset : -offset);
      if (nowMs >= availableAt.getTime()) return { released: true };
      const label = after
        ? `Wird nach ${session.title} freigeschaltet.`
        : `Wird ${offset === 1 ? '1 Tag' : `${offset} Tage`} vor ${session.title} freigeschaltet.`;
      return locked('awaiting_session_offset', label, availableAt);
    }

    case 'after_lesson': {
      if (release.prerequisite_lesson_id === null) {
        return locked('config_invalid', 'Diese Lektion ist noch gesperrt.');
      }
      if (ctx.completedLessonIds.has(release.prerequisite_lesson_id)) return { released: true };
      return locked(
        'prerequisite_lesson_open',
        'Wird nach Abschluss der vorherigen Lektion freigeschaltet.',
      );
    }

    case 'after_module': {
      if (release.prerequisite_module_id === null) {
        return locked('config_invalid', 'Diese Lektion ist noch gesperrt.');
      }
      if (ctx.completedModuleIds.has(release.prerequisite_module_id)) return { released: true };
      return locked(
        'prerequisite_module_open',
        'Wird nach Abschluss des vorherigen Moduls freigeschaltet.',
      );
    }

    case 'manual': {
      // manual: released_at gesetzt und erreicht -> frei, sonst gesperrt
      if (release.released_at !== null) {
        const at = new Date(release.released_at);
        if (nowMs >= at.getTime()) return { released: true };
        return locked('manual_not_released', 'Wird vom Trainer freigeschaltet.', at);
      }
      return locked('manual_not_released', 'Wird vom Trainer freigeschaltet.');
    }
  }
}

/**
 * Waehlt aus den Regeln einer Cohort die fuer (lesson, profile) massgebliche:
 * individuelle Freischaltung (profile_id = Profil) schlaegt die Cohort-Regel
 * (profile_id null); Regeln fremder Profile werden ignoriert.
 */
export function selectRelevantRelease(
  releases: LessonReleaseRow[],
  lessonId: Uuid,
  profileId: Uuid,
): LessonReleaseRow | undefined {
  const forLesson = releases.filter((r) => r.lesson_id === lessonId);
  return (
    forLesson.find((r) => r.profile_id === profileId) ??
    forLesson.find((r) => r.profile_id === null)
  );
}

// --------------------------------------------------------------------------
// intern
// --------------------------------------------------------------------------

const DAY_MS = 86_400_000;

function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * DAY_MS);
}

function locked(reason: string, lockedLabel: string, availableAt?: Date): ReleaseDecision {
  const decision: ReleaseDecision = { released: false, reason, lockedLabel };
  if (availableAt !== undefined) decision.availableAt = availableAt;
  return decision;
}

/** Datum/Uhrzeit deutsch formatiert in Europe/Berlin, z. B. "12.03.2026 um 09:00 Uhr" */
function formatBerlin(d: Date): string {
  const date = new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
  const time = new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
  return `${date} um ${time} Uhr`;
}

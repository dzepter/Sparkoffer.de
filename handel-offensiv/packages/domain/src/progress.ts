/**
 * Fortschrittsberechnung (Spiegel der View module_progress) und
 * Dashboard-Ableitung (§10). Reine Funktionen ohne IO.
 */

import type {
  AnnouncementRow,
  CohortSessionRow,
  DashboardData,
  DashboardLesson,
  DashboardOpenTask,
  DashboardPhase,
  IsoDateTime,
  LearningPhaseRow,
  LessonProgressRow,
  LessonRow,
  ModuleProgress,
  ModuleRow,
  Uuid,
} from '@handel-offensiv/types';

// --------------------------------------------------------------------------
// Fortschritt
// --------------------------------------------------------------------------

/** Aggregierter Fortschritt einer Lektionsmenge */
export interface ProgressSummary {
  total: number;
  completed: number;
  /** 0–100, gerundet; leere Menge -> 0 */
  percent: number;
}

/** Fortschritt ueber eine beliebige Lektionsliste (Lesson-IDs) */
export function computeLessonListProgress(
  lessonIds: readonly Uuid[],
  progressRows: readonly LessonProgressRow[],
): ProgressSummary {
  const completedIds = new Set(
    progressRows.filter((r) => r.status === 'completed').map((r) => r.lesson_id),
  );
  const total = lessonIds.length;
  const completed = lessonIds.filter((id) => completedIds.has(id)).length;
  return { total, completed, percent: toPercent(completed, total) };
}

/** Fortschritt eines Moduls – zaehlt wie die View NUR published Lessons */
export function computeModuleProgress(
  lessons: readonly LessonRow[],
  progressRows: readonly LessonProgressRow[],
): ProgressSummary {
  const published = lessons.filter((l) => l.status === 'published').map((l) => l.id);
  return computeLessonListProgress(published, progressRows);
}

/** Programm-Fortschritt: gewichtet ueber Lektionsanzahl aller Module */
export function computeProgramProgress(
  moduleProgresses: readonly ProgressSummary[],
): ProgressSummary {
  const total = moduleProgresses.reduce((sum, m) => sum + m.total, 0);
  const completed = moduleProgresses.reduce((sum, m) => sum + m.completed, 0);
  return { total, completed, percent: toPercent(completed, total) };
}

// --------------------------------------------------------------------------
// Dashboard (§10)
// --------------------------------------------------------------------------

/** Eingangsdaten der Dashboard-Ableitung (bereits geladen und RLS-gefiltert) */
export interface DeriveDashboardInput {
  now: Date;
  modules: ModuleRow[];
  phases: LearningPhaseRow[];
  lessons: LessonRow[];
  sessions: CohortSessionRow[];
  progressRows: LessonProgressRow[];
  /** Ergebnis der Release-Engine: aktuell freigeschaltete Lektionen */
  releasedLessonIds: Set<Uuid>;
  /** Faelligkeiten aus lesson_releases.due_at je Lektion */
  dueAtByLessonId?: ReadonlyMap<Uuid, IsoDateTime>;
  /** Kandidaten offener Aufgaben (required Blocks ohne Abgabe/Abschluss) */
  openTaskCandidates: DashboardOpenTask[];
  /** Zeilen der View module_progress fuer Profil + Cohort */
  moduleProgresses: ModuleProgress[];
  /** Ankuendigungen der Cohort (unsortiert erlaubt) */
  announcements: AnnouncementRow[];
}

/**
 * Leitet die Dashboard-Daten ab:
 * - wichtigste Lektion = erste freigeschaltete, nicht abgeschlossene published
 *   Lektion in Curriculum-Reihenfolge (Modul- > Phasen- > Lektions-Position)
 * - aktuelle Phase = Phase dieser Lektion
 * - naechste Session = frueheste mit starts_at >= now
 * - offene Aufgaben: max. 3, sortiert nach due_at (ohne due_at zuletzt)
 * - Ankuendigung: neueste mit published_at <= now
 */
export function deriveDashboard(input: DeriveDashboardInput): DashboardData {
  const moduleOrder = orderIndex([...input.modules].sort((a, b) => a.position - b.position));
  const sortedPhases = [...input.phases].sort(
    (a, b) => byIndex(moduleOrder, a.module_id, b.module_id) || a.position - b.position,
  );
  const phaseOrder = orderIndex(sortedPhases);
  const sortedLessons = [...input.lessons].sort(
    (a, b) =>
      byIndex(phaseOrder, a.learning_phase_id, b.learning_phase_id) || a.position - b.position,
  );

  const progressByLesson = new Map(input.progressRows.map((r) => [r.lesson_id, r]));

  // Wichtigste Lektion
  const featured = sortedLessons.find(
    (l) =>
      l.status === 'published' &&
      input.releasedLessonIds.has(l.id) &&
      progressByLesson.get(l.id)?.status !== 'completed',
  );

  const phaseById = new Map(input.phases.map((p) => [p.id, p]));
  const moduleById = new Map(input.modules.map((m) => [m.id, m]));

  let currentPhase: DashboardPhase | null = null;
  let featuredLesson: DashboardLesson | null = null;
  if (featured !== undefined) {
    const phase = phaseById.get(featured.learning_phase_id);
    const module = phase !== undefined ? moduleById.get(phase.module_id) : undefined;
    if (phase !== undefined && module !== undefined) {
      currentPhase = {
        moduleId: module.id,
        moduleNumberLabel: module.number_label,
        moduleTitle: module.title,
        phaseId: phase.id,
        phaseType: phase.phase_type,
        phaseTitle: phase.title,
      };
      featuredLesson = {
        lessonId: featured.id,
        title: featured.title,
        summary: featured.summary,
        estimatedMinutes: featured.estimated_minutes,
        moduleId: module.id,
        phaseId: phase.id,
        dueAt: input.dueAtByLessonId?.get(featured.id) ?? null,
      };
    }
  }

  // Naechste Session: frueheste zukuenftige
  const nowMs = input.now.getTime();
  const nextSession = input.sessions
    .filter((s) => Date.parse(s.starts_at) >= nowMs)
    .reduce<CohortSessionRow | null>(
      (best, s) =>
        best === null || Date.parse(s.starts_at) < Date.parse(best.starts_at) ? s : best,
      null,
    );

  // Offene Aufgaben: nach due_at sortiert (null zuletzt), max. 3
  const openTasks = [...input.openTaskCandidates]
    .sort((a, b) => {
      if (a.dueAt === null && b.dueAt === null) return 0;
      if (a.dueAt === null) return 1;
      if (b.dueAt === null) return -1;
      return Date.parse(a.dueAt) - Date.parse(b.dueAt);
    })
    .slice(0, 3);

  // Ankuendigung: neueste bereits veroeffentlichte
  const announcement = input.announcements
    .filter((a) => Date.parse(a.published_at) <= nowMs)
    .reduce<AnnouncementRow | null>(
      (best, a) =>
        best === null || Date.parse(a.published_at) > Date.parse(best.published_at) ? a : best,
      null,
    );

  return {
    currentPhase,
    nextSession,
    featuredLesson,
    openTasks,
    progress: {
      overallPercent: computeProgramProgress(
        input.moduleProgresses.map((m) => ({
          total: m.total_lessons,
          completed: m.completed_lessons,
          percent: m.percent,
        })),
      ).percent,
      modules: input.moduleProgresses,
    },
    announcement,
  };
}

// --------------------------------------------------------------------------
// intern
// --------------------------------------------------------------------------

function toPercent(completed: number, total: number): number {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

function orderIndex(rows: readonly { id: Uuid }[]): Map<Uuid, number> {
  return new Map(rows.map((row, index) => [row.id, index]));
}

/** Vergleich zweier IDs anhand einer Ordnungs-Map (unbekannte IDs ans Ende) */
function byIndex(order: Map<Uuid, number>, a: Uuid, b: Uuid): number {
  return (
    (order.get(a) ?? Number.MAX_SAFE_INTEGER) - (order.get(b) ?? Number.MAX_SAFE_INTEGER)
  );
}

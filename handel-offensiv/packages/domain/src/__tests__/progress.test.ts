import { describe, expect, it } from 'vitest';
import type { DashboardOpenTask, ModuleProgress } from '@handel-offensiv/types';
import type { DeriveDashboardInput } from '../progress';
import {
  computeLessonListProgress,
  computeModuleProgress,
  computeProgramProgress,
  deriveDashboard,
} from '../progress';
import {
  makeAnnouncement,
  makeLesson,
  makeModule,
  makePhase,
  makeProgress,
  makeSession,
} from './factories';

describe('computeLessonListProgress', () => {
  it('liefert 0/0/0 fuer die leere Liste', () => {
    expect(computeLessonListProgress([], [])).toEqual({ total: 0, completed: 0, percent: 0 });
  });

  it('zaehlt nur completed-Rows (in_progress zaehlt nicht)', () => {
    const result = computeLessonListProgress(
      ['l1', 'l2', 'l3'],
      [
        makeProgress({ lesson_id: 'l1', status: 'completed' }),
        makeProgress({ id: 'p2', lesson_id: 'l2', status: 'in_progress' }),
      ],
    );
    expect(result).toEqual({ total: 3, completed: 1, percent: 33 });
  });

  it('ignoriert Fortschritt zu fremden Lektionen und erreicht 100 %', () => {
    const result = computeLessonListProgress(
      ['l1', 'l2'],
      [
        makeProgress({ lesson_id: 'l1' }),
        makeProgress({ id: 'p2', lesson_id: 'l2' }),
        makeProgress({ id: 'p3', lesson_id: 'l99' }),
      ],
    );
    expect(result).toEqual({ total: 2, completed: 2, percent: 100 });
  });
});

describe('computeModuleProgress', () => {
  it('zaehlt nur published Lessons (wie die View module_progress)', () => {
    const lessons = [
      makeLesson({ id: 'l1', status: 'published' }),
      makeLesson({ id: 'l2', status: 'draft' }),
      makeLesson({ id: 'l3', status: 'published' }),
    ];
    const result = computeModuleProgress(lessons, [makeProgress({ lesson_id: 'l1' })]);
    expect(result).toEqual({ total: 2, completed: 1, percent: 50 });
  });

  it('liefert 0 % fuer ein Modul ohne published Lessons', () => {
    const result = computeModuleProgress([makeLesson({ status: 'draft' })], []);
    expect(result).toEqual({ total: 0, completed: 0, percent: 0 });
  });
});

describe('computeProgramProgress', () => {
  it('gewichtet ueber die Lektionsanzahl der Module', () => {
    const result = computeProgramProgress([
      { total: 8, completed: 8, percent: 100 },
      { total: 2, completed: 0, percent: 0 },
    ]);
    expect(result).toEqual({ total: 10, completed: 8, percent: 80 });
  });

  it('liefert 0 fuer ein leeres Programm', () => {
    expect(computeProgramProgress([])).toEqual({ total: 0, completed: 0, percent: 0 });
  });
});

describe('deriveDashboard', () => {
  const NOW = new Date('2026-03-01T12:00:00.000Z');

  const modules = [
    makeModule({ id: 'm1', position: 1, number_label: 'Modul 1', title: 'Grundlagen' }),
    makeModule({ id: 'm2', position: 2, number_label: 'Modul 2', title: 'Vertiefung' }),
  ];
  const phases = [
    makePhase({ id: 'ph1', module_id: 'm1', position: 1, phase_type: 'before_day' }),
    makePhase({ id: 'ph2', module_id: 'm1', position: 2, phase_type: 'after_day' }),
    makePhase({ id: 'ph3', module_id: 'm2', position: 1, phase_type: 'before_day' }),
  ];
  const lessons = [
    makeLesson({ id: 'l1', learning_phase_id: 'ph1', position: 1, title: 'Start' }),
    makeLesson({ id: 'l2', learning_phase_id: 'ph1', position: 2, title: 'Transfer' }),
    makeLesson({ id: 'l3', learning_phase_id: 'ph2', position: 1, title: 'Nachbereitung' }),
    makeLesson({ id: 'l4', learning_phase_id: 'ph3', position: 1, title: 'Modul 2 Start' }),
  ];
  const moduleProgresses: ModuleProgress[] = [
    { profile_id: 'profile-1', module_id: 'm1', cohort_id: 'cohort-1', total_lessons: 3, completed_lessons: 1, percent: 33 },
    { profile_id: 'profile-1', module_id: 'm2', cohort_id: 'cohort-1', total_lessons: 1, completed_lessons: 0, percent: 0 },
  ];

  function input(overrides: Partial<DeriveDashboardInput> = {}): DeriveDashboardInput {
    return {
      now: NOW,
      modules,
      phases,
      lessons,
      sessions: [],
      progressRows: [makeProgress({ lesson_id: 'l1' })],
      releasedLessonIds: new Set(['l1', 'l2', 'l3']),
      openTaskCandidates: [],
      moduleProgresses,
      announcements: [],
      ...overrides,
    };
  }

  it('wichtigste Lektion = erste freigeschaltete, nicht abgeschlossene', () => {
    const dashboard = deriveDashboard(input());
    expect(dashboard.featuredLesson?.lessonId).toBe('l2');
    expect(dashboard.featuredLesson?.moduleId).toBe('m1');
    expect(dashboard.currentPhase?.phaseId).toBe('ph1');
    expect(dashboard.currentPhase?.moduleNumberLabel).toBe('Modul 1');
  });

  it('ueberspringt gesperrte und nicht-published Lektionen', () => {
    const dashboard = deriveDashboard(
      input({
        lessons: [
          makeLesson({ id: 'l1', learning_phase_id: 'ph1', position: 1, status: 'draft' }),
          ...lessons.slice(1),
        ],
        releasedLessonIds: new Set(['l1', 'l3']),
        progressRows: [],
      }),
    );
    // l1 draft, l2 nicht freigeschaltet -> l3 in Phase ph2
    expect(dashboard.featuredLesson?.lessonId).toBe('l3');
    expect(dashboard.currentPhase?.phaseId).toBe('ph2');
  });

  it('liefert null-Werte, wenn alles abgeschlossen oder leer ist', () => {
    const dashboard = deriveDashboard(
      input({
        progressRows: [
          makeProgress({ lesson_id: 'l1' }),
          makeProgress({ id: 'p2', lesson_id: 'l2' }),
          makeProgress({ id: 'p3', lesson_id: 'l3' }),
        ],
        releasedLessonIds: new Set(['l1', 'l2', 'l3']),
      }),
    );
    expect(dashboard.featuredLesson).toBeNull();
    expect(dashboard.currentPhase).toBeNull();
    expect(dashboard.nextSession).toBeNull();
    expect(dashboard.announcement).toBeNull();
  });

  it('naechste Session = frueheste zukuenftige (vergangene ignoriert)', () => {
    const dashboard = deriveDashboard(
      input({
        sessions: [
          makeSession({ id: 's-past', starts_at: '2026-02-01T08:00:00.000Z' }),
          makeSession({ id: 's-later', starts_at: '2026-04-01T08:00:00.000Z' }),
          makeSession({ id: 's-next', starts_at: '2026-03-10T08:00:00.000Z' }),
        ],
      }),
    );
    expect(dashboard.nextSession?.id).toBe('s-next');
  });

  it('offene Aufgaben: max. 3, sortiert nach due_at, ohne due_at zuletzt', () => {
    const task = (id: string, dueAt: string | null): DashboardOpenTask => ({
      contentBlockId: id,
      blockType: 'transfer_task',
      lessonId: 'l2',
      lessonTitle: 'Transfer',
      dueAt,
    });
    const dashboard = deriveDashboard(
      input({
        openTaskCandidates: [
          task('t-none', null),
          task('t-late', '2026-03-20T00:00:00.000Z'),
          task('t-early', '2026-03-05T00:00:00.000Z'),
          task('t-mid', '2026-03-10T00:00:00.000Z'),
        ],
      }),
    );
    expect(dashboard.openTasks.map((t) => t.contentBlockId)).toEqual([
      't-early',
      't-mid',
      't-late',
    ]);
  });

  it('Fortschritt: overallPercent gewichtet, Module durchgereicht', () => {
    const dashboard = deriveDashboard(input());
    // 1 von 4 Lektionen -> 25 %
    expect(dashboard.progress.overallPercent).toBe(25);
    expect(dashboard.progress.modules).toEqual(moduleProgresses);
  });

  it('Ankuendigung: neueste bereits veroeffentlichte, zukuenftige ignoriert', () => {
    const dashboard = deriveDashboard(
      input({
        announcements: [
          makeAnnouncement({ id: 'a-old', published_at: '2026-02-01T00:00:00.000Z' }),
          makeAnnouncement({ id: 'a-new', published_at: '2026-02-20T00:00:00.000Z' }),
          makeAnnouncement({ id: 'a-future', published_at: '2026-04-01T00:00:00.000Z' }),
        ],
      }),
    );
    expect(dashboard.announcement?.id).toBe('a-new');
  });
});

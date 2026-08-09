import { describe, expect, it } from 'vitest';
import type { ReleaseEvaluationContext } from '../release-engine';
import { isLessonReleased, selectRelevantRelease } from '../release-engine';
import { makeRelease, makeSession } from './factories';

/** Kontext-Factory; now Standard: 1.3.2026 12:00 UTC */
function ctx(overrides: Partial<ReleaseEvaluationContext> = {}): ReleaseEvaluationContext {
  return {
    now: new Date('2026-03-01T12:00:00.000Z'),
    sessions: [],
    completedLessonIds: new Set(),
    completedModuleIds: new Set(),
    ...overrides,
  };
}

describe('isLessonReleased – immediate', () => {
  it('ist sofort freigeschaltet', () => {
    const result = isLessonReleased(makeRelease({ release_mode: 'immediate' }), ctx());
    expect(result).toEqual({ released: true });
  });

  it('ist trotz immediate gesperrt, wenn expires_at ueberschritten ist', () => {
    const result = isLessonReleased(
      makeRelease({ release_mode: 'immediate', expires_at: '2026-02-01T00:00:00.000Z' }),
      ctx(),
    );
    expect(result.released).toBe(false);
    expect(result.reason).toBe('expired');
    expect(result.lockedLabel).toBe('Diese Lektion ist nicht mehr verfügbar.');
  });
});

describe('isLessonReleased – at_datetime', () => {
  it('ist vor dem Zeitpunkt gesperrt (mit availableAt und deutschem Label)', () => {
    const result = isLessonReleased(
      makeRelease({ release_mode: 'at_datetime', release_at: '2026-03-12T08:00:00.000Z' }),
      ctx(),
    );
    expect(result.released).toBe(false);
    expect(result.reason).toBe('awaiting_datetime');
    expect(result.availableAt).toEqual(new Date('2026-03-12T08:00:00.000Z'));
    // 08:00 UTC = 09:00 Europe/Berlin (Winterzeit)
    expect(result.lockedLabel).toBe('Wird am 12.03.2026 um 09:00 Uhr freigeschaltet.');
  });

  it('ist genau am Stichtag freigeschaltet', () => {
    const result = isLessonReleased(
      makeRelease({ release_mode: 'at_datetime', release_at: '2026-03-01T12:00:00.000Z' }),
      ctx(),
    );
    expect(result.released).toBe(true);
  });

  it('ist ohne release_at gesperrt (Fehlkonfiguration)', () => {
    const result = isLessonReleased(
      makeRelease({ release_mode: 'at_datetime', release_at: null }),
      ctx(),
    );
    expect(result.released).toBe(false);
    expect(result.reason).toBe('config_invalid');
  });

  it('ist genau bei expires_at bereits gesperrt (halboffenes Fenster)', () => {
    const result = isLessonReleased(
      makeRelease({
        release_mode: 'at_datetime',
        release_at: '2026-02-01T00:00:00.000Z',
        expires_at: '2026-03-01T12:00:00.000Z',
      }),
      ctx(),
    );
    expect(result.released).toBe(false);
    expect(result.reason).toBe('expired');
  });
});

describe('isLessonReleased – days_after_session', () => {
  const session = makeSession({
    id: 'session-1',
    title: 'Offensivtag 2',
    starts_at: '2026-03-10T08:00:00.000Z',
  });

  it('ist ohne auffindbare Session gesperrt – mit Grund', () => {
    const result = isLessonReleased(
      makeRelease({ release_mode: 'days_after_session', session_id: 'session-x', offset_days: 1 }),
      ctx({ sessions: [session] }),
    );
    expect(result.released).toBe(false);
    expect(result.reason).toBe('session_missing');
    expect(result.lockedLabel).toBe('Wird nach dem Präsenztag freigeschaltet.');
  });

  it('ist vor Session + Offset gesperrt, Label nennt den Session-Titel', () => {
    const result = isLessonReleased(
      makeRelease({ release_mode: 'days_after_session', session_id: 'session-1', offset_days: 1 }),
      ctx({ sessions: [session] }),
    );
    expect(result.released).toBe(false);
    expect(result.lockedLabel).toBe('Wird nach Offensivtag 2 freigeschaltet.');
    expect(result.availableAt).toEqual(new Date('2026-03-11T08:00:00.000Z'));
  });

  it('ist genau bei Session-Start + Offset freigeschaltet', () => {
    const result = isLessonReleased(
      makeRelease({ release_mode: 'days_after_session', session_id: 'session-1', offset_days: 1 }),
      ctx({ sessions: [session], now: new Date('2026-03-11T08:00:00.000Z') }),
    );
    expect(result.released).toBe(true);
  });

  it('behandelt offset_days null wie 0 (frei ab Session-Start)', () => {
    const result = isLessonReleased(
      makeRelease({
        release_mode: 'days_after_session',
        session_id: 'session-1',
        offset_days: null,
      }),
      ctx({ sessions: [session], now: new Date('2026-03-10T08:00:00.000Z') }),
    );
    expect(result.released).toBe(true);
  });
});

describe('isLessonReleased – days_before_session', () => {
  const session = makeSession({
    id: 'session-1',
    title: 'Offensivtag 3',
    starts_at: '2026-03-10T08:00:00.000Z',
  });

  it('ist im Vorlauf-Fenster freigeschaltet', () => {
    const result = isLessonReleased(
      makeRelease({ release_mode: 'days_before_session', session_id: 'session-1', offset_days: 3 }),
      ctx({ sessions: [session], now: new Date('2026-03-08T10:00:00.000Z') }),
    );
    expect(result.released).toBe(true);
  });

  it('ist vor dem Vorlauf-Fenster gesperrt (Label mit Tagen und Titel)', () => {
    const result = isLessonReleased(
      makeRelease({ release_mode: 'days_before_session', session_id: 'session-1', offset_days: 3 }),
      ctx({ sessions: [session], now: new Date('2026-03-01T12:00:00.000Z') }),
    );
    expect(result.released).toBe(false);
    expect(result.reason).toBe('awaiting_session_offset');
    expect(result.lockedLabel).toBe('Wird 3 Tage vor Offensivtag 3 freigeschaltet.');
    expect(result.availableAt).toEqual(new Date('2026-03-07T08:00:00.000Z'));
  });

  it('ist genau am Fensterbeginn freigeschaltet (Grenzfall)', () => {
    const result = isLessonReleased(
      makeRelease({ release_mode: 'days_before_session', session_id: 'session-1', offset_days: 1 }),
      ctx({ sessions: [session], now: new Date('2026-03-09T08:00:00.000Z') }),
    );
    expect(result.released).toBe(true);
  });

  it('nutzt Singular "1 Tag" im Label', () => {
    const result = isLessonReleased(
      makeRelease({ release_mode: 'days_before_session', session_id: 'session-1', offset_days: 1 }),
      ctx({ sessions: [session], now: new Date('2026-03-01T00:00:00.000Z') }),
    );
    expect(result.lockedLabel).toBe('Wird 1 Tag vor Offensivtag 3 freigeschaltet.');
  });

  it('ist ohne Session gesperrt', () => {
    const result = isLessonReleased(
      makeRelease({ release_mode: 'days_before_session', session_id: null, offset_days: 2 }),
      ctx({ sessions: [session] }),
    );
    expect(result.released).toBe(false);
    expect(result.reason).toBe('session_missing');
    expect(result.lockedLabel).toBe('Wird vor dem Präsenztag freigeschaltet.');
  });
});

describe('isLessonReleased – after_lesson', () => {
  it('ist nach Abschluss der Voraussetzungs-Lektion freigeschaltet', () => {
    const result = isLessonReleased(
      makeRelease({ release_mode: 'after_lesson', prerequisite_lesson_id: 'lesson-prev' }),
      ctx({ completedLessonIds: new Set(['lesson-prev']) }),
    );
    expect(result.released).toBe(true);
  });

  it('ist ohne Abschluss gesperrt', () => {
    const result = isLessonReleased(
      makeRelease({ release_mode: 'after_lesson', prerequisite_lesson_id: 'lesson-prev' }),
      ctx(),
    );
    expect(result.released).toBe(false);
    expect(result.reason).toBe('prerequisite_lesson_open');
    expect(result.lockedLabel).toBe('Wird nach Abschluss der vorherigen Lektion freigeschaltet.');
  });

  it('ist ohne prerequisite_lesson_id gesperrt (Fehlkonfiguration)', () => {
    const result = isLessonReleased(
      makeRelease({ release_mode: 'after_lesson', prerequisite_lesson_id: null }),
      ctx(),
    );
    expect(result.released).toBe(false);
    expect(result.reason).toBe('config_invalid');
  });
});

describe('isLessonReleased – after_module', () => {
  it('ist nach Abschluss des Voraussetzungs-Moduls freigeschaltet', () => {
    const result = isLessonReleased(
      makeRelease({ release_mode: 'after_module', prerequisite_module_id: 'module-prev' }),
      ctx({ completedModuleIds: new Set(['module-prev']) }),
    );
    expect(result.released).toBe(true);
  });

  it('ist ohne Modul-Abschluss gesperrt', () => {
    const result = isLessonReleased(
      makeRelease({ release_mode: 'after_module', prerequisite_module_id: 'module-prev' }),
      ctx({ completedModuleIds: new Set(['module-other']) }),
    );
    expect(result.released).toBe(false);
    expect(result.reason).toBe('prerequisite_module_open');
    expect(result.lockedLabel).toBe('Wird nach Abschluss des vorherigen Moduls freigeschaltet.');
  });
});

describe('isLessonReleased – manual', () => {
  it('ist ohne released_at gesperrt', () => {
    const result = isLessonReleased(
      makeRelease({ release_mode: 'manual', released_at: null }),
      ctx(),
    );
    expect(result.released).toBe(false);
    expect(result.reason).toBe('manual_not_released');
    expect(result.lockedLabel).toBe('Wird vom Trainer freigeschaltet.');
    expect(result.availableAt).toBeUndefined();
  });

  it('ist ab released_at freigeschaltet', () => {
    const result = isLessonReleased(
      makeRelease({ release_mode: 'manual', released_at: '2026-03-01T12:00:00.000Z' }),
      ctx(),
    );
    expect(result.released).toBe(true);
  });

  it('ist bei zukuenftigem released_at noch gesperrt (mit availableAt)', () => {
    const result = isLessonReleased(
      makeRelease({ release_mode: 'manual', released_at: '2026-04-01T00:00:00.000Z' }),
      ctx(),
    );
    expect(result.released).toBe(false);
    expect(result.availableAt).toEqual(new Date('2026-04-01T00:00:00.000Z'));
  });
});

describe('selectRelevantRelease', () => {
  const cohortRule = makeRelease({ id: 'r-cohort', lesson_id: 'lesson-1', profile_id: null });
  const individual = makeRelease({ id: 'r-me', lesson_id: 'lesson-1', profile_id: 'profile-1' });
  const foreign = makeRelease({ id: 'r-other', lesson_id: 'lesson-1', profile_id: 'profile-2' });

  it('individuelle Freischaltung schlaegt die Cohort-Regel', () => {
    const picked = selectRelevantRelease([cohortRule, individual, foreign], 'lesson-1', 'profile-1');
    expect(picked?.id).toBe('r-me');
  });

  it('faellt auf die Cohort-Regel zurueck und ignoriert fremde Profile', () => {
    const picked = selectRelevantRelease([foreign, cohortRule], 'lesson-1', 'profile-1');
    expect(picked?.id).toBe('r-cohort');
    expect(selectRelevantRelease([foreign], 'lesson-1', 'profile-1')).toBeUndefined();
  });
});

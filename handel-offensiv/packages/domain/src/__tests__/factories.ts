/** Test-Factories: minimale gueltige Rows mit ueberschreibbaren Feldern. */

import type {
  ActorContext,
  AnnouncementRow,
  CohortSessionRow,
  LearningPhaseRow,
  LessonProgressRow,
  LessonReleaseRow,
  LessonRow,
  ModuleRow,
  QuizOptionRow,
} from '@handel-offensiv/types';
import type { QuizQuestionWithOptions } from '../quiz';

const TS = '2026-01-01T00:00:00.000Z';

export function makeActor(overrides: Partial<ActorContext> = {}): ActorContext {
  return {
    profileId: 'profile-1',
    isSuperAdmin: false,
    memberships: [],
    trainerCohortIds: [],
    memberCohortIds: [],
    ...overrides,
  };
}

export function makeRelease(overrides: Partial<LessonReleaseRow> = {}): LessonReleaseRow {
  return {
    id: 'release-1',
    lesson_id: 'lesson-1',
    cohort_id: 'cohort-1',
    profile_id: null,
    release_mode: 'immediate',
    release_at: null,
    due_at: null,
    expires_at: null,
    offset_days: null,
    session_id: null,
    prerequisite_lesson_id: null,
    prerequisite_module_id: null,
    released_at: null,
    created_by: null,
    created_at: TS,
    updated_at: TS,
    ...overrides,
  };
}

export function makeSession(overrides: Partial<CohortSessionRow> = {}): CohortSessionRow {
  return {
    id: 'session-1',
    cohort_id: 'cohort-1',
    module_id: null,
    title: 'Offensivtag 2',
    starts_at: '2026-03-10T08:00:00.000Z',
    ends_at: null,
    timezone: 'Europe/Berlin',
    venue: null,
    address: null,
    room: null,
    trainer_profile_id: null,
    notes: null,
    directions: null,
    created_at: TS,
    updated_at: TS,
    ...overrides,
  };
}

export function makeModule(overrides: Partial<ModuleRow> = {}): ModuleRow {
  return {
    id: 'module-1',
    program_id: 'program-1',
    position: 1,
    number_label: 'Modul 1',
    title: 'Grundlagen',
    claim: null,
    description: null,
    status: 'published',
    created_at: TS,
    updated_at: TS,
    ...overrides,
  };
}

export function makePhase(overrides: Partial<LearningPhaseRow> = {}): LearningPhaseRow {
  return {
    id: 'phase-1',
    module_id: 'module-1',
    position: 1,
    phase_type: 'before_day',
    title: 'Vor dem Offensivtag',
    created_at: TS,
    updated_at: TS,
    ...overrides,
  };
}

export function makeLesson(overrides: Partial<LessonRow> = {}): LessonRow {
  return {
    id: 'lesson-1',
    learning_phase_id: 'phase-1',
    position: 1,
    title: 'Lektion',
    summary: null,
    estimated_minutes: null,
    status: 'published',
    created_by: null,
    updated_by: null,
    created_at: TS,
    updated_at: TS,
    published_at: TS,
    ...overrides,
  };
}

export function makeProgress(overrides: Partial<LessonProgressRow> = {}): LessonProgressRow {
  return {
    id: 'progress-1',
    lesson_id: 'lesson-1',
    profile_id: 'profile-1',
    cohort_id: 'cohort-1',
    status: 'completed',
    completed_at: TS,
    updated_at: TS,
    ...overrides,
  };
}

export function makeAnnouncement(overrides: Partial<AnnouncementRow> = {}): AnnouncementRow {
  return {
    id: 'announcement-1',
    cohort_id: 'cohort-1',
    author_profile_id: null,
    title: 'Info',
    body: 'Text',
    published_at: TS,
    created_at: TS,
    ...overrides,
  };
}

export function makeOption(overrides: Partial<QuizOptionRow> = {}): QuizOptionRow {
  return {
    id: 'option-1',
    question_id: 'question-1',
    position: 1,
    body: 'Option',
    is_correct: false,
    ...overrides,
  };
}

export function makeQuestion(
  overrides: Partial<QuizQuestionWithOptions> = {},
): QuizQuestionWithOptions {
  return {
    id: 'question-1',
    quiz_id: 'quiz-1',
    position: 1,
    kind: 'single',
    body: 'Frage?',
    explanation: null,
    points: 1,
    options: [],
    ...overrides,
  };
}

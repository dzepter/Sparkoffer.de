/**
 * Abgeleitete Domain-Typen (App-Ebene, camelCase) und View-Formen (snake_case,
 * da direkt aus supabase-js-Abfragen typisiert).
 */

import type { BlockType, MemberRole, PhaseType } from './enums';
import type {
  AnnouncementRow,
  CohortSessionRow,
  ContentBlockRow,
  IsoDateTime,
  LessonReleaseRow,
  LessonRow,
  Uuid,
} from './tables';

// --------------------------------------------------------------------------
// ActorContext: aufgeloester Berechtigungskontext des angemeldeten Nutzers
// (Basis fuer clientseitige Gates; verbindlich bleibt RLS)
// --------------------------------------------------------------------------
export interface ActorMembership {
  organizationId: Uuid;
  role: MemberRole;
  /** Feingranulare Rechte-Overrides aus organization_memberships.permissions (jsonb) */
  permissions?: Record<string, boolean>;
}

export interface ActorContext {
  profileId: Uuid;
  isSuperAdmin: boolean;
  memberships: ActorMembership[];
  /** Cohorts, in denen der Nutzer Trainer ist (cohort_trainers) */
  trainerCohortIds: Uuid[];
  /** Cohorts, in denen der Nutzer Teilnehmer ist (cohort_members) */
  memberCohortIds: Uuid[];
}

// --------------------------------------------------------------------------
// ReleaseContext: Eingangsdaten zur Auswertung der Freischaltungsregeln
// (lesson_releases je Cohort/Profil; Sessions und Fortschritt fuer die Modi
// days_before/after_session, after_lesson, after_module)
// --------------------------------------------------------------------------
export interface ReleaseContext {
  profileId: Uuid;
  cohortId: Uuid;
  /** Bezugszeitpunkt der Auswertung (ISO) */
  now: IsoDateTime;
  /** Regeln der Cohort inkl. individueller Overrides (profile_id gesetzt) */
  releases: LessonReleaseRow[];
  /** Praesenztermine der Cohort (fuer session-relative Modi) */
  sessions: CohortSessionRow[];
  /** Vom Profil abgeschlossene Lektionen (fuer after_lesson) */
  completedLessonIds: Uuid[];
  /** Vom Profil vollstaendig abgeschlossene Module (fuer after_module) */
  completedModuleIds: Uuid[];
}

// --------------------------------------------------------------------------
// LessonWithBlocks: Lektion inkl. sortierter Inhaltsbausteine
// (Form eines verschachtelten supabase-Selects, daher snake_case)
// --------------------------------------------------------------------------
export interface LessonWithBlocks extends LessonRow {
  content_blocks: ContentBlockRow[];
}

// --------------------------------------------------------------------------
// ModuleProgress: Form der View public.module_progress (snake_case)
// --------------------------------------------------------------------------
export interface ModuleProgress {
  profile_id: Uuid;
  module_id: Uuid;
  cohort_id: Uuid;
  /** Anzahl published Lessons im Modul */
  total_lessons: number;
  completed_lessons: number;
  /** 0–100, gerundet */
  percent: number;
}

// --------------------------------------------------------------------------
// DashboardData (§10): aktuelle Phase, naechste Session, wichtigste Lektion,
// offene Aufgaben (max. 3), Fortschritt, aktuelle Ankuendigung
// --------------------------------------------------------------------------

/** Aktuelle Lernphase inkl. Modulkontext */
export interface DashboardPhase {
  moduleId: Uuid;
  moduleNumberLabel: string;
  moduleTitle: string;
  phaseId: Uuid;
  phaseType: PhaseType;
  phaseTitle: string;
}

/** Wichtigste (naechste empfohlene) Lektion */
export interface DashboardLesson {
  lessonId: Uuid;
  title: string;
  summary: string | null;
  estimatedMinutes: number | null;
  moduleId: Uuid;
  phaseId: Uuid;
  dueAt: IsoDateTime | null;
}

/** Offene Aufgabe (required Block ohne Abgabe/Abschluss) */
export interface DashboardOpenTask {
  contentBlockId: Uuid;
  blockType: BlockType;
  lessonId: Uuid;
  lessonTitle: string;
  dueAt: IsoDateTime | null;
}

/** Fortschritt: Gesamt und je Modul (View-Form) */
export interface DashboardProgress {
  /** 0–100 ueber alle Module der Cohort */
  overallPercent: number;
  modules: ModuleProgress[];
}

export interface DashboardData {
  currentPhase: DashboardPhase | null;
  nextSession: CohortSessionRow | null;
  featuredLesson: DashboardLesson | null;
  /** maximal 3 Eintraege */
  openTasks: DashboardOpenTask[];
  progress: DashboardProgress;
  /** Neueste veroeffentlichte Ankuendigung der Cohort */
  announcement: AnnouncementRow | null;
}

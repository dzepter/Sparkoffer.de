/**
 * DB-Enums (Spiegel von supabase/migrations/0001_schema.sql).
 * Const-Arrays fuer Laufzeit-Validierung (z. B. zod), Union-Types fuer Typisierung.
 */

// Status einer Organisation bzw. Cohort
export const ORG_STATUSES = ['active', 'inactive', 'archived'] as const;
export type OrgStatus = (typeof ORG_STATUSES)[number];

// Rolle innerhalb einer Organisation
export const MEMBER_ROLES = ['org_admin', 'trainer', 'participant'] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

// Status einer Mitgliedschaft / eines Profils
export const MEMBER_STATUSES = ['active', 'inactive'] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

// Redaktionsstatus von Inhalten (Programme, Module, Lessons)
export const CONTENT_STATUSES = ['draft', 'scheduled', 'published', 'archived'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

// Lernphasen-Typ innerhalb eines Moduls
export const PHASE_TYPES = ['before_day', 'day', 'after_day', 'prep_next', 'custom'] as const;
export type PhaseType = (typeof PHASE_TYPES)[number];

// Typ eines Inhaltsbausteins
export const BLOCK_TYPES = [
  'text',
  'video',
  'audio',
  'pdf',
  'image',
  'checklist',
  'reflection',
  'single_choice',
  'multiple_choice',
  'quiz',
  'scale',
  'transfer_task',
  'download',
  'external_link',
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

// Freischaltungsmodus einer Lektion
export const RELEASE_MODES = [
  'immediate',
  'at_datetime',
  'days_after_session',
  'days_before_session',
  'after_lesson',
  'after_module',
  'manual',
] as const;
export type ReleaseMode = (typeof RELEASE_MODES)[number];

// Sichtbarkeit von Abgaben/Reflexionen
export const VISIBILITY_LEVELS = ['private', 'trainer'] as const;
export type VisibilityLevel = (typeof VISIBILITY_LEVELS)[number];

// Status einer Abgabe
export const SUBMISSION_STATUSES = ['submitted', 'seen', 'feedback_given', 'done'] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

// Lernfortschritt einer Lektion
export const PROGRESS_STATUSES = ['not_started', 'in_progress', 'completed'] as const;
export type ProgressStatus = (typeof PROGRESS_STATUSES)[number];

// Status eines Umsetzungsplan-Items
export const PLAN_ITEM_STATUSES = ['planned', 'started', 'implemented', 'reflected'] as const;
export type PlanItemStatus = (typeof PLAN_ITEM_STATUSES)[number];

// Fragetyp im Quiz
export const QUESTION_KINDS = ['single', 'multiple', 'truefalse', 'freetext'] as const;
export type QuestionKind = (typeof QUESTION_KINDS)[number];

// Status einer Einladung
export const INVITATION_STATUSES = ['pending', 'accepted', 'revoked', 'expired'] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

// Einwilligungsart (DSGVO)
export const CONSENT_TYPES = ['privacy', 'push', 'analytics'] as const;
export type ConsentType = (typeof CONSENT_TYPES)[number];

// Status eines Loeschbegehrens
export const DELETION_STATUSES = ['requested', 'confirmed', 'processing', 'done', 'rejected'] as const;
export type DeletionStatus = (typeof DELETION_STATUSES)[number];

// Art einer Benachrichtigung
export const NOTIFICATION_KINDS = [
  'release',
  'session_reminder',
  'task_due',
  'announcement',
  'feedback',
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

// Kein DB-Enum, aber CHECK-Constraint auf push_tokens.platform
export const PUSH_PLATFORMS = ['ios', 'android'] as const;
export type PushPlatform = (typeof PUSH_PLATFORMS)[number];

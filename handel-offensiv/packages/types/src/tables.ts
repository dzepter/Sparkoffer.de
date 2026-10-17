/**
 * Row-Typen je DB-Tabelle (exakt snake_case wie in 0001_schema.sql),
 * damit supabase-js-Ergebnisse direkt typisierbar sind.
 * Insert-Typen nur fuer die client-seitig beschreibbaren Tabellen.
 */

import type {
  BlockType,
  ConsentType,
  ContentStatus,
  DeletionStatus,
  InvitationStatus,
  MemberRole,
  MemberStatus,
  NotificationKind,
  OrgStatus,
  PhaseType,
  PlanItemStatus,
  ProgressStatus,
  PushPlatform,
  QuestionKind,
  ReleaseMode,
  SubmissionStatus,
  VisibilityLevel,
} from './enums';

// --------------------------------------------------------------------------
// Skalare Hilfstypen
// --------------------------------------------------------------------------

/** uuid als String */
export type Uuid = string;
/** timestamptz als ISO-8601-String (so liefert PostgREST/supabase-js) */
export type IsoDateTime = string;
/** date als 'YYYY-MM-DD' */
export type IsoDate = string;

/** Beliebiger JSON-Wert (jsonb) */
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];
/** jsonb-Objekt (Default '{}') */
export type JsonObject = { [key: string]: Json };

// --------------------------------------------------------------------------
// Row-Typen
// --------------------------------------------------------------------------

/** profiles – 1:1 zu auth.users */
export interface ProfileRow {
  id: Uuid;
  first_name: string | null;
  last_name: string | null;
  avatar_path: string | null;
  is_super_admin: boolean;
  status: MemberStatus;
  locale: string;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

/** organizations – Kundenunternehmen */
export interface OrganizationRow {
  id: Uuid;
  name: string;
  short_name: string | null;
  logo_path: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  status: OrgStatus;
  internal_notes: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

/** organization_memberships – Rolle einer Person in einer Organisation */
export interface OrganizationMembershipRow {
  id: Uuid;
  organization_id: Uuid;
  profile_id: Uuid;
  role: MemberRole;
  permissions: JsonObject;
  status: MemberStatus;
  created_at: IsoDateTime;
}

/** programs – Lernprogramme */
export interface ProgramRow {
  id: Uuid;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  status: ContentStatus;
  created_by: Uuid | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  published_at: IsoDateTime | null;
}

/** modules – Module eines Programms (Tag 1–5) */
export interface ModuleRow {
  id: Uuid;
  program_id: Uuid;
  position: number;
  number_label: string;
  title: string;
  claim: string | null;
  description: string | null;
  status: ContentStatus;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

/** learning_phases – Lernphasen je Modul */
export interface LearningPhaseRow {
  id: Uuid;
  module_id: Uuid;
  position: number;
  phase_type: PhaseType;
  title: string;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

/** lessons – Lektionen einer Lernphase */
export interface LessonRow {
  id: Uuid;
  learning_phase_id: Uuid;
  position: number;
  title: string;
  summary: string | null;
  estimated_minutes: number | null;
  status: ContentStatus;
  created_by: Uuid | null;
  updated_by: Uuid | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  published_at: IsoDateTime | null;
}

/** content_blocks – Inhaltsbausteine einer Lektion */
export interface ContentBlockRow {
  id: Uuid;
  lesson_id: Uuid;
  position: number;
  block_type: BlockType;
  config: JsonObject;
  required: boolean;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

/** config-Form fuer content_blocks mit block_type='quiz' */
export interface QuizBlockConfig extends JsonObject {
  quizId: Uuid;
}

/** cohorts – Durchfuehrung eines Programms je Organisation */
export interface CohortRow {
  id: Uuid;
  organization_id: Uuid;
  program_id: Uuid;
  name: string;
  start_date: IsoDate | null;
  end_date: IsoDate | null;
  status: OrgStatus;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

/** cohort_trainers – Trainer-Zuordnung je Cohort */
export interface CohortTrainerRow {
  id: Uuid;
  cohort_id: Uuid;
  profile_id: Uuid;
  created_at: IsoDateTime;
}

/** cohort_members – Teilnehmer-Zuordnung je Cohort */
export interface CohortMemberRow {
  id: Uuid;
  cohort_id: Uuid;
  profile_id: Uuid;
  status: MemberStatus;
  created_at: IsoDateTime;
}

/** cohort_sessions – Praesenztermine einer Cohort */
export interface CohortSessionRow {
  id: Uuid;
  cohort_id: Uuid;
  module_id: Uuid | null;
  title: string;
  starts_at: IsoDateTime;
  ends_at: IsoDateTime | null;
  timezone: string;
  venue: string | null;
  address: string | null;
  room: string | null;
  trainer_profile_id: Uuid | null;
  notes: string | null;
  directions: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

/** course_enrollments – Einschreibung eines Profils in eine Cohort */
export interface CourseEnrollmentRow {
  id: Uuid;
  profile_id: Uuid;
  cohort_id: Uuid;
  enrolled_at: IsoDateTime;
  completed_at: IsoDateTime | null;
}

/** lesson_releases – Freischaltungsregeln (profile_id gesetzt = individuell) */
export interface LessonReleaseRow {
  id: Uuid;
  lesson_id: Uuid;
  cohort_id: Uuid;
  profile_id: Uuid | null;
  release_mode: ReleaseMode;
  release_at: IsoDateTime | null;
  due_at: IsoDateTime | null;
  expires_at: IsoDateTime | null;
  offset_days: number | null;
  session_id: Uuid | null;
  prerequisite_lesson_id: Uuid | null;
  prerequisite_module_id: Uuid | null;
  released_at: IsoDateTime | null;
  created_by: Uuid | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

/** assignment_submissions – Abgaben zu Transferaufgaben/Checklisten */
export interface AssignmentSubmissionRow {
  id: Uuid;
  content_block_id: Uuid;
  profile_id: Uuid;
  cohort_id: Uuid;
  status: SubmissionStatus;
  note_text: string | null;
  file_path: string | null;
  visibility: VisibilityLevel;
  submitted_at: IsoDateTime;
  updated_at: IsoDateTime;
}

/** reflection_entries – Reflexionseintraege (Default privat) */
export interface ReflectionEntryRow {
  id: Uuid;
  content_block_id: Uuid;
  profile_id: Uuid;
  cohort_id: Uuid;
  body: string;
  visibility: VisibilityLevel;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

/** quizzes */
export interface QuizRow {
  id: Uuid;
  title: string;
  description: string | null;
  pass_score: number | null;
  max_attempts: number | null;
  shuffle: boolean;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

/** quiz_questions */
export interface QuizQuestionRow {
  id: Uuid;
  quiz_id: Uuid;
  position: number;
  kind: QuestionKind;
  body: string;
  explanation: string | null;
  points: number;
}

/** quiz_options */
export interface QuizOptionRow {
  id: Uuid;
  question_id: Uuid;
  position: number;
  body: string;
  is_correct: boolean;
}

/** quiz_attempts – answers: je question_id die gewaehlten Option-IDs bzw. Freitext */
export interface QuizAttemptRow {
  id: Uuid;
  quiz_id: Uuid;
  profile_id: Uuid;
  cohort_id: Uuid;
  attempt_no: number;
  answers: JsonObject;
  score: number | null;
  passed: boolean | null;
  completed_at: IsoDateTime | null;
  created_at: IsoDateTime;
}

/** lesson_progress – Lernfortschritt je Lektion und Profil */
export interface LessonProgressRow {
  id: Uuid;
  lesson_id: Uuid;
  profile_id: Uuid;
  cohort_id: Uuid;
  status: ProgressStatus;
  completed_at: IsoDateTime | null;
  updated_at: IsoDateTime;
}

/** action_plans – Umsetzungsplaene (module_id null = 90-Tage-Plan) */
export interface ActionPlanRow {
  id: Uuid;
  profile_id: Uuid;
  cohort_id: Uuid;
  module_id: Uuid | null;
  share_with_trainer: boolean;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

/** action_plan_items – Einzelvorhaben eines Umsetzungsplans */
export interface ActionPlanItemRow {
  id: Uuid;
  action_plan_id: Uuid;
  position: number;
  insight: string | null;
  behavior: string | null;
  action: string | null;
  team: string | null;
  result: string | null;
  status: PlanItemStatus;
  due_at: IsoDateTime | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

/** trainer_feedback – genau EIN Ziel: submission_id ODER action_plan_item_id */
export interface TrainerFeedbackRow {
  id: Uuid;
  submission_id: Uuid | null;
  action_plan_item_id: Uuid | null;
  author_profile_id: Uuid;
  recipient_profile_id: Uuid;
  body: string;
  created_at: IsoDateTime;
}

/** announcements – Ankuendigungen je Cohort */
export interface AnnouncementRow {
  id: Uuid;
  cohort_id: Uuid;
  author_profile_id: Uuid | null;
  title: string;
  body: string;
  published_at: IsoDateTime;
  created_at: IsoDateTime;
}

/** notifications – In-App-Benachrichtigungen */
export interface NotificationRow {
  id: Uuid;
  profile_id: Uuid;
  kind: NotificationKind;
  title: string;
  body: string | null;
  deep_link: string | null;
  read_at: IsoDateTime | null;
  created_at: IsoDateTime;
}

/** push_tokens – Expo-Push-Tokens je Geraet */
export interface PushTokenRow {
  id: Uuid;
  profile_id: Uuid;
  device_id: string;
  token: string;
  platform: PushPlatform;
  last_seen_at: IsoDateTime | null;
  disabled_at: IsoDateTime | null;
  created_at: IsoDateTime;
}

/** invitations – Einladungen (einziger Registrierungsweg) */
export interface InvitationRow {
  id: Uuid;
  email: string;
  organization_id: Uuid;
  cohort_id: Uuid | null;
  role: MemberRole;
  token_hash: string;
  status: InvitationStatus;
  expires_at: IsoDateTime;
  accepted_at: IsoDateTime | null;
  revoked_at: IsoDateTime | null;
  invited_by: Uuid | null;
  created_at: IsoDateTime;
}

/** learning_assets – Datei-Registry (organization_id null = global) */
export interface LearningAssetRow {
  id: Uuid;
  organization_id: Uuid | null;
  path: string;
  mime: string;
  size_bytes: number | null;
  original_name: string | null;
  uploaded_by: Uuid | null;
  created_at: IsoDateTime;
}

/** audit_logs – INSERT-only-Revisionslog (nur Service Role) */
export interface AuditLogRow {
  id: Uuid;
  actor_profile_id: Uuid | null;
  action: string;
  target_type: string | null;
  target_id: Uuid | null;
  metadata: JsonObject;
  created_at: IsoDateTime;
}

/** user_consents – Einwilligungen (DSGVO), versioniert */
export interface UserConsentRow {
  id: Uuid;
  profile_id: Uuid;
  consent_type: ConsentType;
  version: string;
  granted_at: IsoDateTime;
  revoked_at: IsoDateTime | null;
}

/** account_deletion_requests – Loeschbegehren (DSGVO Art. 17) */
export interface AccountDeletionRequestRow {
  id: Uuid;
  profile_id: Uuid;
  status: DeletionStatus;
  reason: string | null;
  requested_at: IsoDateTime;
  processed_at: IsoDateTime | null;
  notes: string | null;
}

// --------------------------------------------------------------------------
// Insert-Typen (client-seitig beschreibbare Tabellen):
// Pflichtspalten bleiben Pflicht, alles mit DB-Default/Nullable wird optional.
// --------------------------------------------------------------------------

/** Hilfstyp: Pflichtspalten K, Rest optional (DB-Defaults greifen) */
export type InsertOf<Row, K extends keyof Row> = Pick<Row, K> & Partial<Omit<Row, K>>;

/** Teilnehmer: eigene Abgabe */
export type AssignmentSubmissionInsert = InsertOf<
  AssignmentSubmissionRow,
  'content_block_id' | 'profile_id' | 'cohort_id'
>;

/** Teilnehmer: eigener Reflexionseintrag */
export type ReflectionEntryInsert = InsertOf<
  ReflectionEntryRow,
  'content_block_id' | 'profile_id' | 'cohort_id' | 'body'
>;

/** Teilnehmer: eigener Quiz-Versuch */
export type QuizAttemptInsert = InsertOf<
  QuizAttemptRow,
  'quiz_id' | 'profile_id' | 'cohort_id' | 'attempt_no'
>;

/** Teilnehmer: eigener Lernfortschritt */
export type LessonProgressInsert = InsertOf<
  LessonProgressRow,
  'lesson_id' | 'profile_id' | 'cohort_id'
>;

/** Teilnehmer: eigener Umsetzungsplan */
export type ActionPlanInsert = InsertOf<ActionPlanRow, 'profile_id' | 'cohort_id'>;

/** Teilnehmer: Item im eigenen Umsetzungsplan */
export type ActionPlanItemInsert = InsertOf<ActionPlanItemRow, 'action_plan_id' | 'position'>;

/** Trainer: Feedback (genau ein Ziel via submission_id ODER action_plan_item_id) */
export type TrainerFeedbackInsert = InsertOf<
  TrainerFeedbackRow,
  'author_profile_id' | 'recipient_profile_id' | 'body'
>;

/** Trainer: Ankuendigung fuer eine Cohort */
export type AnnouncementInsert = InsertOf<AnnouncementRow, 'cohort_id' | 'title' | 'body'>;

/** Trainer: erlaubte Freischaltungen (z. B. manual) */
export type LessonReleaseInsert = InsertOf<
  LessonReleaseRow,
  'lesson_id' | 'cohort_id' | 'release_mode'
>;

/** Teilnehmer: Push-Token des eigenen Geraets */
export type PushTokenInsert = InsertOf<
  PushTokenRow,
  'profile_id' | 'device_id' | 'token' | 'platform'
>;

/** Teilnehmer: eigene Einwilligung */
export type UserConsentInsert = InsertOf<UserConsentRow, 'profile_id' | 'consent_type' | 'version'>;

/** Teilnehmer: eigenes Loeschbegehren */
export type AccountDeletionRequestInsert = InsertOf<AccountDeletionRequestRow, 'profile_id'>;

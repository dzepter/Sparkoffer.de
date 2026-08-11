-- ============================================================================
-- 0001_schema.sql – Basis-Schema "Handel Offensiv Learning App"
-- Enums, Tabellen, Indexe, updated_at-Trigger, View module_progress.
-- RLS-Policies folgen in einer separaten Migration; RLS wird hier bereits
-- auf allen Tabellen aktiviert (Default: kein Zugriff fuer Client-Rollen).
-- ============================================================================

-- Extension fuer gen_random_uuid() (im Supabase-Standardschema "extensions")
create extension if not exists pgcrypto with schema extensions;

-- ----------------------------------------------------------------------------
-- Schema "app": interne Hilfsfunktionen (RLS-Helper folgen in 0002)
-- ----------------------------------------------------------------------------
create schema if not exists app;

-- Trigger-Funktion: setzt updated_at bei jedem UPDATE
create or replace function app.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function app.touch_updated_at() is
  'Setzt updated_at automatisch bei UPDATE (BEFORE-Trigger je Tabelle).';

-- ----------------------------------------------------------------------------
-- Enum-Typen
-- ----------------------------------------------------------------------------
create type public.org_status         as enum ('active', 'inactive', 'archived');
create type public.member_role        as enum ('org_admin', 'trainer', 'participant');
create type public.member_status      as enum ('active', 'inactive');
create type public.content_status     as enum ('draft', 'scheduled', 'published', 'archived');
create type public.phase_type         as enum ('before_day', 'day', 'after_day', 'prep_next', 'custom');
create type public.block_type         as enum ('text', 'video', 'audio', 'pdf', 'image', 'checklist',
                                               'reflection', 'single_choice', 'multiple_choice', 'quiz',
                                               'scale', 'transfer_task', 'download', 'external_link');
create type public.release_mode       as enum ('immediate', 'at_datetime', 'days_after_session',
                                               'days_before_session', 'after_lesson', 'after_module', 'manual');
create type public.visibility_level   as enum ('private', 'trainer');
create type public.submission_status  as enum ('submitted', 'seen', 'feedback_given', 'done');
create type public.progress_status    as enum ('not_started', 'in_progress', 'completed');
create type public.plan_item_status   as enum ('planned', 'started', 'implemented', 'reflected');
create type public.question_kind      as enum ('single', 'multiple', 'truefalse', 'freetext');
create type public.invitation_status  as enum ('pending', 'accepted', 'revoked', 'expired');
create type public.consent_type       as enum ('privacy', 'push', 'analytics');
create type public.deletion_status    as enum ('requested', 'confirmed', 'processing', 'done', 'rejected');
create type public.notification_kind  as enum ('release', 'session_reminder', 'task_due', 'announcement', 'feedback');

-- ----------------------------------------------------------------------------
-- profiles: 1:1 zu auth.users
-- ----------------------------------------------------------------------------
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  first_name     text,
  last_name      text,
  avatar_path    text,
  is_super_admin boolean       not null default false,
  status         member_status not null default 'active',
  locale         text          not null default 'de',
  created_at     timestamptz   not null default now(),
  updated_at     timestamptz   not null default now()
);

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function app.touch_updated_at();

-- ----------------------------------------------------------------------------
-- organizations: Kundenunternehmen
-- ----------------------------------------------------------------------------
create table public.organizations (
  id             uuid primary key default gen_random_uuid(),
  name           text       not null,
  short_name     text,
  logo_path      text,
  contact_name   text,
  contact_email  text,
  contact_phone  text,
  address        text,
  status         org_status not null default 'active',
  internal_notes text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger organizations_touch_updated_at
  before update on public.organizations
  for each row execute function app.touch_updated_at();

-- ----------------------------------------------------------------------------
-- organization_memberships: Rolle einer Person in einer Organisation
-- ----------------------------------------------------------------------------
create table public.organization_memberships (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid          not null references public.organizations (id) on delete cascade,
  profile_id      uuid          not null references public.profiles (id) on delete cascade,
  role            member_role   not null,
  permissions     jsonb         not null default '{}',
  status          member_status not null default 'active',
  created_at      timestamptz   not null default now(),
  unique (organization_id, profile_id)
);

-- RLS-Helper fragen haeufig nach "Mitgliedschaften eines Profils"
create index idx_org_memberships_profile_id on public.organization_memberships (profile_id);

-- ----------------------------------------------------------------------------
-- programs: Lernprogramme (z. B. "Handel Offensiv", 5 Module)
-- ----------------------------------------------------------------------------
create table public.programs (
  id           uuid primary key default gen_random_uuid(),
  slug         text           not null unique,
  title        text           not null,
  subtitle     text,
  description  text,
  status       content_status not null default 'draft',
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz    not null default now(),
  updated_at   timestamptz    not null default now(),
  published_at timestamptz
);

create trigger programs_touch_updated_at
  before update on public.programs
  for each row execute function app.touch_updated_at();

-- ----------------------------------------------------------------------------
-- modules: Module eines Programms (Tag 1–5)
-- ----------------------------------------------------------------------------
create table public.modules (
  id           uuid primary key default gen_random_uuid(),
  program_id   uuid           not null references public.programs (id) on delete cascade,
  position     int            not null,
  number_label text           not null,
  title        text           not null,
  claim        text,
  description  text,
  status       content_status not null default 'draft',
  created_at   timestamptz    not null default now(),
  updated_at   timestamptz    not null default now(),
  unique (program_id, position)
);

create trigger modules_touch_updated_at
  before update on public.modules
  for each row execute function app.touch_updated_at();

-- ----------------------------------------------------------------------------
-- learning_phases: Lernphasen je Modul (vor dem Tag, Tag, danach, ...)
-- ----------------------------------------------------------------------------
create table public.learning_phases (
  id         uuid primary key default gen_random_uuid(),
  module_id  uuid        not null references public.modules (id) on delete cascade,
  position   int         not null,
  phase_type phase_type  not null,
  title      text        not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, position)
);

create trigger learning_phases_touch_updated_at
  before update on public.learning_phases
  for each row execute function app.touch_updated_at();

-- ----------------------------------------------------------------------------
-- lessons: Lektionen innerhalb einer Lernphase
-- ----------------------------------------------------------------------------
create table public.lessons (
  id                uuid primary key default gen_random_uuid(),
  learning_phase_id uuid           not null references public.learning_phases (id) on delete cascade,
  position          int            not null,
  title             text           not null,
  summary           text,
  estimated_minutes int,
  status            content_status not null default 'draft',
  created_by        uuid references public.profiles (id) on delete set null,
  updated_by        uuid references public.profiles (id) on delete set null,
  created_at        timestamptz    not null default now(),
  updated_at        timestamptz    not null default now(),
  published_at      timestamptz,
  unique (learning_phase_id, position)
);

create trigger lessons_touch_updated_at
  before update on public.lessons
  for each row execute function app.touch_updated_at();

-- ----------------------------------------------------------------------------
-- content_blocks: Inhaltsbausteine einer Lektion
-- Bloecke vom Typ 'quiz' referenzieren das Quiz in config: {"quizId": "<uuid>"}
-- ----------------------------------------------------------------------------
create table public.content_blocks (
  id         uuid primary key default gen_random_uuid(),
  lesson_id  uuid       not null references public.lessons (id) on delete cascade,
  position   int        not null,
  block_type block_type not null,
  config     jsonb      not null default '{}',
  required   boolean    not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, position)
);

comment on column public.content_blocks.config is
  'Typspezifische Konfiguration; bei block_type=quiz: {"quizId": "<uuid>"}.';

create trigger content_blocks_touch_updated_at
  before update on public.content_blocks
  for each row execute function app.touch_updated_at();

-- ----------------------------------------------------------------------------
-- cohorts: Durchfuehrungen eines Programms je Organisation
-- ----------------------------------------------------------------------------
create table public.cohorts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid       not null references public.organizations (id) on delete cascade,
  program_id      uuid       not null references public.programs (id) on delete restrict,
  name            text       not null,
  start_date      date,
  end_date        date,
  status          org_status not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_cohorts_organization_id on public.cohorts (organization_id);
create index idx_cohorts_program_id      on public.cohorts (program_id);

create trigger cohorts_touch_updated_at
  before update on public.cohorts
  for each row execute function app.touch_updated_at();

-- ----------------------------------------------------------------------------
-- cohort_trainers: Trainer-Zuordnung je Cohort
-- ----------------------------------------------------------------------------
create table public.cohort_trainers (
  id         uuid primary key default gen_random_uuid(),
  cohort_id  uuid        not null references public.cohorts (id) on delete cascade,
  profile_id uuid        not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (cohort_id, profile_id)
);

create index idx_cohort_trainers_profile_id on public.cohort_trainers (profile_id);

-- ----------------------------------------------------------------------------
-- cohort_members: Teilnehmer-Zuordnung je Cohort
-- ----------------------------------------------------------------------------
create table public.cohort_members (
  id         uuid          primary key default gen_random_uuid(),
  cohort_id  uuid          not null references public.cohorts (id) on delete cascade,
  profile_id uuid          not null references public.profiles (id) on delete cascade,
  status     member_status not null default 'active',
  created_at timestamptz   not null default now(),
  unique (cohort_id, profile_id)
);

create index idx_cohort_members_profile_id on public.cohort_members (profile_id);

-- ----------------------------------------------------------------------------
-- cohort_sessions: Praesenztermine (Tag 1–5) einer Cohort
-- ----------------------------------------------------------------------------
create table public.cohort_sessions (
  id                 uuid primary key default gen_random_uuid(),
  cohort_id          uuid        not null references public.cohorts (id) on delete cascade,
  module_id          uuid        references public.modules (id) on delete set null,
  title              text        not null,
  starts_at          timestamptz not null,
  ends_at            timestamptz,
  timezone           text        not null default 'Europe/Berlin',
  venue              text,
  address            text,
  room               text,
  trainer_profile_id uuid        references public.profiles (id) on delete set null,
  notes              text,
  directions         text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index idx_cohort_sessions_cohort_starts on public.cohort_sessions (cohort_id, starts_at);
create index idx_cohort_sessions_module_id     on public.cohort_sessions (module_id);
create index idx_cohort_sessions_trainer_id    on public.cohort_sessions (trainer_profile_id);

create trigger cohort_sessions_touch_updated_at
  before update on public.cohort_sessions
  for each row execute function app.touch_updated_at();

-- ----------------------------------------------------------------------------
-- course_enrollments: Einschreibung eines Profils in eine Cohort
-- ----------------------------------------------------------------------------
create table public.course_enrollments (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid        not null references public.profiles (id) on delete cascade,
  cohort_id    uuid        not null references public.cohorts (id) on delete cascade,
  enrolled_at  timestamptz not null default now(),
  completed_at timestamptz,
  unique (profile_id, cohort_id)
);

create index idx_course_enrollments_cohort_id on public.course_enrollments (cohort_id);

-- ----------------------------------------------------------------------------
-- lesson_releases: Freischaltungslogik je Lektion und Cohort
-- Feldbelegung je release_mode:
--   immediate           -> keine Zusatzfelder
--   at_datetime         -> release_at (Pflicht)
--   days_after_session  -> offset_days + session_id
--   days_before_session -> offset_days + session_id
--   after_lesson        -> prerequisite_lesson_id
--   after_module        -> prerequisite_module_id
--   manual              -> released_at wird beim manuellen Freischalten gesetzt
-- due_at/expires_at optional in allen Modi; profile_id gesetzt = individuelle
-- Freischaltung (ueberschreibt die Cohort-Regel fuer diese Person).
-- ----------------------------------------------------------------------------
create table public.lesson_releases (
  id                     uuid primary key default gen_random_uuid(),
  lesson_id              uuid         not null references public.lessons (id) on delete cascade,
  cohort_id              uuid         not null references public.cohorts (id) on delete cascade,
  profile_id             uuid         references public.profiles (id) on delete cascade,
  release_mode           release_mode not null,
  release_at             timestamptz,
  due_at                 timestamptz,
  expires_at             timestamptz,
  offset_days            int,
  session_id             uuid references public.cohort_sessions (id) on delete set null,
  prerequisite_lesson_id uuid references public.lessons (id) on delete set null,
  prerequisite_module_id uuid references public.modules (id) on delete set null,
  released_at            timestamptz,
  created_by             uuid references public.profiles (id) on delete set null,
  created_at             timestamptz  not null default now(),
  updated_at             timestamptz  not null default now()
);

create index idx_lesson_releases_cohort_lesson on public.lesson_releases (cohort_id, lesson_id);
create index idx_lesson_releases_lesson_id     on public.lesson_releases (lesson_id);
create index idx_lesson_releases_profile_id    on public.lesson_releases (profile_id) where profile_id is not null;
create index idx_lesson_releases_session_id    on public.lesson_releases (session_id);
create index idx_lesson_releases_prereq_lesson on public.lesson_releases (prerequisite_lesson_id);
create index idx_lesson_releases_prereq_module on public.lesson_releases (prerequisite_module_id);

create trigger lesson_releases_touch_updated_at
  before update on public.lesson_releases
  for each row execute function app.touch_updated_at();

-- ----------------------------------------------------------------------------
-- assignment_submissions: Abgaben zu Transferaufgaben/Checklisten
-- ----------------------------------------------------------------------------
create table public.assignment_submissions (
  id               uuid primary key default gen_random_uuid(),
  content_block_id uuid              not null references public.content_blocks (id) on delete cascade,
  profile_id       uuid              not null references public.profiles (id) on delete cascade,
  cohort_id        uuid              not null references public.cohorts (id) on delete cascade,
  status           submission_status not null default 'submitted',
  note_text        text,
  file_path        text,
  visibility       visibility_level  not null default 'private',
  submitted_at     timestamptz       not null default now(),
  updated_at       timestamptz       not null default now(),
  unique (content_block_id, profile_id)
);

create index idx_assignment_submissions_profile_id on public.assignment_submissions (profile_id);
create index idx_assignment_submissions_cohort_id  on public.assignment_submissions (cohort_id);

create trigger assignment_submissions_touch_updated_at
  before update on public.assignment_submissions
  for each row execute function app.touch_updated_at();

-- ----------------------------------------------------------------------------
-- reflection_entries: Reflexionseintraege (standardmaessig privat)
-- ----------------------------------------------------------------------------
create table public.reflection_entries (
  id               uuid primary key default gen_random_uuid(),
  content_block_id uuid             not null references public.content_blocks (id) on delete cascade,
  profile_id       uuid             not null references public.profiles (id) on delete cascade,
  cohort_id        uuid             not null references public.cohorts (id) on delete cascade,
  body             text             not null,
  visibility       visibility_level not null default 'private',
  created_at       timestamptz      not null default now(),
  updated_at       timestamptz      not null default now(),
  unique (content_block_id, profile_id)
);

create index idx_reflection_entries_profile_id on public.reflection_entries (profile_id);
create index idx_reflection_entries_cohort_id  on public.reflection_entries (cohort_id);

create trigger reflection_entries_touch_updated_at
  before update on public.reflection_entries
  for each row execute function app.touch_updated_at();

-- ----------------------------------------------------------------------------
-- quizzes / quiz_questions / quiz_options / quiz_attempts
-- ----------------------------------------------------------------------------
create table public.quizzes (
  id           uuid primary key default gen_random_uuid(),
  title        text        not null,
  description  text,
  pass_score   int,
  max_attempts int,
  shuffle      boolean     not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger quizzes_touch_updated_at
  before update on public.quizzes
  for each row execute function app.touch_updated_at();

create table public.quiz_questions (
  id          uuid primary key default gen_random_uuid(),
  quiz_id     uuid          not null references public.quizzes (id) on delete cascade,
  position    int           not null,
  kind        question_kind not null,
  body        text          not null,
  explanation text,
  points      int           not null default 1,
  unique (quiz_id, position)
);

create table public.quiz_options (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid    not null references public.quiz_questions (id) on delete cascade,
  position    int     not null,
  body        text    not null,
  is_correct  boolean not null default false,
  unique (question_id, position)
);

create table public.quiz_attempts (
  id           uuid primary key default gen_random_uuid(),
  quiz_id      uuid        not null references public.quizzes (id) on delete cascade,
  profile_id   uuid        not null references public.profiles (id) on delete cascade,
  cohort_id    uuid        not null references public.cohorts (id) on delete cascade,
  attempt_no   int         not null,
  answers      jsonb       not null default '{}',
  score        int,
  passed       boolean,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (quiz_id, profile_id, attempt_no)
);

create index idx_quiz_attempts_profile_id on public.quiz_attempts (profile_id);
create index idx_quiz_attempts_cohort_id  on public.quiz_attempts (cohort_id);

-- ----------------------------------------------------------------------------
-- lesson_progress: Lernfortschritt je Lektion und Profil
-- ----------------------------------------------------------------------------
create table public.lesson_progress (
  id           uuid primary key default gen_random_uuid(),
  lesson_id    uuid            not null references public.lessons (id) on delete cascade,
  profile_id   uuid            not null references public.profiles (id) on delete cascade,
  cohort_id    uuid            not null references public.cohorts (id) on delete cascade,
  status       progress_status not null default 'not_started',
  completed_at timestamptz,
  updated_at   timestamptz     not null default now(),
  unique (lesson_id, profile_id)
);

create index idx_lesson_progress_profile_cohort on public.lesson_progress (profile_id, cohort_id);
create index idx_lesson_progress_cohort_id      on public.lesson_progress (cohort_id);

create trigger lesson_progress_touch_updated_at
  before update on public.lesson_progress
  for each row execute function app.touch_updated_at();

-- ----------------------------------------------------------------------------
-- action_plans: Umsetzungsplaene (module_id NULL = 90-Tage-Plan)
-- NULLS NOT DISTINCT: pro Profil/Cohort auch nur EIN 90-Tage-Plan (PG >= 15)
-- ----------------------------------------------------------------------------
create table public.action_plans (
  id                 uuid primary key default gen_random_uuid(),
  profile_id         uuid        not null references public.profiles (id) on delete cascade,
  cohort_id          uuid        not null references public.cohorts (id) on delete cascade,
  module_id          uuid        references public.modules (id) on delete restrict,
  share_with_trainer boolean     not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique nulls not distinct (profile_id, cohort_id, module_id)
);

create index idx_action_plans_cohort_id on public.action_plans (cohort_id);
create index idx_action_plans_module_id on public.action_plans (module_id);

create trigger action_plans_touch_updated_at
  before update on public.action_plans
  for each row execute function app.touch_updated_at();

-- ----------------------------------------------------------------------------
-- action_plan_items: Einzelvorhaben eines Umsetzungsplans
-- ----------------------------------------------------------------------------
create table public.action_plan_items (
  id             uuid primary key default gen_random_uuid(),
  action_plan_id uuid             not null references public.action_plans (id) on delete cascade,
  position       int              not null,
  insight        text,
  behavior       text,
  action         text,
  team           text,
  result         text,
  status         plan_item_status not null default 'planned',
  due_at         timestamptz,
  created_at     timestamptz      not null default now(),
  updated_at     timestamptz      not null default now()
);

create index idx_action_plan_items_plan_position on public.action_plan_items (action_plan_id, position);

create trigger action_plan_items_touch_updated_at
  before update on public.action_plan_items
  for each row execute function app.touch_updated_at();

-- ----------------------------------------------------------------------------
-- trainer_feedback: Feedback zu genau EINEM Ziel (Submission ODER Plan-Item)
-- ----------------------------------------------------------------------------
create table public.trainer_feedback (
  id                   uuid primary key default gen_random_uuid(),
  submission_id        uuid references public.assignment_submissions (id) on delete cascade,
  action_plan_item_id  uuid references public.action_plan_items (id) on delete cascade,
  author_profile_id    uuid        not null references public.profiles (id) on delete cascade,
  recipient_profile_id uuid        not null references public.profiles (id) on delete cascade,
  body                 text        not null,
  created_at           timestamptz not null default now(),
  -- Genau ein Ziel: entweder Submission oder Plan-Item
  constraint trainer_feedback_exactly_one_target
    check (num_nonnulls(submission_id, action_plan_item_id) = 1)
);

create index idx_trainer_feedback_submission_id  on public.trainer_feedback (submission_id);
create index idx_trainer_feedback_plan_item_id   on public.trainer_feedback (action_plan_item_id);
create index idx_trainer_feedback_recipient_id   on public.trainer_feedback (recipient_profile_id);
create index idx_trainer_feedback_author_id      on public.trainer_feedback (author_profile_id);

-- ----------------------------------------------------------------------------
-- announcements: Ankuendigungen je Cohort
-- ----------------------------------------------------------------------------
create table public.announcements (
  id                uuid primary key default gen_random_uuid(),
  cohort_id         uuid        not null references public.cohorts (id) on delete cascade,
  author_profile_id uuid        references public.profiles (id) on delete set null,
  title             text        not null,
  body              text        not null,
  published_at      timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index idx_announcements_cohort_published on public.announcements (cohort_id, published_at desc);

-- ----------------------------------------------------------------------------
-- notifications: In-App-Benachrichtigungen
-- ----------------------------------------------------------------------------
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid              not null references public.profiles (id) on delete cascade,
  kind       notification_kind not null,
  title      text              not null,
  body       text,
  deep_link  text,
  read_at    timestamptz,
  created_at timestamptz       not null default now()
);

-- Abfrage "ungelesene Benachrichtigungen eines Profils"
create index idx_notifications_profile_read on public.notifications (profile_id, read_at);

-- ----------------------------------------------------------------------------
-- push_tokens: Expo-Push-Tokens je Geraet
-- ----------------------------------------------------------------------------
create table public.push_tokens (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid        not null references public.profiles (id) on delete cascade,
  device_id    text        not null,
  token        text        not null,
  platform     text        not null check (platform in ('ios', 'android')),
  last_seen_at timestamptz,
  disabled_at  timestamptz,
  created_at   timestamptz not null default now(),
  unique (profile_id, device_id)
);

-- ----------------------------------------------------------------------------
-- invitations: Einladungen (einziger Registrierungsweg)
-- ----------------------------------------------------------------------------
create table public.invitations (
  id              uuid primary key default gen_random_uuid(),
  email           text              not null,
  organization_id uuid              not null references public.organizations (id) on delete cascade,
  cohort_id       uuid              references public.cohorts (id) on delete set null,
  role            member_role       not null default 'participant',
  token_hash      text              not null unique,
  status          invitation_status not null default 'pending',
  expires_at      timestamptz       not null,
  accepted_at     timestamptz,
  revoked_at      timestamptz,
  invited_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz       not null default now()
);

create index idx_invitations_email           on public.invitations (email);
create index idx_invitations_organization_id on public.invitations (organization_id);
create index idx_invitations_cohort_id       on public.invitations (cohort_id);

-- ----------------------------------------------------------------------------
-- learning_assets: Datei-Registry (organization_id NULL = globales Asset)
-- ----------------------------------------------------------------------------
create table public.learning_assets (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid   references public.organizations (id) on delete cascade,
  path            text   not null unique,
  mime            text   not null,
  size_bytes      bigint,
  original_name   text,
  uploaded_by     uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now()
);

create index idx_learning_assets_organization_id on public.learning_assets (organization_id);

-- ----------------------------------------------------------------------------
-- audit_logs: Revisionslog – ausschliesslich INSERT (via Service Role);
-- keine SELECT/UPDATE/DELETE-Policies fuer Client-Rollen
-- ----------------------------------------------------------------------------
create table public.audit_logs (
  id               uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles (id) on delete set null,
  action           text  not null,
  target_type      text,
  target_id        uuid,
  metadata         jsonb not null default '{}',
  created_at       timestamptz not null default now()
);

comment on table public.audit_logs is
  'INSERT-only-Revisionslog; Schreibzugriff nur ueber Service Role.';

create index idx_audit_logs_actor_id   on public.audit_logs (actor_profile_id);
create index idx_audit_logs_target     on public.audit_logs (target_type, target_id);
create index idx_audit_logs_created_at on public.audit_logs (created_at);

-- ----------------------------------------------------------------------------
-- user_consents: Einwilligungen (DSGVO), versioniert
-- ----------------------------------------------------------------------------
create table public.user_consents (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid         not null references public.profiles (id) on delete cascade,
  consent_type consent_type not null,
  version      text         not null,
  granted_at   timestamptz  not null default now(),
  revoked_at   timestamptz,
  unique (profile_id, consent_type, version)
);

-- ----------------------------------------------------------------------------
-- account_deletion_requests: Loeschbegehren (DSGVO Art. 17)
-- ----------------------------------------------------------------------------
create table public.account_deletion_requests (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid            not null references public.profiles (id) on delete cascade,
  status       deletion_status not null default 'requested',
  reason       text,
  requested_at timestamptz     not null default now(),
  processed_at timestamptz,
  notes        text
);

create index idx_account_deletion_requests_profile_id on public.account_deletion_requests (profile_id);

-- ----------------------------------------------------------------------------
-- VIEW module_progress: Fortschritt je (profile_id, module_id, cohort_id)
-- Zaehlt nur published Lessons; security_invoker => RLS der Basistabellen gilt
-- ----------------------------------------------------------------------------
create view public.module_progress
with (security_invoker = true) as
select
  cm.profile_id,
  m.id  as module_id,
  cm.cohort_id,
  count(l.id) as total_lessons,
  count(lp.id) filter (where lp.status = 'completed') as completed_lessons,
  case
    when count(l.id) = 0 then 0
    else round(100.0 * count(lp.id) filter (where lp.status = 'completed') / count(l.id))::int
  end as percent
from public.cohort_members cm
join public.cohorts c on c.id = cm.cohort_id
join public.modules m on m.program_id = c.program_id
left join public.learning_phases ph on ph.module_id = m.id
left join public.lessons l
  on l.learning_phase_id = ph.id
 and l.status = 'published'
left join public.lesson_progress lp
  on lp.lesson_id = l.id
 and lp.profile_id = cm.profile_id
 and lp.cohort_id = cm.cohort_id
group by cm.profile_id, m.id, cm.cohort_id;

comment on view public.module_progress is
  'Modul-Fortschritt je Teilnehmer und Cohort (nur published Lessons).';

-- ----------------------------------------------------------------------------
-- RLS aktivieren (Policies folgen in 0002_rls.sql; bis dahin: kein Zugriff
-- fuer anon/authenticated, Service Role bypassed RLS)
-- ----------------------------------------------------------------------------
alter table public.profiles                  enable row level security;
alter table public.organizations             enable row level security;
alter table public.organization_memberships  enable row level security;
alter table public.programs                  enable row level security;
alter table public.modules                   enable row level security;
alter table public.learning_phases           enable row level security;
alter table public.lessons                   enable row level security;
alter table public.content_blocks            enable row level security;
alter table public.cohorts                   enable row level security;
alter table public.cohort_trainers           enable row level security;
alter table public.cohort_members            enable row level security;
alter table public.cohort_sessions           enable row level security;
alter table public.course_enrollments        enable row level security;
alter table public.lesson_releases           enable row level security;
alter table public.assignment_submissions    enable row level security;
alter table public.reflection_entries        enable row level security;
alter table public.quizzes                   enable row level security;
alter table public.quiz_questions            enable row level security;
alter table public.quiz_options              enable row level security;
alter table public.quiz_attempts             enable row level security;
alter table public.lesson_progress           enable row level security;
alter table public.action_plans              enable row level security;
alter table public.action_plan_items         enable row level security;
alter table public.trainer_feedback          enable row level security;
alter table public.announcements             enable row level security;
alter table public.notifications             enable row level security;
alter table public.push_tokens               enable row level security;
alter table public.invitations               enable row level security;
alter table public.learning_assets           enable row level security;
alter table public.audit_logs                enable row level security;
alter table public.user_consents             enable row level security;
alter table public.account_deletion_requests enable row level security;

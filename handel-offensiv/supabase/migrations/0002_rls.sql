-- ============================================================================
-- 0002_rls.sql – Row Level Security fuer "Handel Offensiv Learning App"
--
-- Grundsatz: Default deny. Policies nur fuer die Rolle "authenticated".
--   * Teilnehmer: ausschliesslich eigene Zeilen.
--   * Trainer: nur zugewiesene Cohorts; Submissions/Reflexionen NUR mit
--     visibility = 'trainer'.
--   * Org-Admin: eigene Organisation; KEINE reflection_entries, KEINE
--     privaten Submissions, KEINE quiz_attempts-Details.
--   * Super Admin (profiles.is_super_admin): Lesezugriff auf Struktur/Inhalte;
--     ALLE Schreibzugriffe auf Content/Stammdaten laufen ueber die Service
--     Role (Edge Functions). Die Service Role hat BYPASSRLS und braucht
--     daher keine Policies – auch nicht bei FORCE ROW LEVEL SECURITY.
--   * audit_logs: KEINE Policies => keinerlei Client-Zugriff; nur die
--     Service Role (BYPASSRLS) kann schreiben/lesen.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Hilfsfunktionen im Schema "app"
--    SECURITY DEFINER: umgeht RLS der referenzierten Tabellen und verhindert
--    Rekursion in Policies. STABLE + fixierter search_path.
-- ----------------------------------------------------------------------------

-- Profil-ID des angemeldeten Users (profiles.id == auth.users.id)
create or replace function app.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select auth.uid()
$$;

-- Ist der angemeldete User Super Admin?
create or replace function app.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select p.is_super_admin from public.profiles p where p.id = auth.uid()),
    false
  )
$$;

-- Rolle des Users in einer Organisation (null = keine aktive Mitgliedschaft)
create or replace function app.org_role(org uuid)
returns public.member_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.role
  from public.organization_memberships m
  where m.organization_id = org
    and m.profile_id = auth.uid()
    and m.status = 'active'
  limit 1
$$;

-- Ist der User Org-Admin der Organisation?
create or replace function app.is_org_admin(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = org
      and m.profile_id = auth.uid()
      and m.role = 'org_admin'
      and m.status = 'active'
  )
$$;

-- Ist der User (beliebige Rolle) aktives Mitglied der Organisation?
create or replace function app.is_org_member(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = org
      and m.profile_id = auth.uid()
      and m.status = 'active'
  )
$$;

-- Wie is_org_member, aber mit Text-Parameter (fuer Storage-Pfadsegmente;
-- vermeidet Cast-Fehler bei ungueltigen UUID-Strings im Pfad)
create or replace function app.is_org_member_by_text(org_text text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.organization_memberships m
    where m.organization_id::text = org_text
      and m.profile_id = auth.uid()
      and m.status = 'active'
  )
$$;

-- Ist der User Trainer der Cohort?
create or replace function app.is_cohort_trainer(c uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.cohort_trainers ct
    where ct.cohort_id = c
      and ct.profile_id = auth.uid()
  )
$$;

-- Ist der User aktives Mitglied (Teilnehmer) der Cohort?
create or replace function app.is_cohort_member(c uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.cohort_members cm
    where cm.cohort_id = c
      and cm.profile_id = auth.uid()
      and cm.status = 'active'
  )
$$;

-- Ist der User Org-Admin der Organisation, zu der die Cohort gehoert?
create or replace function app.is_org_admin_of_cohort(c uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.cohorts co
    join public.organization_memberships m on m.organization_id = co.organization_id
    where co.id = c
      and m.profile_id = auth.uid()
      and m.role = 'org_admin'
      and m.status = 'active'
  )
$$;

-- Trainer-Sicht auf Profile: sieht der User (als Trainer) das Zielprofil,
-- weil es aktives Mitglied einer seiner Cohorts ist?
create or replace function app.is_trainer_of_profile(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.cohort_trainers ct
    join public.cohort_members cm on cm.cohort_id = ct.cohort_id
    where ct.profile_id = auth.uid()
      and cm.profile_id = target
      and cm.status = 'active'
  )
$$;

-- Programm-Zugang: Mitglied ODER Trainer einer Cohort dieses Programms,
-- ODER Org-Admin einer Organisation mit Cohort dieses Programms
-- (Org-Admin-Zweig noetig, damit die View module_progress – security_invoker –
--  fuer Org-Admins aggregierten Fortschritt liefern kann).
create or replace function app.can_access_program(p uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.cohorts c
    where c.program_id = p
      and (
        exists (select 1 from public.cohort_members cm
                 where cm.cohort_id = c.id and cm.profile_id = auth.uid() and cm.status = 'active')
        or exists (select 1 from public.cohort_trainers ct
                 where ct.cohort_id = c.id and ct.profile_id = auth.uid())
        or exists (select 1 from public.organization_memberships m
                 where m.organization_id = c.organization_id
                   and m.profile_id = auth.uid() and m.role = 'org_admin' and m.status = 'active')
      )
  )
$$;

-- Lesezugang zu einer Lektion:
--   Teilnehmer: es existiert eine lesson_release fuer die eigene Cohort
--     (cohort-weit ODER individuell fuer den User). Die Feinlogik der
--     Freischaltbedingung (Zeitpunkt, Session-Offset, Prerequisite) wird
--     bewusst in der App/Domain geprueft – DB-seitig genuegt die Release-Zeile.
--   Trainer: Lektion gehoert zum Programm einer zugewiesenen Cohort.
--   Org-Admin: Lektion gehoert zum Programm einer Cohort der eigenen
--     Organisation (nur fuer aggregierten Fortschritt via module_progress).
create or replace function app.can_read_lesson(l uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    exists (
      select 1
      from public.lesson_releases r
      join public.cohort_members cm on cm.cohort_id = r.cohort_id
      where r.lesson_id = l
        and cm.profile_id = auth.uid()
        and cm.status = 'active'
        and (r.profile_id is null or r.profile_id = auth.uid())
    )
    or exists (
      select 1
      from public.lessons le
      join public.learning_phases ph on ph.id = le.learning_phase_id
      join public.modules mo on mo.id = ph.module_id
      join public.cohorts c on c.program_id = mo.program_id
      join public.cohort_trainers ct on ct.cohort_id = c.id
      where le.id = l
        and ct.profile_id = auth.uid()
    )
    or exists (
      select 1
      from public.lessons le
      join public.learning_phases ph on ph.id = le.learning_phase_id
      join public.modules mo on mo.id = ph.module_id
      join public.cohorts c on c.program_id = mo.program_id
      join public.organization_memberships m on m.organization_id = c.organization_id
      where le.id = l
        and m.profile_id = auth.uid()
        and m.role = 'org_admin'
        and m.status = 'active'
    )
$$;

-- Schema-/Funktionsrechte: Policies laufen als "authenticated"
grant usage on schema app to authenticated, service_role;
grant execute on all functions in schema app to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2. Schutz-Trigger
-- ----------------------------------------------------------------------------

-- profiles: kritische Spalten (id, is_super_admin, status) fuer Nicht-Service-
-- Rollen einfrieren – Selbst-Eskalation zum Super Admin ist damit unmoeglich.
create or replace function app.protect_profile_columns()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  -- Service Role / Migrations-Rollen duerfen alles
  if current_user in ('service_role', 'postgres', 'supabase_admin', 'supabase_auth_admin') then
    return new;
  end if;
  new.id             := old.id;
  new.is_super_admin := old.is_super_admin;
  new.status         := old.status;
  return new;
end;
$$;

create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute function app.protect_profile_columns();

-- lesson_releases: Trainer duerfen per UPDATE ausschliesslich released_at
-- setzen (manuelle Freischaltung); alle anderen Spalten werden eingefroren.
create or replace function app.protect_lesson_release_columns()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;
  new.id                     := old.id;
  new.lesson_id              := old.lesson_id;
  new.cohort_id              := old.cohort_id;
  new.profile_id             := old.profile_id;
  new.release_mode           := old.release_mode;
  new.release_at             := old.release_at;
  new.due_at                 := old.due_at;
  new.expires_at             := old.expires_at;
  new.offset_days            := old.offset_days;
  new.session_id             := old.session_id;
  new.prerequisite_lesson_id := old.prerequisite_lesson_id;
  new.prerequisite_module_id := old.prerequisite_module_id;
  new.created_by             := old.created_by;
  new.created_at             := old.created_at;
  return new; -- frei bleiben nur: released_at (updated_at setzt touch-Trigger)
end;
$$;

create trigger lesson_releases_protect_columns
  before update on public.lesson_releases
  for each row execute function app.protect_lesson_release_columns();

-- ----------------------------------------------------------------------------
-- 3. RLS aktivieren + erzwingen (FORCE gilt auch fuer den Tabellen-Owner;
--    die Service Role bleibt via BYPASSRLS-Rollenattribut unbeschraenkt)
-- ----------------------------------------------------------------------------
alter table public.profiles                  enable row level security;
alter table public.profiles                  force  row level security;
alter table public.organizations             enable row level security;
alter table public.organizations             force  row level security;
alter table public.organization_memberships  enable row level security;
alter table public.organization_memberships  force  row level security;
alter table public.programs                  enable row level security;
alter table public.programs                  force  row level security;
alter table public.modules                   enable row level security;
alter table public.modules                   force  row level security;
alter table public.learning_phases           enable row level security;
alter table public.learning_phases           force  row level security;
alter table public.lessons                   enable row level security;
alter table public.lessons                   force  row level security;
alter table public.content_blocks            enable row level security;
alter table public.content_blocks            force  row level security;
alter table public.cohorts                   enable row level security;
alter table public.cohorts                   force  row level security;
alter table public.cohort_trainers           enable row level security;
alter table public.cohort_trainers           force  row level security;
alter table public.cohort_members            enable row level security;
alter table public.cohort_members            force  row level security;
alter table public.cohort_sessions           enable row level security;
alter table public.cohort_sessions           force  row level security;
alter table public.course_enrollments        enable row level security;
alter table public.course_enrollments        force  row level security;
alter table public.lesson_releases           enable row level security;
alter table public.lesson_releases           force  row level security;
alter table public.assignment_submissions    enable row level security;
alter table public.assignment_submissions    force  row level security;
alter table public.reflection_entries        enable row level security;
alter table public.reflection_entries        force  row level security;
alter table public.quizzes                   enable row level security;
alter table public.quizzes                   force  row level security;
alter table public.quiz_questions            enable row level security;
alter table public.quiz_questions            force  row level security;
alter table public.quiz_options              enable row level security;
alter table public.quiz_options              force  row level security;
alter table public.quiz_attempts             enable row level security;
alter table public.quiz_attempts             force  row level security;
alter table public.lesson_progress           enable row level security;
alter table public.lesson_progress           force  row level security;
alter table public.action_plans              enable row level security;
alter table public.action_plans              force  row level security;
alter table public.action_plan_items         enable row level security;
alter table public.action_plan_items         force  row level security;
alter table public.trainer_feedback          enable row level security;
alter table public.trainer_feedback          force  row level security;
alter table public.announcements             enable row level security;
alter table public.announcements             force  row level security;
alter table public.notifications             enable row level security;
alter table public.notifications             force  row level security;
alter table public.push_tokens               enable row level security;
alter table public.push_tokens               force  row level security;
alter table public.invitations               enable row level security;
alter table public.invitations               force  row level security;
alter table public.learning_assets           enable row level security;
alter table public.learning_assets           force  row level security;
alter table public.audit_logs               enable row level security;
alter table public.audit_logs               force  row level security;
alter table public.user_consents             enable row level security;
alter table public.user_consents             force  row level security;
alter table public.account_deletion_requests enable row level security;
alter table public.account_deletion_requests force  row level security;

-- ----------------------------------------------------------------------------
-- 4. Policies
-- ----------------------------------------------------------------------------

-- ==== profiles ==============================================================
-- Eigenes Profil lesen; Trainer sehen Profile (Namen) ihrer Cohort-Mitglieder.
-- Cohort-Mitglieder sehen die Profile anderer Teilnehmer NICHT.
create policy profiles_select
  on public.profiles
  for select
  to authenticated
  using (
    id = app.current_profile_id()
    or app.is_super_admin()
    or app.is_trainer_of_profile(id)
  );

-- Eigenes Profil aendern (unkritische Felder: first_name, last_name,
-- avatar_path, locale). is_super_admin/status/id friert der Trigger
-- profiles_protect_columns fuer Nicht-Service-Rollen ein.
create policy profiles_update_self
  on public.profiles
  for update
  to authenticated
  using (id = app.current_profile_id())
  with check (id = app.current_profile_id());

-- INSERT/DELETE nur via Service Role (Registrierung ausschliesslich per
-- Einladung ueber Edge Function; Loeschung ueber account_deletion_requests).

-- ==== organizations =========================================================
-- Aktive Mitglieder (org_admin/trainer/participant) sehen die eigene
-- Organisation (Name/Logo); Schreibzugriff nur Service Role.
create policy organizations_select_member
  on public.organizations
  for select
  to authenticated
  using (
    app.is_super_admin()
    or app.is_org_member(id)
  );

-- ==== organization_memberships ==============================================
-- Eigene Mitgliedschaft; Org-Admins sehen alle Mitgliedschaften ihrer Org.
create policy org_memberships_select
  on public.organization_memberships
  for select
  to authenticated
  using (
    profile_id = app.current_profile_id()
    or app.is_org_admin(organization_id)
    or app.is_super_admin()
  );

-- ==== programs ==============================================================
-- Nur veroeffentlichte Programme, zu denen ueber eine Cohort Zugang besteht.
create policy programs_select_published
  on public.programs
  for select
  to authenticated
  using (
    app.is_super_admin()
    or (status = 'published' and app.can_access_program(id))
  );

-- ==== modules ===============================================================
create policy modules_select_published
  on public.modules
  for select
  to authenticated
  using (
    app.is_super_admin()
    or (status = 'published' and app.can_access_program(program_id))
  );

-- ==== learning_phases =======================================================
-- Kaskadierende Sichtbarkeit: Phase sichtbar, wenn ihr Modul sichtbar ist
-- (Subquery unterliegt der modules-RLS des Aufrufers).
create policy learning_phases_select
  on public.learning_phases
  for select
  to authenticated
  using (
    exists (select 1 from public.modules mo where mo.id = learning_phases.module_id)
  );

-- ==== lessons ===============================================================
-- Teilnehmer: published + Release-Zeile fuer die eigene Cohort (Feinlogik der
-- Freischaltung clientseitig). Trainer/Org-Admin: siehe app.can_read_lesson.
create policy lessons_select_released
  on public.lessons
  for select
  to authenticated
  using (
    app.is_super_admin()
    or (status = 'published' and app.can_read_lesson(id))
  );

-- ==== content_blocks ========================================================
-- Sichtbar, wenn die zugehoerige Lektion sichtbar ist (lessons-RLS kaskadiert).
create policy content_blocks_select
  on public.content_blocks
  for select
  to authenticated
  using (
    exists (select 1 from public.lessons le where le.id = content_blocks.lesson_id)
  );

-- ==== cohorts ===============================================================
create policy cohorts_select
  on public.cohorts
  for select
  to authenticated
  using (
    app.is_super_admin()
    or app.is_cohort_member(id)
    or app.is_cohort_trainer(id)
    or app.is_org_admin(organization_id)
  );

-- ==== cohort_trainers =======================================================
-- Eigene Zuordnung; Mitglieder sehen, wer ihre Cohort trainiert; Trainer und
-- Org-Admin sehen die Trainerliste ihrer Cohorts.
create policy cohort_trainers_select
  on public.cohort_trainers
  for select
  to authenticated
  using (
    profile_id = app.current_profile_id()
    or app.is_cohort_member(cohort_id)
    or app.is_cohort_trainer(cohort_id)
    or app.is_org_admin_of_cohort(cohort_id)
    or app.is_super_admin()
  );

-- ==== cohort_members ========================================================
-- Eigene Zeile; Trainer und Org-Admin sehen die Mitgliederliste. Teilnehmer
-- sehen NICHT die anderen Mitglieder (Datenschutz).
create policy cohort_members_select
  on public.cohort_members
  for select
  to authenticated
  using (
    profile_id = app.current_profile_id()
    or app.is_cohort_trainer(cohort_id)
    or app.is_org_admin_of_cohort(cohort_id)
    or app.is_super_admin()
  );

-- ==== cohort_sessions =======================================================
create policy cohort_sessions_select
  on public.cohort_sessions
  for select
  to authenticated
  using (
    app.is_cohort_member(cohort_id)
    or app.is_cohort_trainer(cohort_id)
    or app.is_org_admin_of_cohort(cohort_id)
    or app.is_super_admin()
  );

-- ==== course_enrollments ====================================================
create policy course_enrollments_select
  on public.course_enrollments
  for select
  to authenticated
  using (
    profile_id = app.current_profile_id()
    or app.is_cohort_trainer(cohort_id)
    or app.is_org_admin_of_cohort(cohort_id)
    or app.is_super_admin()
  );

-- ==== lesson_releases =======================================================
-- Teilnehmer: Releases der eigenen Cohort (cohort-weit oder individuell fuer
-- sich selbst); Trainer: alle Releases ihrer Cohorts.
create policy lesson_releases_select
  on public.lesson_releases
  for select
  to authenticated
  using (
    app.is_super_admin()
    or app.is_cohort_trainer(cohort_id)
    or (
      app.is_cohort_member(cohort_id)
      and (profile_id is null or profile_id = app.current_profile_id())
    )
  );

-- Trainer: manuelle Freischaltung (nur released_at; alle anderen Spalten
-- friert der Trigger lesson_releases_protect_columns ein).
create policy lesson_releases_update_trainer
  on public.lesson_releases
  for update
  to authenticated
  using (app.is_cohort_trainer(cohort_id))
  with check (app.is_cohort_trainer(cohort_id));

-- ==== assignment_submissions ================================================
-- Eigene Abgaben; Trainer NUR bei visibility='trainer'. Org-Admins sehen
-- KEINE Submissions (auch keine trainer-sichtbaren).
create policy assignment_submissions_select
  on public.assignment_submissions
  for select
  to authenticated
  using (
    profile_id = app.current_profile_id()
    or (visibility = 'trainer' and app.is_cohort_trainer(cohort_id))
  );

create policy assignment_submissions_insert_own
  on public.assignment_submissions
  for insert
  to authenticated
  with check (
    profile_id = app.current_profile_id()
    and app.is_cohort_member(cohort_id)
  );

create policy assignment_submissions_update_own
  on public.assignment_submissions
  for update
  to authenticated
  using (profile_id = app.current_profile_id())
  with check (
    profile_id = app.current_profile_id()
    and app.is_cohort_member(cohort_id)
  );

create policy assignment_submissions_delete_own
  on public.assignment_submissions
  for delete
  to authenticated
  using (profile_id = app.current_profile_id());

-- ==== reflection_entries ====================================================
-- Standard privat; Trainer NUR bei visibility='trainer'. Org-Admins NIE.
create policy reflection_entries_select
  on public.reflection_entries
  for select
  to authenticated
  using (
    profile_id = app.current_profile_id()
    or (visibility = 'trainer' and app.is_cohort_trainer(cohort_id))
  );

create policy reflection_entries_insert_own
  on public.reflection_entries
  for insert
  to authenticated
  with check (
    profile_id = app.current_profile_id()
    and app.is_cohort_member(cohort_id)
  );

create policy reflection_entries_update_own
  on public.reflection_entries
  for update
  to authenticated
  using (profile_id = app.current_profile_id())
  with check (
    profile_id = app.current_profile_id()
    and app.is_cohort_member(cohort_id)
  );

create policy reflection_entries_delete_own
  on public.reflection_entries
  for delete
  to authenticated
  using (profile_id = app.current_profile_id());

-- ==== quizzes / quiz_questions / quiz_options ===============================
-- Sichtbar, wenn ein sichtbarer content_block vom Typ 'quiz' das Quiz per
-- config.quizId referenziert (content_blocks-RLS kaskadiert). Textvergleich
-- statt uuid-Cast vermeidet Fehler bei fehlerhafter config.
create policy quizzes_select
  on public.quizzes
  for select
  to authenticated
  using (
    app.is_super_admin()
    or exists (
      select 1
      from public.content_blocks cb
      where cb.block_type = 'quiz'
        and cb.config ->> 'quizId' = quizzes.id::text
    )
  );

create policy quiz_questions_select
  on public.quiz_questions
  for select
  to authenticated
  using (
    exists (select 1 from public.quizzes q where q.id = quiz_questions.quiz_id)
  );

-- Hinweis: quiz_options.is_correct ist fuer berechtigte Nutzer lesbar
-- (clientseitige Auswertung); serverseitige Bewertung waere via Edge Function
-- moeglich, ist im Datenmodell aber nicht gefordert.
create policy quiz_options_select
  on public.quiz_options
  for select
  to authenticated
  using (
    exists (select 1 from public.quiz_questions qq where qq.id = quiz_options.question_id)
  );

-- ==== quiz_attempts =========================================================
-- Eigene Versuche; Trainer sehen Versuche ihrer Cohorts. Org-Admins sehen
-- KEINE Attempt-Details (nur aggregierter Fortschritt via module_progress).
create policy quiz_attempts_select
  on public.quiz_attempts
  for select
  to authenticated
  using (
    profile_id = app.current_profile_id()
    or app.is_cohort_trainer(cohort_id)
  );

create policy quiz_attempts_insert_own
  on public.quiz_attempts
  for insert
  to authenticated
  with check (
    profile_id = app.current_profile_id()
    and app.is_cohort_member(cohort_id)
  );

create policy quiz_attempts_update_own
  on public.quiz_attempts
  for update
  to authenticated
  using (profile_id = app.current_profile_id())
  with check (
    profile_id = app.current_profile_id()
    and app.is_cohort_member(cohort_id)
  );

-- ==== lesson_progress =======================================================
-- Eigener Fortschritt; Trainer ihrer Cohorts; Org-Admin der Organisation
-- (Basiszugriff noetig, damit die security_invoker-View module_progress fuer
-- Org-Admins aggregieren kann).
create policy lesson_progress_select
  on public.lesson_progress
  for select
  to authenticated
  using (
    profile_id = app.current_profile_id()
    or app.is_cohort_trainer(cohort_id)
    or app.is_org_admin_of_cohort(cohort_id)
    or app.is_super_admin()
  );

create policy lesson_progress_insert_own
  on public.lesson_progress
  for insert
  to authenticated
  with check (
    profile_id = app.current_profile_id()
    and app.is_cohort_member(cohort_id)
  );

create policy lesson_progress_update_own
  on public.lesson_progress
  for update
  to authenticated
  using (profile_id = app.current_profile_id())
  with check (
    profile_id = app.current_profile_id()
    and app.is_cohort_member(cohort_id)
  );

-- ==== action_plans ==========================================================
-- Eigene Plaene; Trainer nur bei share_with_trainer = true.
create policy action_plans_select
  on public.action_plans
  for select
  to authenticated
  using (
    profile_id = app.current_profile_id()
    or (share_with_trainer and app.is_cohort_trainer(cohort_id))
  );

create policy action_plans_insert_own
  on public.action_plans
  for insert
  to authenticated
  with check (
    profile_id = app.current_profile_id()
    and app.is_cohort_member(cohort_id)
  );

create policy action_plans_update_own
  on public.action_plans
  for update
  to authenticated
  using (profile_id = app.current_profile_id())
  with check (
    profile_id = app.current_profile_id()
    and app.is_cohort_member(cohort_id)
  );

create policy action_plans_delete_own
  on public.action_plans
  for delete
  to authenticated
  using (profile_id = app.current_profile_id());

-- ==== action_plan_items =====================================================
-- Lesen kaskadiert ueber die action_plans-RLS (eigen oder trainer-geteilt);
-- Schreiben nur auf Items des EIGENEN Plans.
create policy action_plan_items_select
  on public.action_plan_items
  for select
  to authenticated
  using (
    exists (select 1 from public.action_plans ap where ap.id = action_plan_items.action_plan_id)
  );

create policy action_plan_items_insert_own
  on public.action_plan_items
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.action_plans ap
      where ap.id = action_plan_items.action_plan_id
        and ap.profile_id = app.current_profile_id()
    )
  );

create policy action_plan_items_update_own
  on public.action_plan_items
  for update
  to authenticated
  using (
    exists (
      select 1 from public.action_plans ap
      where ap.id = action_plan_items.action_plan_id
        and ap.profile_id = app.current_profile_id()
    )
  )
  with check (
    exists (
      select 1 from public.action_plans ap
      where ap.id = action_plan_items.action_plan_id
        and ap.profile_id = app.current_profile_id()
    )
  );

create policy action_plan_items_delete_own
  on public.action_plan_items
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.action_plans ap
      where ap.id = action_plan_items.action_plan_id
        and ap.profile_id = app.current_profile_id()
    )
  );

-- ==== trainer_feedback ======================================================
-- Empfaenger und Autor lesen; nur Trainer schreiben, und nur zu Zielen, die
-- sie sehen duerfen (trainer-sichtbare Submission bzw. geteilter Plan) und
-- deren Eigentuemer der Empfaenger ist.
create policy trainer_feedback_select
  on public.trainer_feedback
  for select
  to authenticated
  using (
    recipient_profile_id = app.current_profile_id()
    or author_profile_id = app.current_profile_id()
  );

create policy trainer_feedback_insert_trainer
  on public.trainer_feedback
  for insert
  to authenticated
  with check (
    author_profile_id = app.current_profile_id()
    and (
      (
        submission_id is not null
        and exists (
          select 1
          from public.assignment_submissions s
          where s.id = trainer_feedback.submission_id
            and s.visibility = 'trainer'
            and s.profile_id = trainer_feedback.recipient_profile_id
            and app.is_cohort_trainer(s.cohort_id)
        )
      )
      or (
        action_plan_item_id is not null
        and exists (
          select 1
          from public.action_plan_items i
          join public.action_plans ap on ap.id = i.action_plan_id
          where i.id = trainer_feedback.action_plan_item_id
            and ap.share_with_trainer
            and ap.profile_id = trainer_feedback.recipient_profile_id
            and app.is_cohort_trainer(ap.cohort_id)
        )
      )
    )
  );

-- ==== announcements =========================================================
create policy announcements_select
  on public.announcements
  for select
  to authenticated
  using (
    app.is_cohort_member(cohort_id)
    or app.is_cohort_trainer(cohort_id)
    or app.is_super_admin()
  );

-- Trainer duerfen Ankuendigungen fuer ihre Cohorts erstellen (Autor = selbst);
-- Korrekturen/Loeschungen laufen ueber die Service Role.
create policy announcements_insert_trainer
  on public.announcements
  for insert
  to authenticated
  with check (
    app.is_cohort_trainer(cohort_id)
    and author_profile_id = app.current_profile_id()
  );

-- ==== notifications =========================================================
-- Strikt nur eigene; INSERT nur via Service Role. UPDATE gedacht fuer read_at.
create policy notifications_select_own
  on public.notifications
  for select
  to authenticated
  using (profile_id = app.current_profile_id());

create policy notifications_update_own
  on public.notifications
  for update
  to authenticated
  using (profile_id = app.current_profile_id())
  with check (profile_id = app.current_profile_id());

create policy notifications_delete_own
  on public.notifications
  for delete
  to authenticated
  using (profile_id = app.current_profile_id());

-- ==== push_tokens ===========================================================
-- Strikt nur eigene Geraete-Tokens.
create policy push_tokens_select_own
  on public.push_tokens
  for select
  to authenticated
  using (profile_id = app.current_profile_id());

create policy push_tokens_insert_own
  on public.push_tokens
  for insert
  to authenticated
  with check (profile_id = app.current_profile_id());

create policy push_tokens_update_own
  on public.push_tokens
  for update
  to authenticated
  using (profile_id = app.current_profile_id())
  with check (profile_id = app.current_profile_id());

create policy push_tokens_delete_own
  on public.push_tokens
  for delete
  to authenticated
  using (profile_id = app.current_profile_id());

-- ==== invitations ===========================================================
-- Org-Admins sehen Einladungen ihrer Organisation. Erstellen/Annehmen/
-- Widerrufen laeuft ueber Edge Functions (Service Role; Token-Pruefung
-- serverseitig gegen token_hash).
create policy invitations_select_org_admin
  on public.invitations
  for select
  to authenticated
  using (
    app.is_org_admin(organization_id)
    or app.is_super_admin()
  );

-- ==== learning_assets =======================================================
-- Metadaten: globale Assets (organization_id null) fuer alle angemeldeten
-- Nutzer, Org-Assets nur fuer Mitglieder der Organisation. Upload/Registry-
-- Pflege via Service Role.
create policy learning_assets_select
  on public.learning_assets
  for select
  to authenticated
  using (
    app.is_super_admin()
    or organization_id is null
    or app.is_org_member(organization_id)
  );

-- ==== audit_logs ============================================================
-- KEINE Policies: RLS enabled+forced ohne Policy = kein SELECT/INSERT/UPDATE/
-- DELETE fuer anon/authenticated. Nur die Service Role (BYPASSRLS) schreibt
-- (INSERT-only per Konvention). Zusaetzlich Grants entziehen (Defense in Depth).
revoke all on public.audit_logs from anon, authenticated;

-- ==== user_consents =========================================================
-- Strikt nur eigene; UPDATE gedacht fuer revoked_at (Widerruf). Kein DELETE:
-- Einwilligungshistorie muss erhalten bleiben (DSGVO-Nachweis).
create policy user_consents_select_own
  on public.user_consents
  for select
  to authenticated
  using (profile_id = app.current_profile_id());

create policy user_consents_insert_own
  on public.user_consents
  for insert
  to authenticated
  with check (profile_id = app.current_profile_id());

create policy user_consents_update_own
  on public.user_consents
  for update
  to authenticated
  using (profile_id = app.current_profile_id())
  with check (profile_id = app.current_profile_id());

-- ==== account_deletion_requests =============================================
-- Eigenes Loeschbegehren stellen und einsehen; Bearbeitung (Statuswechsel)
-- ausschliesslich via Service Role.
create policy account_deletion_requests_select_own
  on public.account_deletion_requests
  for select
  to authenticated
  using (profile_id = app.current_profile_id());

create policy account_deletion_requests_insert_own
  on public.account_deletion_requests
  for insert
  to authenticated
  with check (
    profile_id = app.current_profile_id()
    and status = 'requested'
  );

-- ----------------------------------------------------------------------------
-- 5. Storage: Buckets + Policies
-- ----------------------------------------------------------------------------

-- Private Buckets (Zugriff ausschliesslich ueber signierte URLs bzw. RLS)
insert into storage.buckets (id, name, public)
values
  ('learning-assets', 'learning-assets', false),
  ('avatars',         'avatars',         false)
on conflict (id) do nothing;

-- learning-assets: Lesen nur, wenn der Pfad zur eigenen Organisation gehoert
-- (organizations/{orgId}/...) und eine aktive Mitgliedschaft besteht.
-- Uploads/Loeschungen via Service Role (Admin-Backend).
create policy storage_learning_assets_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'learning-assets'
    and (
      app.is_super_admin()
      or (
        (storage.foldername(name))[1] = 'organizations'
        and app.is_org_member_by_text((storage.foldername(name))[2])
      )
    )
  );

-- avatars: ausschliesslich der eigene Pfad avatars/{profileId}/...
-- (erste Pfadebene im Bucket = eigene Profil-ID)
create policy storage_avatars_select_own
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = app.current_profile_id()::text
  );

create policy storage_avatars_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = app.current_profile_id()::text
  );

create policy storage_avatars_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = app.current_profile_id()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = app.current_profile_id()::text
  );

create policy storage_avatars_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = app.current_profile_id()::text
  );

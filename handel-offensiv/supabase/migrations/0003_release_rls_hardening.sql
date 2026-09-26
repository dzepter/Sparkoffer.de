-- ============================================================================
-- 0003_release_rls_hardening.sql – Sicherheitshaertung (Phase 1, Befunde
-- S-1, S-5, S-8, S-9 aus docs/SECURITY.md; verbindliche Vorgaben 7 + 8 der
-- Freigabe vom 26.09.2026)
--
-- Kernpunkte
--   1. Freischaltung wird in der DATENBANK bei JEDEM Zugriff ausgewertet
--      (app.lesson_is_released): release_at <= now(), Session-Offsets,
--      Voraussetzungen, manuelle Freigabe, Ablauf – KEINE Abhaengigkeit von
--      Cronjobs. Cronjobs duerfen nur Folgeaktionen ausloesen (E-Mail/Push).
--   2. Zugriff setzt immer voraus: aktives Profil, aktive Organisations-
--      mitgliedschaft, aktive Gruppe (nicht archiviert), aktive Organisation,
--      aktive Gruppenzuordnung UND Einschreibung, Lektion/Modul/Programm
--      veroeffentlicht.
--   3. Deaktivierungskaskade: app.current_profile_id() liefert NULL fuer
--      inaktive Profile -> saemtliche Policies (auch "eigene Zeilen") greifen
--      nicht mehr. Inaktive Mitgliedschaft -> kein Gruppenzugriff.
--   4. Schreibzugriffe (Fortschritt, Abgaben, Reflexionen, Quizversuche) nur
--      auf SICHTBARE Lektionen/Bloecke (verhindert Umgehung von Voraussetzungen
--      ueber die API).
--   5. Eindeutigkeit je Gruppe: Fortschritt/Abgaben/Reflexionen/Quizversuche
--      sind je (…, cohort_id) eindeutig, damit Wiederholer sauber getrennt sind.
--   6. audit_logs.organization_id fuer mandantenbezogene Auswertung.
--
-- Semantik von app.lesson_is_released ist der Spiegel von
-- packages/domain/src/release-engine.ts (halboffenes Fenster: frei ab
-- Freischaltzeitpunkt EINSCHLIESSLICH, gesperrt ab expires_at EINSCHLIESSLICH;
-- Tages-Offsets = 24-Stunden-Schritte wie im TypeScript-Modul).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Aktives Profil als Basis aller Helfer
-- ----------------------------------------------------------------------------

-- Profil-ID des angemeldeten Users – NUR wenn das Profil aktiv ist.
-- Inaktive/deaktivierte Konten verlieren damit sofort jeden Zeilenzugriff.
create or replace function app.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id
  from public.profiles p
  where p.id = auth.uid()
    and p.status = 'active'
$$;

create or replace function app.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select p.is_super_admin
       from public.profiles p
      where p.id = auth.uid()
        and p.status = 'active'),
    false
  )
$$;

create or replace function app.org_role(org uuid)
returns public.member_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.role
  from public.organization_memberships m
  join public.organizations o on o.id = m.organization_id
  where m.organization_id = org
    and m.profile_id = app.current_profile_id()
    and m.status = 'active'
    and o.status = 'active'
  limit 1
$$;

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
    join public.organizations o on o.id = m.organization_id
    where m.organization_id = org
      and m.profile_id = app.current_profile_id()
      and m.role = 'org_admin'
      and m.status = 'active'
      and o.status = 'active'
  )
$$;

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
    join public.organizations o on o.id = m.organization_id
    where m.organization_id = org
      and m.profile_id = app.current_profile_id()
      and m.status = 'active'
      and o.status = 'active'
  )
$$;

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
    join public.organizations o on o.id = m.organization_id
    where m.organization_id::text = org_text
      and m.profile_id = app.current_profile_id()
      and m.status = 'active'
      and o.status = 'active'
  )
$$;

-- Trainer der Gruppe: Zuordnung UND aktive Mitgliedschaft in der
-- Organisation der Gruppe (Super Admins ohne Mitgliedschaft ausgenommen).
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
    join public.cohorts co on co.id = ct.cohort_id
    join public.organizations o on o.id = co.organization_id
    where ct.cohort_id = c
      and ct.profile_id = app.current_profile_id()
      and o.status = 'active'
      and (
        app.is_super_admin()
        or exists (
          select 1
          from public.organization_memberships m
          where m.organization_id = co.organization_id
            and m.profile_id = ct.profile_id
            and m.status = 'active'
        )
      )
  )
$$;

-- Aktives Gruppenmitglied: Zuordnung aktiv, Mitgliedschaft in der
-- Organisation aktiv, Gruppe aktiv (nicht archiviert), Organisation aktiv.
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
    join public.cohorts co on co.id = cm.cohort_id
    join public.organizations o on o.id = co.organization_id
    join public.organization_memberships m
      on m.organization_id = co.organization_id
     and m.profile_id = cm.profile_id
     and m.status = 'active'
    where cm.cohort_id = c
      and cm.profile_id = app.current_profile_id()
      and cm.status = 'active'
      and co.status = 'active'
      and o.status = 'active'
  )
$$;

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
    join public.organizations o on o.id = co.organization_id
    join public.organization_memberships m on m.organization_id = co.organization_id
    where co.id = c
      and m.profile_id = app.current_profile_id()
      and m.role = 'org_admin'
      and m.status = 'active'
      and o.status = 'active'
  )
$$;

-- Trainer sieht Zielprofil, wenn es aktives Mitglied einer seiner Gruppen ist.
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
    where ct.profile_id = app.current_profile_id()
      and cm.profile_id = target
      and cm.status = 'active'
      and app.is_cohort_trainer(ct.cohort_id)
  )
$$;

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
        app.is_cohort_member(c.id)
        or app.is_cohort_trainer(c.id)
        or app.is_org_admin(c.organization_id)
      )
  )
$$;

-- ----------------------------------------------------------------------------
-- 2. Freischaltlogik in der Datenbank (Spiegel von release-engine.ts)
-- ----------------------------------------------------------------------------

-- Modul abgeschlossen: mindestens eine veroeffentlichte Lektion und ALLE
-- veroeffentlichten Lektionen des Moduls vom Profil in dieser Gruppe abgeschlossen.
create or replace function app.module_completed(mod uuid, p uuid, c uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select count(l.id) > 0
     and count(l.id) = count(lp.id) filter (where lp.status = 'completed')
  from public.learning_phases ph
  join public.lessons l
    on l.learning_phase_id = ph.id
   and l.status = 'published'
  left join public.lesson_progress lp
    on lp.lesson_id = l.id
   and lp.profile_id = p
   and lp.cohort_id = c
  where ph.module_id = mod
$$;

-- Wertet die fuer (Lektion, Profil, Gruppe) massgebliche Regel aus.
-- Individuelle Regel (profile_id = Profil) schlaegt die Gruppenregel.
create or replace function app.release_rule_satisfied(
  r  public.lesson_releases,
  p  uuid,
  at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    -- Ablauf dominiert alles: ab expires_at (einschliesslich) gesperrt
    (r.expires_at is null or at < r.expires_at)
    and case r.release_mode
      when 'immediate' then true
      when 'at_datetime' then r.release_at is not null and at >= r.release_at
      when 'manual' then r.released_at is not null and at >= r.released_at
      when 'days_after_session' then exists (
        select 1
        from public.cohort_sessions s
        where s.id = r.session_id
          and s.cohort_id = r.cohort_id
          and at >= s.starts_at + (coalesce(r.offset_days, 0) * interval '24 hours')
      )
      when 'days_before_session' then exists (
        select 1
        from public.cohort_sessions s
        where s.id = r.session_id
          and s.cohort_id = r.cohort_id
          and at >= s.starts_at - (coalesce(r.offset_days, 0) * interval '24 hours')
      )
      when 'after_lesson' then r.prerequisite_lesson_id is not null and exists (
        select 1
        from public.lesson_progress lp
        where lp.lesson_id = r.prerequisite_lesson_id
          and lp.profile_id = p
          and lp.cohort_id = r.cohort_id
          and lp.status = 'completed'
      )
      when 'after_module' then r.prerequisite_module_id is not null
        and app.module_completed(r.prerequisite_module_id, p, r.cohort_id)
      else false
    end
$$;

-- Ist die Lektion fuer das Profil zum Zeitpunkt "at" freigeschaltet?
-- Prueft ZUSAETZLICH die vollstaendige Zugangskette:
--   Profil aktiv, Organisation aktiv, Mitgliedschaft aktiv, Gruppe aktiv,
--   Gruppenzuordnung aktiv, Einschreibung vorhanden, Programm/Modul/Lektion
--   veroeffentlicht. Fuer jede Gruppe des Profils gilt die massgebliche Regel
--   (individuell vor gruppenweit).
create or replace function app.lesson_is_released(
  l  uuid,
  p  uuid,
  at timestamptz default now()
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.lessons le
    join public.learning_phases ph on ph.id = le.learning_phase_id
    join public.modules mo         on mo.id = ph.module_id
    join public.programs pr        on pr.id = mo.program_id
    join public.cohorts co         on co.program_id = pr.id
    join public.organizations o    on o.id = co.organization_id
    join public.profiles pf        on pf.id = p
    join public.organization_memberships m
      on m.organization_id = co.organization_id
     and m.profile_id = p
     and m.status = 'active'
    join public.cohort_members cm
      on cm.cohort_id = co.id
     and cm.profile_id = p
     and cm.status = 'active'
    join public.course_enrollments ce
      on ce.cohort_id = co.id
     and ce.profile_id = p
    join lateral (
      select r.*
      from public.lesson_releases r
      where r.lesson_id = le.id
        and r.cohort_id = co.id
        and (r.profile_id = p or r.profile_id is null)
      order by (r.profile_id is not null) desc, r.created_at desc
      limit 1
    ) rule on true
    where le.id = l
      and le.status = 'published'
      and mo.status = 'published'
      and pr.status = 'published'
      and co.status = 'active'
      and o.status  = 'active'
      and pf.status = 'active'
      and app.release_rule_satisfied(rule, p, at)
  )
$$;

comment on function app.lesson_is_released(uuid, uuid, timestamptz) is
  'Freischaltpruefung in der DB (Spiegel von release-engine.ts). Keine Cron-Abhaengigkeit: wird bei jedem Zugriff ausgewertet.';

-- Lesezugang Lektion: Teilnehmer NUR bei tatsaechlicher Freischaltung;
-- Trainer/Org-Admin ueber ihre (aktiven) Gruppen/Organisationen.
create or replace function app.can_read_lesson(l uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    app.lesson_is_released(l, app.current_profile_id(), now())
    or exists (
      select 1
      from public.lessons le
      join public.learning_phases ph on ph.id = le.learning_phase_id
      join public.modules mo on mo.id = ph.module_id
      join public.cohorts c on c.program_id = mo.program_id
      where le.id = l
        and (
          app.is_cohort_trainer(c.id)
          or app.is_org_admin(c.organization_id)
        )
    )
$$;

grant execute on all functions in schema app to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 3. Schreibzugriffe nur auf sichtbare Lektionen/Bloecke
--    (die Subqueries unterliegen der RLS des Aufrufers -> gesperrte Inhalte
--     sind auch fuer Schreibzugriffe unsichtbar)
-- ----------------------------------------------------------------------------

drop policy if exists lesson_progress_insert_own on public.lesson_progress;
create policy lesson_progress_insert_own
  on public.lesson_progress
  for insert
  to authenticated
  with check (
    profile_id = app.current_profile_id()
    and app.is_cohort_member(cohort_id)
    and exists (select 1 from public.lessons le where le.id = lesson_progress.lesson_id)
  );

drop policy if exists lesson_progress_update_own on public.lesson_progress;
create policy lesson_progress_update_own
  on public.lesson_progress
  for update
  to authenticated
  using (profile_id = app.current_profile_id())
  with check (
    profile_id = app.current_profile_id()
    and app.is_cohort_member(cohort_id)
    and exists (select 1 from public.lessons le where le.id = lesson_progress.lesson_id)
  );

drop policy if exists assignment_submissions_insert_own on public.assignment_submissions;
create policy assignment_submissions_insert_own
  on public.assignment_submissions
  for insert
  to authenticated
  with check (
    profile_id = app.current_profile_id()
    and app.is_cohort_member(cohort_id)
    and exists (select 1 from public.content_blocks cb where cb.id = assignment_submissions.content_block_id)
  );

drop policy if exists assignment_submissions_update_own on public.assignment_submissions;
create policy assignment_submissions_update_own
  on public.assignment_submissions
  for update
  to authenticated
  using (profile_id = app.current_profile_id())
  with check (
    profile_id = app.current_profile_id()
    and app.is_cohort_member(cohort_id)
    and exists (select 1 from public.content_blocks cb where cb.id = assignment_submissions.content_block_id)
  );

drop policy if exists reflection_entries_insert_own on public.reflection_entries;
create policy reflection_entries_insert_own
  on public.reflection_entries
  for insert
  to authenticated
  with check (
    profile_id = app.current_profile_id()
    and app.is_cohort_member(cohort_id)
    and exists (select 1 from public.content_blocks cb where cb.id = reflection_entries.content_block_id)
  );

drop policy if exists reflection_entries_update_own on public.reflection_entries;
create policy reflection_entries_update_own
  on public.reflection_entries
  for update
  to authenticated
  using (profile_id = app.current_profile_id())
  with check (
    profile_id = app.current_profile_id()
    and app.is_cohort_member(cohort_id)
    and exists (select 1 from public.content_blocks cb where cb.id = reflection_entries.content_block_id)
  );

drop policy if exists quiz_attempts_insert_own on public.quiz_attempts;
create policy quiz_attempts_insert_own
  on public.quiz_attempts
  for insert
  to authenticated
  with check (
    profile_id = app.current_profile_id()
    and app.is_cohort_member(cohort_id)
    and exists (select 1 from public.quizzes q where q.id = quiz_attempts.quiz_id)
  );

drop policy if exists quiz_attempts_update_own on public.quiz_attempts;
create policy quiz_attempts_update_own
  on public.quiz_attempts
  for update
  to authenticated
  using (profile_id = app.current_profile_id())
  with check (
    profile_id = app.current_profile_id()
    and app.is_cohort_member(cohort_id)
    and exists (select 1 from public.quizzes q where q.id = quiz_attempts.quiz_id)
  );

-- ----------------------------------------------------------------------------
-- 4. Eindeutigkeit je Gruppe (Wiederholer in einer zweiten Gruppe)
-- ----------------------------------------------------------------------------
alter table public.assignment_submissions
  drop constraint if exists assignment_submissions_content_block_id_profile_id_key,
  add constraint assignment_submissions_block_profile_cohort_key
    unique (content_block_id, profile_id, cohort_id);

alter table public.reflection_entries
  drop constraint if exists reflection_entries_content_block_id_profile_id_key,
  add constraint reflection_entries_block_profile_cohort_key
    unique (content_block_id, profile_id, cohort_id);

alter table public.lesson_progress
  drop constraint if exists lesson_progress_lesson_id_profile_id_key,
  add constraint lesson_progress_lesson_profile_cohort_key
    unique (lesson_id, profile_id, cohort_id);

alter table public.quiz_attempts
  drop constraint if exists quiz_attempts_quiz_id_profile_id_attempt_no_key,
  add constraint quiz_attempts_quiz_profile_cohort_attempt_key
    unique (quiz_id, profile_id, cohort_id, attempt_no);

-- Gruppenregel je Lektion hoechstens einmal, individuelle Regel je Profil
-- hoechstens einmal (Admin-Editor sucht bisher per Hand – jetzt erzwungen).
create unique index if not exists lesson_releases_cohort_rule_unique
  on public.lesson_releases (lesson_id, cohort_id)
  where profile_id is null;

create unique index if not exists lesson_releases_profile_rule_unique
  on public.lesson_releases (lesson_id, cohort_id, profile_id)
  where profile_id is not null;

-- ----------------------------------------------------------------------------
-- 5. audit_logs: Mandantenbezug
-- ----------------------------------------------------------------------------
alter table public.audit_logs
  add column if not exists organization_id uuid references public.organizations (id) on delete set null;

create index if not exists idx_audit_logs_organization_id on public.audit_logs (organization_id);

-- ----------------------------------------------------------------------------
-- 6. Schutz-Trigger: Teilnehmer duerfen ueber UPDATE keine Gruppen-/Profil-
--    Zuordnung eigener Lern-Zeilen verschieben (Kopplung an sichtbare Ziele
--    ist per Policy gegeben; hier zusaetzlich Defense in Depth).
-- ----------------------------------------------------------------------------
create or replace function app.protect_learning_row_keys()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;
  new.profile_id := old.profile_id;
  new.cohort_id  := old.cohort_id;
  return new;
end;
$$;

drop trigger if exists lesson_progress_protect_keys on public.lesson_progress;
create trigger lesson_progress_protect_keys
  before update on public.lesson_progress
  for each row execute function app.protect_learning_row_keys();

drop trigger if exists assignment_submissions_protect_keys on public.assignment_submissions;
create trigger assignment_submissions_protect_keys
  before update on public.assignment_submissions
  for each row execute function app.protect_learning_row_keys();

drop trigger if exists reflection_entries_protect_keys on public.reflection_entries;
create trigger reflection_entries_protect_keys
  before update on public.reflection_entries
  for each row execute function app.protect_learning_row_keys();

drop trigger if exists quiz_attempts_protect_keys on public.quiz_attempts;
create trigger quiz_attempts_protect_keys
  before update on public.quiz_attempts
  for each row execute function app.protect_learning_row_keys();

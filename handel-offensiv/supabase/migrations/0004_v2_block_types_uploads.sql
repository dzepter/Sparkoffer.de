-- ============================================================================
-- 0004_v2_block_types_uploads.sql – Blocktypen §12, Datei-Nachweise,
-- Bucket participant-uploads, Transfer-Nachfragen (DATA_MODEL.md 0.2/0.3/0.4)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Blocktypen erweitern (18 Typen)
-- ----------------------------------------------------------------------------
alter type public.block_type add value if not exists 'practice_task';
alter type public.block_type add value if not exists 'file_upload';
alter type public.block_type add value if not exists 'photo_upload';
alter type public.block_type add value if not exists 'announcement';

-- ----------------------------------------------------------------------------
-- 2. Transfer-Nachfragen (§11): strukturierte Antworten zur Abgabe
-- ----------------------------------------------------------------------------
alter table public.assignment_submissions
  add column if not exists answers jsonb not null default '{}';

comment on column public.assignment_submissions.answers is
  'Strukturierte Antworten auf followUpQuestions des Blocks, z. B. {"happened": "...", "worked": "...", "change": "..."}.';

-- ----------------------------------------------------------------------------
-- 3. submission_files: Datei-/Foto-Nachweise zu Abgaben
-- ----------------------------------------------------------------------------
create table if not exists public.submission_files (
  id             uuid primary key default gen_random_uuid(),
  submission_id  uuid   not null references public.assignment_submissions (id) on delete cascade,
  storage_path   text   not null unique,
  mime_type      text   not null,
  size_bytes     bigint not null check (size_bytes > 0),
  original_name  text,
  created_at     timestamptz not null default now()
);

create index if not exists idx_submission_files_submission_id on public.submission_files (submission_id);

alter table public.submission_files enable row level security;
alter table public.submission_files force  row level security;

-- Sichtbar, wenn die Abgabe sichtbar ist (RLS von assignment_submissions kaskadiert:
-- Eigentuemer immer, Trainer nur bei visibility='trainer', Org-Admin nie).
create policy submission_files_select
  on public.submission_files
  for select
  to authenticated
  using (
    exists (select 1 from public.assignment_submissions s where s.id = submission_files.submission_id)
  );

-- Anlegen/Loeschen nur fuer die eigene Abgabe
create policy submission_files_insert_own
  on public.submission_files
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.assignment_submissions s
      where s.id = submission_files.submission_id
        and s.profile_id = app.current_profile_id()
    )
  );

create policy submission_files_delete_own
  on public.submission_files
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.assignment_submissions s
      where s.id = submission_files.submission_id
        and s.profile_id = app.current_profile_id()
    )
  );

-- ----------------------------------------------------------------------------
-- 4. Bucket participant-uploads
--    Pfad: organizations/{orgId}/cohorts/{cohortId}/profiles/{profileId}/{datei}
--    Eigentuemer: lesen/schreiben/loeschen im eigenen Pfad;
--    Trainer der Gruppe: lesen (Nachweise sind ohnehin nur bei visibility=trainer
--    ueber submission_files auffindbar; der Pfad allein verraet keinen Inhalt).
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('participant-uploads', 'participant-uploads', false)
on conflict (id) do nothing;

create or replace function app.upload_path_is_own(name text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select (storage.foldername(name))[1] = 'organizations'
     and (storage.foldername(name))[3] = 'cohorts'
     and (storage.foldername(name))[5] = 'profiles'
     and (storage.foldername(name))[6] = app.current_profile_id()::text
     and exists (
       select 1 from public.cohort_members cm
       join public.cohorts co on co.id = cm.cohort_id
       where cm.profile_id = app.current_profile_id()
         and cm.status = 'active'
         and co.id::text = (storage.foldername(name))[4]
         and co.organization_id::text = (storage.foldername(name))[2]
     )
$$;

create or replace function app.upload_path_is_trainer_cohort(name text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select (storage.foldername(name))[1] = 'organizations'
     and (storage.foldername(name))[3] = 'cohorts'
     and exists (
       select 1 from public.cohorts co
       where co.id::text = (storage.foldername(name))[4]
         and app.is_cohort_trainer(co.id)
     )
$$;

grant execute on all functions in schema app to authenticated, service_role;

create policy storage_participant_uploads_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'participant-uploads'
    and (
      app.is_super_admin()
      or app.upload_path_is_own(name)
      or app.upload_path_is_trainer_cohort(name)
    )
  );

create policy storage_participant_uploads_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'participant-uploads' and app.upload_path_is_own(name));

create policy storage_participant_uploads_update_own
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'participant-uploads' and app.upload_path_is_own(name))
  with check (bucket_id = 'participant-uploads' and app.upload_path_is_own(name));

create policy storage_participant_uploads_delete_own
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'participant-uploads' and app.upload_path_is_own(name));

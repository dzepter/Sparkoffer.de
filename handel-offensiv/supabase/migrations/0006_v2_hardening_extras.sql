-- ============================================================================
-- 0006_v2_hardening_extras.sql – weitere Haertungen und Zustandstabellen
-- (DATA_MODEL.md 0.3/0.4: block_responses, session_notes,
--  notification_preferences, program_progress, rate_limits, Storage-Limits,
--  Konsistenz Gruppe <-> Organisation, Web-Push)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Konsistenz: Gruppenzuordnung setzt aktive Organisationsmitgliedschaft voraus
-- ----------------------------------------------------------------------------
-- SECURITY DEFINER: die Pruefung liest cohorts/memberships unabhaengig von der
-- RLS des Aufrufers; die Fehlermeldung ist bewusst in beiden Faellen gleich
-- (kein Orakel, ob eine fremde Gruppe existiert).
create or replace function app.enforce_cohort_membership_consistency()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_org uuid;
begin
  select organization_id into v_org from public.cohorts where id = new.cohort_id;
  if v_org is not null
     and exists (select 1 from public.profiles p where p.id = new.profile_id and p.is_super_admin) then
    return new;
  end if;
  if v_org is null or not exists (
    select 1 from public.organization_memberships m
    where m.organization_id = v_org and m.profile_id = new.profile_id and m.status = 'active'
  ) then
    raise exception 'Zuordnung nicht zulässig: Die Person ist kein aktives Mitglied der Organisation dieser Gruppe.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists cohort_members_membership_consistency on public.cohort_members;
create trigger cohort_members_membership_consistency
  before insert or update of cohort_id, profile_id on public.cohort_members
  for each row execute function app.enforce_cohort_membership_consistency();

drop trigger if exists cohort_trainers_membership_consistency on public.cohort_trainers;
create trigger cohort_trainers_membership_consistency
  before insert or update of cohort_id, profile_id on public.cohort_trainers
  for each row execute function app.enforce_cohort_membership_consistency();

-- ----------------------------------------------------------------------------
-- 2. block_responses: Zustand interaktiver Bloecke (Checkliste, Skala, Choice)
-- ----------------------------------------------------------------------------
create table if not exists public.block_responses (
  profile_id        uuid not null references public.profiles (id) on delete cascade,
  cohort_id         uuid not null references public.cohorts (id) on delete cascade,
  content_block_id  uuid not null references public.content_blocks (id) on delete cascade,
  response          jsonb not null default '{}',
  updated_at        timestamptz not null default now(),
  primary key (profile_id, cohort_id, content_block_id)
);

create trigger block_responses_touch_updated_at
  before update on public.block_responses
  for each row execute function app.touch_updated_at();

alter table public.block_responses enable row level security;
alter table public.block_responses force  row level security;

create policy block_responses_select
  on public.block_responses
  for select
  to authenticated
  using (
    profile_id = app.current_profile_id()
    or (
      app.is_cohort_trainer(cohort_id)
      and exists (
        select 1 from public.content_blocks cb
        where cb.id = block_responses.content_block_id
          and cb.block_type = 'scale'
          and coalesce((cb.config ->> 'shareWithTrainer')::boolean, false)
      )
    )
  );

create policy block_responses_write_own
  on public.block_responses
  for all
  to authenticated
  using (profile_id = app.current_profile_id())
  with check (
    profile_id = app.current_profile_id()
    and app.is_cohort_member(cohort_id)
    and exists (select 1 from public.content_blocks cb where cb.id = block_responses.content_block_id)
  );

-- ----------------------------------------------------------------------------
-- 3. session_notes: persoenliche Notizen zum Praesenztag (nur Eigentuemer)
-- ----------------------------------------------------------------------------
create table if not exists public.session_notes (
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  session_id  uuid not null references public.cohort_sessions (id) on delete cascade,
  note_md     text not null default '',
  updated_at  timestamptz not null default now(),
  primary key (profile_id, session_id)
);

create trigger session_notes_touch_updated_at
  before update on public.session_notes
  for each row execute function app.touch_updated_at();

alter table public.session_notes enable row level security;
alter table public.session_notes force  row level security;

create policy session_notes_own
  on public.session_notes
  for all
  to authenticated
  using (profile_id = app.current_profile_id())
  with check (
    profile_id = app.current_profile_id()
    and exists (select 1 from public.cohort_sessions s where s.id = session_notes.session_id)
  );

-- ----------------------------------------------------------------------------
-- 4. notification_preferences (nur Eigentuemer)
-- ----------------------------------------------------------------------------
create table if not exists public.notification_preferences (
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  kind        public.notification_kind not null,
  channel     text not null check (channel in ('in_app', 'email', 'push', 'web_push')),
  enabled     boolean not null default true,
  updated_at  timestamptz not null default now(),
  primary key (profile_id, kind, channel)
);

create trigger notification_preferences_touch_updated_at
  before update on public.notification_preferences
  for each row execute function app.touch_updated_at();

alter table public.notification_preferences enable row level security;
alter table public.notification_preferences force  row level security;

create policy notification_preferences_own
  on public.notification_preferences
  for all
  to authenticated
  using (profile_id = app.current_profile_id())
  with check (profile_id = app.current_profile_id());

-- Web-Push (§18): Plattform 'web' zulassen
alter table public.push_tokens drop constraint if exists push_tokens_platform_check;
alter table public.push_tokens add constraint push_tokens_platform_check
  check (platform in ('ios', 'android', 'web'));

-- ----------------------------------------------------------------------------
-- 5. program_progress: Gesamtfortschritt je Teilnehmer und Gruppe
-- ----------------------------------------------------------------------------
create or replace view public.program_progress
with (security_invoker = true) as
select
  mp.profile_id,
  mp.cohort_id,
  c.program_id,
  sum(mp.total_lessons)::int     as total_lessons,
  sum(mp.completed_lessons)::int as completed_lessons,
  case
    when sum(mp.total_lessons) = 0 then 0
    else round(100.0 * sum(mp.completed_lessons) / sum(mp.total_lessons))::int
  end as percent
from public.module_progress mp
join public.cohorts c on c.id = mp.cohort_id
group by mp.profile_id, mp.cohort_id, c.program_id;

-- ----------------------------------------------------------------------------
-- 6. rate_limits: persistentes Token-Bucket fuer Edge Functions / Server Actions
--    (nur Service Role – keine Client-Policies)
-- ----------------------------------------------------------------------------
create table if not exists public.rate_limits (
  key          text primary key,
  tokens       numeric not null,
  refilled_at  timestamptz not null default now()
);

alter table public.rate_limits enable row level security;
alter table public.rate_limits force  row level security;
revoke all on public.rate_limits from anon, authenticated;

-- Atomarer Verbrauch: liefert true, wenn ein Token entnommen werden konnte.
create or replace function app.rate_limit_take(
  p_key text,
  p_capacity numeric,
  p_refill_per_minute numeric
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tokens numeric;
  v_refilled timestamptz;
  v_now timestamptz := now();
begin
  insert into public.rate_limits (key, tokens, refilled_at)
  values (p_key, p_capacity, v_now)
  on conflict (key) do nothing;

  select tokens, refilled_at into v_tokens, v_refilled
  from public.rate_limits where key = p_key for update;

  v_tokens := least(p_capacity, v_tokens + extract(epoch from (v_now - v_refilled)) / 60.0 * p_refill_per_minute);
  if v_tokens < 1 then
    update public.rate_limits set tokens = v_tokens, refilled_at = v_now where key = p_key;
    return false;
  end if;
  update public.rate_limits set tokens = v_tokens - 1, refilled_at = v_now where key = p_key;
  return true;
end;
$$;

revoke all on function app.rate_limit_take(text, numeric, numeric) from public;
grant execute on function app.rate_limit_take(text, numeric, numeric) to service_role;

-- ----------------------------------------------------------------------------
-- 7. Storage-Limits je Bucket (MIME-Typen, Groessen); keine ausfuehrbaren Typen
-- ----------------------------------------------------------------------------
update storage.buckets
   set file_size_limit = 5 * 1024 * 1024,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
 where id = 'avatars';

update storage.buckets
   set file_size_limit = 500 * 1024 * 1024,
       allowed_mime_types = array[
         'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
         'audio/mpeg', 'audio/mp4', 'video/mp4', 'video/webm',
         'application/vnd.apple.mpegurl', 'text/vtt'
       ]
 where id = 'learning-assets';

update storage.buckets
   set file_size_limit = 25 * 1024 * 1024,
       allowed_mime_types = array[
         'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
         'audio/mpeg', 'audio/mp4'
       ]
 where id = 'participant-uploads';

grant execute on all functions in schema app to authenticated, service_role;

-- ============================================================================
-- 0005_v2_website_cms.sql – Redaktion der oeffentlichen Website im Admin
-- (Freigabe Punkt 11: Zustaende DRAFT, PREVIEW, PUBLISHED, ARCHIVED sowie
--  created_at, updated_at, updated_by, published_at; KEINE Aenderung geht beim
--  Tippen unmittelbar live.)
--
-- Prinzip: Live-Stand und Arbeitsstand sind getrennt gespeichert.
--   site_content        = veroeffentlichter Text je Schluessel (anon lesbar)
--   site_content_drafts = Arbeitsstand (draft/preview), nur Redaktion
--   site_posts          = Impulse/Blog; veroeffentlichte Felder + draft jsonb
--   inquiries           = Anfragen aus dem Website-Formular (nur Server schreibt)
-- Veroeffentlichen erfolgt ueber app.publish_site_content / app.publish_site_post
-- (SECURITY DEFINER, nur Super Admin) – niemals durch direktes UPDATE des Clients.
-- ============================================================================

create type public.site_status as enum ('draft', 'preview', 'published', 'archived');

-- ----------------------------------------------------------------------------
-- 1. site_content: veroeffentlichte Texte (Schluessel wie im bisherigen CMS)
-- ----------------------------------------------------------------------------
create table public.site_content (
  key           text primary key,
  group_key     text not null,
  label         text not null,
  value_html    text not null default '',
  status        public.site_status not null default 'published'
                check (status in ('published', 'archived')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  updated_by    uuid references public.profiles (id) on delete set null,
  published_at  timestamptz,
  published_by  uuid references public.profiles (id) on delete set null
);

create trigger site_content_touch_updated_at
  before update on public.site_content
  for each row execute function app.touch_updated_at();

create table public.site_content_drafts (
  key         text primary key references public.site_content (key) on delete cascade,
  value_html  text not null,
  status      public.site_status not null default 'draft'
              check (status in ('draft', 'preview')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles (id) on delete set null
);

create trigger site_content_drafts_touch_updated_at
  before update on public.site_content_drafts
  for each row execute function app.touch_updated_at();

-- ----------------------------------------------------------------------------
-- 2. site_posts: Impulse (Blog) – Live-Felder + Arbeitsstand in draft
-- ----------------------------------------------------------------------------
create table public.site_posts (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title              text not null,
  excerpt            text,
  body_md            text not null default '',
  cover_path         text,
  status             public.site_status not null default 'draft',
  author_profile_id  uuid references public.profiles (id) on delete set null,
  -- Unveroeffentlichter Arbeitsstand: {"title","excerpt","body_md","cover_path"}
  draft              jsonb,
  draft_status       public.site_status check (draft_status in ('draft', 'preview')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  updated_by         uuid references public.profiles (id) on delete set null,
  published_at       timestamptz,
  published_by       uuid references public.profiles (id) on delete set null,
  archived_at        timestamptz,
  constraint site_posts_draft_consistent
    check ((draft is null) = (draft_status is null))
);

create index idx_site_posts_status_published on public.site_posts (status, published_at desc);

create trigger site_posts_touch_updated_at
  before update on public.site_posts
  for each row execute function app.touch_updated_at();

-- ----------------------------------------------------------------------------
-- 3. inquiries: Anfragen „Offensivtag anfragen" (ersetzt mailto:)
-- ----------------------------------------------------------------------------
create table public.inquiries (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null default 'offensivtag'
               check (kind in ('offensivtag', 'unternehmen', 'vortrag', 'sonstiges')),
  name         text not null,
  company      text,
  email        text not null,
  phone        text,
  message      text not null,
  consent_at   timestamptz not null,
  source_page  text,
  ip_hash      text,
  status       text not null default 'new'
               check (status in ('new', 'in_progress', 'answered', 'spam', 'archived')),
  handled_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_inquiries_status_created on public.inquiries (status, created_at desc);

create trigger inquiries_touch_updated_at
  before update on public.inquiries
  for each row execute function app.touch_updated_at();

-- ----------------------------------------------------------------------------
-- 4. RLS
-- ----------------------------------------------------------------------------
alter table public.site_content        enable row level security;
alter table public.site_content        force  row level security;
alter table public.site_content_drafts enable row level security;
alter table public.site_content_drafts force  row level security;
alter table public.site_posts          enable row level security;
alter table public.site_posts          force  row level security;
alter table public.inquiries           enable row level security;
alter table public.inquiries           force  row level security;

-- Oeffentlich: nur veroeffentlichte Texte/Beitraege; Entwuerfe nie.
create policy site_content_select_public
  on public.site_content
  for select
  to anon, authenticated
  using (status = 'published' or app.is_super_admin());

create policy site_content_drafts_select_admin
  on public.site_content_drafts
  for select
  to authenticated
  using (app.is_super_admin());

-- Redaktion schreibt NUR in Entwuerfe (Live-Tabelle ist fuer Clients read-only).
create policy site_content_drafts_write_admin
  on public.site_content_drafts
  for all
  to authenticated
  using (app.is_super_admin())
  with check (app.is_super_admin() and updated_by = app.current_profile_id());

-- Beitraege: oeffentlich nur published; Super Admin sieht alle (inkl. Entwurf).
create policy site_posts_select
  on public.site_posts
  for select
  to anon, authenticated
  using (status = 'published' or app.is_super_admin());

-- Anfragen: kein Client-Zugriff ausser Lesen/Bearbeiten durch Super Admin;
-- INSERT ausschliesslich ueber die Server Action (Service Role, Rate Limit).
create policy inquiries_select_admin
  on public.inquiries
  for select
  to authenticated
  using (app.is_super_admin());

create policy inquiries_update_admin
  on public.inquiries
  for update
  to authenticated
  using (app.is_super_admin())
  with check (app.is_super_admin());

-- Die oeffentliche Website liest als anon: Grants explizit setzen
grant select on public.site_content, public.site_posts to anon;

-- Oeffentliche Sicht auf Beitraege OHNE Arbeitsstand (draft-Spalten bleiben intern)
create view public.site_posts_public
with (security_invoker = true) as
select id, slug, title, excerpt, body_md, cover_path, published_at, updated_at
from public.site_posts
where status = 'published';

grant select on public.site_posts_public to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 5. Veroeffentlichen (nur Super Admin; setzt published_at/published_by)
-- ----------------------------------------------------------------------------
create or replace function app.publish_site_content(p_key text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_draft public.site_content_drafts%rowtype;
begin
  if not app.is_super_admin() then
    raise exception 'Für diese Aktion fehlt Ihnen die Berechtigung.' using errcode = '42501';
  end if;
  select * into v_draft from public.site_content_drafts where key = p_key;
  if not found then
    raise exception 'Für diesen Text liegt kein Entwurf vor.' using errcode = 'P0002';
  end if;
  update public.site_content
     set value_html   = v_draft.value_html,
         status       = 'published',
         updated_by   = app.current_profile_id(),
         published_at = now(),
         published_by = app.current_profile_id()
   where key = p_key;
  delete from public.site_content_drafts where key = p_key;
end;
$$;

create or replace function app.publish_site_post(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_post public.site_posts%rowtype;
begin
  if not app.is_super_admin() then
    raise exception 'Für diese Aktion fehlt Ihnen die Berechtigung.' using errcode = '42501';
  end if;
  select * into v_post from public.site_posts where id = p_id;
  if not found then
    raise exception 'Der Beitrag wurde nicht gefunden.' using errcode = 'P0002';
  end if;
  update public.site_posts
     set title        = coalesce(v_post.draft ->> 'title', title),
         excerpt      = coalesce(v_post.draft ->> 'excerpt', excerpt),
         body_md      = coalesce(v_post.draft ->> 'body_md', body_md),
         cover_path   = coalesce(v_post.draft ->> 'cover_path', cover_path),
         draft        = null,
         draft_status = null,
         status       = 'published',
         updated_by   = app.current_profile_id(),
         published_at = coalesce(published_at, now()),
         published_by = app.current_profile_id(),
         archived_at  = null
   where id = p_id;
end;
$$;

create or replace function app.archive_site_post(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not app.is_super_admin() then
    raise exception 'Für diese Aktion fehlt Ihnen die Berechtigung.' using errcode = '42501';
  end if;
  update public.site_posts
     set status = 'archived', archived_at = now(), updated_by = app.current_profile_id()
   where id = p_id;
end;
$$;

revoke all on function app.publish_site_content(text) from public;
revoke all on function app.publish_site_post(uuid) from public;
revoke all on function app.archive_site_post(uuid) from public;
grant execute on function app.publish_site_content(text) to authenticated, service_role;
grant execute on function app.publish_site_post(uuid)    to authenticated, service_role;
grant execute on function app.archive_site_post(uuid)    to authenticated, service_role;

-- ============================================================================
-- Supabase-Shim fuer lokale RLS-Tests gegen ein nacktes PostgreSQL 16.
--
-- Stellt genau die Teile der Supabase-Plattform nach, die die Migrationen
-- 0001 ff. voraussetzen: Rollen (anon/authenticated/service_role),
-- Schemata auth/storage/extensions, auth.users/auth.identities,
-- auth.uid()/auth.jwt()/auth.role(), storage.buckets/objects/foldername
-- sowie die Standard-Grants von Supabase (anon/authenticated/service_role
-- erhalten Rechte auf alle Objekte in public; RLS entscheidet den Zugriff).
--
-- NICHT fuer Staging/Produktion – dort existiert das alles bereits.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'supabase_admin') then
    create role supabase_admin nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    create role supabase_auth_admin nologin;
  end if;
end
$$;

create schema if not exists extensions;
create schema if not exists auth;
create schema if not exists storage;
create schema if not exists graphql_public;

create extension if not exists pgcrypto with schema extensions;

-- ----------------------------------------------------------------------------
-- auth: Tabellen (Spaltenauswahl wie von seed.sql / Migrationen genutzt)
-- ----------------------------------------------------------------------------
create table if not exists auth.users (
  instance_id                 uuid,
  id                          uuid primary key,
  aud                         text,
  role                        text,
  email                       text,
  encrypted_password          text,
  email_confirmed_at          timestamptz,
  raw_app_meta_data           jsonb,
  raw_user_meta_data          jsonb,
  created_at                  timestamptz,
  updated_at                  timestamptz,
  confirmation_token          text,
  recovery_token              text,
  email_change                text,
  email_change_token_new      text,
  email_change_token_current  text,
  reauthentication_token      text,
  banned_until                timestamptz,
  deleted_at                  timestamptz,
  is_sso_user                 boolean not null default false
);

create table if not exists auth.identities (
  id               uuid primary key,
  user_id          uuid not null references auth.users (id) on delete cascade,
  identity_data    jsonb,
  provider         text,
  provider_id      text,
  last_sign_in_at  timestamptz,
  created_at       timestamptz,
  updated_at       timestamptz,
  unique (provider, provider_id)
);

-- ----------------------------------------------------------------------------
-- auth: Funktionen – lesen die JWT-Claims aus request.jwt.claims (wie PostgREST)
-- ----------------------------------------------------------------------------
create or replace function auth.jwt()
returns jsonb
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')
  )::jsonb
$$;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

create or replace function auth.role()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;

-- ----------------------------------------------------------------------------
-- storage: Buckets, Objekte, foldername()
-- ----------------------------------------------------------------------------
create table if not exists storage.buckets (
  id                  text primary key,
  name                text not null unique,
  owner               uuid,
  public              boolean default false,
  file_size_limit     bigint,
  allowed_mime_types  text[],
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create table if not exists storage.objects (
  id          uuid primary key default gen_random_uuid(),
  bucket_id   text references storage.buckets (id),
  name        text,
  owner       uuid,
  metadata    jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table storage.objects enable row level security;

create or replace function storage.foldername(name text)
returns text[]
language plpgsql
immutable
as $$
declare
  _parts text[];
begin
  select string_to_array(name, '/') into _parts;
  return _parts[1 : array_length(_parts, 1) - 1];
end
$$;

-- ----------------------------------------------------------------------------
-- Grants wie in Supabase (RLS regelt den tatsaechlichen Zugriff)
-- ----------------------------------------------------------------------------
grant usage on schema public, extensions, auth, storage to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

grant all on all tables in schema storage to anon, authenticated, service_role;
grant execute on all functions in schema auth to anon, authenticated, service_role;
grant execute on all functions in schema storage to anon, authenticated, service_role;

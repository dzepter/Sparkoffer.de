-- ============================================================================
-- 0008_rate_limit_public.sql – Persistentes Rate Limit fuer Server Actions
-- und Edge Functions (Sicherheitsbefunde S-6 / S-16)
--
-- Hintergrund: app.rate_limit_take (0006) liegt im Schema app, das PostgREST
-- nicht exponiert – ein supabase-js-Client kann es nicht per .rpc() aufrufen.
-- Diese Migration stellt einen schmalen, oeffentlichen Wrapper bereit, der
-- AUSSCHLIESSLICH von der Service-Rolle ausfuehrbar ist:
--
--   public.rate_limit_take(p_key, p_capacity, p_refill_per_minute) -> boolean
--     true  = ein Token wurde entnommen (Anfrage zulaessig)
--     false = Bucket leer (Anfrage ablehnen, HTTP 429 / deutsche Meldung)
--
--   public.rate_limit_reset(p_key) -> void       (Tests/Support: Bucket loeschen)
--   app.rate_limit_cleanup()       -> integer    (Aufraeumen alter Buckets)
--
-- SICHERHEIT: Schluessel (p_key) enthalten NIE Klartext-IPs oder E-Mail-
-- Adressen, sondern nur SHA-256-Hashes mit Salt (RATE_LIMIT_SALT) – siehe
-- apps/*/src/lib/rate-limit.ts und supabase/functions/_shared/ratelimit.ts.
-- Aufrufer sind ausschliesslich Server-Prozesse (Service Role); Clients
-- (anon/authenticated) erhalten "permission denied".
--
-- Aufraeumen: app.rate_limit_cleanup() loescht Buckets, die seit > 1 Tag nicht
-- mehr angefasst wurden (ein voller Bucket ist nach dieser Zeit ohnehin
-- wieder voll). Die Funktion wird NICHT hier per Cron eingeplant – das Rate
-- Limit selbst haengt nicht davon ab (Korrektheit bleibt ohne Cleanup
-- erhalten; die Tabelle waechst nur langsam). Einplanung spaeter z. B. per
-- pg_cron: select cron.schedule('rate-limit-cleanup', '15 3 * * *',
--   $$select app.rate_limit_cleanup()$$);
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Rechte der internen Funktion nachziehen: Die Sammel-Grants
--    "grant execute on all functions in schema app to authenticated" aus
--    0002/0003/0004/0006 haben app.rate_limit_take wieder fuer authenticated
--    freigegeben. Explizit auf service_role beschraenken.
-- ----------------------------------------------------------------------------
revoke all on function app.rate_limit_take(text, numeric, numeric) from public, anon, authenticated;
grant execute on function app.rate_limit_take(text, numeric, numeric) to service_role;

-- ----------------------------------------------------------------------------
-- 2. Oeffentlicher Wrapper (fuer supabase-js .rpc()) – nur Service Role
-- ----------------------------------------------------------------------------
create or replace function public.rate_limit_take(
  p_key text,
  p_capacity numeric,
  p_refill_per_minute numeric
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_key is null or length(p_key) = 0 or length(p_key) > 200 then
    raise exception 'Ungültiger Rate-Limit-Schlüssel.' using errcode = 'P0001';
  end if;
  if p_capacity is null or p_capacity < 1 or p_refill_per_minute is null or p_refill_per_minute < 0 then
    raise exception 'Ungültige Rate-Limit-Parameter.' using errcode = 'P0001';
  end if;
  return app.rate_limit_take(p_key, p_capacity, p_refill_per_minute);
end;
$$;

comment on function public.rate_limit_take(text, numeric, numeric) is
  'Token-Bucket: entnimmt ein Token fuer p_key (true) oder meldet leeren Bucket (false). Nur Service Role; Schluessel enthalten nur Hashes.';

revoke all on function public.rate_limit_take(text, numeric, numeric) from public, anon, authenticated;
grant execute on function public.rate_limit_take(text, numeric, numeric) to service_role;

-- ----------------------------------------------------------------------------
-- 3. Reset eines Buckets (Tests, Support-Faelle) – nur Service Role
-- ----------------------------------------------------------------------------
create or replace function public.rate_limit_reset(p_key text)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  delete from public.rate_limits where key = p_key;
$$;

comment on function public.rate_limit_reset(text) is
  'Loescht den Token-Bucket zu p_key (Tests/Support). Nur Service Role.';

revoke all on function public.rate_limit_reset(text) from public, anon, authenticated;
grant execute on function public.rate_limit_reset(text) to service_role;

-- ----------------------------------------------------------------------------
-- 4. Aufraeumen alter Buckets (spaeter per pg_cron einplanen, siehe Kopf)
-- ----------------------------------------------------------------------------
create or replace function app.rate_limit_cleanup()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted integer;
begin
  delete from public.rate_limits where refilled_at < now() - interval '1 day';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

comment on function app.rate_limit_cleanup() is
  'Loescht Rate-Limit-Buckets, die seit mehr als einem Tag nicht angefasst wurden. Rueckgabe: Anzahl geloeschter Zeilen. Fuer pg_cron vorgesehen.';

revoke all on function app.rate_limit_cleanup() from public, anon, authenticated;
grant execute on function app.rate_limit_cleanup() to service_role;

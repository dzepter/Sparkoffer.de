-- ============================================================================
-- 0007_quiz_server_grading.sql – Quiz serverseitig bewerten
-- (DATA_MODEL.md 0.4 Punkt 2, Sicherheitsbefund S-3)
--
-- Befund: quiz_options.is_correct war fuer Teilnehmer lesbar (Loesung im
-- Client) und quiz_attempts.score/passed vom Client schreibbar.
--
-- Neu:
--   1. View public.quiz_options_public (id, question_id, position, body) –
--      OHNE is_correct, security_invoker: die RLS von quiz_options gilt
--      unveraendert (nur Optionen erreichbarer, freigeschalteter Quizze).
--   2. Spalte quiz_options.is_correct ist fuer authenticated nicht mehr
--      lesbar (Spaltenrechte). Die Zeilen-Policy bleibt bestehen. Trainer und
--      Admins lesen is_correct im Cockpit ueber die Service-Rolle
--      (createSupabaseAdminClient), NICHT ueber die Nutzersession.
--   3. RPC public.submit_quiz_attempt(p_quiz_id, p_cohort_id, p_answers):
--      SECURITY DEFINER, prueft Anmeldung, Gruppenmitgliedschaft und
--      Erreichbarkeit des Quiz ueber eine freigeschaltete Lektion
--      (app.lesson_is_released – keine Cron-Abhaengigkeit), erzwingt
--      max_attempts, bewertet exakt wie packages/domain/src/quiz.ts und
--      schreibt den Versuch. Ergebnis als jsonb (siehe Kommentar unten).
--   4. Clients duerfen quiz_attempts nicht mehr direkt einfuegen/aendern
--      (Policies quiz_attempts_insert_own/update_own entfallen); eigene
--      Versuche und Versuche der eigenen Gruppen (Trainer) bleiben lesbar.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. View ohne Loesung
-- ----------------------------------------------------------------------------
create or replace view public.quiz_options_public
with (security_invoker = true) as
select
  o.id,
  o.question_id,
  o.position,
  o.body
from public.quiz_options o;

comment on view public.quiz_options_public is
  'Antwortoptionen fuer Teilnehmer-Clients – ohne is_correct. security_invoker: RLS von quiz_options gilt.';

revoke all on public.quiz_options_public from public, anon;
grant select on public.quiz_options_public to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2. is_correct fuer authenticated sperren (Spaltenrechte)
--    Tabellenweites SELECT entfernen, nur die unkritischen Spalten freigeben.
--    Die Zeilen-Policy quiz_options_select bleibt unveraendert (anon liest
--    ueber die Policy "to authenticated" ohnehin keine Zeile).
-- ----------------------------------------------------------------------------
revoke select on public.quiz_options from authenticated;
grant select (id, question_id, position, body) on public.quiz_options to authenticated;

comment on column public.quiz_options.is_correct is
  'Nur ueber Service-Rolle lesbar (Cockpit). Teilnehmer-Clients nutzen quiz_options_public; Bewertung via submit_quiz_attempt.';

-- ----------------------------------------------------------------------------
-- 3. Versuche nur noch ueber die RPC
-- ----------------------------------------------------------------------------
drop policy if exists quiz_attempts_insert_own on public.quiz_attempts;
drop policy if exists quiz_attempts_update_own on public.quiz_attempts;

-- ----------------------------------------------------------------------------
-- 4. Hilfsfunktion: Antwortwert -> Menge gewaehlter Option-IDs (als Text,
--    dedupliziert). Spiegel von normalizeSelection() in quiz.ts:
--    null/fehlend -> leer, String -> {String}, Array -> Elemente.
--    Andere Typen ergeben einen nicht passenden Eintrag (= falsch).
-- ----------------------------------------------------------------------------
create or replace function app.quiz_selected_ids(p_value jsonb)
returns text[]
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when p_value is null or jsonb_typeof(p_value) = 'null' then '{}'::text[]
    when jsonb_typeof(p_value) = 'string' then array[p_value #>> '{}']
    when jsonb_typeof(p_value) = 'array' then coalesce(
      (select array_agg(distinct e.v)
         from (select case when jsonb_typeof(x) = 'string' then x #>> '{}' else x::text end as v
                 from jsonb_array_elements(p_value) as x) e),
      '{}'::text[])
    else array[p_value::text]
  end
$$;

revoke all on function app.quiz_selected_ids(jsonb) from public;

-- ----------------------------------------------------------------------------
-- 5. RPC submit_quiz_attempt
-- ----------------------------------------------------------------------------
-- p_answers: { "<question_id>": "<option_id>" | ["<option_id>", ...] | "<Freitext>" }
-- Rueckgabe:
-- {
--   attempt_id, attempt_no, score, max_score, passed (bool|null),
--   results: [{ question_id, kind, correct (bool|null), selected_option_ids,
--               correct_option_ids, explanation }]
-- }
-- Bewertung (Spiegel von gradeQuizAttempt):
--   single/truefalse/multiple: gewaehlte Menge == Menge der korrekten Optionen
--   (keine Teilpunkte), freetext: correct null, zaehlt weder zu score noch
--   max_score; passed = score >= pass_score, null ohne pass_score.
create or replace function public.submit_quiz_attempt(
  p_quiz_id   uuid,
  p_cohort_id uuid,
  p_answers   jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor        uuid := app.current_profile_id();
  v_quiz         public.quizzes%rowtype;
  v_attempt_id   uuid;
  v_attempt_no   int;
  v_used         int;
  v_score        int := 0;
  v_max_score    int := 0;
  v_passed       boolean;
  v_results      jsonb := '[]'::jsonb;
  v_question     record;
  v_selected     text[];
  v_correct      text[];
  v_correct_ids  uuid[];
  v_selected_ids uuid[];
  v_is_correct   boolean;
begin
  if v_actor is null then
    raise exception 'Bitte melden Sie sich an, um das Quiz abzugeben.'
      using errcode = '42501';
  end if;

  if p_quiz_id is null or p_cohort_id is null then
    raise exception 'Dieses Quiz ist für Sie nicht verfügbar.'
      using errcode = '42501';
  end if;

  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'Ihre Antworten konnten nicht verarbeitet werden. Bitte versuchen Sie es erneut.'
      using errcode = 'P0001';
  end if;

  -- Gruppenmitgliedschaft (aktiv, inkl. Organisation) und Erreichbarkeit des
  -- Quiz ueber eine freigeschaltete Lektion im Programm dieser Gruppe.
  -- Bewusst dieselbe Meldung fuer alle Faelle (kein Orakel ueber fremde Daten).
  if not app.is_cohort_member(p_cohort_id)
     or not exists (
       select 1
       from public.content_blocks cb
       join public.lessons le         on le.id = cb.lesson_id
       join public.learning_phases ph on ph.id = le.learning_phase_id
       join public.modules mo         on mo.id = ph.module_id
       join public.cohorts co         on co.id = p_cohort_id
                                     and co.program_id = mo.program_id
       where cb.block_type = 'quiz'
         and cb.config ->> 'quizId' = p_quiz_id::text
         and app.lesson_is_released(le.id, v_actor, now())
     )
  then
    raise exception 'Dieses Quiz ist für Sie nicht verfügbar.'
      using errcode = '42501';
  end if;

  select * into v_quiz from public.quizzes where id = p_quiz_id;
  if not found then
    raise exception 'Dieses Quiz ist für Sie nicht verfügbar.'
      using errcode = '42501';
  end if;

  -- Versuche je Quiz/Profil/Gruppe serialisieren (attempt_no ohne Rennen)
  perform pg_advisory_xact_lock(hashtext(p_quiz_id::text || ':' || v_actor::text || ':' || p_cohort_id::text));

  select count(*), coalesce(max(attempt_no), 0)
    into v_used, v_attempt_no
    from public.quiz_attempts
   where quiz_id = p_quiz_id
     and profile_id = v_actor
     and cohort_id = p_cohort_id;

  if v_quiz.max_attempts is not null and v_used >= v_quiz.max_attempts then
    raise exception 'Sie haben die maximale Anzahl an Versuchen erreicht.'
      using errcode = 'P0001';
  end if;
  v_attempt_no := v_attempt_no + 1;

  -- Bewertung
  for v_question in
    select q.id, q.kind, q.points, q.explanation
      from public.quiz_questions q
     where q.quiz_id = p_quiz_id
     order by q.position
  loop
    if v_question.kind = 'freetext' then
      v_results := v_results || jsonb_build_object(
        'question_id',         v_question.id,
        'kind',                v_question.kind,
        'correct',             null,
        'selected_option_ids', '[]'::jsonb,
        'correct_option_ids',  '[]'::jsonb,
        'explanation',         v_question.explanation
      );
      continue;
    end if;

    v_max_score := v_max_score + v_question.points;

    select coalesce(array_agg(o.id order by o.position), '{}'::uuid[]),
           coalesce(array_agg(o.id::text), '{}'::text[])
      into v_correct_ids, v_correct
      from public.quiz_options o
     where o.question_id = v_question.id
       and o.is_correct;

    v_selected := app.quiz_selected_ids(p_answers -> v_question.id::text);

    -- Mengengleichheit: gleiche Anzahl und jede gewaehlte Option ist korrekt
    v_is_correct := cardinality(v_selected) = cardinality(v_correct)
                    and v_selected <@ v_correct;
    if v_is_correct then
      v_score := v_score + v_question.points;
    end if;

    -- Rueckgabe der gewaehlten Optionen: nur tatsaechliche Optionen der Frage
    select coalesce(array_agg(o.id order by o.position), '{}'::uuid[])
      into v_selected_ids
      from public.quiz_options o
     where o.question_id = v_question.id
       and o.id::text = any (v_selected);

    v_results := v_results || jsonb_build_object(
      'question_id',         v_question.id,
      'kind',                v_question.kind,
      'correct',             v_is_correct,
      'selected_option_ids', to_jsonb(v_selected_ids),
      'correct_option_ids',  to_jsonb(v_correct_ids),
      'explanation',         v_question.explanation
    );
  end loop;

  v_passed := case
    when v_quiz.pass_score is null then null
    else v_score >= v_quiz.pass_score
  end;

  insert into public.quiz_attempts
    (quiz_id, profile_id, cohort_id, attempt_no, answers, score, passed, completed_at)
  values
    (p_quiz_id, v_actor, p_cohort_id, v_attempt_no, p_answers, v_score, v_passed, now())
  returning id into v_attempt_id;

  return jsonb_build_object(
    'attempt_id', v_attempt_id,
    'attempt_no', v_attempt_no,
    'score',      v_score,
    'max_score',  v_max_score,
    'passed',     v_passed,
    'results',    v_results
  );
end;
$$;

comment on function public.submit_quiz_attempt(uuid, uuid, jsonb) is
  'Quizversuch abgeben: prueft Freischaltung/Mitgliedschaft/max_attempts in der DB, bewertet wie packages/domain quiz.ts und speichert den Versuch. Einziger Schreibweg fuer quiz_attempts aus Clients.';

revoke all on function public.submit_quiz_attempt(uuid, uuid, jsonb) from public, anon;
grant execute on function public.submit_quiz_attempt(uuid, uuid, jsonb) to authenticated;

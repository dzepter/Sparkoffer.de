-- ============================================================================
-- Test-Fixtures fuer die RLS-Regressionstests (NUR Testdatenbank).
-- Zwei Mandanten (Organisation A und B), je Gruppe, Trainer, Org-Admin,
-- Teilnehmer; ein Programm mit Lektionen in allen Freischaltmodi.
-- Alle Personen/Firmen sind fiktiv. Zeitbezogene Regeln werden relativ zu
-- now() angelegt (Einspielzeitpunkt = Testlauf).
--
-- Feste IDs (Praefix = Bedeutung):
--   00.. Super Admin        aa.. Organisation A (Personen)   bb.. Organisation B
--   cc.. Programm/Module    dd.. Lektionen      ee.. Content-Bloecke   ff.. Quizze
--   a1/b1 Gruppen           a9/b9 Termine       a2..a8/b2..b8 Lern-/Kommunikationsdaten
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Auth-Benutzer + Profile
-- ---------------------------------------------------------------------------
insert into auth.users (instance_id, id, aud, role, email, created_at, updated_at)
select '00000000-0000-0000-0000-000000000000', v.id, 'authenticated', 'authenticated', v.email, now(), now()
from (values
  ('00000000-0000-4000-a000-000000000001'::uuid, 'sa@test.invalid'),
  ('aa000000-0000-4000-a000-000000000001'::uuid, 'a-admin@test.invalid'),
  ('aa000000-0000-4000-a000-000000000002'::uuid, 'a-trainer@test.invalid'),
  ('aa000000-0000-4000-a000-000000000003'::uuid, 'a-p1@test.invalid'),
  ('aa000000-0000-4000-a000-000000000004'::uuid, 'a-p2@test.invalid'),
  ('aa000000-0000-4000-a000-000000000005'::uuid, 'a-p3-inactive-profile@test.invalid'),
  ('aa000000-0000-4000-a000-000000000006'::uuid, 'a-p4-inactive-membership@test.invalid'),
  ('aa000000-0000-4000-a000-000000000007'::uuid, 'a-p5-no-enrollment@test.invalid'),
  ('aa000000-0000-4000-a000-000000000008'::uuid, 'a-p6-archived-cohort@test.invalid'),
  ('bb000000-0000-4000-a000-000000000001'::uuid, 'b-admin@test.invalid'),
  ('bb000000-0000-4000-a000-000000000002'::uuid, 'b-trainer@test.invalid'),
  ('bb000000-0000-4000-a000-000000000003'::uuid, 'b-p1@test.invalid'),
  ('ee000000-0000-4000-a000-000000000001'::uuid, 'x-trainer-no-membership@test.invalid')
) as v (id, email);

insert into public.profiles (id, first_name, last_name, is_super_admin, status) values
  ('00000000-0000-4000-a000-000000000001', 'Super',   'Admin',        true,  'active'),
  ('aa000000-0000-4000-a000-000000000001', 'Anna',    'Admin-A',      false, 'active'),
  ('aa000000-0000-4000-a000-000000000002', 'Tom',     'Trainer-A',    false, 'active'),
  ('aa000000-0000-4000-a000-000000000003', 'Paul',    'Eins-A',       false, 'active'),
  ('aa000000-0000-4000-a000-000000000004', 'Petra',   'Zwei-A',       false, 'active'),
  ('aa000000-0000-4000-a000-000000000005', 'Ilse',    'Inaktiv-A',    false, 'inactive'),
  ('aa000000-0000-4000-a000-000000000006', 'Mia',     'OhneMitgl-A',  false, 'active'),
  ('aa000000-0000-4000-a000-000000000007', 'Nils',    'OhneEinschr-A',false, 'active'),
  ('aa000000-0000-4000-a000-000000000008', 'Ada',     'Archiv-A',     false, 'active'),
  ('bb000000-0000-4000-a000-000000000001', 'Bernd',   'Admin-B',      false, 'active'),
  ('bb000000-0000-4000-a000-000000000002', 'Tina',    'Trainer-B',    false, 'active'),
  ('bb000000-0000-4000-a000-000000000003', 'Boris',   'Eins-B',       false, 'active'),
  ('ee000000-0000-4000-a000-000000000001', 'Xaver',   'FremdTrainer', false, 'active');

-- ---------------------------------------------------------------------------
-- Organisationen + Mitgliedschaften
-- ---------------------------------------------------------------------------
insert into public.organizations (id, name, short_name, status) values
  ('aa000000-0000-4000-a000-000000000100', 'Test Handelsgruppe A GmbH', 'A', 'active'),
  ('bb000000-0000-4000-a000-000000000100', 'Test Handelsgruppe B GmbH', 'B', 'active');

insert into public.organization_memberships (organization_id, profile_id, role, status) values
  ('aa000000-0000-4000-a000-000000000100', 'aa000000-0000-4000-a000-000000000001', 'org_admin',   'active'),
  ('aa000000-0000-4000-a000-000000000100', 'aa000000-0000-4000-a000-000000000002', 'trainer',     'active'),
  ('aa000000-0000-4000-a000-000000000100', 'aa000000-0000-4000-a000-000000000003', 'participant', 'active'),
  ('aa000000-0000-4000-a000-000000000100', 'aa000000-0000-4000-a000-000000000004', 'participant', 'active'),
  ('aa000000-0000-4000-a000-000000000100', 'aa000000-0000-4000-a000-000000000005', 'participant', 'active'),
  ('aa000000-0000-4000-a000-000000000100', 'aa000000-0000-4000-a000-000000000006', 'participant', 'active'),
  ('aa000000-0000-4000-a000-000000000100', 'aa000000-0000-4000-a000-000000000007', 'participant', 'active'),
  ('aa000000-0000-4000-a000-000000000100', 'aa000000-0000-4000-a000-000000000008', 'participant', 'active'),
  ('bb000000-0000-4000-a000-000000000100', 'bb000000-0000-4000-a000-000000000001', 'org_admin',   'active'),
  ('bb000000-0000-4000-a000-000000000100', 'bb000000-0000-4000-a000-000000000002', 'trainer',     'active'),
  ('bb000000-0000-4000-a000-000000000100', 'bb000000-0000-4000-a000-000000000003', 'participant', 'active'),
  ('aa000000-0000-4000-a000-000000000100', 'ee000000-0000-4000-a000-000000000001', 'trainer',     'active');

-- ---------------------------------------------------------------------------
-- Programm, Module, Lernphasen
-- ---------------------------------------------------------------------------
insert into public.programs (id, slug, title, status, published_at) values
  ('cc000000-0000-4000-a000-000000000001', 'test-programm', 'Testprogramm', 'published', now());

insert into public.modules (id, program_id, position, number_label, title, status) values
  ('cc000000-0000-4000-a000-000000000011', 'cc000000-0000-4000-a000-000000000001', 1, '01', 'Modul 1', 'published'),
  ('cc000000-0000-4000-a000-000000000012', 'cc000000-0000-4000-a000-000000000001', 2, '02', 'Modul 2', 'published'),
  ('cc000000-0000-4000-a000-000000000013', 'cc000000-0000-4000-a000-000000000001', 3, '03', 'Mini-Modul', 'published');

insert into public.learning_phases (id, module_id, position, phase_type, title) values
  ('cc000000-0000-4000-a000-000000000021', 'cc000000-0000-4000-a000-000000000011', 1, 'before_day', 'Vorbereitung 1'),
  ('cc000000-0000-4000-a000-000000000022', 'cc000000-0000-4000-a000-000000000012', 1, 'before_day', 'Vorbereitung 2'),
  ('cc000000-0000-4000-a000-000000000023', 'cc000000-0000-4000-a000-000000000013', 1, 'before_day', 'Mini');

-- ---------------------------------------------------------------------------
-- Lektionen (Titel beschreibt den erwarteten Zustand fuer Teilnehmer P1 in A1)
-- ---------------------------------------------------------------------------
insert into public.lessons (id, learning_phase_id, position, title, status, published_at) values
  ('dd000000-0000-4000-a000-000000000001', 'cc000000-0000-4000-a000-000000000021',  1, 'L01 immediate -> frei',                       'published', now()),
  ('dd000000-0000-4000-a000-000000000002', 'cc000000-0000-4000-a000-000000000021',  2, 'L02 at_datetime vergangen -> frei',           'published', now()),
  ('dd000000-0000-4000-a000-000000000003', 'cc000000-0000-4000-a000-000000000021',  3, 'L03 at_datetime zukuenftig -> gesperrt',      'published', now()),
  ('dd000000-0000-4000-a000-000000000004', 'cc000000-0000-4000-a000-000000000021',  4, 'L04 1 Tag vor Termin in 3 Tagen -> gesperrt', 'published', now()),
  ('dd000000-0000-4000-a000-000000000005', 'cc000000-0000-4000-a000-000000000021',  5, 'L05 1 Tag nach Termin vor 5 Tagen -> frei',   'published', now()),
  ('dd000000-0000-4000-a000-000000000006', 'cc000000-0000-4000-a000-000000000021',  6, 'L06 nach L01 (P1 fertig, P2 nicht)',          'published', now()),
  ('dd000000-0000-4000-a000-000000000009', 'cc000000-0000-4000-a000-000000000021',  7, 'L09 manual freigegeben -> frei',              'published', now()),
  ('dd000000-0000-4000-a000-000000000010', 'cc000000-0000-4000-a000-000000000021',  8, 'L10 manual nicht freigegeben -> gesperrt',    'published', now()),
  ('dd000000-0000-4000-a000-000000000011', 'cc000000-0000-4000-a000-000000000021',  9, 'L11 immediate aber abgelaufen -> gesperrt',   'published', now()),
  ('dd000000-0000-4000-a000-000000000012', 'cc000000-0000-4000-a000-000000000021', 10, 'L12 ohne Regel -> gesperrt',                  'published', now()),
  ('dd000000-0000-4000-a000-000000000013', 'cc000000-0000-4000-a000-000000000021', 11, 'L13 Entwurf mit Regel -> gesperrt',           'draft',     null),
  ('dd000000-0000-4000-a000-000000000014', 'cc000000-0000-4000-a000-000000000021', 12, 'L14 7 Tage vor Termin in 3 Tagen -> frei',    'published', now()),
  ('dd000000-0000-4000-a000-000000000015', 'cc000000-0000-4000-a000-000000000021', 13, 'L15 0 Tage nach Termin in 3 Tagen -> gesperrt','published', now()),
  ('dd000000-0000-4000-a000-000000000016', 'cc000000-0000-4000-a000-000000000021', 14, 'L16 Gruppe gesperrt, P1 individuell frei',    'published', now()),
  ('dd000000-0000-4000-a000-000000000017', 'cc000000-0000-4000-a000-000000000021', 15, 'L17 nur fuer Gruppe B frei',                  'published', now()),
  ('dd000000-0000-4000-a000-000000000018', 'cc000000-0000-4000-a000-000000000021', 16, 'L18 Fenster 12.03.2027 09:00 bis 01.04.2027',  'published', now()),
  ('dd000000-0000-4000-a000-000000000007', 'cc000000-0000-4000-a000-000000000022',  1, 'L07 nach Mini-Modul (P1 fertig, P2 nicht)',   'published', now()),
  ('dd000000-0000-4000-a000-000000000008', 'cc000000-0000-4000-a000-000000000023',  1, 'L08 Mini-Modul immediate -> frei',            'published', now());

insert into public.content_blocks (id, lesson_id, position, block_type, config, required) values
  ('ee000000-0000-4000-a000-000000000001', 'dd000000-0000-4000-a000-000000000001', 1, 'text',          '{"markdown": "Text L01"}', false),
  ('ee000000-0000-4000-a000-000000000002', 'dd000000-0000-4000-a000-000000000001', 2, 'quiz',          '{"quizId": "ff000000-0000-4000-a000-000000000001"}', false),
  ('ee000000-0000-4000-a000-000000000003', 'dd000000-0000-4000-a000-000000000001', 3, 'transfer_task', '{"task": "Transfer L01"}', true),
  ('ee000000-0000-4000-a000-000000000004', 'dd000000-0000-4000-a000-000000000001', 4, 'reflection',    '{"prompt": "Reflexion L01"}', false),
  ('ee000000-0000-4000-a000-000000000031', 'dd000000-0000-4000-a000-000000000003', 1, 'text',          '{"markdown": "Text L03 (gesperrt)"}', false),
  ('ee000000-0000-4000-a000-000000000032', 'dd000000-0000-4000-a000-000000000003', 2, 'quiz',          '{"quizId": "ff000000-0000-4000-a000-000000000002"}', false),
  ('ee000000-0000-4000-a000-000000000171', 'dd000000-0000-4000-a000-000000000017', 1, 'text',          '{"markdown": "Text L17 (nur B)"}', false);

insert into public.quizzes (id, title, pass_score, max_attempts) values
  ('ff000000-0000-4000-a000-000000000001', 'Quiz L01 (frei)',     1, 3),
  ('ff000000-0000-4000-a000-000000000002', 'Quiz L03 (gesperrt)', 1, 3);

insert into public.quiz_questions (id, quiz_id, position, kind, body) values
  ('ff000000-0000-4000-a000-000000000011', 'ff000000-0000-4000-a000-000000000001', 1, 'single', 'Frage Q1'),
  ('ff000000-0000-4000-a000-000000000021', 'ff000000-0000-4000-a000-000000000002', 1, 'single', 'Frage Q2');

insert into public.quiz_options (id, question_id, position, body, is_correct) values
  ('ff000000-0000-4000-a000-000000000111', 'ff000000-0000-4000-a000-000000000011', 1, 'Richtig', true),
  ('ff000000-0000-4000-a000-000000000112', 'ff000000-0000-4000-a000-000000000011', 2, 'Falsch',  false),
  ('ff000000-0000-4000-a000-000000000211', 'ff000000-0000-4000-a000-000000000021', 1, 'Richtig', true);

-- ---------------------------------------------------------------------------
-- Gruppen, Termine, Trainer, Mitglieder, Einschreibungen
-- ---------------------------------------------------------------------------
insert into public.cohorts (id, organization_id, program_id, name, status) values
  ('a1000000-0000-4000-a000-000000000001', 'aa000000-0000-4000-a000-000000000100', 'cc000000-0000-4000-a000-000000000001', 'Gruppe A1', 'active'),
  ('a1000000-0000-4000-a000-000000000002', 'aa000000-0000-4000-a000-000000000100', 'cc000000-0000-4000-a000-000000000001', 'Gruppe A2 (archiviert)', 'archived'),
  ('b1000000-0000-4000-a000-000000000001', 'bb000000-0000-4000-a000-000000000100', 'cc000000-0000-4000-a000-000000000001', 'Gruppe B1', 'active');

insert into public.cohort_sessions (id, cohort_id, module_id, title, starts_at) values
  ('a9000000-0000-4000-a000-000000000000', 'a1000000-0000-4000-a000-000000000001', 'cc000000-0000-4000-a000-000000000011', 'Termin A0 (vor 5 Tagen)', date_trunc('second', now()) - interval '5 days'),
  ('a9000000-0000-4000-a000-000000000001', 'a1000000-0000-4000-a000-000000000001', 'cc000000-0000-4000-a000-000000000011', 'Termin A1 (in 3 Tagen)',  date_trunc('second', now()) + interval '3 days'),
  ('b9000000-0000-4000-a000-000000000001', 'b1000000-0000-4000-a000-000000000001', 'cc000000-0000-4000-a000-000000000011', 'Termin B1 (in 10 Tagen)', date_trunc('second', now()) + interval '10 days');

insert into public.cohort_trainers (cohort_id, profile_id) values
  ('a1000000-0000-4000-a000-000000000001', 'aa000000-0000-4000-a000-000000000002'),
  ('a1000000-0000-4000-a000-000000000001', 'ee000000-0000-4000-a000-000000000001'),
  ('b1000000-0000-4000-a000-000000000001', 'bb000000-0000-4000-a000-000000000002');

insert into public.cohort_members (cohort_id, profile_id, status) values
  ('a1000000-0000-4000-a000-000000000001', 'aa000000-0000-4000-a000-000000000003', 'active'),
  ('a1000000-0000-4000-a000-000000000001', 'aa000000-0000-4000-a000-000000000004', 'active'),
  ('a1000000-0000-4000-a000-000000000001', 'aa000000-0000-4000-a000-000000000005', 'active'),
  ('a1000000-0000-4000-a000-000000000001', 'aa000000-0000-4000-a000-000000000006', 'active'),
  ('a1000000-0000-4000-a000-000000000001', 'aa000000-0000-4000-a000-000000000007', 'active'),
  ('a1000000-0000-4000-a000-000000000002', 'aa000000-0000-4000-a000-000000000008', 'active'),
  ('b1000000-0000-4000-a000-000000000001', 'bb000000-0000-4000-a000-000000000003', 'active');

insert into public.course_enrollments (profile_id, cohort_id) values
  ('aa000000-0000-4000-a000-000000000003', 'a1000000-0000-4000-a000-000000000001'),
  ('aa000000-0000-4000-a000-000000000004', 'a1000000-0000-4000-a000-000000000001'),
  ('aa000000-0000-4000-a000-000000000005', 'a1000000-0000-4000-a000-000000000001'),
  ('aa000000-0000-4000-a000-000000000006', 'a1000000-0000-4000-a000-000000000001'),
  ('aa000000-0000-4000-a000-000000000008', 'a1000000-0000-4000-a000-000000000002'),
  ('bb000000-0000-4000-a000-000000000003', 'b1000000-0000-4000-a000-000000000001');

-- ---------------------------------------------------------------------------
-- Freischaltregeln
-- ---------------------------------------------------------------------------
insert into public.lesson_releases
  (lesson_id, cohort_id, profile_id, release_mode, release_at, expires_at, offset_days, session_id, prerequisite_lesson_id, prerequisite_module_id, released_at)
values
  ('dd000000-0000-4000-a000-000000000001', 'a1000000-0000-4000-a000-000000000001', null, 'immediate',           null, null, null, null, null, null, null),
  ('dd000000-0000-4000-a000-000000000002', 'a1000000-0000-4000-a000-000000000001', null, 'at_datetime',         now() - interval '1 hour', null, null, null, null, null, null),
  ('dd000000-0000-4000-a000-000000000003', 'a1000000-0000-4000-a000-000000000001', null, 'at_datetime',         now() + interval '1 day',  null, null, null, null, null, null),
  ('dd000000-0000-4000-a000-000000000004', 'a1000000-0000-4000-a000-000000000001', null, 'days_before_session', null, null, 1, 'a9000000-0000-4000-a000-000000000001', null, null, null),
  ('dd000000-0000-4000-a000-000000000005', 'a1000000-0000-4000-a000-000000000001', null, 'days_after_session',  null, null, 1, 'a9000000-0000-4000-a000-000000000000', null, null, null),
  ('dd000000-0000-4000-a000-000000000006', 'a1000000-0000-4000-a000-000000000001', null, 'after_lesson',        null, null, null, null, 'dd000000-0000-4000-a000-000000000001', null, null),
  ('dd000000-0000-4000-a000-000000000007', 'a1000000-0000-4000-a000-000000000001', null, 'after_module',        null, null, null, null, null, 'cc000000-0000-4000-a000-000000000013', null),
  ('dd000000-0000-4000-a000-000000000008', 'a1000000-0000-4000-a000-000000000001', null, 'immediate',           null, null, null, null, null, null, null),
  ('dd000000-0000-4000-a000-000000000009', 'a1000000-0000-4000-a000-000000000001', null, 'manual',              null, null, null, null, null, null, now() - interval '1 hour'),
  ('dd000000-0000-4000-a000-000000000010', 'a1000000-0000-4000-a000-000000000001', null, 'manual',              null, null, null, null, null, null, null),
  ('dd000000-0000-4000-a000-000000000011', 'a1000000-0000-4000-a000-000000000001', null, 'immediate',           null, now() - interval '1 hour', null, null, null, null, null),
  ('dd000000-0000-4000-a000-000000000013', 'a1000000-0000-4000-a000-000000000001', null, 'immediate',           null, null, null, null, null, null, null),
  ('dd000000-0000-4000-a000-000000000014', 'a1000000-0000-4000-a000-000000000001', null, 'days_before_session', null, null, 7, 'a9000000-0000-4000-a000-000000000001', null, null, null),
  ('dd000000-0000-4000-a000-000000000015', 'a1000000-0000-4000-a000-000000000001', null, 'days_after_session',  null, null, 0, 'a9000000-0000-4000-a000-000000000001', null, null, null),
  ('dd000000-0000-4000-a000-000000000016', 'a1000000-0000-4000-a000-000000000001', null, 'at_datetime',         now() + interval '1 day',  null, null, null, null, null, null),
  ('dd000000-0000-4000-a000-000000000016', 'a1000000-0000-4000-a000-000000000001', 'aa000000-0000-4000-a000-000000000003', 'immediate', null, null, null, null, null, null, null),
  ('dd000000-0000-4000-a000-000000000018', 'a1000000-0000-4000-a000-000000000001', null, 'at_datetime',         '2027-03-12T09:00:00+01:00', '2027-04-01T00:00:00+02:00', null, null, null, null, null),
  -- Gruppe B1: L17 (nur B) und L01
  ('dd000000-0000-4000-a000-000000000017', 'b1000000-0000-4000-a000-000000000001', null, 'immediate',           null, null, null, null, null, null, null),
  ('dd000000-0000-4000-a000-000000000001', 'b1000000-0000-4000-a000-000000000001', null, 'immediate',           null, null, null, null, null, null, null),
  -- Gruppe A2 (archiviert): L01 frei – darf trotzdem nicht sichtbar sein
  ('dd000000-0000-4000-a000-000000000001', 'a1000000-0000-4000-a000-000000000002', null, 'immediate',           null, null, null, null, null, null, null);

-- ---------------------------------------------------------------------------
-- Lerndaten
-- ---------------------------------------------------------------------------
insert into public.lesson_progress (id, lesson_id, profile_id, cohort_id, status, completed_at) values
  ('a0000000-0000-4000-a000-000000000001', 'dd000000-0000-4000-a000-000000000001', 'aa000000-0000-4000-a000-000000000003', 'a1000000-0000-4000-a000-000000000001', 'completed',   now()),
  ('a0000000-0000-4000-a000-000000000002', 'dd000000-0000-4000-a000-000000000008', 'aa000000-0000-4000-a000-000000000003', 'a1000000-0000-4000-a000-000000000001', 'completed',   now()),
  ('a0000000-0000-4000-a000-000000000003', 'dd000000-0000-4000-a000-000000000001', 'aa000000-0000-4000-a000-000000000004', 'a1000000-0000-4000-a000-000000000001', 'in_progress', null),
  ('b0000000-0000-4000-a000-000000000001', 'dd000000-0000-4000-a000-000000000001', 'bb000000-0000-4000-a000-000000000003', 'b1000000-0000-4000-a000-000000000001', 'completed',   now());

insert into public.assignment_submissions (id, content_block_id, profile_id, cohort_id, note_text, visibility) values
  ('a5000000-0000-4000-a000-000000000001', 'ee000000-0000-4000-a000-000000000003', 'aa000000-0000-4000-a000-000000000003', 'a1000000-0000-4000-a000-000000000001', 'Abgabe P1 (Trainer sichtbar)', 'trainer'),
  ('a5000000-0000-4000-a000-000000000002', 'ee000000-0000-4000-a000-000000000003', 'aa000000-0000-4000-a000-000000000004', 'a1000000-0000-4000-a000-000000000001', 'Abgabe P2 (privat)',          'private'),
  ('b5000000-0000-4000-a000-000000000001', 'ee000000-0000-4000-a000-000000000003', 'bb000000-0000-4000-a000-000000000003', 'b1000000-0000-4000-a000-000000000001', 'Abgabe B (Trainer sichtbar)', 'trainer');

insert into public.reflection_entries (id, content_block_id, profile_id, cohort_id, body, visibility) values
  ('a6000000-0000-4000-a000-000000000001', 'ee000000-0000-4000-a000-000000000004', 'aa000000-0000-4000-a000-000000000003', 'a1000000-0000-4000-a000-000000000001', 'Reflexion P1 (privat)',          'private'),
  ('a6000000-0000-4000-a000-000000000002', 'ee000000-0000-4000-a000-000000000004', 'aa000000-0000-4000-a000-000000000004', 'a1000000-0000-4000-a000-000000000001', 'Reflexion P2 (Trainer sichtbar)', 'trainer'),
  ('b6000000-0000-4000-a000-000000000001', 'ee000000-0000-4000-a000-000000000004', 'bb000000-0000-4000-a000-000000000003', 'b1000000-0000-4000-a000-000000000001', 'Reflexion B (Trainer sichtbar)',  'trainer');

insert into public.quiz_attempts (id, quiz_id, profile_id, cohort_id, attempt_no, score, passed, completed_at) values
  ('a7000000-0000-4000-a000-000000000001', 'ff000000-0000-4000-a000-000000000001', 'aa000000-0000-4000-a000-000000000003', 'a1000000-0000-4000-a000-000000000001', 1, 1, true, now()),
  ('a7000000-0000-4000-a000-000000000002', 'ff000000-0000-4000-a000-000000000001', 'aa000000-0000-4000-a000-000000000004', 'a1000000-0000-4000-a000-000000000001', 1, 0, false, now()),
  ('b7000000-0000-4000-a000-000000000001', 'ff000000-0000-4000-a000-000000000001', 'bb000000-0000-4000-a000-000000000003', 'b1000000-0000-4000-a000-000000000001', 1, 1, true, now());

insert into public.action_plans (id, profile_id, cohort_id, module_id, share_with_trainer) values
  ('a8000000-0000-4000-a000-000000000001', 'aa000000-0000-4000-a000-000000000003', 'a1000000-0000-4000-a000-000000000001', null, false),
  ('a8000000-0000-4000-a000-000000000002', 'aa000000-0000-4000-a000-000000000004', 'a1000000-0000-4000-a000-000000000001', null, true),
  ('b8000000-0000-4000-a000-000000000001', 'bb000000-0000-4000-a000-000000000003', 'b1000000-0000-4000-a000-000000000001', null, true);

insert into public.action_plan_items (id, action_plan_id, position, insight, status) values
  ('a8000000-0000-4000-a000-000000000011', 'a8000000-0000-4000-a000-000000000001', 1, 'Vorhaben P1', 'planned'),
  ('a8000000-0000-4000-a000-000000000021', 'a8000000-0000-4000-a000-000000000002', 1, 'Vorhaben P2', 'planned'),
  ('b8000000-0000-4000-a000-000000000011', 'b8000000-0000-4000-a000-000000000001', 1, 'Vorhaben B',  'planned');

insert into public.trainer_feedback (id, submission_id, author_profile_id, recipient_profile_id, body) values
  ('a4000000-0000-4000-a000-000000000001', 'a5000000-0000-4000-a000-000000000001', 'aa000000-0000-4000-a000-000000000002', 'aa000000-0000-4000-a000-000000000003', 'Feedback an P1');

-- ---------------------------------------------------------------------------
-- Kommunikation, Zugang, Betrieb
-- ---------------------------------------------------------------------------
insert into public.announcements (id, cohort_id, author_profile_id, title, body) values
  ('a3000000-0000-4000-a000-000000000001', 'a1000000-0000-4000-a000-000000000001', 'aa000000-0000-4000-a000-000000000002', 'Ankuendigung A1', 'Text A1'),
  ('b3000000-0000-4000-a000-000000000001', 'b1000000-0000-4000-a000-000000000001', 'bb000000-0000-4000-a000-000000000002', 'Ankuendigung B1', 'Text B1');

insert into public.notifications (id, profile_id, kind, title) values
  ('a2000000-0000-4000-a000-000000000001', 'aa000000-0000-4000-a000-000000000003', 'release', 'Benachrichtigung P1'),
  ('a2000000-0000-4000-a000-000000000002', 'aa000000-0000-4000-a000-000000000004', 'release', 'Benachrichtigung P2'),
  ('b2000000-0000-4000-a000-000000000001', 'bb000000-0000-4000-a000-000000000003', 'release', 'Benachrichtigung B');

insert into public.push_tokens (id, profile_id, device_id, token, platform) values
  ('a2000000-0000-4000-a000-000000000011', 'aa000000-0000-4000-a000-000000000003', 'geraet-p1', 'ExponentPushToken[p1]', 'ios'),
  ('a2000000-0000-4000-a000-000000000012', 'aa000000-0000-4000-a000-000000000004', 'geraet-p2', 'ExponentPushToken[p2]', 'android');

insert into public.invitations (id, email, organization_id, cohort_id, role, token_hash, status, expires_at) values
  ('aa000000-0000-4000-a000-000000000301', 'neu-a@test.invalid', 'aa000000-0000-4000-a000-000000000100', 'a1000000-0000-4000-a000-000000000001', 'participant', 'hash-a', 'pending', now() + interval '14 days'),
  ('bb000000-0000-4000-a000-000000000301', 'neu-b@test.invalid', 'bb000000-0000-4000-a000-000000000100', 'b1000000-0000-4000-a000-000000000001', 'participant', 'hash-b', 'pending', now() + interval '14 days');

insert into public.user_consents (profile_id, consent_type, version) values
  ('aa000000-0000-4000-a000-000000000003', 'privacy', 'v1'),
  ('aa000000-0000-4000-a000-000000000004', 'privacy', 'v1');

insert into public.account_deletion_requests (id, profile_id, status) values
  ('a2000000-0000-4000-a000-000000000021', 'aa000000-0000-4000-a000-000000000004', 'requested');

insert into public.learning_assets (id, organization_id, path, mime) values
  ('ab000000-0000-4000-a000-000000000001', null,                                   'global/handbuch.pdf', 'application/pdf'),
  ('ab000000-0000-4000-a000-000000000002', 'aa000000-0000-4000-a000-000000000100', 'organizations/aa000000-0000-4000-a000-000000000100/a.pdf', 'application/pdf'),
  ('ab000000-0000-4000-a000-000000000003', 'bb000000-0000-4000-a000-000000000100', 'organizations/bb000000-0000-4000-a000-000000000100/b.pdf', 'application/pdf');

insert into public.audit_logs (actor_profile_id, action, target_type, organization_id) values
  ('00000000-0000-4000-a000-000000000001', 'test.fixture', 'system', null);

insert into storage.objects (bucket_id, name) values
  ('learning-assets', 'organizations/aa000000-0000-4000-a000-000000000100/a.pdf'),
  ('learning-assets', 'organizations/bb000000-0000-4000-a000-000000000100/b.pdf'),
  ('avatars', 'aa000000-0000-4000-a000-000000000003/avatar.jpg'),
  ('avatars', 'aa000000-0000-4000-a000-000000000004/avatar.jpg');

-- ---------------------------------------------------------------------------
-- Nachtraegliche Deaktivierungen (der Konsistenz-Trigger aus Migration 0006
-- verlangt bei der Zuordnung eine AKTIVE Mitgliedschaft; die Tests pruefen den
-- Zustand DANACH: P4 = Mitgliedschaft inaktiv, X-Trainer = Mitgliedschaft inaktiv)
-- ---------------------------------------------------------------------------
update public.organization_memberships set status = 'inactive'
 where profile_id in ('aa000000-0000-4000-a000-000000000006', 'ee000000-0000-4000-a000-000000000001');

-- ---------------------------------------------------------------------------
-- Quiz-Fixtures fuer die serverseitige Bewertung (Migration 0007, Test 06)
-- Quiz ff..0003 haengt an der freien Lektion L01 (Block ee..0005, nicht
-- verpflichtend). Alle Fragearten, pass_score 3 von max. 4 Punkten,
-- max_attempts 2, keine vorhandenen Versuche.
-- ---------------------------------------------------------------------------
insert into public.quizzes (id, title, pass_score, max_attempts) values
  ('ff000000-0000-4000-a000-000000000003', 'Quiz L01 (Bewertung)', 3, 2);

insert into public.content_blocks (id, lesson_id, position, block_type, config, required) values
  ('ee000000-0000-4000-a000-000000000005', 'dd000000-0000-4000-a000-000000000001', 5, 'quiz', '{"quizId": "ff000000-0000-4000-a000-000000000003"}', false);

insert into public.quiz_questions (id, quiz_id, position, kind, body, explanation, points) values
  ('ff000000-0000-4000-a000-000000000031', 'ff000000-0000-4000-a000-000000000003', 1, 'single',    'Q31 single (1 Punkt)',    'Erklaerung Q31', 1),
  ('ff000000-0000-4000-a000-000000000032', 'ff000000-0000-4000-a000-000000000003', 2, 'multiple',  'Q32 multiple (2 Punkte)', null,             2),
  ('ff000000-0000-4000-a000-000000000033', 'ff000000-0000-4000-a000-000000000003', 3, 'truefalse', 'Q33 truefalse (1 Punkt)', 'Erklaerung Q33', 1),
  ('ff000000-0000-4000-a000-000000000034', 'ff000000-0000-4000-a000-000000000003', 4, 'freetext',  'Q34 freetext (ohne Wertung)', 'Erklaerung Q34', 1);

insert into public.quiz_options (id, question_id, position, body, is_correct) values
  ('ff000000-0000-4000-a000-000000000311', 'ff000000-0000-4000-a000-000000000031', 1, 'Q31 A (richtig)', true),
  ('ff000000-0000-4000-a000-000000000312', 'ff000000-0000-4000-a000-000000000031', 2, 'Q31 B',           false),
  ('ff000000-0000-4000-a000-000000000313', 'ff000000-0000-4000-a000-000000000031', 3, 'Q31 C',           false),
  ('ff000000-0000-4000-a000-000000000321', 'ff000000-0000-4000-a000-000000000032', 1, 'Q32 A (richtig)', true),
  ('ff000000-0000-4000-a000-000000000322', 'ff000000-0000-4000-a000-000000000032', 2, 'Q32 B (richtig)', true),
  ('ff000000-0000-4000-a000-000000000323', 'ff000000-0000-4000-a000-000000000032', 3, 'Q32 C',           false),
  ('ff000000-0000-4000-a000-000000000331', 'ff000000-0000-4000-a000-000000000033', 1, 'Richtig',         true),
  ('ff000000-0000-4000-a000-000000000332', 'ff000000-0000-4000-a000-000000000033', 2, 'Falsch',          false);

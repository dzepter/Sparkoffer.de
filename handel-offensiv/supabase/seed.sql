-- ============================================================================
-- seed.sql – DEMO-Daten "Handel Offensiv Learning App"
--
-- ACHTUNG: Ausschliesslich kuenstliche, klar als [DEMO] markierte Daten.
-- Keine echten Personen- oder Kundendaten (vgl. Anforderung §50).
-- NUR fuer die LOKALE Entwicklung gedacht (supabase db reset / supabase start).
-- Alle IDs sind fest vergeben (Praefix dX...), damit der Seed deterministisch
-- und idempotent ist (ON CONFLICT DO NOTHING bzw. NOT-EXISTS-Guards).
--
-- ID-Schema (fest):
--   d0... Profile/Users    d1... Organisation   d2... Programm
--   d3... Module           d4... Lernphasen     d5... Lektionen
--   d6... Quizzes/Fragen   d7... Transfer-Bloecke
--   d8... Cohort           d9... Sessions       da... Submission
--   db... Action Plan      dc... Plan Items     dd... Announcement
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Demo-Auth-Benutzer (auth.users / auth.identities)
-- HINWEIS: Der Passwort-Hash (Passwort: demo1234!) wird via
-- extensions.crypt(..., gen_salt('bf')) erzeugt und ist NUR fuer die lokale
-- Entwicklung bestimmt. Niemals in Staging/Produktion einspielen!
-- ----------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, reauthentication_token
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  v.id,
  'authenticated',
  'authenticated',
  v.email,
  extensions.crypt('demo1234!', extensions.gen_salt('bf')),  -- NUR lokal!
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{}'::jsonb,
  now(), now(),
  '', '', '', '', '', ''
from (values
  ('d0000000-0000-4000-a000-000000000001'::uuid, 'superadmin@demo.handel-offensiv.test'),
  ('d0000000-0000-4000-a000-000000000002'::uuid, 'trainer@demo.handel-offensiv.test'),
  ('d0000000-0000-4000-a000-000000000003'::uuid, 'orgadmin@demo.handel-offensiv.test'),
  ('d0000000-0000-4000-a000-000000000004'::uuid, 'max.muster@demo.handel-offensiv.test'),
  ('d0000000-0000-4000-a000-000000000005'::uuid, 'anna.beispiel@demo.handel-offensiv.test')
) as v (id, email)
on conflict do nothing;

-- E-Mail-Identities passend zu den Demo-Usern (provider_id = user id)
insert into auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email',
  u.id::text,
  now(), now(), now()
from auth.users u
where u.email like '%@demo.handel-offensiv.test'
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- 2) Profile (Superadmin mit is_super_admin = true)
-- ----------------------------------------------------------------------------
insert into public.profiles (id, first_name, last_name, is_super_admin) values
  ('d0000000-0000-4000-a000-000000000001', 'Demo', 'Superadmin', true),
  ('d0000000-0000-4000-a000-000000000002', 'Demo', 'Trainer',    false),
  ('d0000000-0000-4000-a000-000000000003', 'Demo', 'Orgadmin',   false),
  ('d0000000-0000-4000-a000-000000000004', 'Max',  'Muster',     false),
  ('d0000000-0000-4000-a000-000000000005', 'Anna', 'Beispiel',   false)
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- 3) Demo-Organisation + Mitgliedschaften
-- ----------------------------------------------------------------------------
insert into public.organizations (
  id, name, short_name, contact_name, contact_email, contact_phone,
  address, status, internal_notes
) values (
  'd1000000-0000-4000-a000-000000000001',
  'Aigner Offensiv Demo GmbH',
  'AO Demo',
  'Demo Kontakt',
  'kontakt@demo.handel-offensiv.test',
  '+49 000 0000000',
  'DEMO Musterstrasse 1, 80331 Muenchen',
  'active',
  '[DEMO] Reine Seed-Organisation fuer die lokale Entwicklung.'
)
on conflict do nothing;

insert into public.organization_memberships (organization_id, profile_id, role) values
  ('d1000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000003', 'org_admin'),
  ('d1000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000002', 'trainer'),
  ('d1000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000004', 'participant'),
  ('d1000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000005', 'participant')
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- 4) Programm "Handel Offensiv" (published) mit 5 Modulen
-- ----------------------------------------------------------------------------
insert into public.programs (
  id, slug, title, subtitle, description, status, created_by, published_at
) values (
  'd2000000-0000-4000-a000-000000000001',
  'handel-offensiv',
  'Handel Offensiv',
  '[DEMO] Das 5-taegige Fuehrungsprogramm fuer den Handel',
  '[DEMO] Praesenzprogramm mit fuenf Offensivtagen und begleitenden Lernphasen (vorher, am Tag, nachher, Vorbereitung).',
  'published',
  'd0000000-0000-4000-a000-000000000001',
  now()
)
on conflict do nothing;

insert into public.modules (id, program_id, position, number_label, title, claim, description, status) values
  ('d3000000-0000-4000-a000-000000000001', 'd2000000-0000-4000-a000-000000000001', 1, '01',
   'Führung beginnt bei mir',
   'Selbstführung ist die Basis wirksamer Führung.',
   '[DEMO] Modulbeschreibung – Selbstreflexion, Haltung und Wirkung als Führungskraft.', 'published'),
  ('d3000000-0000-4000-a000-000000000002', 'd2000000-0000-4000-a000-000000000001', 2, '02',
   'Aus Mitarbeitern wird Mannschaft',
   'Aus Einzelspielern wird ein Team mit gemeinsamem Ziel.',
   '[DEMO] Modulbeschreibung – Teamentwicklung, Vertrauen und Zusammenhalt.', 'published'),
  ('d3000000-0000-4000-a000-000000000003', 'd2000000-0000-4000-a000-000000000001', 3, '03',
   'Die richtige Aufstellung',
   'Stärken erkennen, Rollen klären, Verantwortung verteilen.',
   '[DEMO] Modulbeschreibung – Staerkenorientierung und klare Rollen.', 'published'),
  ('d3000000-0000-4000-a000-000000000004', 'd2000000-0000-4000-a000-000000000001', 4, '04',
   'Spielintelligenz mit KI',
   'KI clever nutzen – Spielintelligenz für den Führungsalltag.',
   '[DEMO] Modulbeschreibung – KI-Werkzeuge sinnvoll im Tagesgeschaeft einsetzen.', 'published'),
  ('d3000000-0000-4000-a000-000000000005', 'd2000000-0000-4000-a000-000000000001', 5, '05',
   'Führen, wenn es darauf ankommt',
   'Klarheit und Haltung, wenn es darauf ankommt.',
   '[DEMO] Modulbeschreibung – Fuehrung in kritischen und fordernden Situationen.', 'published')
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- 5) Lernphasen: je Modul 4 Phasen (IDs: d4...-...MP, M=Modul, P=Phase)
-- ----------------------------------------------------------------------------
insert into public.learning_phases (id, module_id, position, phase_type, title)
select
  ('d4000000-0000-4000-a000-0000000000' || m.position || p.pos)::uuid,
  m.id,
  p.pos,
  p.ptype::public.phase_type,
  p.title
from public.modules m
cross join (values
  (1, 'before_day', 'Vor dem Offensivtag'),
  (2, 'day',        'Offensivtag'),
  (3, 'after_day',  'Nach dem Offensivtag'),
  (4, 'prep_next',  'Vorbereitung auf das nächste Modul')
) as p (pos, ptype, title)
where m.program_id = 'd2000000-0000-4000-a000-000000000001'
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- 6) Quizzes fuer Modul 1 und 2 (je 3 Fragen: single / multiple / truefalse)
-- ----------------------------------------------------------------------------
insert into public.quizzes (id, title, description, pass_score, max_attempts, shuffle) values
  ('d6000000-0000-4000-a000-000000000001', '[DEMO] Wissenscheck Modul 01',
   '[DEMO] Kurzer Wissenscheck zu "Führung beginnt bei mir".', 2, 3, false),
  ('d6000000-0000-4000-a000-000000000002', '[DEMO] Wissenscheck Modul 02',
   '[DEMO] Kurzer Wissenscheck zu "Aus Mitarbeitern wird Mannschaft".', 2, 3, false)
on conflict do nothing;

-- Fragen (IDs: d61...-...QN, Q=Quiz, N=Frage)
insert into public.quiz_questions (id, quiz_id, position, kind, body, explanation, points) values
  -- Quiz Modul 01
  ('d6100000-0000-4000-a000-000000000011', 'd6000000-0000-4000-a000-000000000001', 1, 'single',
   '[DEMO] Was ist der erste Schritt wirksamer Führung?',
   '[DEMO] Wirksame Führung beginnt mit Selbstreflexion – erst das eigene Verhalten verstehen, dann andere führen.', 1),
  ('d6100000-0000-4000-a000-000000000012', 'd6000000-0000-4000-a000-000000000001', 2, 'multiple',
   '[DEMO] Welche Elemente gehören zur Selbstführung? (Mehrfachauswahl)',
   '[DEMO] Eigene Ziele und Energiemanagement gehören zur Selbstführung; pauschales Delegieren nicht.', 2),
  ('d6100000-0000-4000-a000-000000000013', 'd6000000-0000-4000-a000-000000000001', 3, 'truefalse',
   '[DEMO] Das eigene Führungsverhalten wirkt direkt auf die Teamkultur.',
   '[DEMO] Wahr – Führungskräfte prägen durch Vorbildverhalten die Kultur ihres Teams.', 1),
  -- Quiz Modul 02
  ('d6100000-0000-4000-a000-000000000021', 'd6000000-0000-4000-a000-000000000002', 1, 'single',
   '[DEMO] Was unterscheidet eine Mannschaft von einer bloßen Gruppe?',
   '[DEMO] Eine Mannschaft verbindet ein gemeinsames Ziel mit klaren Rollen – nicht die Größe oder der Dienstplan.', 1),
  ('d6100000-0000-4000-a000-000000000022', 'd6000000-0000-4000-a000-000000000002', 2, 'multiple',
   '[DEMO] Was stärkt den Zusammenhalt im Team? (Mehrfachauswahl)',
   '[DEMO] Ehrliches Feedback und sichtbare gemeinsame Erfolge stärken den Zusammenhalt; Dauerwettbewerb um jeden Preis nicht.', 2),
  ('d6100000-0000-4000-a000-000000000023', 'd6000000-0000-4000-a000-000000000002', 3, 'truefalse',
   '[DEMO] Konflikte im Team sind grundsätzlich ein Zeichen schlechter Führung.',
   '[DEMO] Falsch – Konflikte sind normal; entscheidend ist der konstruktive Umgang damit.', 1)
on conflict do nothing;

-- Antwortoptionen
insert into public.quiz_options (question_id, position, body, is_correct) values
  -- M01 F1 (single)
  ('d6100000-0000-4000-a000-000000000011', 1, '[DEMO] Selbstreflexion und Klarheit über die eigene Rolle', true),
  ('d6100000-0000-4000-a000-000000000011', 2, '[DEMO] Mehr Kontrolle über alle Arbeitsschritte', false),
  ('d6100000-0000-4000-a000-000000000011', 3, '[DEMO] Längere Teammeetings', false),
  -- M01 F2 (multiple)
  ('d6100000-0000-4000-a000-000000000012', 1, '[DEMO] Eigene Ziele und Werte kennen', true),
  ('d6100000-0000-4000-a000-000000000012', 2, '[DEMO] Energie- und Zeitmanagement', true),
  ('d6100000-0000-4000-a000-000000000012', 3, '[DEMO] Alle Aufgaben grundsätzlich delegieren', false),
  -- M01 F3 (truefalse)
  ('d6100000-0000-4000-a000-000000000013', 1, '[DEMO] Wahr', true),
  ('d6100000-0000-4000-a000-000000000013', 2, '[DEMO] Falsch', false),
  -- M02 F1 (single)
  ('d6100000-0000-4000-a000-000000000021', 1, '[DEMO] Ein gemeinsames Ziel und klare Rollen', true),
  ('d6100000-0000-4000-a000-000000000021', 2, '[DEMO] Die Anzahl der Mitglieder', false),
  ('d6100000-0000-4000-a000-000000000021', 3, '[DEMO] Ein gemeinsamer Dienstplan', false),
  -- M02 F2 (multiple)
  ('d6100000-0000-4000-a000-000000000022', 1, '[DEMO] Regelmäßiges, ehrliches Feedback', true),
  ('d6100000-0000-4000-a000-000000000022', 2, '[DEMO] Gemeinsame Erfolge sichtbar machen', true),
  ('d6100000-0000-4000-a000-000000000022', 3, '[DEMO] Interner Dauerwettbewerb um jeden Preis', false),
  -- M02 F3 (truefalse)
  ('d6100000-0000-4000-a000-000000000023', 1, '[DEMO] Wahr', false),
  ('d6100000-0000-4000-a000-000000000023', 2, '[DEMO] Falsch', true)
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- 7) Lektionen Modul 1 + 2 (vollstaendig, IDs: d5...-...MPL)
-- ----------------------------------------------------------------------------
insert into public.lessons (
  id, learning_phase_id, position, title, summary, estimated_minutes,
  status, created_by, published_at
) values
  -- Modul 1
  ('d5000000-0000-4000-a000-000000000111', 'd4000000-0000-4000-a000-000000000011', 1,
   '[DEMO] Ankommen: Warum Führung bei mir beginnt',
   '[DEMO] Einstimmung auf Offensivtag 1 mit Video, Checkliste und Reflexion.', 20,
   'published', 'd0000000-0000-4000-a000-000000000001', now()),
  ('d5000000-0000-4000-a000-000000000121', 'd4000000-0000-4000-a000-000000000012', 1,
   '[DEMO] Tagesbegleiter Offensivtag 1',
   '[DEMO] Agenda und Teilnehmerunterlage fuer den Praesenztag.', 10,
   'published', 'd0000000-0000-4000-a000-000000000001', now()),
  ('d5000000-0000-4000-a000-000000000131', 'd4000000-0000-4000-a000-000000000013', 1,
   '[DEMO] Transfer: Mein Führungsverhalten im Alltag',
   '[DEMO] Selbsteinschaetzung, Transferaufgabe und Wissenscheck.', 25,
   'published', 'd0000000-0000-4000-a000-000000000001', now()),
  ('d5000000-0000-4000-a000-000000000141', 'd4000000-0000-4000-a000-000000000014', 1,
   '[DEMO] Ausblick: Aus Mitarbeitern wird Mannschaft',
   '[DEMO] Vorbereitung auf Modul 02 mit Download und Lesetipp.', 10,
   'published', 'd0000000-0000-4000-a000-000000000001', now()),
  -- Modul 2
  ('d5000000-0000-4000-a000-000000000211', 'd4000000-0000-4000-a000-000000000021', 1,
   '[DEMO] Einstimmung: Aus Mitarbeitern wird Mannschaft',
   '[DEMO] Einstieg in das Teamthema mit Video und Checkliste.', 15,
   'published', 'd0000000-0000-4000-a000-000000000001', now()),
  ('d5000000-0000-4000-a000-000000000221', 'd4000000-0000-4000-a000-000000000022', 1,
   '[DEMO] Tagesbegleiter Offensivtag 2',
   '[DEMO] Agenda und Teilnehmerunterlage fuer den Praesenztag.', 10,
   'published', 'd0000000-0000-4000-a000-000000000001', now()),
  ('d5000000-0000-4000-a000-000000000231', 'd4000000-0000-4000-a000-000000000023', 1,
   '[DEMO] Transfer: Teamdynamik gestalten',
   '[DEMO] Reflexion, Skala, Transferaufgabe und Wissenscheck.', 25,
   'published', 'd0000000-0000-4000-a000-000000000001', now()),
  ('d5000000-0000-4000-a000-000000000241', 'd4000000-0000-4000-a000-000000000024', 1,
   '[DEMO] Ausblick: Die richtige Aufstellung',
   '[DEMO] Vorbereitung auf Modul 03.', 10,
   'published', 'd0000000-0000-4000-a000-000000000001', now())
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- 8) Content-Blöcke Modul 1 + 2 (alle wichtigen Blocktypen)
-- Transfer-Task-Bloecke mit festen IDs (d7...), da Submissions darauf zeigen.
-- ----------------------------------------------------------------------------
-- Modul 1 / Vor dem Offensivtag
insert into public.content_blocks (lesson_id, position, block_type, config, required) values
  ('d5000000-0000-4000-a000-000000000111', 1, 'text',
   '{"format": "markdown", "body": "[DEMO] **Willkommen bei Handel Offensiv!** Bevor der erste Offensivtag startet, stimmen Sie sich hier auf das Thema Selbstführung ein."}', false),
  ('d5000000-0000-4000-a000-000000000111', 2, 'video',
   '{"provider": "external", "url": "https://example.com/demo/videos/modul-01-intro.mp4", "title": "[DEMO] Intro-Video Modul 01", "durationSeconds": 180}', false),
  ('d5000000-0000-4000-a000-000000000111', 3, 'checklist',
   '{"title": "[DEMO] Vorbereitung Offensivtag 1", "items": [{"id": "c1", "label": "Anreise und Termin geprüft"}, {"id": "c2", "label": "Intro-Video angesehen"}, {"id": "c3", "label": "Eigene Erwartungen notiert"}]}', false),
  ('d5000000-0000-4000-a000-000000000111', 4, 'reflection',
   '{"prompt": "[DEMO] Was möchte ich als Führungskraft an mir selbst weiterentwickeln – und woran werde ich es merken?"}', true)
on conflict do nothing;

-- Modul 1 / Offensivtag
insert into public.content_blocks (lesson_id, position, block_type, config, required) values
  ('d5000000-0000-4000-a000-000000000121', 1, 'text',
   '{"format": "markdown", "body": "[DEMO] **Agenda Offensivtag 1:** 09:00 Ankommen · 09:30 Selbstführung · 12:30 Mittagspause · 13:30 Praxisfälle · 17:00 Abschluss."}', false),
  ('d5000000-0000-4000-a000-000000000121', 2, 'pdf',
   '{"assetPath": "demo/unterlagen/modul-01-teilnehmerheft.pdf", "title": "[DEMO] Teilnehmerheft Modul 01 (Platzhalter)"}', false)
on conflict do nothing;

-- Modul 1 / Nach dem Offensivtag (Transfer-Task mit fester ID d7...0001)
insert into public.content_blocks (id, lesson_id, position, block_type, config, required) values
  (gen_random_uuid(), 'd5000000-0000-4000-a000-000000000131', 1, 'scale',
   '{"question": "[DEMO] Wie konsequent setze ich meine Erkenntnisse vom Offensivtag bereits um?", "min": 1, "max": 10, "minLabel": "noch gar nicht", "maxLabel": "voll umgesetzt"}', false),
  ('d7000000-0000-4000-a000-000000000001', 'd5000000-0000-4000-a000-000000000131', 2, 'transfer_task',
   '{"title": "[DEMO] Transferaufgabe: Führungsmoment dokumentieren", "instructions": "[DEMO] Beschreiben Sie eine konkrete Führungssituation der letzten Woche: Was haben Sie anders gemacht als früher – und mit welcher Wirkung?", "allowFileUpload": true}', true),
  (gen_random_uuid(), 'd5000000-0000-4000-a000-000000000131', 3, 'quiz',
   '{"quizId": "d6000000-0000-4000-a000-000000000001"}', true)
on conflict do nothing;

-- Modul 1 / Vorbereitung auf das naechste Modul
insert into public.content_blocks (lesson_id, position, block_type, config, required) values
  ('d5000000-0000-4000-a000-000000000141', 1, 'text',
   '{"format": "markdown", "body": "[DEMO] In Modul 02 geht es um Ihr Team: Wie aus einzelnen Mitarbeitenden eine Mannschaft wird. Beobachten Sie bis dahin Ihre Teamdynamik im Alltag."}', false),
  ('d5000000-0000-4000-a000-000000000141', 2, 'download',
   '{"assetPath": "demo/downloads/modul-01-selbstcheck.pdf", "title": "[DEMO] Selbstcheck Selbstführung (Platzhalter)"}', false),
  ('d5000000-0000-4000-a000-000000000141', 3, 'external_link',
   '{"url": "https://example.com/demo/artikel-teamfuehrung", "label": "[DEMO] Lesetipp: Vom Ich zum Wir (Platzhalter-Link)"}', false)
on conflict do nothing;

-- Modul 2 / Vor dem Offensivtag
insert into public.content_blocks (lesson_id, position, block_type, config, required) values
  ('d5000000-0000-4000-a000-000000000211', 1, 'text',
   '{"format": "markdown", "body": "[DEMO] **Aus Mitarbeitern wird Mannschaft.** Zur Vorbereitung auf Offensivtag 2 richten wir den Blick auf Ihr Team: Rollen, Vertrauen und Zusammenspiel."}', false),
  ('d5000000-0000-4000-a000-000000000211', 2, 'video',
   '{"provider": "external", "url": "https://example.com/demo/videos/modul-02-intro.mp4", "title": "[DEMO] Intro-Video Modul 02", "durationSeconds": 240}', false),
  ('d5000000-0000-4000-a000-000000000211', 3, 'checklist',
   '{"title": "[DEMO] Vorbereitung Offensivtag 2", "items": [{"id": "c1", "label": "Intro-Video angesehen"}, {"id": "c2", "label": "Aktuelle Teamsituation stichpunktartig notiert"}, {"id": "c3", "label": "Transferaufgabe aus Modul 01 abgeschlossen"}]}', false)
on conflict do nothing;

-- Modul 2 / Offensivtag
insert into public.content_blocks (lesson_id, position, block_type, config, required) values
  ('d5000000-0000-4000-a000-000000000221', 1, 'text',
   '{"format": "markdown", "body": "[DEMO] **Agenda Offensivtag 2:** 09:00 Rückblick Transfer · 10:00 Teamphasen · 13:30 Zusammenhalt stärken · 17:00 Abschluss."}', false),
  ('d5000000-0000-4000-a000-000000000221', 2, 'pdf',
   '{"assetPath": "demo/unterlagen/modul-02-teilnehmerheft.pdf", "title": "[DEMO] Teilnehmerheft Modul 02 (Platzhalter)"}', false)
on conflict do nothing;

-- Modul 2 / Nach dem Offensivtag (Transfer-Task mit fester ID d7...0002)
insert into public.content_blocks (id, lesson_id, position, block_type, config, required) values
  (gen_random_uuid(), 'd5000000-0000-4000-a000-000000000231', 1, 'reflection',
   '{"prompt": "[DEMO] Welche Stärke jedes einzelnen Teammitglieds nutze ich heute noch zu wenig?"}', true),
  (gen_random_uuid(), 'd5000000-0000-4000-a000-000000000231', 2, 'scale',
   '{"question": "[DEMO] Wie stark erlebe ich mein Team aktuell als Mannschaft?", "min": 1, "max": 10, "minLabel": "Einzelkämpfer", "maxLabel": "eingespielte Mannschaft"}', false),
  ('d7000000-0000-4000-a000-000000000002', 'd5000000-0000-4000-a000-000000000231', 3, 'transfer_task',
   '{"title": "[DEMO] Transferaufgabe: Teamritual etablieren", "instructions": "[DEMO] Führen Sie in den nächsten 14 Tagen ein kurzes Teamritual ein (z. B. Wochenstart) und dokumentieren Sie die Reaktion des Teams.", "allowFileUpload": true}', true),
  (gen_random_uuid(), 'd5000000-0000-4000-a000-000000000231', 4, 'quiz',
   '{"quizId": "d6000000-0000-4000-a000-000000000002"}', true)
on conflict do nothing;

-- Modul 2 / Vorbereitung auf das naechste Modul
insert into public.content_blocks (lesson_id, position, block_type, config, required) values
  ('d5000000-0000-4000-a000-000000000241', 1, 'text',
   '{"format": "markdown", "body": "[DEMO] In Modul 03 geht es um die richtige Aufstellung: Stärken erkennen und Rollen klären. Notieren Sie vorab die drei größten Stärken Ihres Teams."}', false),
  ('d5000000-0000-4000-a000-000000000241', 2, 'external_link',
   '{"url": "https://example.com/demo/staerkentest", "label": "[DEMO] Stärkencheck zur Vorbereitung (Platzhalter-Link)"}', false)
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- 9) Module 3–5: je 1 knappe Beispiel-Lektion pro Phase (+ 1 Textblock)
-- ----------------------------------------------------------------------------
insert into public.lessons (
  id, learning_phase_id, position, title, summary, estimated_minutes,
  status, created_by, published_at
)
select
  ('d5000000-0000-4000-a000-000000000' || m.position || ph.position || '1')::uuid,
  ph.id,
  1,
  '[DEMO] ' || ph.title || ' – Modul ' || m.number_label,
  '[DEMO] Knappe Beispiel-Lektion für die Phase "' || ph.title || '" in Modul ' || m.number_label || '.',
  10,
  'published',
  'd0000000-0000-4000-a000-000000000001'::uuid,
  now()
from public.modules m
join public.learning_phases ph on ph.module_id = m.id
where m.program_id = 'd2000000-0000-4000-a000-000000000001'
  and m.position between 3 and 5
on conflict do nothing;

insert into public.content_blocks (lesson_id, position, block_type, config, required)
select
  l.id,
  1,
  'text',
  jsonb_build_object(
    'format', 'markdown',
    'body', '[DEMO] Platzhalter-Inhalt für "' || l.title || '". Wird redaktionell ersetzt.'
  ),
  false
from public.lessons l
join public.learning_phases ph on ph.id = l.learning_phase_id
join public.modules m on m.id = ph.module_id
where m.program_id = 'd2000000-0000-4000-a000-000000000001'
  and m.position between 3 and 5
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- 10) Cohort "Handel Offensiv Pilotgruppe" inkl. Trainer, Mitglieder,
--     Enrollments und 5 Sessions (generische Zukunftstermine, 4-Wochen-Takt)
-- ----------------------------------------------------------------------------
insert into public.cohorts (id, organization_id, program_id, name, start_date, end_date, status) values (
  'd8000000-0000-4000-a000-000000000001',
  'd1000000-0000-4000-a000-000000000001',
  'd2000000-0000-4000-a000-000000000001',
  'Handel Offensiv Pilotgruppe',
  current_date + 7,
  current_date + 119,
  'active'
)
on conflict do nothing;

insert into public.cohort_trainers (cohort_id, profile_id) values
  ('d8000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000002')
on conflict do nothing;

insert into public.cohort_members (cohort_id, profile_id) values
  ('d8000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000004'),
  ('d8000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000005')
on conflict do nothing;

insert into public.course_enrollments (profile_id, cohort_id) values
  ('d0000000-0000-4000-a000-000000000004', 'd8000000-0000-4000-a000-000000000001'),
  ('d0000000-0000-4000-a000-000000000005', 'd8000000-0000-4000-a000-000000000001')
on conflict do nothing;

-- 5 Praesenztermine, jeweils 09:00–17:00 Europe/Berlin (relativ zu heute)
insert into public.cohort_sessions (
  id, cohort_id, module_id, title, starts_at, ends_at, timezone,
  venue, address, room, trainer_profile_id, notes
)
select
  s.sid::uuid,
  'd8000000-0000-4000-a000-000000000001'::uuid,
  m.id,
  'DEMO Offensivtag ' || m.position || ': ' || m.title,
  ((current_date + s.offset_days) + interval '9 hours')  at time zone 'Europe/Berlin',
  ((current_date + s.offset_days) + interval '17 hours') at time zone 'Europe/Berlin',
  'Europe/Berlin',
  'DEMO Seminarraum München',
  'DEMO Musterstrasse 1, 80331 Muenchen',
  'Raum 1',
  'd0000000-0000-4000-a000-000000000002'::uuid,
  '[DEMO] Generischer Zukunftstermin aus dem Seed.'
from (values
  ('d9000000-0000-4000-a000-000000000001', 1,   7),
  ('d9000000-0000-4000-a000-000000000002', 2,  35),
  ('d9000000-0000-4000-a000-000000000003', 3,  63),
  ('d9000000-0000-4000-a000-000000000004', 4,  91),
  ('d9000000-0000-4000-a000-000000000005', 5, 119)
) as s (sid, module_pos, offset_days)
join public.modules m
  on m.program_id = 'd2000000-0000-4000-a000-000000000001'
 and m.position   = s.module_pos
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- 11) lesson_releases je Modul (Cohort-weit, profile_id NULL)
--     Modul 1: immediate · Modul 2: at_datetime (+7 Tage)
--     Modul 3: days_after_session (1 Tag nach Offensivtag 3) · Modul 4+5: manual
-- ----------------------------------------------------------------------------
-- Modul 1: sofort frei
insert into public.lesson_releases (lesson_id, cohort_id, release_mode, created_by)
select l.id, 'd8000000-0000-4000-a000-000000000001'::uuid, 'immediate',
       'd0000000-0000-4000-a000-000000000001'::uuid
from public.lessons l
join public.learning_phases ph on ph.id = l.learning_phase_id
where ph.module_id = 'd3000000-0000-4000-a000-000000000001'
  and not exists (
    select 1 from public.lesson_releases lr
    where lr.lesson_id = l.id
      and lr.cohort_id = 'd8000000-0000-4000-a000-000000000001'
      and lr.profile_id is null
  );

-- Modul 2: zu festem Zeitpunkt (in 7 Tagen)
insert into public.lesson_releases (lesson_id, cohort_id, release_mode, release_at, created_by)
select l.id, 'd8000000-0000-4000-a000-000000000001'::uuid, 'at_datetime',
       now() + interval '7 days',
       'd0000000-0000-4000-a000-000000000001'::uuid
from public.lessons l
join public.learning_phases ph on ph.id = l.learning_phase_id
where ph.module_id = 'd3000000-0000-4000-a000-000000000002'
  and not exists (
    select 1 from public.lesson_releases lr
    where lr.lesson_id = l.id
      and lr.cohort_id = 'd8000000-0000-4000-a000-000000000001'
      and lr.profile_id is null
  );

-- Modul 3: 1 Tag nach Offensivtag 3 (Beispiel fuer days_after_session)
insert into public.lesson_releases (lesson_id, cohort_id, release_mode, offset_days, session_id, created_by)
select l.id, 'd8000000-0000-4000-a000-000000000001'::uuid, 'days_after_session',
       1, 'd9000000-0000-4000-a000-000000000003'::uuid,
       'd0000000-0000-4000-a000-000000000001'::uuid
from public.lessons l
join public.learning_phases ph on ph.id = l.learning_phase_id
where ph.module_id = 'd3000000-0000-4000-a000-000000000003'
  and not exists (
    select 1 from public.lesson_releases lr
    where lr.lesson_id = l.id
      and lr.cohort_id = 'd8000000-0000-4000-a000-000000000001'
      and lr.profile_id is null
  );

-- Modul 4 + 5: manuelle Freischaltung (released_at bleibt NULL)
insert into public.lesson_releases (lesson_id, cohort_id, release_mode, created_by)
select l.id, 'd8000000-0000-4000-a000-000000000001'::uuid, 'manual',
       'd0000000-0000-4000-a000-000000000001'::uuid
from public.lessons l
join public.learning_phases ph on ph.id = l.learning_phase_id
where ph.module_id in ('d3000000-0000-4000-a000-000000000004',
                       'd3000000-0000-4000-a000-000000000005')
  and not exists (
    select 1 from public.lesson_releases lr
    where lr.lesson_id = l.id
      and lr.cohort_id = 'd8000000-0000-4000-a000-000000000001'
      and lr.profile_id is null
  );

-- ----------------------------------------------------------------------------
-- 12) Beispiel-Aktivitaet von Max Muster
-- ----------------------------------------------------------------------------
-- Abgeschlossene Lektion (Modul 1, "Vor dem Offensivtag")
insert into public.lesson_progress (lesson_id, profile_id, cohort_id, status, completed_at) values (
  'd5000000-0000-4000-a000-000000000111',
  'd0000000-0000-4000-a000-000000000004',
  'd8000000-0000-4000-a000-000000000001',
  'completed',
  now()
)
on conflict do nothing;

-- Abgabe zur Transferaufgabe Modul 1 (fuer Trainer sichtbar)
insert into public.assignment_submissions (
  id, content_block_id, profile_id, cohort_id, status, note_text, visibility
) values (
  'da000000-0000-4000-a000-000000000001',
  'd7000000-0000-4000-a000-000000000001',
  'd0000000-0000-4000-a000-000000000004',
  'd8000000-0000-4000-a000-000000000001',
  'feedback_given',
  '[DEMO] Ich habe im Wochenmeeting zum ersten Mal bewusst zuerst zugehört statt sofort Lösungen vorzugeben. Das Team hat drei eigene Vorschläge eingebracht.',
  'trainer'
)
on conflict do nothing;

-- Trainer-Feedback zur Abgabe
insert into public.trainer_feedback (submission_id, author_profile_id, recipient_profile_id, body)
select
  'da000000-0000-4000-a000-000000000001'::uuid,
  'd0000000-0000-4000-a000-000000000002'::uuid,
  'd0000000-0000-4000-a000-000000000004'::uuid,
  '[DEMO] Starker erster Transfer, Max! Zuhören vor Lösungen – genau darum geht es. Bleiben Sie dran und wiederholen Sie das Vorgehen in den nächsten zwei Meetings.'
where not exists (
  select 1 from public.trainer_feedback tf
  where tf.submission_id = 'da000000-0000-4000-a000-000000000001'
);

-- Umsetzungsplan zu Modul 1 (mit Trainer geteilt) inkl. 2 Vorhaben
insert into public.action_plans (id, profile_id, cohort_id, module_id, share_with_trainer) values (
  'db000000-0000-4000-a000-000000000001',
  'd0000000-0000-4000-a000-000000000004',
  'd8000000-0000-4000-a000-000000000001',
  'd3000000-0000-4000-a000-000000000001',
  true
)
on conflict do nothing;

insert into public.action_plan_items (
  id, action_plan_id, position, insight, behavior, action, team, result, status, due_at
) values
  ('dc000000-0000-4000-a000-000000000001', 'db000000-0000-4000-a000-000000000001', 1,
   '[DEMO] Ich gebe zu schnell fertige Lösungen vor.',
   '[DEMO] Erst fragen, dann bewerten.',
   '[DEMO] In jedem Wochenmeeting zuerst drei offene Fragen stellen.',
   '[DEMO] Gesamtes Verkaufsteam',
   '[DEMO] Team bringt eigene Lösungsvorschläge ein.',
   'started', now() + interval '14 days'),
  ('dc000000-0000-4000-a000-000000000002', 'db000000-0000-4000-a000-000000000001', 2,
   '[DEMO] Positive Leistungen bleiben oft unerwähnt.',
   '[DEMO] Konkretes Lob zeitnah aussprechen.',
   '[DEMO] Pro Woche mindestens zwei konkrete Anerkennungen geben.',
   '[DEMO] Frühschicht-Team',
   '[DEMO] Spürbar bessere Stimmung im Tagesgeschäft.',
   'planned', now() + interval '30 days')
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- 13) Ankuendigung des Trainers in der Pilotgruppe
-- ----------------------------------------------------------------------------
insert into public.announcements (id, cohort_id, author_profile_id, title, body) values (
  'dd000000-0000-4000-a000-000000000001',
  'd8000000-0000-4000-a000-000000000001',
  'd0000000-0000-4000-a000-000000000002',
  '[DEMO] Willkommen in der Pilotgruppe!',
  '[DEMO] Herzlich willkommen bei Handel Offensiv. Modul 01 ist ab sofort freigeschaltet – bitte schließen Sie die Einstimmung vor dem ersten Offensivtag ab. Wir freuen uns auf Sie!'
)
on conflict do nothing;

-- ============================================================================
-- Ende seed.sql – alle Daten sind kuenstlich und als [DEMO] markiert.
-- ============================================================================

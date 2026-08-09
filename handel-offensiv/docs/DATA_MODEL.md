# Datenmodell – Handel Offensiv Learning App

Dieses Dokument beschreibt das vollständige relationale Datenmodell der Handel Offensiv Learning App (Supabase/PostgreSQL). Es richtet sich an Entwickler (Detailkapitel) und an fachliche Leser (Überblickskapitel 1–3). Alle Änderungen am Schema erfolgen ausschließlich über versionierte Migrationen in `supabase/migrations/`.

---

## 1. Überblick für fachliche Leser

Die Datenbank bildet vier Bereiche ab:

1. **Wer nutzt die App?** Personen (Profile), Kundenfirmen (Organisationen), Rollen (Org-Admin, Trainer, Teilnehmer) und Gruppen (Cohorts) mit ihren Terminen (Offensivtagen).
2. **Was wird gelernt?** Die Programmstruktur: ein Programm besteht aus Modulen, jedes Modul aus Lernphasen (vor dem Offensivtag, am Tag, danach, Vorbereitung auf das nächste Modul), jede Lernphase aus Lektionen, jede Lektion aus einzelnen Inhaltsbausteinen (Text, Video, Aufgabe, Quiz usw.).
3. **Wann wird etwas sichtbar?** Die Release Engine steuert pro Gruppe (oder pro Person), wann eine Lektion freigeschaltet wird – z. B. "3 Tage nach Offensivtag 2".
4. **Was passiert beim Lernen?** Fortschritt, eingereichte Transferaufgaben, Reflexionen, Quiz-Ergebnisse, der persönliche Offensivplan, Trainer-Feedback, Mitteilungen und Push-Benachrichtigungen.

Wichtiger Grundsatz: **Reflexionen und Einreichungen gehören dem Teilnehmer.** Nur wenn er einen Eintrag ausdrücklich freigibt, sieht ihn der Trainer. Org-Admins der Kundenfirma sehen niemals Reflexionstexte, sondern nur zusammengefasste Fortschrittszahlen.

---

## 2. Konventionen

- **Primärschlüssel:** jede Tabelle hat `id uuid primary key default gen_random_uuid()` (Ausnahme: `profiles.id` = `auth.users.id`).
- **Zeitstempel:** immer `timestamptz`. Jede Tabelle hat `created_at timestamptz not null default now()`; veränderliche Tabellen zusätzlich `updated_at timestamptz not null default now()` (Trigger `app.set_updated_at()`).
- **Enums:** feste Wertelisten sind Postgres-Enum-Typen im Schema `public` (Abschnitt 5). Neue Werte nur per Migration.
- **Fremdschlüssel:** immer explizit mit definierter `ON DELETE`-Regel (siehe jeweilige Tabelle). Standard: `RESTRICT` (nichts geht "aus Versehen" verloren), `CASCADE` nur bei echten Kind-Datensätzen ohne Eigenleben.
- **Soft Delete:** fachliche Objekte (Organisationen, Programme, Lektionen) werden über `status`-Felder archiviert, nicht physisch gelöscht. Physisches Löschen/Anonymisieren nur im Rahmen der Löschstrategie (Abschnitt 13).
- **RLS:** Row Level Security ist auf allen Client-Tabellen aktiviert. Policies nutzen die SECURITY-DEFINER-Funktionen `app.is_super_admin()`, `app.org_role(org_id)`, `app.is_cohort_trainer(cohort_id)`, `app.is_cohort_member(cohort_id)`. RLS-Details stehen in `docs/SECURITY.md`; dieses Dokument nennt nur das Sichtbarkeitsmodell (Abschnitt 10).
- **Dateien:** binäre Inhalte liegen nie in der Datenbank, sondern in privaten Storage-Buckets; Tabellen speichern nur Pfade (`text`), Auslieferung über Signed URLs.

---

## 3. ASCII-ER-Übersicht (Kernbeziehungen)

```
                           auth.users (Supabase Auth)
                                │ 1:1
                                ▼
   organizations ◄──────── profiles ────────────────────────────┐
        │ 1:n                 │                                 │
        ▼                     │ n:m via                         │
   organization_memberships ◄─┘ (role, permissions)             │
        │                                                       │
        │  organizations 1:n cohorts                            │
        ▼                                                       │
     cohorts ──────────► programs                               │
        │  │  \                │ 1:n                            │
        │  │   \               ▼                                │
        │  │    \           modules                             │
        │  │     \             │ 1:n                            │
        │  │      \            ▼                                │
        │  │       \      learning_phases                       │
        │  │        \          │ 1:n                            │
        │  │         \         ▼                                │
        │  │          \     lessons ──1:n──► content_blocks     │
        │  │           \       │                  │             │
        │  ├─1:n─ cohort_sessions (Offensivtage)  │             │
        │  │           │       │                  │             │
        │  ├─n:m─ cohort_trainers ────────────────┼─────────────┤
        │  └─n:m─ cohort_members ─────────────────┼─────────────┤
        │                      │                  │             │
        ▼                      ▼                  │             │
   lesson_releases ◄── (cohort, lesson, [profile], [session])   │
                                                  │             │
   Lern-Entitäten (alle mit profile_id ───────────┼─────────────┘
   und meist lesson-/block-Bezug):                │
     course_enrollments        lesson_progress ◄──┘
     assignment_submissions ◄── content_blocks(transfer_task)
     reflection_entries     ◄── content_blocks(reflection)
     quiz_attempts ◄── quizzes ◄── content_blocks(quiz)
                        │ 1:n
                        ▼
                  quiz_questions ──1:n──► quiz_options
     action_plans ──1:n──► action_plan_items
     trainer_feedback ──► (submission | reflection | action_plan)

   Kommunikation / Betrieb:
     announcements (org/cohort) ──► notifications ──► push_tokens
     invitations, learning_assets, audit_logs,
     user_consents, account_deletion_requests
```

---

## 4. Programmhierarchie: PROGRAMM → MODULE → LERNPHASEN → LEKTIONEN → CONTENT-BLÖCKE

- **Programm** (`programs`): die oberste Klammer, z. B. "HANDEL OFFENSIV – Der Führungsführerschein für den Handel". Die Struktur ist bewusst **nicht auf 5 Module festgeschrieben** – weitere Programme oder Programmvarianten sind ohne Schemaänderung möglich.
- **Modul** (`modules`): ein inhaltlicher Abschnitt, in der Regel einem Offensivtag zugeordnet. Trägt `number_label` ("01" … "05") und `claim` für die typografische Darstellung (große Modulnummern). Standardmodule: 01 Führung beginnt bei mir · 02 Aus Mitarbeitern wird Mannschaft · 03 Die richtige Aufstellung · 04 Spielintelligenz mit KI · 05 Führen, wenn es darauf ankommt.
- **Lernphase** (`learning_phases`): gliedert ein Modul zeitlich um den Offensivtag herum: `before_day` (Vorbereiten), `day` (Materialien zum Präsenztag), `after_day` (Vertiefen/Umsetzen), `prep_next` (Vorbereitung auf das nächste Modul), `custom` (frei benennbar).
- **Lektion** (`lessons`): die kleinste freischaltbare Einheit. Nur Lektionen haben einen Publikationsstatus und werden von der Release Engine gesteuert.
- **Content-Block** (`content_blocks`): der einzelne Baustein innerhalb einer Lektion (Text, Video, Reflexionsfrage, Transferaufgabe, Quiz …). Reihenfolge über `position`, typ­spezifische Konfiguration in `config jsonb` (Zod-validiert, siehe Abschnitt 12). Interaktive Blöcke (Reflexion, Transferaufgabe, Quiz) sind die Anker, an denen Teilnehmer-Antworten hängen.

Die Zuordnung Modul ↔ konkreter Termin geschieht **nicht** in der Programmstruktur (die ist cohort-unabhängig wiederverwendbar), sondern über `cohort_sessions.module_id`. Dadurch kann dasselbe Programm von beliebig vielen Gruppen mit unterschiedlichen Terminen durchlaufen werden.

---

## 5. Postgres-Enum-Typen

| Enum-Typ | Werte |
|---|---|
| `org_status` | `active`, `inactive`, `archived` |
| `profile_status` | `active`, `inactive`, `deleted` |
| `membership_role` | `org_admin`, `trainer`, `participant` |
| `membership_status` | `active`, `inactive` |
| `cohort_status` | `planned`, `active`, `completed`, `archived` |
| `cohort_member_status` | `active`, `inactive`, `completed` |
| `phase_type` | `before_day`, `day`, `after_day`, `prep_next`, `custom` |
| `lesson_status` | `draft`, `scheduled`, `published`, `archived` |
| `block_type` | `text`, `video`, `audio`, `pdf`, `image`, `checklist`, `reflection`, `single_choice`, `multiple_choice`, `quiz`, `scale`, `transfer_task`, `download`, `external_link` |
| `release_mode` | `immediate`, `at_datetime`, `days_after_session`, `days_before_session`, `after_lesson`, `after_module`, `manual` |
| `enrollment_status` | `active`, `paused`, `completed`, `withdrawn` |
| `submission_status` | `submitted`, `seen`, `feedback_given`, `done` |
| `record_visibility` | `private`, `trainer` |
| `question_type` | `single`, `multiple`, `truefalse`, `freetext` |
| `progress_status` | `not_started`, `in_progress`, `completed` |
| `action_item_status` | `geplant`, `begonnen`, `umgesetzt`, `reflektiert` |
| `notification_status` | `pending`, `sent`, `failed`, `read` |
| `invitation_status` | `pending`, `accepted`, `expired`, `revoked` |
| `deletion_request_status` | `requested`, `confirmed`, `processing`, `completed`, `rejected` |
| `announcement_audience` | `organization`, `cohort` |

---

## 6. Identität, Mandanten, Gruppen

### 6.1 `profiles`

**Zweck:** App-Profil zu jedem Auth-Benutzer (1:1 zu `auth.users`). Enthält keine Zugangsdaten – die verwaltet Supabase Auth.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | = `auth.users.id`; FK → `auth.users(id) ON DELETE CASCADE` |
| `first_name` | `text not null` | Vorname |
| `last_name` | `text not null` | Nachname |
| `avatar_path` | `text` | Storage-Pfad des Profilbilds, nullable |
| `is_super_admin` | `boolean not null default false` | nur serverseitig (service role) änderbar |
| `status` | `profile_status not null default 'active'` | `deleted` = anonymisiertes Profil |
| `locale` | `text not null default 'de'` | Sprach-/Formatpräferenz |
| `created_at` / `updated_at` | `timestamptz not null` | |

Indexe: PK genügt. Kein E-Mail-Feld – E-Mail lebt in `auth.users` (eine Quelle der Wahrheit).

### 6.2 `organizations`

**Zweck:** Mandant/Kundenfirma. Alles Kundenspezifische hängt direkt oder indirekt an dieser Tabelle.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `name` | `text not null` | vollständiger Firmenname |
| `short_name` | `text not null` | Kurzname für UI/Storage-Pfade |
| `logo_path` | `text` | Storage-Pfad, nullable |
| `contact_name` | `text` | Ansprechpartner |
| `contact_email` | `text` | |
| `contact_phone` | `text` | |
| `address` | `text` | Postadresse, einzeilig oder mehrzeilig |
| `status` | `org_status not null default 'active'` | |
| `internal_notes` | `text` | nur für Super Admin sichtbar (RLS) |
| `created_at` / `updated_at` | `timestamptz not null` | |

Constraints/Indexe: `UNIQUE (short_name)`; Index auf `status`.

### 6.3 `organization_memberships`

**Zweck:** Zuordnung Person ↔ Organisation mit Rolle. Eine Person kann mehreren Organisationen angehören (z. B. Trainer).

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `profile_id` | `uuid not null` | FK → `profiles(id) ON DELETE CASCADE` |
| `organization_id` | `uuid not null` | FK → `organizations(id) ON DELETE CASCADE` |
| `role` | `membership_role not null` | `org_admin` \| `trainer` \| `participant` |
| `permissions` | `jsonb not null default '{}'` | feingranulare Org-Admin-Rechte; Zod-validiertes Objekt aus Capability-Overrides (Abschnitt 12) |
| `status` | `membership_status not null default 'active'` | |
| `created_at` / `updated_at` | `timestamptz not null` | |

Constraints/Indexe: `UNIQUE (profile_id, organization_id)`; Indexe auf `organization_id`, `profile_id`.

Hinweis: Der Super Admin hat bewusst **keine** Membership-Zeilen – er wird ausschließlich über `profiles.is_super_admin` + serverseitige Edge Functions abgebildet.

### 6.4 `cohorts`

**Zweck:** Eine Gruppe/Staffel, die ein Programm durchläuft ("Mannschaft").

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `organization_id` | `uuid not null` | FK → `organizations(id) ON DELETE RESTRICT` |
| `program_id` | `uuid not null` | FK → `programs(id) ON DELETE RESTRICT` |
| `name` | `text not null` | z. B. Bereichs- oder Jahrgangsname |
| `start_date` | `date` | geplanter Beginn |
| `end_date` | `date` | geplantes Ende |
| `status` | `cohort_status not null default 'planned'` | |
| `created_at` / `updated_at` | `timestamptz not null` | |

Indexe: `(organization_id)`, `(program_id)`, `(status)`.

### 6.5 `cohort_trainers`

**Zweck:** n:m-Zuordnung Trainer ↔ Cohort. Grundlage von `app.is_cohort_trainer()`.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `cohort_id` | `uuid not null` | FK → `cohorts(id) ON DELETE CASCADE` |
| `profile_id` | `uuid not null` | FK → `profiles(id) ON DELETE CASCADE` |
| `created_at` | `timestamptz not null` | |

Constraints/Indexe: `UNIQUE (cohort_id, profile_id)`; Index auf `profile_id`.

### 6.6 `cohort_members`

**Zweck:** n:m-Zuordnung Teilnehmer ↔ Cohort. Grundlage von `app.is_cohort_member()`.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `cohort_id` | `uuid not null` | FK → `cohorts(id) ON DELETE CASCADE` |
| `profile_id` | `uuid not null` | FK → `profiles(id) ON DELETE CASCADE` |
| `status` | `cohort_member_status not null default 'active'` | |
| `created_at` / `updated_at` | `timestamptz not null` | |

Constraints/Indexe: `UNIQUE (cohort_id, profile_id)`; Index auf `profile_id`.

### 6.7 `cohort_sessions`

**Zweck:** Konkreter Termin (Offensivtag) einer Cohort. Referenzpunkt für die Release-Modi `days_after_session` / `days_before_session` und Datenquelle für Termindetails in der App (Ort, Raum, Anfahrt).

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `cohort_id` | `uuid not null` | FK → `cohorts(id) ON DELETE CASCADE` |
| `module_id` | `uuid` | FK → `modules(id) ON DELETE SET NULL`; nullable (z. B. Kick-off ohne Modulbezug) |
| `title` | `text not null` | z. B. "Offensivtag 2" |
| `starts_at` | `timestamptz not null` | |
| `ends_at` | `timestamptz not null` | Check: `ends_at > starts_at` |
| `timezone` | `text not null default 'Europe/Berlin'` | IANA-Zeitzone für die Anzeige |
| `venue` | `text` | Veranstaltungsort/Name |
| `address` | `text` | |
| `room` | `text` | |
| `trainer_profile_id` | `uuid` | FK → `profiles(id) ON DELETE SET NULL` |
| `notes` | `text` | interne Hinweise |
| `directions` | `text` | Anfahrtsbeschreibung |
| `created_at` / `updated_at` | `timestamptz not null` | |

Indexe: `(cohort_id, starts_at)`, `(module_id)`.

---

## 7. Programmstruktur (Content)

### 7.1 `programs`

**Zweck:** Oberste Programmklammer, cohort-unabhängig wiederverwendbar.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `title` | `text not null` | |
| `subtitle` | `text` | |
| `description` | `text` | |
| `status` | `lesson_status not null default 'draft'` | gleicher Lifecycle wie Lektionen (draft/published/archived; `scheduled` ungenutzt) |
| `created_at` / `updated_at` | `timestamptz not null` | |

### 7.2 `modules`

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `program_id` | `uuid not null` | FK → `programs(id) ON DELETE CASCADE` |
| `position` | `integer not null` | Sortierung innerhalb des Programms |
| `number_label` | `text not null` | Anzeige-Label "01", "02", … (bewusst Text, nicht Zahl) |
| `title` | `text not null` | |
| `claim` | `text` | kurzer Leitsatz des Moduls |
| `created_at` / `updated_at` | `timestamptz not null` | |

Constraints/Indexe: `UNIQUE (program_id, position)`; Index auf `program_id`.

### 7.3 `learning_phases`

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `module_id` | `uuid not null` | FK → `modules(id) ON DELETE CASCADE` |
| `phase_type` | `phase_type not null` | `before_day` \| `day` \| `after_day` \| `prep_next` \| `custom` |
| `title` | `text not null` | z. B. "Vorbereitung", bei `custom` frei |
| `position` | `integer not null` | Sortierung im Modul |
| `created_at` / `updated_at` | `timestamptz not null` | |

Constraints/Indexe: `UNIQUE (module_id, position)`; Index auf `module_id`.

### 7.4 `lessons`

**Zweck:** Kleinste freischaltbare Lerneinheit; Ziel der Release Engine.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `learning_phase_id` | `uuid not null` | FK → `learning_phases(id) ON DELETE CASCADE` |
| `title` | `text not null` | |
| `summary` | `text` | Kurzbeschreibung, auch für die gesperrte Vorschau |
| `position` | `integer not null` | Sortierung in der Phase |
| `status` | `lesson_status not null default 'draft'` | nur `published` ist für Teilnehmer überhaupt erreichbar |
| `estimated_minutes` | `integer` | geschätzte Bearbeitungszeit, nullable |
| `created_at` / `updated_at` | `timestamptz not null` | |

Constraints/Indexe: `UNIQUE (learning_phase_id, position)`; Indexe auf `learning_phase_id`, `status`.

### 7.5 `content_blocks`

**Zweck:** Einzelner Inhaltsbaustein einer Lektion; typspezifische Konfiguration in `config`.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `lesson_id` | `uuid not null` | FK → `lessons(id) ON DELETE CASCADE` |
| `block_type` | `block_type not null` | siehe Enum |
| `position` | `integer not null` | Sortierung in der Lektion |
| `config` | `jsonb not null` | Zod-validierte Konfiguration je `block_type` (Abschnitt 12) |
| `created_at` / `updated_at` | `timestamptz not null` | |

Constraints/Indexe: `UNIQUE (lesson_id, position)`; Indexe auf `lesson_id`, `(block_type)`.

Antwort-Daten der Teilnehmer liegen **nie** im Block, sondern in eigenen Tabellen (`assignment_submissions`, `reflection_entries`, `quiz_attempts`, `lesson_progress`).

---

## 8. Release Engine

### 8.1 `lesson_releases`

**Zweck:** Regelt pro Cohort (optional pro Person), wann eine Lektion freigeschaltet wird. Die Auswertungslogik ist eine reine Funktion in `packages/domain` (Release Engine); diese Tabelle ist ihre Datenbasis.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `cohort_id` | `uuid not null` | FK → `cohorts(id) ON DELETE CASCADE` |
| `profile_id` | `uuid` | FK → `profiles(id) ON DELETE CASCADE`; nullable. Gesetzt = individuelle Regel für genau diese Person, die die Cohort-Regel überschreibt |
| `lesson_id` | `uuid not null` | FK → `lessons(id) ON DELETE CASCADE` |
| `release_mode` | `release_mode not null` | siehe 8.2 |
| `release_at` | `timestamptz` | Pflicht bei `at_datetime`, sonst null |
| `due_at` | `timestamptz` | optionale Fälligkeit (Anzeige/Erinnerung, keine Sperre) |
| `expires_at` | `timestamptz` | optional: danach wieder gesperrt/ausgeblendet |
| `offset_days` | `integer` | Pflicht bei `days_after_session`/`days_before_session` (>= 0) |
| `session_id` | `uuid` | FK → `cohort_sessions(id) ON DELETE RESTRICT`; Pflicht bei den session-relativen Modi |
| `prerequisite_lesson_id` | `uuid` | FK → `lessons(id) ON DELETE RESTRICT`; Pflicht bei `after_lesson` |
| `prerequisite_module_id` | `uuid` | FK → `modules(id) ON DELETE RESTRICT`; Pflicht bei `after_module` |
| `released_at` | `timestamptz` | tatsächlicher Freischaltzeitpunkt; bei `manual` gesetzt durch die explizite Freischalt-Aktion eines berechtigten Admins (Capability `cohorts.manage`, siehe `docs/RBAC.md`), bei anderen Modi beim ersten Wirksamwerden protokolliert |
| `created_at` / `updated_at` | `timestamptz not null` | |

Constraints/Indexe:
- `UNIQUE (cohort_id, lesson_id, profile_id)` – pro Ziel genau eine Regel (Postgres behandelt `NULL` in Unique-Indexen als verschieden; daher zusätzlich partieller Unique-Index `UNIQUE (cohort_id, lesson_id) WHERE profile_id IS NULL` für die Cohort-Regel).
- CHECK-Constraints je Modus (z. B. `release_mode = 'at_datetime' → release_at IS NOT NULL`).
- Indexe: `(cohort_id)`, `(lesson_id)`, `(session_id)`, `(profile_id)`.

### 8.2 Semantik der `release_mode`-Werte

| Modus | Bedeutung | Pflichtfelder |
|---|---|---|
| `immediate` | sofort frei, sobald die Lektion `published` ist und die Regel existiert | – |
| `at_datetime` | frei ab festem Zeitpunkt `release_at` | `release_at` |
| `days_after_session` | frei ab `offset_days` Tagen **nach** Beginn des referenzierten Offensivtags (`session_id`) | `offset_days`, `session_id` |
| `days_before_session` | frei ab `offset_days` Tagen **vor** Beginn des referenzierten Offensivtags – typisch für `before_day`-Phasen | `offset_days`, `session_id` |
| `after_lesson` | frei, sobald der Teilnehmer die Voraussetzungs-Lektion abgeschlossen hat (`lesson_progress.status = 'completed'`) | `prerequisite_lesson_id` |
| `after_module` | frei, sobald das Voraussetzungs-Modul abgeschlossen ist (alle veröffentlichten Lektionen des Moduls `completed`, siehe `module_progress`) | `prerequisite_module_id` |
| `manual` | frei erst, wenn ein berechtigter Admin (Capability `cohorts.manage`) die Freischaltung explizit auslöst (setzt `released_at`) | – |

Gesperrte Lektionen sind in der App als Vorschau sichtbar (Titel + Begründung, z. B. "Wird nach Offensivtag 2 freigeschaltet"), aber ihre Inhalte sind serverseitig (RLS) nicht lesbar – die Vorschau nutzt nur `lessons.title/summary` und den Regeltext.

---

## 9. Lern-Entitäten

### 9.1 `course_enrollments`

**Zweck:** Einschreibung eines Teilnehmers in ein Programm im Kontext seiner Cohort; trägt den Gesamtstatus des Durchlaufs.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `profile_id` | `uuid not null` | FK → `profiles(id) ON DELETE CASCADE` |
| `cohort_id` | `uuid not null` | FK → `cohorts(id) ON DELETE CASCADE` |
| `status` | `enrollment_status not null default 'active'` | |
| `enrolled_at` | `timestamptz not null default now()` | |
| `completed_at` | `timestamptz` | |
| `created_at` / `updated_at` | `timestamptz not null` | |

Constraints/Indexe: `UNIQUE (profile_id, cohort_id)`; Index auf `cohort_id`.

### 9.2 `assignment_submissions`

**Zweck:** Einreichung zu einem `transfer_task`-Block (Text und/oder Datei).

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `profile_id` | `uuid not null` | FK → `profiles(id) ON DELETE CASCADE` |
| `content_block_id` | `uuid not null` | FK → `content_blocks(id) ON DELETE RESTRICT`; muss `block_type = 'transfer_task'` sein (Trigger-Check) |
| `cohort_id` | `uuid not null` | FK → `cohorts(id) ON DELETE CASCADE`; denormalisiert für RLS/Trainer-Abfragen |
| `status` | `submission_status not null default 'submitted'` | `submitted → seen → feedback_given → done` |
| `note_text` | `text` | Antworttext |
| `file_path` | `text` | Storage-Pfad, nullable |
| `visibility` | `record_visibility not null default 'private'` | Datensatzebene, siehe Abschnitt 10 |
| `submitted_at` | `timestamptz not null default now()` | |
| `created_at` / `updated_at` | `timestamptz not null` | |

Constraints/Indexe: `UNIQUE (profile_id, content_block_id)` (eine aktuelle Einreichung pro Aufgabe; Überarbeitung = Update); Indexe auf `(cohort_id, status)`, `(content_block_id)`.

### 9.3 `reflection_entries`

**Zweck:** Persönliche Reflexionsantworten zu `reflection`-Blöcken. Sensibelste Daten der App.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `profile_id` | `uuid not null` | FK → `profiles(id) ON DELETE CASCADE` |
| `content_block_id` | `uuid not null` | FK → `content_blocks(id) ON DELETE RESTRICT`; muss `block_type = 'reflection'` sein |
| `cohort_id` | `uuid not null` | FK → `cohorts(id) ON DELETE CASCADE` |
| `body` | `text not null` | Reflexionstext |
| `visibility` | `record_visibility not null default 'private'` | **auf Datensatzebene**; `trainer` nur durch expliziten Teilnehmer-Opt-in |
| `created_at` / `updated_at` | `timestamptz not null` | |

Constraints/Indexe: `UNIQUE (profile_id, content_block_id)`; Index auf `(cohort_id) WHERE visibility = 'trainer'` (Trainer-Sicht). Org-Admins haben **keinerlei** Lesezugriff, auch nicht auf `visibility='trainer'`-Einträge.

### 9.4 `quizzes`, `quiz_questions`, `quiz_options`, `quiz_attempts`

**`quizzes`** – Definition eines Quiz, referenziert von genau einem `quiz`-Block (`content_blocks.config.quiz_id`).

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `content_block_id` | `uuid not null` | FK → `content_blocks(id) ON DELETE CASCADE`; `UNIQUE` |
| `title` | `text not null` | |
| `pass_threshold_pct` | `integer` | Bestehensgrenze in %, nullable = kein Bestehen nötig |
| `max_attempts` | `integer` | nullable = unbegrenzt |
| `shuffle_questions` | `boolean not null default false` | |
| `shuffle_options` | `boolean not null default false` | |
| `created_at` / `updated_at` | `timestamptz not null` | |

**`quiz_questions`**

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `quiz_id` | `uuid not null` | FK → `quizzes(id) ON DELETE CASCADE` |
| `question_type` | `question_type not null` | `single` \| `multiple` \| `truefalse` \| `freetext` |
| `body` | `text not null` | Fragetext |
| `explanation` | `text` | Erklärung, wird nach Beantwortung gezeigt |
| `position` | `integer not null` | |
| `created_at` / `updated_at` | `timestamptz not null` | |

`UNIQUE (quiz_id, position)`.

**`quiz_options`** (für `single`/`multiple`/`truefalse`)

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `question_id` | `uuid not null` | FK → `quiz_questions(id) ON DELETE CASCADE` |
| `body` | `text not null` | |
| `is_correct` | `boolean not null default false` | via RLS nie an Teilnehmer-Clients ausgeliefert; Auswertung serverseitig |
| `position` | `integer not null` | |

`UNIQUE (question_id, position)`.

**`quiz_attempts`**

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `quiz_id` | `uuid not null` | FK → `quizzes(id) ON DELETE CASCADE` |
| `profile_id` | `uuid not null` | FK → `profiles(id) ON DELETE CASCADE` |
| `attempt_number` | `integer not null` | 1..n |
| `answers` | `jsonb not null` | pro Frage gewählte Option-IDs bzw. Freitext; Zod-validiertes Antwortformat |
| `score_pct` | `integer` | Ergebnis in %; null solange `freetext`-Anteile unbewertet |
| `passed` | `boolean` | Ergebnis gegen `pass_threshold_pct` |
| `started_at` | `timestamptz not null default now()` | |
| `finished_at` | `timestamptz` | |

Constraints/Indexe: `UNIQUE (quiz_id, profile_id, attempt_number)`; Index auf `(profile_id, quiz_id)`.

### 9.5 `lesson_progress`

**Zweck:** Fortschritt eines Teilnehmers pro Lektion; Grundlage der View `module_progress` und der Modi `after_lesson`/`after_module`.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `profile_id` | `uuid not null` | FK → `profiles(id) ON DELETE CASCADE` |
| `lesson_id` | `uuid not null` | FK → `lessons(id) ON DELETE CASCADE` |
| `cohort_id` | `uuid not null` | FK → `cohorts(id) ON DELETE CASCADE` |
| `status` | `progress_status not null default 'not_started'` | |
| `started_at` | `timestamptz` | |
| `completed_at` | `timestamptz` | gesetzt bei `completed` |
| `created_at` / `updated_at` | `timestamptz not null` | |

Constraints/Indexe: `UNIQUE (profile_id, lesson_id)`; Indexe auf `(cohort_id, lesson_id)`, `(profile_id, status)`.

### 9.6 `module_progress` (SQL-View, keine Tabelle)

Berechnete Sicht: pro `(profile_id, cohort_id, module_id)` die Zahl veröffentlichter Lektionen des Moduls, die Zahl abgeschlossener Lektionen (`lesson_progress.status = 'completed'`), ein Prozentwert und ein abgeleiteter Status (`completed`, wenn alle veröffentlichten Lektionen abgeschlossen sind; `in_progress`, wenn mindestens eine begonnen; sonst `not_started`).

Bewusst als View statt Tabelle: keine redundante Persistenz, keine Synchronisationsfehler, die Definition ist die einzige Wahrheit der Fortschrittsberechnung (Spiegelbild der reinen Funktion in `packages/domain`, die die identische Logik client-/edge-seitig rechnet und getestet ist). Die View respektiert RLS über die zugrunde liegenden Tabellen (`security_invoker = on`). Org-Admins sehen nur hierüber aggregierte Zahlen, nie Einzelinhalte.

### 9.7 `action_plans` und `action_plan_items`

**Zweck:** Persönlicher Umsetzungsplan des Teilnehmers; nach Modul 5 zusammengeführt zum 90-Tage-Offensivplan (PDF-Export über Edge Function).

**`action_plans`**

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `profile_id` | `uuid not null` | FK → `profiles(id) ON DELETE CASCADE` |
| `cohort_id` | `uuid not null` | FK → `cohorts(id) ON DELETE CASCADE` |
| `module_id` | `uuid` | FK → `modules(id) ON DELETE SET NULL`; null = übergreifender 90-Tage-Offensivplan |
| `title` | `text not null` | |
| `share_with_trainer` | `boolean not null default false` | Opt-in analog `visibility` |
| `created_at` / `updated_at` | `timestamptz not null` | |

Indexe: `(profile_id, cohort_id)`, partiell `(cohort_id) WHERE share_with_trainer`.

**`action_plan_items`**

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `action_plan_id` | `uuid not null` | FK → `action_plans(id) ON DELETE CASCADE` |
| `insight` | `text` | Feld "Erkenntnis" |
| `behavior` | `text` | Feld "Verhalten" |
| `measure` | `text` | Feld "Maßnahme" |
| `team` | `text` | Feld "Mannschaft" (wen beziehe ich ein) |
| `outcome` | `text` | Feld "Ergebnis" |
| `status` | `action_item_status not null default 'geplant'` | `geplant → begonnen → umgesetzt → reflektiert` |
| `due_date` | `date` | optional |
| `position` | `integer not null` | |
| `created_at` / `updated_at` | `timestamptz not null` | |

`UNIQUE (action_plan_id, position)`.

### 9.8 `trainer_feedback`

**Zweck:** Rückmeldung eines Trainers zu einer Einreichung, einer freigegebenen Reflexion oder einem geteilten Aktionsplan. Genau ein Ziel pro Zeile.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `trainer_profile_id` | `uuid not null` | FK → `profiles(id) ON DELETE RESTRICT` |
| `recipient_profile_id` | `uuid not null` | FK → `profiles(id) ON DELETE CASCADE` |
| `submission_id` | `uuid` | FK → `assignment_submissions(id) ON DELETE CASCADE` |
| `reflection_id` | `uuid` | FK → `reflection_entries(id) ON DELETE CASCADE` |
| `action_plan_id` | `uuid` | FK → `action_plans(id) ON DELETE CASCADE` |
| `body` | `text not null` | Feedback-Text |
| `created_at` / `updated_at` | `timestamptz not null` | |

Constraint: CHECK "genau eines von `submission_id`/`reflection_id`/`action_plan_id` ist gesetzt". Indexe auf allen drei Ziel-FKs und `recipient_profile_id`.

---

## 10. Sichtbarkeitsmodell (visibility auf Datensatzebene)

- `reflection_entries.visibility` und `assignment_submissions.visibility` (sowie `action_plans.share_with_trainer`) stehen **am einzelnen Datensatz**, nicht am Block oder an der Lektion. Der Teilnehmer entscheidet pro Antwort neu.
- `private` (Default): nur der Teilnehmer selbst.
- `trainer`: zusätzlich lesbar für Trainer der zugehörigen Cohort (`app.is_cohort_trainer(cohort_id)`), Grundlage für `trainer_feedback`.
- **Org-Admins sehen Reflexionstexte nie** – unabhängig von `visibility`. Sie erhalten ausschließlich Aggregate (z. B. über `module_progress`).
- Der Super Admin arbeitet über serverseitige Edge Functions; auch dort werden Reflexionsinhalte nur für Support-Fälle mit Audit-Log-Eintrag angefasst.
- Durchsetzung: RLS-Policies auf Zeilenebene + serverseitige Rechteprüfung in Edge Functions; das UI blendet nur zusätzlich aus (Defense in Depth – das UI ist nie die Sicherheitsgrenze).

---

## 11. Kommunikation, Zugang, Betrieb

### 11.1 `announcements`

**Zweck:** Mitteilungen an eine Organisation oder eine Cohort ("Aus der Kabine").

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `audience` | `announcement_audience not null` | `organization` \| `cohort` |
| `organization_id` | `uuid` | FK → `organizations(id) ON DELETE CASCADE` |
| `cohort_id` | `uuid` | FK → `cohorts(id) ON DELETE CASCADE` |
| `author_profile_id` | `uuid not null` | FK → `profiles(id) ON DELETE RESTRICT` |
| `title` | `text not null` | |
| `body` | `text not null` | |
| `published_at` | `timestamptz` | null = Entwurf |
| `created_at` / `updated_at` | `timestamptz not null` | |

Constraint: CHECK passend zu `audience` (genau das jeweilige Ziel-FK gesetzt). Indexe: `(cohort_id, published_at)`, `(organization_id, published_at)`.

### 11.2 `notifications`

**Zweck:** In-App-/Push-Benachrichtigung an eine Person, mit Deep Link. Push wird sparsam eingesetzt.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `profile_id` | `uuid not null` | FK → `profiles(id) ON DELETE CASCADE` |
| `title` | `text not null` | |
| `body` | `text` | |
| `deep_link` | `text` | expo-router-Pfad, z. B. `/lesson/{id}` |
| `status` | `notification_status not null default 'pending'` | |
| `sent_at` | `timestamptz` | |
| `read_at` | `timestamptz` | |
| `created_at` | `timestamptz not null` | |

Indexe: `(profile_id, status)`, `(profile_id, created_at DESC)`.

### 11.3 `push_tokens`

**Zweck:** Gerätebezogene Expo-Push-Tokens.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `profile_id` | `uuid not null` | FK → `profiles(id) ON DELETE CASCADE` |
| `token` | `text not null` | Expo Push Token |
| `platform` | `text not null` | `ios` \| `android` (CHECK) |
| `device_label` | `text` | z. B. Modellname |
| `last_seen_at` | `timestamptz not null default now()` | für das Ausmisten toter Tokens |
| `created_at` | `timestamptz not null` | |

Constraints/Indexe: `UNIQUE (token)`; Index auf `profile_id`.

### 11.4 `invitations`

**Zweck:** Einladungsflüsse ohne Klartext-Anfangspasswörter. Es wird nur der Hash des Einladungstokens gespeichert; der Klartext-Token existiert ausschließlich im E-Mail-Link.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `organization_id` | `uuid not null` | FK → `organizations(id) ON DELETE CASCADE` |
| `cohort_id` | `uuid` | FK → `cohorts(id) ON DELETE SET NULL`; optionale Direktzuordnung |
| `email` | `text not null` | Zieladresse |
| `first_name` / `last_name` | `text` | für die Anrede |
| `role` | `membership_role not null default 'participant'` | |
| `token_hash` | `text not null` | Hash des Einmal-Tokens; nie Klartext |
| `status` | `invitation_status not null default 'pending'` | abgeleitet auch aus den Zeitfeldern |
| `expires_at` | `timestamptz not null` | |
| `accepted_at` | `timestamptz` | |
| `revoked_at` | `timestamptz` | |
| `invited_by_profile_id` | `uuid not null` | FK → `profiles(id) ON DELETE RESTRICT` |
| `accepted_profile_id` | `uuid` | FK → `profiles(id) ON DELETE SET NULL` |
| `created_at` / `updated_at` | `timestamptz not null` | |

Constraints/Indexe: `UNIQUE (token_hash)`; partieller Unique-Index `(organization_id, lower(email)) WHERE status = 'pending'` (keine doppelten offenen Einladungen); Index auf `expires_at`. Zugriff nur über Edge Functions (service role), keine Client-RLS-Lesbarkeit des `token_hash`.

### 11.5 `learning_assets`

**Zweck:** Metadaten zu Dateien in privaten Storage-Buckets (Videos, PDFs, Audio, Bilder). Pfadkonvention `organizations/{orgId}/...`; Auslieferung ausschließlich über Signed URLs.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `organization_id` | `uuid` | FK → `organizations(id) ON DELETE RESTRICT`; null = programmweites Aigner-Asset |
| `storage_path` | `text not null` | Pfad im Bucket |
| `file_name` | `text not null` | Original-Dateiname |
| `mime_type` | `text not null` | |
| `size_bytes` | `bigint not null` | |
| `uploaded_by_profile_id` | `uuid` | FK → `profiles(id) ON DELETE SET NULL` |
| `created_at` | `timestamptz not null` | |

Constraints/Indexe: `UNIQUE (storage_path)`; Index auf `organization_id`. Content-Blocks referenzieren Assets über `config` (`asset_id`), Validierung per Zod + serverseitiger Existenzprüfung.

### 11.6 `audit_logs`

**Zweck:** Revisionssicheres Protokoll sicherheitsrelevanter Aktionen (Einladungen, Rollenwechsel, Freischaltungen, Datenexporte, Löschungen). **INSERT-only**: keine UPDATE-/DELETE-Policies, auch nicht für Org-Admins; Schreibzugriff nur über Edge Functions/Trigger.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `actor_profile_id` | `uuid` | FK → `profiles(id) ON DELETE SET NULL`; null = Systemaktion |
| `organization_id` | `uuid` | FK → `organizations(id) ON DELETE SET NULL`; Kontext |
| `action` | `text not null` | maschinenlesbarer Aktionsname, z. B. `invitation.revoked` |
| `entity_type` | `text not null` | Tabellenname des betroffenen Objekts |
| `entity_id` | `uuid` | betroffener Datensatz |
| `metadata` | `jsonb not null default '{}'` | Kontextdaten; **keine** sensiblen Inhalte (keine Reflexionstexte, keine Tokens) |
| `created_at` | `timestamptz not null default now()` | |

Indexe: `(organization_id, created_at DESC)`, `(actor_profile_id)`, `(entity_type, entity_id)`.

### 11.7 `user_consents`

**Zweck:** Nachweis der Zustimmung (Datenschutzerklärung, ggf. weitere Dokumente) mit Version.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `profile_id` | `uuid not null` | FK → `profiles(id) ON DELETE RESTRICT` (Nachweis bleibt, siehe Abschnitt 13) |
| `consent_type` | `text not null` | z. B. `privacy_policy` |
| `document_version` | `text not null` | Versionskennung des Dokuments |
| `granted_at` | `timestamptz not null default now()` | |
| `revoked_at` | `timestamptz` | |

Constraints/Indexe: `UNIQUE (profile_id, consent_type, document_version)`; Index auf `profile_id`.

### 11.8 `account_deletion_requests`

**Zweck:** DSGVO-Löschbegehren mit nachvollziehbarem Ablauf.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` PK | |
| `profile_id` | `uuid not null` | FK → `profiles(id) ON DELETE RESTRICT` (bis zur Ausführung) |
| `status` | `deletion_request_status not null default 'requested'` | |
| `requested_at` | `timestamptz not null default now()` | |
| `confirmed_at` | `timestamptz` | Bestätigung durch den Nutzer (E-Mail-Link) |
| `processed_at` | `timestamptz` | Ausführung durch Edge Function |
| `processed_by_profile_id` | `uuid` | FK → `profiles(id) ON DELETE SET NULL` |
| `notes` | `text` | interner Vermerk |
| `created_at` / `updated_at` | `timestamptz not null` | |

Index: `(status)`.

---

## 12. JSONB-Nutzungsregeln

JSONB ist erlaubt an genau drei Stellen – überall sonst gilt: relational modellieren.

1. **`content_blocks.config`** – typspezifische Block-Konfiguration. Für jeden `block_type` existiert ein Zod-Schema in `packages/validation` (z. B. `video`: `asset_id`, `caption`; `checklist`: `items[]`; `scale`: `min`, `max`, `labels`; `transfer_task`: `prompt`, `allow_file_upload`; `quiz`: `quiz_id`). Schreiben nur über Admin-UI/Edge Functions, die gegen das Schema validieren; zusätzlich prüft ein DB-Trigger die Grundform. Kein Client interpretiert unvalidiertes JSON.
2. **`organization_memberships.permissions`** – Capability-Overrides für Org-Admins (Schlüssel aus dem festen Capability-Katalog in `packages/domain`, Werte boolesch). Zod-validiert; unbekannte Schlüssel werden abgelehnt.
3. **`quiz_attempts.answers`** und **`audit_logs.metadata`** – strukturierte, schemadefinierte Nutzdaten ohne eigene Abfrage-Anforderungen.

Regeln: Sobald ein JSONB-Feld gefiltert, gejoint oder aggregiert werden müsste, wird es in eine eigene Tabelle/Spalte überführt (per Migration). Keine "Sonstiges"-JSON-Spalten, keine unversionierten Formate – jedes Schema trägt implizit die Version über die Migrationshistorie und die Zod-Definition im Monorepo.

---

## 13. Lösch- und Anonymisierungsstrategie

Grundprinzip: **Löschen, was personenbezogen und entbehrlich ist; anonymisieren, was für Statistik/Integrität gebraucht wird; behalten, was rechtlich nachweispflichtig ist.** Die Ausführung übernimmt eine Edge Function (service role) im Rahmen von `account_deletion_requests`; jeder Lauf erzeugt einen `audit_logs`-Eintrag ohne Personenbezug im `metadata`.

Punkte mit **[zu klären]** benötigen eine Entscheidung mit Datenschutzberatung (Fristen, Rechtsgrundlagen) vor Produktivbetrieb.

| Entität | Bei Account-Löschung | Anmerkung |
|---|---|---|
| `auth.users` | **löschen** | entfernt Zugangsdaten und E-Mail |
| `profiles` | **anonymisieren**: Namen → "Gelöschter Nutzer", `avatar_path` → null (Datei im Storage löschen), `status='deleted'` | Zeile bleibt als FK-Anker, solange abhängige anonymisierte Daten existieren; Alternativ-Vollöschung [zu klären] |
| `organization_memberships` | **löschen** | |
| `cohort_trainers` / `cohort_members` | **löschen** | Aggregate der Cohort dürfen sich dadurch ändern; Alternative "anonymisiert behalten" für stabile Statistik [zu klären] |
| `cohort_sessions.trainer_profile_id` | **auf null setzen** | Termin bleibt bestehen |
| `course_enrollments` | **löschen** | |
| `lesson_progress` | **löschen** | |
| `assignment_submissions` | **löschen** inkl. Storage-Dateien | |
| `reflection_entries` | **löschen** | höchste Priorität, keine Aufbewahrung |
| `quiz_attempts` | **löschen** | anonymisierte Aufbewahrung für Programmauswertung [zu klären] |
| `action_plans` / `action_plan_items` | **löschen** inkl. exportierter PDFs im Storage | |
| `trainer_feedback` | **löschen**, wenn der Empfänger gelöscht wird; bei Löschung des **Trainers** Autor anonymisieren, Text erhalten [zu klären] | Feedback ist auch Arbeitsdokumentation des Empfängers |
| `announcements` | Autor **anonymisieren** (`author_profile_id` bleibt auf anonymisiertes Profil), Inhalt bleibt | organisationsbezogener Inhalt, kein privater |
| `notifications` | **löschen** | |
| `push_tokens` | **löschen** (zusätzlich sofort bei Logout/Deaktivierung) | |
| `invitations` | offene Einladungen der Person **widerrufen/löschen**; `accepted_profile_id` → null; Aufbewahrungsfrist angenommener Einladungen [zu klären] | `token_hash` ist ohne Klartext wertlos |
| `learning_assets` | `uploaded_by_profile_id` → null | Inhalte gehören der Organisation/dem Programm |
| `audit_logs` | **behalten**, `actor_profile_id` → null (Anonymisierung über FK `SET NULL` bzw. Verweis auf anonymisiertes Profil) | Nachweisfunktion; Aufbewahrungsdauer [zu klären] |
| `user_consents` | **behalten** bis Ablauf der Nachweispflicht, danach löschen; Frist [zu klären] | Nachweis der erteilten Einwilligung ist gerade im Streitfall relevant |
| `account_deletion_requests` | **behalten** (Nachweis der Löschung selbst), `notes` von Personenbezug befreien; Aufbewahrungsdauer [zu klären] | |
| `organizations`, Programmstruktur (`programs`…`content_blocks`), `lesson_releases`, `quizzes/-questions/-options`, `cohorts` | **unberührt** | keine personenbezogenen Teilnehmerdaten |

Organisations-Offboarding (Vertragsende einer Kundenfirma) ist ein separater Prozess: Organisation auf `archived`, Datenexport auf Wunsch, danach Löschlauf über alle organisationsgebundenen Daten inkl. Storage-Präfix `organizations/{orgId}/` – Fristen und Umfang [zu klären, vertraglich zu regeln].

---

## 14. Abgrenzung

- RLS-Policies im Detail, Auth-Flüsse, MFA: `docs/SECURITY.md`
- Release-Engine-Algorithmus (reine Funktionen, Tests): `packages/domain`
- Zod-Schemas der Block-Configs: `packages/validation`
- Migrationsworkflow und Environments (local/staging/production): `docs/ENVIRONMENTS.md`

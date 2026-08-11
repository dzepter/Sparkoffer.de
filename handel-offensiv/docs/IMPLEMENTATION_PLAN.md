# Umsetzungsplan – Handel Offensiv Learning App

**Dokument:** `docs/IMPLEMENTATION_PLAN.md`
**Produkt:** Digitaler Begleiter des Präsenzprogramms „HANDEL OFFENSIV – Der Führungsführerschein für den Handel"
**Auftraggeber:** Aigner Offensiv – Institut für Führung und Vertrieb, München

---

## Wie dieses Dokument zu lesen ist

Dieser Plan beschreibt, **in welcher Reihenfolge** die App gebaut wird und **woran man erkennt, dass ein Abschnitt fertig ist**. Er ist bewusst in neun Phasen gegliedert, die aufeinander aufbauen: Erst das Fundament (Datenbank, Sicherheit, Projektstruktur), dann das Verwaltungswerkzeug für Trainer und Administratoren, dann die App für die Teilnehmer, zuletzt Qualitätssicherung und Veröffentlichung in den App Stores.

Die Abschnitte **„Ziele"** und **„Definition of Done"** jeder Phase sind so geschrieben, dass sie auch ohne IT-Hintergrund verständlich sind. Die **Arbeitspakete** dazwischen sind die technische Checkliste für das Entwicklungsteam.

Zwei Grundsätze ziehen sich durch alle Phasen:

1. **Sicherheit zuerst, nicht nachträglich.** Zugriffsregeln (wer darf was sehen) werden in der Datenbank selbst verankert, bevor die erste Oberfläche gebaut wird – nicht als Nachbesserung am Ende.
2. **Kleine, überprüfbare Schritte.** Jede Phase endet mit etwas, das man anfassen, testen und abnehmen kann. Es gibt keinen Punkt, an dem monatelang „im Dunkeln" gebaut wird.

Dieser Plan enthält bewusst **keine Kalendertermine**. Die Reihenfolge und die Fertigstellungskriterien sind verbindlich; die Dauer der Phasen hängt von Teamgröße und Rückmeldegeschwindigkeit ab und wird in der Projektsteuerung separat geführt.

---

## Phasenüberblick

| Phase | Name | Ergebnis in einem Satz |
|---|---|---|
| 1 | Architektur | Alle Struktur-, Technologie- und Sicherheitsentscheidungen sind dokumentiert und abgenommen. |
| 2 | Foundation | Monorepo, Datenbankschema, Zugriffsregeln (RLS) und Basis-Pakete stehen und sind getestet. |
| 3 | Admin Core | Super Admin und Org-Admins können Organisationen, Nutzer, Gruppen und Einladungen verwalten. |
| 4 | Teilnehmer Core | Teilnehmer können sich einladen lassen, anmelden und ihr Programm mit Terminen sehen. |
| 5 | Learning Engine | Inhalte, Freischaltlogik, Quiz, Transferaufgaben, Reflexionen und Umsetzungspläne funktionieren. |
| 6 | Communication | Ankündigungen, Push-Benachrichtigungen und Trainer-Feedback sind im Einsatz. |
| 7 | Privacy & Security | Datenschutz-Funktionen, Härtung und Audit sind vollständig; die App ist DSGVO-tauglich betreibbar. |
| 8 | QA | Alle Testebenen laufen automatisiert; die definierten Testfälle sind grün. |
| 9 | Store Release | Die App ist in App Store und Play Store veröffentlicht; das Admin-Portal läuft produktiv. |

**Abhängigkeitslogik:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9. Phasen 3 und 4 können sich teilweise überlappen, sobald Phase 2 abgeschlossen ist. Phase 7 sammelt zwar am Ende, aber die Sicherheitsgrundlagen (RLS, Einladungsflow ohne Klartextpasswörter, Audit-Log-Tabelle) entstehen bereits in Phase 2/3 – Phase 7 vervollständigt und prüft sie.

---

## Phase 1 – Architektur

### Ziele

Bevor Code entsteht, ist schriftlich festgehalten, **wie** die App gebaut wird: Welche Bausteine es gibt, wo Daten liegen, wer worauf zugreifen darf und wie das Produkt aussehen soll. Damit ist sichergestellt, dass Entwickler und Auftraggeber vom selben Produkt sprechen und spätere Entscheidungen nicht improvisiert werden.

### Arbeitspakete

- [ ] `docs/ARCHITECTURE.md`: Gesamtarchitektur (Monorepo-Struktur, Supabase als Backend, Expo-App, Next.js-Admin, Paketaufteilung `types` / `validation` / `domain` / `config`)
- [ ] `docs/DATA_MODEL.md`: vollständiges Datenmodell inkl. Mandantenfähigkeit (`organizations` → `organization_memberships` → `cohorts`), Programmstruktur (`programs` → `modules` → `learning_phases` → `lessons` → `content_blocks`) und Lern-Entitäten
- [ ] `docs/SECURITY.md`: Rollenmodell (Super Admin, Org-Admin, Trainer, Teilnehmer), RLS-Strategie, SECURITY-DEFINER-Hilfsfunktionen im Schema `app`, Defense-in-Depth-Prinzip (RLS + serverseitige Prüfung + UI nur als UX)
- [ ] `docs/RBAC.md`: Capability-Katalog (`organizations.read/manage`, `users.read/invite/manage`, `cohorts.read/manage`, `content.read/edit/publish`, `submissions.read/feedback`, `analytics.read`, `notifications.send`, `audit.read`, `settings.manage`) und Zuordnung Rollen → Capabilities
- [ ] `docs/RELEASE_ENGINE.md`: Freischaltmodi (`immediate`, `at_datetime`, `days_after_session`, `days_before_session`, `after_lesson`, `after_module`, `manual`), Auflösungsreihenfolge, Verhalten gesperrter Lektionen („Wird nach Offensivtag 2 freigeschaltet.")
- [ ] `docs/DESIGN_SYSTEM.md`: Design Tokens aus der bestehenden Aigner-Offensiv-Website (green `#A8C62B`, greenBright `#C5E33C`, dark `#12160E`, dark2 `#181D13`, paper `#F7F6F1`, ink `#131711`, inkSoft `#454B42`, line `#E3E3D8`), Schrift Archivo (lokal gebundelt), Radius 2 px, große Modulnummern, subtile Taktiklinien, expliziter Light Mode
- [ ] `docs/ENVIRONMENTS.md`: drei getrennte Supabase-Projekte (local / staging / production), EU-Hostingregion, Secrets-Handling, Migrationsdisziplin (DB-Änderungen nur über versionierte Migrationen)
- [ ] Entscheidung dokumentieren: keine öffentliche Registrierung, kein Service-Role-Key im Client, Mobile-Tokens nur in `expo-secure-store`
- [ ] Review der Architektur-Dokumente durch Entwicklungsteam; Freigabe der Überblickskapitel durch Auftraggeber

### Abhängigkeiten

Keine. Startphase.

### Definition of Done

- Alle genannten Dokumente liegen in `handel-offensiv/docs/` und widersprechen sich nicht.
- Die verbindlichen Entscheidungen (Decision Spine) sind vollständig abgedeckt; offene Fragen sind als solche markiert, nicht stillschweigend entschieden.
- Auftraggeber hat die nicht-technischen Überblickskapitel gelesen und freigegeben.

---

## Phase 2 – Foundation

### Ziele

Das technische Fundament steht: Projektstruktur, Datenbank mit allen Tabellen und Zugriffsregeln, die gemeinsam genutzten Pakete und die automatische Qualitätsprüfung bei jeder Codeänderung. Nach dieser Phase existiert noch keine sichtbare App – aber alles, worauf die App aufbaut, ist da und getestet. Das ist vergleichbar mit dem Rohbau eines Hauses: unspektakulär, aber entscheidend dafür, dass später nichts einstürzt.

### Arbeitspakete

**Monorepo & Tooling**

- [ ] Monorepo unter `handel-offensiv/` mit pnpm workspaces anlegen (`apps/mobile`, `apps/admin`, `packages/types`, `packages/validation`, `packages/domain`, `packages/config`, `supabase/`, `docs/`)
- [ ] TypeScript strict in allen Paketen, gemeinsame `tsconfig`-Basis
- [ ] ESLint + Prettier einheitlich konfigurieren
- [ ] `.github/workflows/ci.yml`: Typecheck, Lint, Unit-Tests, Builds bei jedem Pull Request
- [ ] `packages/config`: Design Tokens (Farben, Schrift, Radius, Abstände) als typisierte Konstanten – einzige Quelle für Mobile und Admin

**Supabase & Datenbank**

- [ ] `supabase/config.toml`, lokale Entwicklungsumgebung mit Supabase CLI
- [ ] Migrationen für Identität & Mandanten: `profiles`, `organizations`, `organization_memberships` (UNIQUE auf `profile_id, organization_id`, `permissions jsonb`)
- [ ] Migrationen für Gruppen: `cohorts`, `cohort_trainers`, `cohort_members`, `cohort_sessions`
- [ ] Migrationen für Programmstruktur: `programs`, `modules`, `learning_phases`, `lessons`, `content_blocks`
- [ ] Migrationen für Release Engine: `lesson_releases` mit allen Modi und Feldern (`release_at`, `due_at`, `expires_at`, `offset_days`, `session_id`, `prerequisite_lesson_id`, `prerequisite_module_id`, `released_at`)
- [ ] Migrationen für Lern-Entitäten: `course_enrollments`, `assignment_submissions`, `reflection_entries`, `quizzes`/`quiz_questions`/`quiz_options`/`quiz_attempts`, `lesson_progress`, `module_progress` (View), `action_plans`/`action_plan_items`, `trainer_feedback`
- [ ] Migrationen für Kommunikation & Betrieb: `announcements`, `notifications`, `push_tokens`, `invitations` (`token_hash`, `expires_at`, `accepted_at`, `revoked_at`), `learning_assets`, `audit_logs` (INSERT-only), `user_consents`, `account_deletion_requests`
- [ ] SECURITY-DEFINER-Hilfsfunktionen im Schema `app`: `app.is_super_admin()`, `app.org_role(org_id)`, `app.is_cohort_trainer(cohort_id)`, `app.is_cohort_member(cohort_id)`
- [ ] RLS-Policies auf **allen** Client-Tabellen: Teilnehmer nur eigene Daten; Trainer nur zugewiesene Cohorts und nur `visibility='trainer'`; Org-Admins nur Aggregate der eigenen Organisation, nie Reflexionstexte; `audit_logs` für normale Admins unveränderlich
- [ ] Storage-Buckets für `learning_assets` (privat, Signed URLs, Pfadschema `organizations/{orgId}/...`)
- [ ] `seed.sql`: Standardprogramm „Handel Offensiv" mit den fünf Modulen (01 Führung beginnt bei mir · 02 Aus Mitarbeitern wird Mannschaft · 03 Die richtige Aufstellung · 04 Spielintelligenz mit KI · 05 Führen, wenn es darauf ankommt) samt Lernphasen-Gerüst; Demo-Daten für lokale Entwicklung

**Gemeinsame Pakete**

- [ ] `packages/types`: Domain- und DB-Typen für alle Tabellen und Enums
- [ ] `packages/validation`: Zod-Schemas, insbesondere pro `block_type` ein Config-Schema (text, video, audio, pdf, image, checklist, reflection, single_choice, multiple_choice, quiz, scale, transfer_task, download, external_link)
- [ ] `packages/domain`: RBAC-Capability-Schicht (Rollen → Capabilities, `can(actor, capability, scope)`), Release Engine als reine Funktion (Eingabe: Release-Regel + Kontext, Ausgabe: freigeschaltet ja/nein + Begründungstext), Fortschrittsberechnung – alles ohne Seiteneffekte und mit Unit-Tests

**App-Gerüste**

- [ ] `apps/mobile`: Expo-Projekt (aktuelles stabiles SDK) mit expo-router, @tanstack/react-query, @supabase/supabase-js, expo-notifications, expo-secure-store; Login-Platzhalter; Design Tokens angebunden; Archivo lokal gebundelt
- [ ] `apps/admin`: Next.js App Router mit Tailwind, minimaler shadcn/ui-Basis, @supabase/ssr; Login-Platzhalter; Design Tokens angebunden
- [ ] Environment-Konzept verdrahtet: local / staging / production mit getrennten Supabase-Projekten, keine Secrets im Repo

### Abhängigkeiten

Phase 1 (Datenmodell und Sicherheitskonzept müssen final sein, bevor Migrationen geschrieben werden).

### Definition of Done

- `pnpm install && pnpm typecheck && pnpm lint && pnpm test` läuft im gesamten Monorepo fehlerfrei.
- `supabase db reset` baut die Datenbank vollständig aus Migrationen + Seed auf, ohne manuelle Schritte.
- RLS ist auf jeder Client-Tabelle aktiv; ein erster Satz RLS-SQL-Tests (mindestens: Teilnehmer sieht fremde Daten nicht, Org-Admin sieht fremde Organisation nicht) läuft in CI.
- Die Release Engine und die RBAC-Schicht in `packages/domain` haben Unit-Tests für alle Modi bzw. alle Rollen.
- Beide App-Gerüste starten lokal und zeigen einen Screen im Design-Token-Look.

---

## Phase 3 – Admin Core

### Ziele

Das Admin-Portal kann den organisatorischen Kern abbilden: Der Super Admin (Aigner Offensiv) legt Kundenorganisationen an, Org-Admins verwalten ihre eigenen Nutzer und Gruppen, Einladungen gehen sicher per E-Mail-Link raus. Nach dieser Phase könnte man – noch ohne Lerninhalte – eine echte Kundenorganisation mit Teilnehmern und Terminen anlegen.

### Arbeitspakete

**Auth & Zugang (Admin)**

- [ ] E-Mail+Passwort-Login im Admin-Portal (@supabase/ssr, serverseitige Session)
- [ ] Passwort vergessen / Passwort ändern
- [ ] Rollenabhängige Navigation über die RBAC-Capability-Schicht (keine verstreuten `if role === ...`-Abfragen)
- [ ] MFA (TOTP) für Super Admin und Trainer vorbereitet und aktivierbar

**Super-Admin-Bereich (nur über Edge Functions mit Service Role, nie im Client)**

- [ ] Organisationen anlegen/bearbeiten/archivieren (`name`, `short_name`, Logo, Kontaktdaten, `status`, `internal_notes`)
- [ ] Nutzerübersicht über alle Organisationen, Deaktivierung von Konten
- [ ] Edge Function `admin-invite`: Invitation mit `token_hash` erzeugen, E-Mail mit sicherem Einmallink versenden – **nie** Klartext-Anfangspasswörter
- [ ] Edge Functions für Einladung erneut senden und Einladung zurückziehen (`revoked_at`)
- [ ] Audit-Log-Schreibungen für alle administrativen Aktionen (INSERT-only)

**Org-Admin-Bereich**

- [ ] Nutzer der eigenen Organisation einladen und verwalten (gemäß `permissions jsonb` feingranular einschränkbar)
- [ ] Cohorts (Gruppen) anlegen: Programmzuordnung, Name, Zeitraum, Status
- [ ] Cohort-Mitglieder und Cohort-Trainer zuordnen
- [ ] Cohort-Sessions (Offensivtage) pflegen: Titel, Beginn/Ende, Zeitzone, Ort, Adresse, Raum, Trainer, Notizen, Anfahrt
- [ ] Übersicht der eigenen Organisation (Mitglieder, Gruppen, Termine) – nur Aggregate, keine privaten Inhalte

**Einladungs-Annahme (Web-Flow)**

- [ ] Einmallink-Seite: Token prüfen (Hash-Vergleich, Ablauf, Widerruf), Passwort setzen, Datenschutzerklärung akzeptieren (`user_consents`), dann Login
- [ ] Fehlerfälle sauber behandelt: abgelaufener Token, bereits akzeptiert, widerrufen

### Abhängigkeiten

Phase 2 (Schema, RLS, Edge-Function-Infrastruktur, RBAC-Schicht).

### Definition of Done

- Kompletter Durchstich funktioniert auf Staging: Super Admin legt Organisation an → lädt Org-Admin ein → Org-Admin nimmt Einladung an, legt Cohort mit Sessions an, lädt Teilnehmer ein.
- Kein Weg im System, auf dem ein Anfangspasswort im Klartext existiert oder der Service-Role-Key den Server verlässt.
- Org-Admin einer Organisation kann nachweislich (RLS-Test) keine Daten einer anderen Organisation lesen oder schreiben.
- Alle administrativen Aktionen erscheinen im Audit-Log.

---

## Phase 4 – Teilnehmer Core

### Ziele

Die Mobile App wird für Teilnehmer nutzbar: Einladung annehmen, anmelden, das eigene Programm mit Modulen und Offensivtagen sehen, das eigene Profil pflegen. Die Lerninhalte selbst folgen in Phase 5 – hier geht es darum, dass sich die App bereits „nach Handel Offensiv anfühlt": ruhig, hochwertig, mit der Bildsprache der Marke, ohne Spielerei.

### Arbeitspakete

- [ ] Einladungsannahme in der App (Deep Link aus der E-Mail): Passwort setzen, Datenschutz akzeptieren, Login
- [ ] E-Mail+Passwort-Login; Tokens ausschließlich in `expo-secure-store`
- [ ] Passwort vergessen / ändern; Abmelden; „Alle Sitzungen beenden"
- [ ] Home/„Kabine": Begrüßung, nächster Offensivtag, aktueller Stand im Programm
- [ ] Programmübersicht: Module mit großen Nummern 01–05, Claim je Modul, Fortschrittsanzeige; gesperrte Inhalte als Vorschau mit Begründung („Wird nach Offensivtag 2 freigeschaltet.")
- [ ] Terminansicht: Offensivtage der eigenen Cohort mit Ort, Raum, Zeit, Anfahrt
- [ ] Profil: Name, Avatar (Upload in privaten Storage, Signed URLs), Sprache
- [ ] Offline-Basis: Cache der zuletzt geladenen Inhalte (react-query persist), definiertes Verhalten ohne Netz
- [ ] Datenminimierung umgesetzt: keine Berechtigungen für Kontakte, Standort oder Mikrofon im App-Manifest
- [ ] Design-QS: Light Mode konsequent, Archivo, Token-Farben, Radius 2 px, subtile Taktiklinien – Abnahme gegen `DESIGN_SYSTEM.md`

### Abhängigkeiten

Phase 3 (Einladungen und Cohort-Daten müssen aus dem Admin heraus erzeugbar sein).

### Definition of Done

- Ein per Admin eingeladener Teilnehmer kann auf einem echten Gerät (iOS und Android) die Einladung annehmen, sich anmelden und sieht sein Programm mit Terminen.
- RLS-Nachweis: Ein Teilnehmer sieht ausschließlich die eigene Cohort und die eigenen Daten.
- App startet und zeigt gecachte Inhalte auch ohne Netzverbindung; keine Abstürze im Flugmodus.
- Design-Abnahme durch Auftraggeber anhand der laufenden App (nicht anhand von Screenshots-Mockups).

---

## Phase 5 – Learning Engine

### Ziele

Das Herzstück: Trainer und Admins können Inhalte anlegen und zeitlich steuern; Teilnehmer bearbeiten Lektionen, Quiz, Transferaufgaben und Reflexionen; die App begleitet Vorbereitung, Vertiefung, Umsetzung und Reflexion rund um die Offensivtage. Nach dieser Phase ist der fachliche Kern des Produkts vollständig.

### Arbeitspakete

**Content-Verwaltung (Admin)**

- [ ] Programm-/Modul-/Lernphasen-/Lektionsverwaltung mit Positionierung und Statusworkflow (`draft` → `scheduled` → `published` → `archived`)
- [ ] Block-Editor für alle 14 Blocktypen; jede Config wird beim Speichern gegen das Zod-Schema aus `packages/validation` geprüft
- [ ] Medien-Upload in `learning_assets` (privat, Pfad `organizations/{orgId}/...`), Auslieferung über Signed URLs
- [ ] Vorschau einer Lektion aus Teilnehmersicht

**Release Engine (Admin + App)**

- [ ] Verwaltung von `lesson_releases` pro Cohort, optional pro einzelnem Teilnehmer (`profile_id`)
- [ ] Alle sieben Modi bedienbar, inkl. Kopplung an Sessions (`days_after_session` / `days_before_session`) und Voraussetzungen (`after_lesson` / `after_module`), manueller Freischaltung und Fälligkeit/Ablauf (`due_at`, `expires_at`)
- [ ] App wertet Freischaltung über die geteilte Funktion aus `packages/domain` aus; gesperrte Lektionen zeigen die korrekte Begründung
- [ ] Serverseitige Durchsetzung: Inhalte nicht freigegebener Lektionen sind per RLS/Query nicht abrufbar – die Sperre ist keine reine UI-Sache

**Lernen (App)**

- [ ] Lektions-Player: Blöcke in Reihenfolge, `lesson_progress` (`not_started` / `in_progress` / `completed`), Fortschritt je Modul über `module_progress`-View
- [ ] Quiz: single/multiple/truefalse/freetext, Erklärungen nach Antwort, Bestehensgrenze, maximale Versuche, Antwort-Shuffle; `quiz_attempts` vollständig gespeichert
- [ ] Transferaufgaben: Text und/oder Datei einreichen, Sichtbarkeit wählbar (`private` | `trainer`), Statusverlauf `submitted` → `seen` → `feedback_given` → `done`
- [ ] Reflexionen: Sichtbarkeit **pro Eintrag** (`private` | `trainer`); private Einträge verlassen nachweislich nie den Kreis des Teilnehmers
- [ ] Umsetzungspläne: `action_plans` mit Items (Erkenntnis, Verhalten, Maßnahme, Mannschaft, Ergebnis; Status geplant/begonnen/umgesetzt/reflektiert), optional mit Trainer geteilt; nach Modul 5 der 90-Tage-Offensivplan mit PDF-Export
- [ ] Offline: lokale Sicherung angefangener Antworten, Wiederholungsversand (Retry) bei Netzrückkehr, keine Doppel-Submissions

**Trainer-Sicht (Admin)**

- [ ] Cohort-Cockpit: Fortschritt der Gruppe (Aggregate), eingereichte Transferaufgaben, geteilte Reflexionen und geteilte Umsetzungspläne
- [ ] Feedback auf Einreichungen (`trainer_feedback`), Statuswechsel der Submission

### Abhängigkeiten

Phasen 3 und 4 (Admin-Verwaltung und Teilnehmer-Grundgerüst).

### Definition of Done

- Ein vollständiges Modul (z. B. „01 Führung beginnt bei mir") lässt sich im Admin anlegen, mit allen Blocktypen befüllen, per Release-Regel an eine Cohort koppeln und in der App vollständig durcharbeiten.
- Jeder der sieben Release-Modi ist per Unit-Test **und** per manuellem Durchstich auf Staging verifiziert.
- Sichtbarkeitsregeln nachgewiesen: Trainer sieht nur `trainer`-Inhalte der eigenen Cohorts; Org-Admin sieht keine Reflexionstexte; Teilnehmer sieht nichts von anderen.
- PDF-Export des 90-Tage-Offensivplans erzeugt ein sauberes, markenkonformes Dokument.
- Unterbrochene Einreichungen (Netzabbruch) gehen nicht verloren.

---

## Phase 6 – Communication

### Ziele

Die App hält Teilnehmer auf dem Laufenden, ohne zu nerven: Ankündigungen der Trainer, sparsame Push-Benachrichtigungen mit direktem Absprung zum Inhalt, Feedback-Benachrichtigungen. Kommunikation unterstützt das Präsenzprogramm – sie ersetzt es nicht und wird nicht zum Dauerfeuer.

### Arbeitspakete

- [ ] Ankündigungen (`announcements`): Trainer/Org-Admin verfasst Ankündigung an Cohort oder Organisation; Anzeige in der App
- [ ] In-App-Benachrichtigungszentrale (`notifications`) mit Gelesen-Status
- [ ] Push-Infrastruktur: `push_tokens` gerätebezogen registrieren/aufräumen (expo-notifications), Versand über Edge Function an den Expo Push Service
- [ ] Push-Anlässe definiert und bewusst begrenzt: neue Freischaltung, neue Ankündigung, erhaltenes Trainer-Feedback, Erinnerung vor Offensivtag
- [ ] Deep Links: jede Push führt direkt zum betreffenden Inhalt (Lektion, Ankündigung, Feedback, Termin)
- [ ] Benachrichtigungseinstellungen pro Nutzer (Push je Anlass abschaltbar); Systemberechtigung wird begründet und zum passenden Zeitpunkt erfragt, nicht beim ersten Start
- [ ] Capability `notifications.send` in der RBAC-Schicht durchgesetzt (wer darf an wen senden)
- [ ] Versand-Ereignisse im Audit-Log

### Abhängigkeiten

Phase 5 (Push-Anlässe setzen Releases, Feedback und Termine voraus); Phase 4 (App-Grundgerüst, Deep-Link-Routing).

### Definition of Done

- Push kommt auf echten iOS- und Android-Geräten an und öffnet per Deep Link den richtigen Bildschirm – auch aus beendetem App-Zustand.
- Abgeschaltete Anlässe erzeugen nachweislich keine Push mehr; die In-App-Zentrale zeigt sie weiterhin.
- Ungültig gewordene Gerätetokens werden automatisch bereinigt.
- Kein Versandweg umgeht die Capability-Prüfung.

---

## Phase 7 – Privacy & Security

### Ziele

Die App ist datenschutzkonform betreibbar und gegen die naheliegenden Angriffe gehärtet. Vieles davon ist seit Phase 2 eingebaut – diese Phase vervollständigt die nutzerseitigen Datenschutzfunktionen, prüft systematisch alle Zugriffsregeln nach und dokumentiert den Betrieb. Für den Auftraggeber heißt das: Auskunfts- und Löschpflichten gegenüber Teilnehmern sind technisch abgedeckt, und es gibt Belege statt Zusicherungen.

### Arbeitspakete

**Nutzerrechte (DSGVO)**

- [ ] Konto-Löschung: Teilnehmer stellt Antrag in der App (`account_deletion_requests`), definierter Prozess für Bestätigung und Durchführung inkl. Storage-Daten
- [ ] Datenauskunft/-export der eigenen Daten
- [ ] Einwilligungen (`user_consents`) versioniert; neue Datenschutzerklärungs-Version erzwingt erneute Zustimmung
- [ ] Datenschutzerklärung und Impressum in App und Admin verlinkt (Inhalte liefert der Auftraggeber/Rechtsberatung – werden nicht vom Entwicklungsteam erfunden)

**Härtung & Nachweis**

- [ ] Vollständiger RLS-Review: jede Tabelle, jede Policy, je ein Negativtest (siehe Teststrategie)
- [ ] Review aller Edge Functions: Authentifizierung, Autorisierung über RBAC-Schicht, Input-Validierung mit Zod, keine Service-Role-Leaks in Antworten
- [ ] Storage-Review: alle Buckets privat, Signed URLs mit kurzer Gültigkeit, Pfadregeln erzwungen
- [ ] Rate Limiting für sensible Endpunkte (Login, Einladung, Passwort-Reset)
- [ ] MFA (TOTP) für Super Admin verpflichtend aktiviert, für Trainer aktivierbar
- [ ] Audit-Log-Vollständigkeit prüfen: administrative Aktionen, Freischaltungen, Rollenänderungen, Löschanträge
- [ ] Abhängigkeits-Audit (`pnpm audit` bzw. Dependabot-Lage bereinigt)
- [ ] Verifikation EU-Hostingregion und getrennter Umgebungen; Backup-/Restore-Probe der Produktionsdatenbank dokumentiert
- [ ] `docs/PRIVACY_OPERATIONS.md`: Verzeichnis der Datenkategorien, Speicherorte, Löschwege – als Zuarbeit für das Verarbeitungsverzeichnis des Auftraggebers

### Abhängigkeiten

Phasen 3–6 (alle Funktionen müssen existieren, um sie abschließend zu prüfen).

### Definition of Done

- Ein Löschantrag führt nachvollziehbar zur Entfernung bzw. Anonymisierung aller personenbezogenen Daten inkl. Dateien; der Vorgang ist dokumentiert und getestet.
- Die RLS-Testsuite deckt jede Client-Tabelle mit Positiv- und Negativfällen ab und läuft in CI.
- Kein bekannter kritischer Befund offen (Dependencies, Edge Functions, Storage).
- Super-Admin-Zugänge sind MFA-geschützt.
- Backup-Restore wurde einmal erfolgreich durchgespielt und beschrieben.

---

## Phase 8 – QA

### Ziele

Bevor die App in die Stores geht, wird sie systematisch geprüft – automatisiert auf allen Ebenen und manuell auf echten Geräten. Ziel ist nicht „viele Tests", sondern: Die kritischen Wege (Einladung, Login, Freischaltung, Einreichung, Sichtbarkeit) sind abgesichert und bleiben es bei jeder künftigen Änderung.

### Arbeitspakete

- [ ] Unit-Testsuite `packages/domain` vervollständigen (Release Engine alle Modi & Randfälle, RBAC alle Rollen-Capability-Kombinationen, Fortschrittsberechnung)
- [ ] Zod-Schema-Tests: gültige und ungültige Configs je Blocktyp
- [ ] RLS-SQL-Testsuite in `supabase/tests/` finalisieren (Details siehe Teststrategie)
- [ ] Playwright-E2E für das Admin-Portal (kritische Flows, siehe Teststrategie)
- [ ] Maestro-E2E für die Mobile App (kritische Flows, siehe Teststrategie)
- [ ] Testfall-Checkliste (siehe Teststrategie unten) vollständig abarbeiten und Ergebnis protokollieren
- [ ] Manuelle Geräte-Testrunde: aktuelle iOS- und Android-Geräte, kleines/großes Display, schlechtes Netz, Flugmodus, Systemschriftgröße
- [ ] Zugänglichkeit: Kontraste der Token-Palette geprüft, Touch-Ziele, Screenreader-Grundtauglichkeit der Kernscreens
- [ ] Last-/Mengencheck: Cohort mit realistischer Teilnehmerzahl und vollem Programm – Admin-Listen und App bleiben flüssig
- [ ] Bugtriage-Prozess: Blocker/Major/Minor; Release nur ohne offene Blocker und Major
- [ ] Staging-Abnahme durch Auftraggeber anhand eines Drehbuchs (kompletter Teilnehmer- und Trainer-Durchlauf)

### Abhängigkeiten

Phasen 2–7 (Funktionsumfang eingefroren; nur noch Fehlerbehebung).

### Definition of Done

- Alle vier Testebenen (Unit, RLS-SQL, Playwright, Maestro) laufen in CI bzw. im Release-Check und sind grün.
- Die Testfall-Checkliste ist vollständig durchlaufen; Abweichungen sind behoben oder als bewusste Entscheidung dokumentiert.
- Keine offenen Blocker/Major-Bugs.
- Abnahmeprotokoll des Auftraggebers liegt vor.

---

## Phase 9 – Store Release

### Ziele

Die App wird in Apple App Store und Google Play Store veröffentlicht, das Admin-Portal geht produktiv. Dazu gehören die Store-Einträge, der Review-Prozess der Stores (inklusive Demo-Zugang für die Prüfer) und ein geordneter Erstbetrieb.

### Arbeitspakete

**Vorbereitung**

- [ ] Produktions-Supabase-Projekt final konfiguriert (EU-Region, Secrets, SMTP für Einladungs-Mails, Backups aktiv)
- [ ] Produktionsbereitschafts-Checkliste (siehe unten) vollständig abgehakt
- [ ] EAS-Build-Profile für Produktion; App-Signing (Apple Certificates/Profiles, Play App Signing) eingerichtet
- [ ] App-Store-Einträge: Name, Beschreibung, Screenshots im Marken-Look, Datenschutz-Angaben (App Privacy / Data Safety) wahrheitsgemäß gemäß Datenminimierung
- [ ] Store-Review-Demo-Account: eigene Demo-Organisation mit Demo-Cohort und freigeschalteten Beispielinhalten; Zugangsdaten in den Review-Notizen
- [ ] Admin-Portal-Deployment auf Produktionsdomain, HTTPS, Monitoring/Fehlererfassung aktiv

**Veröffentlichung**

- [ ] TestFlight- und Play-Internal-Runde mit Produktionsbackend (letzter Realitätscheck)
- [ ] Einreichung App Store und Play Store; Rückfragen der Reviews bearbeiten
- [ ] Gestaffelter Rollout im Play Store; Freigabe iOS nach bestandener Review
- [ ] Erste echte Organisation gemeinsam mit dem Auftraggeber anlegen (begleiteter Start)

**Nachlauf**

- [ ] Betriebs-Runbook: Monitoring, Fehlermeldeweg, Migrationsprozess für Updates, Rollback-Strategie
- [ ] OTA-Update-Strategie (Expo Updates) für JS-Fixes definiert; native Änderungen weiterhin über Store-Builds
- [ ] Übergabe- und Adminschulungsunterlagen für Aigner Offensiv

### Abhängigkeiten

Phase 8 (Abnahme), Phase 7 (Produktionsbereitschaft).

### Definition of Done

- App ist in beiden Stores öffentlich verfügbar und mit dem Produktionsbackend verbunden.
- Der Store-Review-Demo-Account funktioniert dauerhaft (wird nicht durch Aufräumjobs zerstört).
- Mindestens eine echte Organisation ist produktiv angelegt; Einladung → Login → Lernen funktioniert Ende-zu-Ende in Produktion.
- Runbook und Übergabeunterlagen sind übergeben.

---

## Teststrategie – Übersicht

Vier Ebenen, jede mit klarem Zweck. Grundsatz: **Die Sicherheits- und Freischaltlogik wird dort getestet, wo sie durchgesetzt wird** – Zugriffsregeln in der Datenbank (RLS-SQL-Tests), Geschäftslogik in `packages/domain` (Unit), Bedienabläufe Ende-zu-Ende (Playwright/Maestro).

### 1. Unit-Tests (`packages/domain`, `packages/validation`)

- Release Engine: jeder Modus einzeln, Kombinationen mit `due_at`/`expires_at`, Zeitzonen-Randfälle, Begründungstexte für gesperrte Lektionen
- RBAC: vollständige Matrix Rolle × Capability; Verweigerung als Default; `permissions jsonb`-Feingranularität für Org-Admins
- Fortschrittsberechnung: leere Lektion, teilweise bearbeitete Blöcke, Modul-Aggregation
- Zod-Schemas: je Blocktyp mindestens ein gültiges und mehrere ungültige Config-Beispiele

### 2. RLS-SQL-Tests (`supabase/tests/`)

Für jede Client-Tabelle Positiv- und Negativfälle, ausgeführt mit simulierten JWT-Rollen gegen eine frisch migrierte Datenbank:

- Teilnehmer A liest/schreibt keine Daten von Teilnehmer B (auch nicht in derselben Cohort)
- Trainer sieht nur zugewiesene Cohorts; in fremden Cohorts weder Mitglieder noch Einreichungen
- Trainer sieht `visibility='trainer'`-Reflexionen und -Einreichungen, **nie** `private`
- Org-Admin sieht keine Reflexionstexte, keine privaten Einreichungen, keine fremden Organisationen
- Nicht freigegebene Lektionsinhalte sind für Teilnehmer nicht abfragbar
- `audit_logs`: INSERT möglich, UPDATE/DELETE für normale Rollen unmöglich
- Storage: Signed-URL-Zugriff nur auf Pfade der eigenen Organisation

### 3. Playwright – Admin-E2E

- Login, Passwort-Reset, MFA-Einrichtung (Super Admin)
- Organisation anlegen → Org-Admin einladen → Einladung annehmen (Web)
- Cohort mit Sessions anlegen, Teilnehmer und Trainer zuordnen
- Lektion mit mehreren Blocktypen anlegen, publizieren, Release-Regel setzen
- Trainer: Einreichung sehen, Feedback geben, Statuswechsel
- Negativ: Org-Admin versucht Zugriff auf fremde Organisation → verweigert

### 4. Maestro – Mobile-E2E

- Einladung per Deep Link annehmen, Passwort setzen, Consent, Login
- Programmübersicht, gesperrte Lektion mit Begründungstext, freigeschaltete Lektion öffnen
- Quiz vollständig durchspielen (bestehen und nicht bestehen)
- Transferaufgabe mit Datei einreichen; Sichtbarkeit umschalten
- Reflexion privat speichern; Umsetzungsplan-Item anlegen
- Offline-Szenario: Antwort im Flugmodus erfassen, nach Netzrückkehr synchronisiert
- Push empfangen und per Deep Link zum Ziel

### Testfall-Checkliste

- [ ] Einladung: Einmallink funktioniert genau einmal; abgelaufener Token wird abgewiesen; widerrufener Token wird abgewiesen; erneut gesendete Einladung invalidiert die alte
- [ ] Kein Klartext-Anfangspasswort in Datenbank, E-Mails oder Logs
- [ ] Login/Logout auf iOS und Android; Token-Ablage nachweislich in `expo-secure-store`, nicht in AsyncStorage
- [ ] „Alle Sitzungen beenden" invalidiert andere Geräte
- [ ] Deaktivierter Nutzer kann sich nicht mehr anmelden; laufende Sitzung wird beendet
- [ ] Release-Modi: je ein Ende-zu-Ende-Fall für `immediate`, `at_datetime`, `days_after_session`, `days_before_session`, `after_lesson`, `after_module`, `manual`
- [ ] Gesperrte Lektion zeigt korrekte Vorschau samt Begründung; Inhalt ist serverseitig nicht abrufbar
- [ ] Quiz: Bestehensgrenze, maximale Versuche, Shuffle, Erklärungstexte; Versuche werden vollständig protokolliert
- [ ] Transferaufgabe: Statuskette `submitted` → `seen` → `feedback_given` → `done`; Datei-Upload und -Abruf nur via Signed URL
- [ ] Reflexion `private` ist für Trainer, Org-Admin und Super-Admin-UI unsichtbar; `trainer` nur für zugewiesene Trainer sichtbar
- [ ] Org-Admin sieht ausschließlich Aggregate, keine Einzeltexte
- [ ] Mandantentrennung: kein Datenzugriff über Organisationsgrenzen (Lesen und Schreiben, alle Rollen)
- [ ] Umsetzungsplan: Statuswechsel, Teilen mit Trainer, 90-Tage-Offensivplan-PDF nach Modul 5
- [ ] Fortschritt: `lesson_progress` und `module_progress` konsistent nach Teil- und Vollbearbeitung
- [ ] Push: Zustellung, Deep Link, Abschaltbarkeit je Anlass, Bereinigung ungültiger Tokens
- [ ] Offline: Cache-Anzeige ohne Netz, lokale Antwortsicherung, Retry ohne Duplikate
- [ ] Konto-Löschantrag: Prozess läuft durch, personenbezogene Daten und Dateien werden entfernt/anonymisiert
- [ ] Audit-Log: administrative Aktionen vorhanden, Einträge unveränderlich
- [ ] Zeitzonen: Session-Zeiten und datumsbasierte Releases korrekt bei abweichender Gerätezeitzone

---

## CI/CD-Pipeline

### PR-Checks (bei jedem Pull Request, `.github/workflows/ci.yml`)

1. **Install & Cache** – pnpm, Turborepo-/Workspace-Caching
2. **Typecheck** – `tsc --noEmit` über alle Workspaces (strict)
3. **Lint** – ESLint über alle Workspaces
4. **Unit-Tests** – `packages/domain`, `packages/validation`
5. **DB-Check** – Supabase lokal starten, alle Migrationen + Seed anwenden, RLS-SQL-Tests ausführen
6. **Builds** – `apps/admin` (Next.js Build), `apps/mobile` (Expo Export/Prebuild-Check)
7. **Playwright** – Admin-E2E gegen lokale Supabase-Instanz

Merge in `main` nur bei grüner Pipeline. Direkt-Pushes auf `main` sind gesperrt.

### Staging-Flow

- Merge in `main` deployt automatisch: Admin-Portal auf Staging, Edge Functions und **Migrationen** auf das Staging-Supabase-Projekt (Migrationen laufen ausschließlich über die Pipeline, nie von Hand)
- EAS-Build (internal) der Mobile App gegen Staging; Verteilung an das Testteam
- Maestro-E2E laufen gegen den Staging-Build (nightly bzw. vor jedem Release-Kandidaten)

### Release-Flow (Produktion)

1. Release-Kandidat per Git-Tag aus `main`
2. Pipeline wendet Migrationen auf Produktion an (nach Backup-Checkpoint), deployt Edge Functions und Admin-Portal
3. EAS-Build (production) → **TestFlight** (iOS) und **Play Internal Testing** (Android) mit Produktionsbackend
4. Interner Smoke-Test anhand einer Kurzcheckliste (Login, Lektion, Push)
5. Freigabe zur Store-Review bzw. gestaffelter Play-Rollout
6. JS-only-Hotfixes über Expo Updates (OTA) mit demselben Tag-/Review-Prozess; native Änderungen immer als neuer Store-Build

---

## Produktionsbereitschafts-Checkliste

Vor dem ersten Produktivgang vollständig abzuhaken:

- [ ] Drei Umgebungen getrennt (local / staging / production), Produktions-Secrets nur in der Deploy-Umgebung, keine Secrets im Repo
- [ ] Supabase-Produktionsprojekt in EU-Region; Backups aktiv; Restore einmal erfolgreich geprobt
- [ ] Alle Migrationen versioniert und über die Pipeline auf Produktion angewendet; kein manueller Schemadrift
- [ ] RLS auf allen Client-Tabellen aktiv; RLS-Testsuite grün gegen den Produktionsstand des Schemas
- [ ] Service-Role-Key ausschließlich in Edge Functions/Server; nachweislich nicht in App- oder Admin-Bundle
- [ ] Auth-Härtung: keine öffentliche Registrierung, Rate Limits, MFA für Super Admin aktiv
- [ ] Einladungsflow in Produktion getestet (echte E-Mail-Zustellung, SPF/DKIM der Absenderdomain)
- [ ] Storage: alle Buckets privat, Signed-URL-Gültigkeiten gesetzt, Pfadregeln erzwungen
- [ ] Push in Produktion verifiziert (APNs-Key, FCM-Konfiguration, Zustellung auf echten Geräten)
- [ ] Deep Links / Universal Links für Produktionsdomain konfiguriert und getestet
- [ ] Monitoring & Fehlererfassung für App, Admin und Edge Functions aktiv; Alarmweg definiert
- [ ] Audit-Logging in Produktion verifiziert
- [ ] Datenschutzerklärung, Impressum, Consent-Versionierung produktiv; Store-Datenschutzangaben stimmen mit der Realität überein (Datenminimierung: keine Kontakte/Standort/Mikrofon)
- [ ] Konto-Löschprozess produktiv durchgespielt
- [ ] Store-Review-Demo-Account angelegt, dokumentiert und gegen Aufräumjobs geschützt
- [ ] Versions- und Update-Strategie festgelegt (Store-Builds vs. OTA, Mindestversions-Handling)
- [ ] Rollback-Plan für fehlgeschlagene Deployments/Migrationen schriftlich vorhanden
- [ ] Betriebs-Runbook und Admin-Schulungsunterlagen übergeben

---

## Bewusst einfach gehalten

V1 lässt Dinge absichtlich weg. Das ist keine Nachlässigkeit, sondern Fokus: Die App soll das Präsenzprogramm begleiten – Vorbereiten, Vertiefen, Umsetzen, Reflektieren – und genau das zuverlässig können. Wichtig ist: **Keine dieser Auslassungen ist eine Sackgasse.** Das Datenmodell und die Architektur sind so angelegt, dass die Erweiterungen später ergänzt werden können, ohne Bestehendes umzubauen.

| Bewusst nicht in V1 | Warum weggelassen | Warum keine Sackgasse |
|---|---|---|
| Öffentliche Registrierung / Self-Service-Signup | Zugang ist Teil des Programms; Teilnehmer werden eingeladen. Weniger Angriffsfläche, kein Spam, klare Mandantenzuordnung. | Der Einladungsflow ist eine Edge Function; ein Signup-Flow wäre eine zusätzliche Function, das Datenmodell bleibt unverändert. |
| Social Login / SSO (Google, Apple, Microsoft) | V1-Zielgruppe wird zentral eingeladen; jeder zusätzliche Auth-Weg ist Test- und Supportaufwand. | Supabase Auth unterstützt weitere Provider; sie lassen sich pro Umgebung zuschalten, ohne die Profil-/Membership-Struktur zu ändern. |
| Chat / Kommunikation zwischen Teilnehmern | Der Austausch der Mannschaft gehört in die Offensivtage. Ein Chat verlangt Moderation, Meldewege und dauerhafte Betreuung. | Ankündigungen und Notifications existieren bereits; eine Kommentarts- oder Chat-Entität ließe sich additiv ergänzen. |
| Gamification (Punkte, Badges, Ranglisten) | Widerspricht dem Produktcharakter „hochwertig, erwachsen, ruhig". Fortschritt wird gezeigt, nicht inszeniert. | `lesson_progress`/`module_progress` liefern alle Rohdaten; jede spätere Verdichtung ist eine Lese-Schicht obendrauf. |
| In-App-Käufe / Abrechnung | Vertrieb läuft über Aigner Offensiv direkt mit den Organisationen. Store-Billing brächte erhebliche Komplexität und Gebühren. | Organisationen haben Status- und Notizfelder; eine spätere Anbindung an Rechnungsstellung berührt die Lernlogik nicht. |
| Videohosting-Plattform / eigenes Streaming | V1 nutzt Video-Blöcke mit Assets bzw. externen Quellen; ein eigenes Streaming-Setup lohnt erst bei entsprechendem Volumen. | Der `video`-Blocktyp ist per Zod-Config definiert; eine zusätzliche Quelle ist eine Config-Erweiterung, kein Umbau. |
| Vollwertige Offline-First-Synchronisation | Echte bidirektionale Sync-Engines sind aufwendig und fehleranfällig. V1: Cache gelesener Inhalte + lokale Antwortsicherung + Retry deckt den realen Bedarf (Zug, Ladenlokal mit schlechtem Empfang). | Die Retry-Queue ist der natürliche Keim einer späteren Sync-Schicht; Datenmodell und IDs sind bereits konfliktarm angelegt. |
| Mehrsprachigkeit der Inhalte | Programm und Zielgruppe sind deutschsprachig. | `locale` existiert bereits am Profil; Inhalte sind strukturiert (Blocks), Übersetzungsvarianten wären eine zusätzliche Dimension, kein Schemabruch. |
| Kundenspezifische Rollen-Editoren | V1 braucht drei Org-Rollen plus feingranulare `permissions jsonb` für Org-Admins – das deckt die realen Fälle. | Die zentrale Capability-Schicht in `packages/domain` ist genau dafür gebaut: neue Rollen sind neue Capability-Zuordnungen, keine Codeverstreuung. |
| Analytics-/Reporting-Suite mit Dashboards | Org-Admins bekommen Aggregate, Trainer ihr Cohort-Cockpit. Mehr Auswertung braucht erst echte Nutzungserfahrung als Grundlage. | Alle Ereignisse liegen strukturiert vor (`progress`, `attempts`, `submissions`); Reporting ist eine zusätzliche Leseschicht bzw. spätere Views. |
| Web-App für Teilnehmer | Ein Kanal, der gut funktioniert, schlägt zwei mittelmäßige. Mobile ist der Begleiter im Alltag auf der Fläche. | Die gesamte Logik liegt in Supabase + `packages/*`; eine Teilnehmer-Web-Oberfläche wäre eine weitere App im Monorepo gegen dieselben APIs. |
| Automatische KI-Auswertung von Reflexionen | Reflexionen sind Vertrauenssache; `private` bleibt privat. Alles andere würde das Fundament des Produkts beschädigen. | Falls je gewünscht, wäre es eine ausdrücklich einwilligungsbasierte Zusatzfunktion – die Sichtbarkeits-Architektur auf Datensatzebene trägt das bereits. |

**Leitgedanke:** V1 baut die schmale, sichere, hochwertige Version des Produkts – mit einem Datenmodell, das breiter angelegt ist als die erste Oberfläche. Wachsen heißt hier ergänzen, nicht ersetzen.

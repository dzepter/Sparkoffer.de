# Bestandsaufnahme (CURRENT_STATE) – Aigner Offensiv / Handel Offensiv

**Stand:** 26. September 2026 · **Anlass:** Master-Prompt „Website + Teilnehmerplattform + Administration" (§1: Bestand analysieren, nichts blind ersetzen)
**Status dieses Dokuments:** Analyse-Ergebnis. Es beschreibt, was **ist** – nicht, was werden soll. Zielbild und Plan stehen in `ARCHITECTURE.md` und `IMPLEMENTATION_PLAN.md`.

---

## 1. Das Wichtigste in zehn Sätzen

1. Es gibt **zwei Live-Domains mit gegensätzlichem Zustand**: `www.aigner-offensiv.de` zeigt noch die **alte WordPress-Site aus 2017** (PHP 7.4, ohne Sicherheitsupdates seit 2022); `www.handel-offensiv.de` zeigt die **im September 2026 neu gebaute statische Programm-Website** im blauen Design mit einem einfachen PHP-Redaktionssystem, das der Kunde bereits nutzt.
2. Eine **komplett überarbeitete Aigner-Offensiv-Website** (grünes Design, 12 Seiten) liegt fertig im Repository, ist aber **nie veröffentlicht** worden.
3. Die **Plattform** (Datenbank, Rechte, Admin-Cockpit, native App, Edge Functions) ist als Monorepo **weitgehend gebaut** – rund 32.000 Zeilen TypeScript/SQL, 72 Unit-Tests – aber **nie zusammenhängend in Betrieb genommen**: Die Tiefenanalyse fand Vertragsbrüche an den Nahtstellen (Admin authentifiziert sich mit dem Service-Role-Key gegenüber Edge Functions, die einen Nutzer erwarten → Einladen/Push aus dem Cockpit würden scheitern; App und Einladungsannahme nutzen abweichende Datenformate; Passwort-Reset ohne Zielseite; Scheduler ohne Cron-Job) – Fehler, die beim ersten echten Durchlauf sofort aufgefallen wären (Abschnitt 5.10). Zudem existieren weder Supabase-Projekt noch Vercel- oder Apple-Konto des Kunden; die „grüne CI" prüft nur Typecheck und Unit-Tests (Lint mit `|| true`, E2E ohne laufenden Stack).
4. Das **Datenmodell deckt den Master-Prompt bereits weitgehend ab**: 32 Tabellen, darunter `learning_phases` mit genau den vier Phasen aus §11, `lesson_releases` mit Freischaltung je Gruppe **und** je Teilnehmer (§16), Reflexionen mit Sichtbarkeit privat/Trainer (§19), Offensivplan mit den vier Status aus §14, 64 RLS-Policies.
5. Das **Admin-Cockpit** hat exakt die in §21 geforderte Navigation (Übersicht … System → Benutzer & Rollen, Audit Log, Einstellungen), CSV-Import, ICS-Export und eine MFA-Einstellungsseite.
6. Das **Teilnehmer-Erlebnis existiert bisher nur als native Expo-App** (HEUTE, Programm, Lektion mit 14 Block-Renderern, Offensivplan, Termine, Profil). Der im Master-Prompt geforderte **Web-Campus** (`campus.aigner-offensiv.de`) ist der **größte fehlende Baustein**.
7. Die **Design-Tokens der Plattform sind noch grün** (`#A8C62B`), während der Kunde für Handel Offensiv **Blau** (`#2E6FB0` auf Navy `#101C2A`) entschieden hat und diese Farbwelt live ist.
8. **Authentisches Bildmaterial** beschränkt sich auf fünf vom Kunden gelieferte Porträts (354–1170 px breit); die Medienbibliothek der alten Site enthält ausschließlich eingefärbte Stock-Grafiken. Videos gibt es keine.
9. Die alte Site hat **16 indexierte URLs** (11 Seiten, 5 Blogartikel aus 2020) und lädt Google Tag Manager, Google Fonts, YouTube und reCAPTCHA – die neuen Sites laden **keine Drittanbieter**.
10. **Rechtstexte** (Impressum mit HRB-Eintrag ohne Rechtsform, Datenschutzerklärungen) stammen von der alten Site und sind zur anwaltlichen Prüfung markiert.

---

## 2. Domains, DNS, Hosting

| Domain / Host | Zeigt auf | Hoster | Zustand |
|---|---|---|---|
| `www.aigner-offensiv.de` | WordPress (Theme `aigner_theme`, Bootstrap 3) | Strato (IPv6 `2a01:238:…`), Apache 2.4.68, **PHP 7.4.33** | live, HTTPS ok, http→https 301, non-www→www 301 |
| `www.handel-offensiv.de` | statische Site + `cms/admin.php` | Strato-Webspace, Ordner `handel-offensiv` (IPv6 `2001:8d8:…`) | live seit Sept. 2026, HTTPS ok, http→https 301, eigene 404-Seite aktiv |
| `cockpit.handel-offensiv.de` | – | kein DNS-Eintrag | im Code/Docs als Cockpit-Domain vorgesehen, **nicht existent** |
| `campus.aigner-offensiv.de`, `admin.aigner-offensiv.de` | – | kein DNS-Eintrag | im Master-Prompt gewünscht, **nicht existent** |
| E-Mail `info@aigner-offensiv.de` | Postfach beim Hoster (vermutlich Strato) | Strato | in Betrieb; **MX-Einträge dürfen bei DNS-Änderungen nicht angefasst werden** |

Strato-Shared-Hosting kann **kein Node.js/Next.js** ausführen – nur statische Dateien und PHP. Alles, was Next.js braucht (Campus, Admin, ggf. neue Website), benötigt einen anderen Host (z. B. Vercel), an den Subdomains per CNAME gehängt werden.

---

## 3. Live-Websites vs. Repository

### 3.1 www.aigner-offensiv.de – alte WordPress-Site (nicht im Repository)

- **Titel:** „Unternehmensberatung für Vertriebsmanagement | Rainer Aigner" · Copyright 2017 · Plugins: Borlabs Cookie, Contact Form 7 (reCAPTCHA/Turnstile), Dracula Dark Mode, Accessibility-Widget, Yoast SEO.
- **Drittanbieter:** Google Tag Manager, Google Fonts, YouTube-Embeds, LinkedIn, reCAPTCHA – datenschutzrechtlich heikel, auf den neuen Sites bewusst nicht vorhanden.
- **Indexierte URLs (Redirect-relevant):**

| Alte URL | Titel (Yoast) | Inhalt |
|---|---|---|
| `/` | Unternehmensberatung für Vertriebsmanagement | Startseite: Vorträge/Seminare/Coaching, Claims „Aus Wissen, Können machen", Buchhinweise |
| `/uber-uns/` | Rainer Aigner – Der Weg in die Bundesliga | Vita (1860, FC Bayern, Fortuna; 16 Firmen, 1000 Arbeitsplätze; zertifizierter Führungskräftetrainer) |
| `/learn-to-lead/` | LEARN TO LEAD® Seminare | 12 Module in 3 Bereichen (Sicherheit & Bindung / Entwicklung & Wachstum / Gesundheit, Glück & Gewinn) – **eingetragene Marke ®** |
| `/vortraege/` | Vorträge | Vortragsthemen |
| `/fuhrung-leicht-gemacht/` | Personality Marketing / Ver-Führung leicht gemacht | Angebotsseite |
| `/potentiale-steuern/` | Erfolgsfaktor Führungspersönlichkeit / Wachstum ist alternativlos | Angebotsseite |
| `/generation-y/` | Der Führungsmanager / Generation Y | Angebotsseite |
| `/kontakt/` | Kontakt | Formular (CF7), Adresse, Telefon 089 / 33 03 50-55 |
| `/blog/` | Blog | Übersicht |
| `/impressum/`, `/datenschutz/` | Rechtstexte | Impressum identisch mit dem der neuen Sites (siehe Abschnitt 8) |
| 5 Beiträge (2020): `/abkuerzungen-…-entrepreneurship/`, `/abkuerzungen-ueber-das-fast-perfekte-gespraech-…/`, `/abkuerzungen-verhaltensregeln-…/`, `/das-wohlstandsproblem-loesen/`, `/krisensituationen-brauchen-echte-fuehrung-…/` | Blog | 531–1566 Wörter je Artikel, Volltexte gesichert |

- **Sitemap:** `/sitemap.xml` → 301 → `/sitemap_index.xml` (Yoast). `robots.txt` sperrt nur `/wp-admin/`, `/wp-includes/`.
- **Vollständige Sicherung:** `docs/archive/aigner-offensiv-wordpress-2026-09/` (Texte aller 16 Inhalte, Indizes, Medienliste, altes Logo).
- **Risiko:** PHP 7.4 ist seit November 2022 ohne Sicherheitsupdates; WordPress-Version unbekannt. Die Site ist ein **offenes Sicherheitsrisiko**, solange sie läuft.

### 3.2 www.handel-offensiv.de – neue statische Programm-Website (im Repository: `handel-offensiv-website/`)

- 7 Seiten (`index`, `login`, `kontakt`, `impressum`, `datenschutz`, `account-loeschen`, `404`), `robots.txt`, `sitemap.xml`, `.htaccess` (eigene 404-Seite), Open-Graph-Bild 1200×630.
- **Redaktionssystem** `cms/admin.php` (413 Zeilen PHP, kein Framework): Passwort-Hash in `cms/passwort.php`, Session + CSRF, dateibasierte Anmeldebremse, Allowlist-Sanitizer (`span.accent`, `mark`, `strong`, `em`, `br`, sichere `a`), speichert nach `cms/content.json`; `assets/js/content.js` injiziert die Texte clientseitig in `[data-edit]`-Elemente.
- **Abweichung Repository ↔ Live (geprüft per md5 am 26.09.2026):**

| Datei | Zustand |
|---|---|
| `assets/css/style.css`, `assets/js/main.js`, `robots.txt`, `sitemap.xml`, `.htaccess` | identisch |
| `index.html`, `login.html`, `kontakt.html`, `404.html`, `assets/js/content.js`, `cms/admin.php` | **live noch Stand vor Commit `8225c49`** – die Ausweitung des Redaktionssystems auf 74 Felder (Live: 23 Felder auf der Startseite) und der wurzelabsolute Pfad in `content.js` sind **nicht hochgeladen** |

- **CMS-Zustand live:** Passwort ist gesetzt (Login-Maske erscheint), `content.json` enthält 23 Felder – alle inhaltlich gleich den eingebauten Standardtexten (kein individueller Text des Kunden geht bei einer Migration verloren).

### 3.3 Nicht veröffentlicht: `aigner-offensiv/` – überarbeitete Aigner-Offensiv-Site

- 12 Seiten (`index`, `ueber-rainer-aigner`, `leistungen`, `learn-to-lead`, `vortraege`, `impulse` mit 5 Artikeln, `kontakt`, `bestellung` für das Buch, `impressum`, `datenschutz`, `account-loeschen`, `404`), 2.235 Zeilen HTML, eigenes CSS (831 Zeilen), grünes Design (`#A8C62B`).
- Enthält bereits Wikipedia-Zeitleiste zu Rainer Aigner, LEARN-TO-LEAD-Module (ohne ®-Zeichen – **nachzutragen**), Vortragsthemen, Buchbestellformular (mailto).
- **Nicht deployt**; die Live-Domain zeigt weiterhin die WordPress-Site aus 3.1.

---

## 4. Repository-Inventar

Repository `dzepter/Sparkoffer.de` (öffentlich), Arbeitsbranch `claude/aigner-offensiv-redesign-fpxwht`, 31 Commits, letzter Stand `8225c49`.

| Ordner | Inhalt | Umfang |
|---|---|---|
| `handel-offensiv/` | Plattform-Monorepo (pnpm): `apps/admin`, `apps/mobile`, `packages/*`, `supabase/`, `docs/` | admin 15.923 · mobile 10.350 · packages 3.121 · functions 2.212 Zeilen TS; SQL 1.861 + Seed 594 |
| `handel-offensiv-website/` | statische Programm-Website + PHP-CMS (live) | 1.012 Zeilen HTML, 989 CSS, 413 PHP |
| `aigner-offensiv/` | überarbeitete Institutswebsite (nicht live) | 2.235 Zeilen HTML, 831 CSS |
| `.github/workflows/handel-offensiv-ci.yml` | CI: install → typecheck → lint → test → build-admin → Playwright e2e | – |
| `Dockerfile`, `server.js`, `package.json`, `payback-app.html`, `README.md` | **projektfremd** (Payback-App aus einem anderen Vorhaben, auf `main` gemergt) | – |

---

## 5. Plattform-Monorepo `handel-offensiv/`

### 5.1 Stack und Versionen (aus den `package.json`)

Next.js 15.1 · React 19 (Admin) / React 18.3 (Mobile) · Expo SDK 52 · Expo Router 4 · TypeScript 5.6 · Tailwind 3.4 · `@supabase/supabase-js` 2.47 · `@supabase/ssr` · Zod 3.23 · Playwright 1.49 · pnpm workspaces · Deno (Edge Functions). Der React-Versionsunterschied Admin/Mobile ist bekannt und über `tsconfig`-Pfade entschärft.

### 5.2 Datenbank (`supabase/migrations/0001_schema.sql`, `0002_rls.sql`)

- **32 Tabellen:** `profiles, organizations, organization_memberships, programs, modules, learning_phases, lessons, content_blocks, cohorts, cohort_trainers, cohort_members, cohort_sessions, course_enrollments, lesson_releases, assignment_submissions, reflection_entries, quizzes, quiz_questions, quiz_options, quiz_attempts, lesson_progress, action_plans, action_plan_items, trainer_feedback, announcements, notifications, push_tokens, invitations, learning_assets, audit_logs, user_consents, account_deletion_requests` · 1 View `module_progress`.
- **Enums:** `phase_type (before_day, day, after_day, prep_next, custom)` · `block_type` (14 Typen: text, video, audio, pdf, image, checklist, reflection, single_choice, multiple_choice, quiz, scale, transfer_task, download, external_link) · `release_mode` (7: immediate, at_datetime, days_after_session, days_before_session, after_lesson, after_module, manual) · `visibility_level (private, trainer)` · `plan_item_status (planned, started, implemented, reflected)` · `member_role (org_admin, trainer, participant)` · `invitation_status`, `submission_status`, `progress_status`, `question_kind`, `consent_type`, `deletion_status`, `notification_kind`, `org_status`, `member_status`, `content_status`.
- **`lesson_releases`** trägt `cohort_id`, optional `profile_id` (Freischaltung für einzelne Teilnehmer), `session_id`, `offset_days`, `prerequisite_lesson_id/module_id`, `release_at/due_at/expires_at` → die Freischaltvarianten aus §16 sind im Schema abgebildet.
- **RLS:** 64 Policies, Hilfsfunktionen im Schema `app` (SECURITY DEFINER). Mandantentrennung auf Datenbankebene.
- **Seed:** ausschließlich als `DEMO` markierte Organisation/Personen (`Demo GmbH`, `max.muster@…`, `anna.beispiel@…`), **Termine relativ zu `now()`** (kein festes Jahr) – Master-Prompt §17/§46 verlangt feste Demo-Daten aus 2027.

### 5.3 Edge Functions (`supabase/functions/`)

`invite-user` (Token-Hash SHA-256, Link `APP_BASE_URL/einladung?token=…`), `accept-invitation` (validate/complete, Passwort ≥ 10 Zeichen, Einwilligungsversion), `send-push` (Expo-Push-Batches, Token-Pruning), `process-deletion-request`, `release-scheduler`; gemeinsame Helfer in `_shared`. E-Mail-Versand ist als Anbieterabstraktion vorbereitet (Resend/Postmark/SMTP erwähnt), **kein Anbieter konfiguriert**.

### 5.4 Admin-/Trainer-Cockpit (`apps/admin`, Next.js App Router)

- **36 Routen**, Navigation exakt wie §21: Übersicht · Unternehmen · Gruppen · Teilnehmer (Liste, Einladen, **CSV-Import**) · Programme (Module) · Inhalte (Lektions-Editor, Quizze) · Termine (**ICS-Export-Route**) · Nachrichten · Auswertung (je Gruppe) · System (Benutzer & Rollen, Audit Log, Einstellungen inkl. **MFA-Seite**) · Vorschau.
- Middleware validiert Sessions serverseitig (`supabase.auth.getUser()`), Root-Layout setzt `robots: index=false, follow=false`.
- Eigene UI-Basis (`components/ui`: button, card, data-table, dialog, form-field, tabs …), Hilfsbibliotheken für Audit, Sanitizing, Content-Guard, Datum.
- **Fehlt gegenüber §21–25:** eine Teilnehmer-**Detailseite** (nur Liste/Einladen/Import vorhanden); Detailprüfung der Dashboard-Kennzahlen (§22) und der Filter (§25) folgt im Abgleich (Abschnitt 11).
- **Farbwelt: grün** (Tailwind-Konfig übernimmt `packages/config`-Tokens).

### 5.5 Native App (`apps/mobile`, Expo)

- Routen: Auth (Willkommen, Einladung, Login, Passwort vergessen, Push-Erlaubnis) · Tabs **Heute, Programm, Offensivplan, Termine, Profil** · Lektion, Quiz, Termin, Nachrichten.
- Feature-Module (`src/features`): heute 506 · lesson 2.499 (14 Block-Renderer) · offensivplan 1.191 (inkl. PDF-Export) · profil 894 · programm 460 · termine 506 · benachrichtigungen 335 Zeilen; 13 UI-Primitive.
- Passwort-Reset leitet auf den App-Deep-Link `handeloffensiv://` – **für einen Web-Campus muss der Redirect auf die Campus-URL zeigen**.
- Diese Module sind die **fachliche Vorlage** für den Web-Campus; der Code selbst (React Native) ist nicht 1:1 im Browser nutzbar, die Supabase-Abfragen und Domänenlogik schon.

### 5.6 Geteilte Pakete (`packages/`)

- `domain`: Capabilities `can(actor, capability, scope)` mit 16 Capabilities (`organizations.read/manage, users.read/invite/manage, cohorts.read/manage, content.read/edit/publish, submissions.read/feedback, analytics.read, notifications.send, audit.read, settings.manage`), Release-Engine, Fortschrittsberechnung, Quiz-Bewertung – reine Funktionen, getestet. §26 nennt `participants.*` statt `users.*` – **Benennung, keine Lücke**.
- `types`, `validation` (Zod-Schemas je Blocktyp), `config` (Design-Tokens **grün**, Konstanten).
- **Kein gemeinsames UI-Paket** für mehrere Web-Apps (Admin bringt eigene Komponenten mit).

### 5.7 Tests und CI

72 Testfälle (`packages/domain`: capabilities, release-engine, progress, quiz; `packages/validation`: content-blocks) + Playwright-E2E `apps/admin/e2e/login.spec.ts`. CI (`handel-offensiv-ci.yml`): install, typecheck, lint, test, build-admin, e2e. **Keine RLS-Tests gegen eine echte Datenbank in der CI.**

### 5.8 Dokumentation (`docs/`, 14 Dateien, 2.979 Zeilen)

ARCHITECTURE, DATA_MODEL (767 Zeilen), RBAC, SECURITY (526), IMPLEMENTATION_PLAN (547), ADMIN_GUIDE, TRAINER_GUIDE, RELEASE_GUIDE, ENVIRONMENT_SETUP, BACKUP_RESTORE, PRIVACY_TECHNICAL, APP_STORE_CHECKLIST, GOOGLE_PLAY_CHECKLIST, NEEDED_FROM_CLIENT. Inhaltlich hochwertig, aber auf das **frühere Zielbild** ausgerichtet: Teilnehmer nur per Native-App, Cockpit unter `cockpit.handel-offensiv.de`, Farbwelt grün. Überarbeitung siehe `IMPLEMENTATION_PLAN.md`.

### 5.9 Deployment

**Es gibt kein produktives oder Staging-Deployment der Plattform.** Erforderliche Konten fehlen (Supabase EU, Vercel, Apple Developer) – siehe `NEEDED_FROM_CLIENT.md`. Lokal läuft alles (Supabase CLI/Docker, `pnpm dev:admin`, Expo).

### 5.10 Integrationsbefunde (Nahtstellen zwischen den Teilsystemen)

Die Teilsysteme sind einzeln plausibel, aber ihre **Verträge** untereinander wurden nie Ende-zu-Ende geprüft:

| Nr. | Befund | Folge |
|---|---|---|
| I‑1 | Admin-Server-Actions rufen `invite-user`/`send-push` mit `Authorization: Bearer <SERVICE_ROLE_KEY>` auf; die Functions ermitteln den Akteur per `auth.getUser(jwt)` – ein Service-Role-Token liefert keinen Nutzer | Einladen (einzeln und per CSV) und Push aus dem Cockpit scheitern zur Laufzeit |
| I‑2 | Mobile sendet an `accept-invitation` `action:"accept"`, `consentPrivacy:true` und erwartet `{ok, invitation, code}`; die Function kennt `action:"complete"`, `consentPrivacyVersion` und antwortet `{error}` | Einladung kann in der App nicht angenommen werden; jede Ursache erscheint als generische Fehlermeldung |
| I‑3 | Passwort-Reset (Mobile) leitet auf `handeloffensiv://passwort-neu` – Screen existiert nicht; Admin-Login ohne „Passwort vergessen" | Reset läuft ins Leere |
| I‑4 | Einladungs-E-Mail verlinkt `${APP_BASE_URL}/einladung` – keine Web-Route vorhanden (nur Deep Link) | Links aus E-Mails funktionieren erst mit dem Web-Campus |
| I‑5 | `release-scheduler` benötigt `pg_cron`/Scheduled Trigger – nicht angelegt; `config.toml` `site_url=localhost`, Redirect-Allowlist leer | zeitgesteuerte Freischaltungen und Erinnerungen laufen nie |
| I‑6 | `process-deletion-request` hat keinen Aufrufer und keine Admin-Oberfläche; räumt Bucket `uploads` statt `learning-assets` | Löschanträge bleiben unbearbeitet |
| I‑7 | Storage: keine INSERT-Policy für Teilnehmer-Uploads; Signed-URL-TTL 1 h (Konzept: Minuten) | Foto-/Dateinachweise scheitern; Links zu lange gültig |
| I‑8 | Rechte-Matrix und Zod-Schemas als Kopien in Deno (`_shared`) statt Import aus `packages/*` | Drift zwischen Admin, App und Functions bereits eingetreten (I‑2) |
| I‑9 | Blockzustände Checkliste/Skala/Auswahl nur lokal im Gerätespeicher, nicht in der DB | bei paralleler Nutzung Web + App inkonsistent; Selbsteinschätzung 1–10 für Trainer unsichtbar |
| I‑10 | Kein Lesezugriff auf `trainer_feedback` in der App | Teilnehmer sieht Trainer-Feedback nirgends (§47 Schritt 14) |
| I‑11 | Rate Limiting in Edge Functions nur In-Memory je Isolate; Auth-Limits nicht konfiguriert | Schutz bei Cold Starts wirkungslos |
| I‑12 | E-Mail-Templates in Alt-Grün; kein Anbieter, kein SPF/DKIM-Setup dokumentiert | erster Markenkontakt der Teilnehmer nicht markenkonform |
| I‑13 | CI: Lint `next lint \|\| true` ohne ESLint-Konfig; E2E `continue-on-error` ohne Stack; keine Function-/RLS-Tests | „CI grün" belegt nur Typecheck + Unit-Tests |

**Bewertung:** Keine dieser Lücken ist konzeptionell – Datenmodell, Rechte und Bausteine sind richtig angelegt. Sie sind das typische Bild eines Systems, das ohne durchgehenden Testlauf gebaut wurde, und werden in Phase 1/2 vor dem Vertical Slice geschlossen (`IMPLEMENTATION_PLAN.md`, Abschnitt 5.5).

---

## 6. Design-Bestand

| Element | Bestand |
|---|---|
| **Farbwelt Handel Offensiv (live, Kundenentscheidung Sept. 2026)** | Navy `#101C2A`, Dunkel-2 `#16263A`, Blau `#2E6FB0`, Hellblau `#7FB8E8`, Tiefblau `#1F5E96`, Off-White `#F5F7F9`, Ink `#131A22`, Linien `#DEE4EA`/`#263A50` |
| **Farbwelt Aigner Offensiv (Repo, nicht live) & Plattform-Tokens** | Grün `#A8C62B`, Hellgrün `#C5E33C`, Dunkel `#12160E`, Papier `#F7F6F1` |
| Schrift | **Archivo** (self-hosted WOFF2, Gewichte 500/600/700/800, Expanded-Stretch für Headlines) – auf beiden statischen Sites; Plattform nutzt Systemschrift |
| Logo | Zwei schräge Balken („//") als Inline-SVG + Wortmarke „HANDEL OFFENSIV / AIGNER OFFENSIV"; altes WP-Logo gesichert (`logo.jpg`, `aigner-offensiv.png`) |
| Gestaltungsmerkmale | kantige Radien (2 px), schräge Akzentbalken („Hero-Slash"), große Modulnummern 01–05, Fußball-Sprache |
| **Authentische Fotos** | `rainer-aigner-1.jpg` 354×496 · `-2` 1033×953 · `-3` 660×738 · `-4` 1170×1546 (Hochformat, im Einsatz) · `-5` 1035×955 · `Rainer-Aigner.jpg` 1998×1125 (Hero, alt) · Buchcover `book-1/2.jpg` 279×324 (klein; besseres Cover vom Kunden **nie angekommen**) |
| Stock/Grafik | `uber-rainer-aigner.jpg`, `vortrag-*.jpg`, `header-1.jpg`, `grafik.jpg` sowie alle 76 WP-Medien (`stage-aigner-*`, `lust-auf-erfolg.jpg` …) – eingefärbte Stock-Motive, **kein Rainer** |
| Videos | **keine** vorhanden |
| Social-Vorschaubild | `og-image.jpg` 1200×630 (Handel Offensiv, blau) |

---

## 7. Inhalte und Texte (vorhanden)

- **Claims:** „Handel ist Mannschaftssport. Führung entscheidet das Spiel." · „Der Führungsführerschein für den Handel" · Leitgedanken „Aus Mitarbeitern wird Mannschaft." / „Führung auf der Fläche. Wirkung in den Zahlen." / „Aus Wissen Können machen." · „Ballbesitz gewinnt keine Spiele. Tore schon." · „Es wird nichts grundsätzlich anders – aber einiges grundsätzlich erfolgreicher."
- **Fünf Offensivtage** mit Titel + Kurztext (identisch mit §10) · **Lernzyklus** in 5 Schritten · **App-Beschreibung** · **Zielgruppen** (Nachwuchsführungskräfte, Markt- & Filialleitung, Handelsunternehmen) · **Trainer-Vita** (Wikipedia-basiert).
- **Alt, gesichert:** 5 Blogartikel (~5.600 Wörter, 2020) · LEARN TO LEAD® (12 Module) · Vortragsthemen · Angebotsseiten (Personality Marketing, Führungspersönlichkeit, Generation Y) · Buchtitel („Lust auf Erfolg", „Der Gewinnertyp", „Pilot oder Passagier", „Der Führungsmanager" – nur als Header-Grafiken).
- **Nicht vorhanden (bewusst nicht erfunden):** Termine, Preise, Gruppengrößen, Kundenreferenzen, Teilnehmerstimmen, echte Lerninhalte/Videos, Zertifizierungsname, Firmierung.

---

## 8. Rechtliches und Datenschutz

- **Impressum (alt = neu):** „Viola & Rainer Aigner, Aigner Offensiv, Hohenzollernstr. 76, 80801 München · Handelsregister HRB 152556, Amtsgericht München · USt-IdNr. DE 234431321 · Tel. 089 / 33 03 50-55, Fax -56 · info@aigner-offensiv.de". Widerspruch **HRB ohne Rechtsform** stammt aus der alten Site; im Code als Prüfvermerk markiert.
- **Datenschutzerklärungen:** neue Sites ohne Cookies/Tracker (nur CMS-Session-Cookie für Redakteure, dokumentiert); alte Site mit Cookie-Banner, GTM, reCAPTCHA, Google Fonts. App-Datenschutz technisch in `PRIVACY_TECHNICAL.md` vorbereitet; **anwaltliche Prüfung aller Texte offen**.
- **Konto-Löschung:** `account-loeschen.html` (App-Store-Anforderung) auf beiden neuen Sites; DB-Tabelle `account_deletion_requests` + Edge Function vorhanden.
- **Marke:** „LEARN TO LEAD®" ist auf der alten Site als eingetragene Marke gekennzeichnet; Status von „Führungsführerschein" unbekannt.

---

## 9. Formulare, E-Mail, Analytics

- Kontakt- und Bestellformulare der neuen Sites sind **mailto-basiert** (öffnen das E-Mail-Programm; keine Serververarbeitung, keine Datenspeicherung). Alte Site: Contact Form 7 mit reCAPTCHA.
- Zieladresse überall `info@aigner-offensiv.de`; alte Site nennt zusätzlich `aigner@aigner-offensiv.de` und Mobil `01577-3388855`.
- **Analytics:** neue Sites keine; alte Site Google Tag Manager (Konfiguration unbekannt).
- Systemmails der Plattform (Einladung, Reset): Anbieter **nicht festgelegt**.

---

## 10. Umgebungsvariablen (nur Namen)

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (nur Server/Functions), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_BASE_URL`, `APP_BASE_URL` (Einladungslink), `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EMAIL_FROM`, `EMAIL_PROVIDER_API_KEY`, `EXPO_ACCESS_TOKEN`, `E2E_BASE_URL`. Keine Werte im Repository (`.env.example` nur Platzhalter).

---

## 11. Abgleich mit dem Master-Prompt – Deckungsgrad (vorläufig)

Legende: ✔ vorhanden · ◐ teilweise (z. B. nur in der Native-App, nicht im Web) · ✖ fehlt

| § | Anforderung | Stand | Anmerkung |
|---|---|---|---|
| 2 | Eine Marke, drei Bereiche, gemeinsames Designsystem | ◐ | Zwei Farbwelten, kein gemeinsames UI-Paket, Domains fehlen |
| 4–5 | Öffentliche Website mit Positionierung/Navigation | ◐ | Inhalte vorhanden (handel-offensiv.de), aber falsche Domain, Navigation abweichend, Seiten FÜR UNTERNEHMEN/IMPULSE/RAINER AIGNER fehlen dort |
| 6–9 | Campus, Login, HEUTE-Seite, Navigation | ◐ | vollständig in der Native-App, **im Web nicht vorhanden** |
| 10–11 | 5 Module, 4 Lernphasen, beliebig viele Module | ✔ | Schema + Seed |
| 12 | 18 Content-Typen | ◐ | 14 vorhanden; fehlen: Praxisaufgabe (getrennt von Transfer), Dateiupload, optionaler Fotoupload, Ankündigung als Block |
| 13 | Video (Abstraktion, kein Autoplay, Untertitel) | ◐ | Renderer in Native-App; Untertitel/Anbieter prüfen |
| 14 | Offensivplan inkl. 90-Tage-Plan, PDF | ◐ | Tabellen + Native-UI + PDF-Export; Web fehlt |
| 15 | Fortschritt ohne Gamification | ✔ | View + Begriffe |
| 16 | 10 Freischaltvarianten | ✔ | Schema deckt alle ab (`profile_id`, `cohort_id`, Offsets, Voraussetzungen); Admin-UI-Abdeckung prüfen |
| 17 | Termine + ICS, Demo 2027 | ◐ | ICS im Admin; Seed relativ statt 2027 |
| 18 | Web-Benachrichtigungen | ◐ | Tabelle + Push; Web-Inbox fehlt |
| 19 | Reflexion privat/Trainer, Org-Admin nie | ✔ | Enum + RLS + RBAC-Doku |
| 20–25 | Trainerrolle, Admin-Navigation, Dashboard, Unternehmen, Gruppen, Teilnehmerverwaltung | ◐ | Navigation ✔, CSV ✔; Teilnehmer-Detail ✖, Feinheiten prüfen |
| 26–27 | Permission-Schicht, Mandantenfähigkeit | ✔ | `can()`, RLS, `app.*`-Helfer |
| 28–29 | Stack, Monorepo | ◐ | Stack passt; `apps/website`, `apps/campus`, `packages/ui` fehlen |
| 30–32 | Datenmodell, RLS, private Dateien | ✔ | 32 Tabellen, 64 Policies, Signed URLs |
| 33 | Auth-Flows, MFA vorbereitet | ◐ | Flows in Native-App/Functions; Web-Seiten fehlen; MFA-Seite vorhanden |
| 34–35 | Design (dunkelblau, Akzent, Off-White, kein Baukasten) | ◐ | Website ✔ (blau); Plattform grün |
| 36–38 | Responsive, PWA, Offline/Autosave | ◐ | Native-App ja; Web-Campus fehlt |
| 39–41 | Datenschutz, Accountlöschung, Audit | ✔ | Tabellen, Function, Seiten |
| 42 | noindex für Campus/Admin/Login | ◐ | Admin ✔; Campus fehlt |
| 43 | Systemmails im Markendesign | ◐ | Abstraktion da, Anbieter/Templates offen |
| 44–45 | Tests, Security-Review | ◐ | 72 Unit-Tests + 1 E2E; RLS-DB-Tests, Campus-Tests fehlen |
| 46 | Demo-Daten 2027, keine Personendaten | ◐ | erfundene Firmen ✔; Jahr 2027 ✖ |
| 47 | Vertical Slice (15 Schritte) | ◐ | Schritte 1–4, 12–13, 15 im Admin/Backend; 5–11, 14 nur nativ |

**Größter Delta-Block:** der Web-Campus (§6–9, 11–19, 36–38, 40, 42) als Next.js-App – fachlich vollständig vorgezeichnet durch Datenmodell und Native-App, aber im Browser nicht vorhanden.

---

## 12. Offene Kundenlieferungen (Kurzfassung)

Supabase-Projekt (EU) · Vercel-Konto · Apple-Developer-Account · E-Mail-Versandweg + Absender · Video-Ablage · echte Lerninhalte (Texte, Aufgaben, Videos, Arbeitsblätter) · Fotos (Rainer in Aktion) · Termine/Preise/Gruppengrößen für die Website · Referenzen mit Freigabe · anwaltliche Prüfung der Rechtstexte · Klärung Firmierung/HRB · Entscheidung Domainstrategie (siehe `IMPLEMENTATION_PLAN.md`, offene Entscheidungen). Vollständige Liste: `NEEDED_FROM_CLIENT.md`.

---

## 13. Methodik und Quellen

Analyse am 26.09.2026: Repository-Lesung (Schema, Routen, Pakete, Tests, CI), Live-Abrufe per `curl` (Status, Header, DNS via `getent`), Datei-Vergleich Repo↔Live per md5, WordPress-REST-API (`/wp-json/wp/v2/pages|posts|media`) und gerendertes HTML für das URL-/Inhaltsinventar, Sichtprüfung der Medien. Acht parallel arbeitende Analyse-Agenten haben die Teilsysteme (Datenbank, Admin, Mobile, Functions, Pakete, Websites, Live/SEO, Dokumentation) gegen §1–54 geprüft; zwei unabhängige Kritiker haben Abdeckung und Risiken bewertet. Ihre Detailbefunde sind in `IMPLEMENTATION_PLAN.md` (Abschnitte Lücken, Risiken, offene Entscheidungen) eingearbeitet.

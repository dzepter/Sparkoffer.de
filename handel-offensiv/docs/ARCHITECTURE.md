# Architektur – Handel Offensiv Learning App

Dieses Dokument beschreibt die Gesamtarchitektur der Handel Offensiv Learning App. Die Kapitel 1 und 2 sind bewusst so geschrieben, dass sie auch ohne IT-Vorwissen verständlich sind. Ab Kapitel 3 wird es technischer; verbindliche Detailentscheidungen (Datenmodell, Sicherheit, Freischaltlogik) sind in den jeweiligen Spezialdokumenten unter `docs/` vertieft.

---

## 1. Produktkontext & Lernmodell

### 1.1 Was die App ist – und was nicht

Die Handel Offensiv Learning App ist der digitale Begleiter des Präsenzprogramms **„HANDEL OFFENSIV – Der Führungsführerschein für den Handel"** von Aigner Offensiv (Institut für Führung und Vertrieb, München). Das Programm besteht aus fünf Präsenztagen, den **Offensivtagen**.

Die App hat vier Kernaufgaben:

1. **Vorbereiten** – Teilnehmer kommen vorbereitet zum nächsten Offensivtag.
2. **Vertiefen** – Inhalte des Tages werden danach in kleinen Einheiten gefestigt.
3. **Umsetzen** – Transferaufgaben und persönliche Maßnahmenpläne bringen das Gelernte in den Arbeitsalltag im Markt.
4. **Reflektieren** – Teilnehmer halten fest, was funktioniert hat und was nicht.

Die App ist ausdrücklich **kein Ersatz für die Präsenztage** und **kein klassischer Onlinekurs**. Sie füllt die Zeit zwischen den Offensivtagen mit Struktur. Der rote Faden folgt dem Claim: *„Handel ist Mannschaftssport. Führung entscheidet das Spiel."* Die Fußballsprache (Mannschaft, Aufstellung, Spieltag, Kabine, Taktik) wird subtil in Texten und Begriffen eingesetzt – ohne Fußballgrafiken-Kitsch und ohne Gamification-Übertreibung.

### 1.2 Das Lernmodell: der Zyklus um jeden Offensivtag

Jedes Modul des Programms ist um einen Offensivtag herum organisiert. Der Zyklus sieht so aus:

```
        ┌──────────────────────────────────────────────────────────┐
        │                                                          │
        ▼                                                          │
  VORBEREITUNG  ──►  PRÄSENZTAG  ──►  VERTIEFUNG  ──►  UMSETZUNG ──┼──►  REFLEXION
  (App: kurze        (Offensivtag,    (App: kompakte   (App: Transfer-  (App: Reflexions-
   Impulse, Fragen,   vor Ort)         Einheiten zum    aufgaben,        einträge, Rückblick,
   Organisatorisches)                  Tag)             Maßnahmenplan)   Vorbereitung des
        ▲                                                               nächsten Moduls)
        └───────────────────────────────────────────────────────────────────────┘
```

Technisch bildet sich dieser Zyklus in den **Lernphasen** jedes Moduls ab (`learning_phases` mit `phase_type`: `before_day`, `day`, `after_day`, `prep_next`, `custom`). Die Freischaltung der Inhalte richtet sich nach den realen Terminen der Gruppe (siehe Release Engine, `docs/RELEASE_ENGINE.md`): Eine Lektion kann z. B. „3 Tage nach Offensivtag 2" automatisch erscheinen. Noch gesperrte Inhalte sind sichtbar, aber verschlossen – mit einem klaren Hinweis wie *„Wird nach Offensivtag 2 freigeschaltet."* So bleibt der Spannungsbogen des Präsenzprogramms erhalten.

Das Standardprogramm umfasst fünf Module (01 Führung beginnt bei mir · 02 Aus Mitarbeitern wird Mannschaft · 03 Die richtige Aufstellung · 04 Spielintelligenz mit KI · 05 Führen, wenn es darauf ankommt). Die Datenstruktur ist jedoch **nicht starr auf fünf Module festgelegt** – Programme, Module, Phasen und Lektionen sind frei konfigurierbar.

### 1.3 Wer die App nutzt

- **Teilnehmer** (Führungskräfte im Handel): nutzen die Mobile App auf dem eigenen Smartphone.
- **Trainer**: sehen ihre zugewiesenen Gruppen, geben Feedback auf Transferaufgaben, sehen freigegebene Reflexionen.
- **Org-Admins** (Ansprechpartner beim Kundenunternehmen): verwalten Teilnehmer ihrer Organisation, sehen aggregierte Fortschritte – niemals private Inhalte.
- **Super Admin** (Aigner Offensiv): verwaltet Organisationen, Programme, Inhalte und Freischaltungen über die Admin-Web-Oberfläche.

---

## 2. Systemübersicht

Das System besteht aus zwei Anwendungen (Mobile App für Teilnehmer/Trainer, Admin-Web für Verwaltung und Inhalte) und einem gemeinsamen Backend auf Basis von Supabase in einer EU-Hostingregion.

```
                 ┌──────────────────────┐        ┌──────────────────────────┐
                 │   MOBILE APP          │        │   ADMIN-WEB               │
                 │   (Expo / React       │        │   (Next.js App Router)    │
                 │    Native, iOS +      │        │   Inhalte, Organisationen,│
                 │    Android)           │        │   Gruppen, Freischaltung, │
                 │   Teilnehmer, Trainer │        │   Auswertungen            │
                 └───────┬───────▲───────┘        └───────────┬──────▲───────┘
                         │       │                            │      │
              supabase-js│       │ Push                @supabase/ssr │
             (Auth, Data,│       │ (Expo Push          (Auth, Data,  │
              Storage,   │       │  Service ◄──┐        Storage)     │
              Realtime)  │       │             │                     │
                         ▼       │             │                     ▼
        ┌────────────────────────┴─────────────┼──────────────────────────────┐
        │                    SUPABASE (EU-Region)                             │
        │                                      │                              │
        │  ┌──────────────┐  ┌──────────────┐  │  ┌───────────────────────┐   │
        │  │ Auth         │  │ PostgreSQL   │  │  │ Edge Functions (Deno) │   │
        │  │ (E-Mail +    │  │ + RLS auf    │  │  │ – Einladungen         │───┼──► E-MAIL
        │  │  Passwort,   │  │ allen Client-│  └──│ – Push-Versand        │    │   (Transaktions-
        │  │  MFA vorber.)│  │ Tabellen     │     │ – Release-Jobs        │    │    mails: Einladung,
        │  └──────────────┘  └──────────────┘     │ – privilegierte       │    │    Passwort-Reset)
        │                                         │   Admin-Aktionen      │    │
        │  ┌──────────────┐  ┌──────────────┐     │   (Service Role –     │    │
        │  │ Storage      │  │ Scheduled    │     │    nie im Client)     │    │
        │  │ (privat,     │  │ Jobs (Cron)  │     └───────────────────────┘    │
        │  │  Signed URLs)│  └──────────────┘                                  │
        │  └──────────────┘                                                    │
        └──────────────────────────────────────────────────────────────────────┘
```

Kernprinzipien der Übersicht:

- **Beide Clients sprechen direkt mit Supabase** (Auth, Datenbank, Storage). Die Datenbank schützt sich selbst über Row Level Security (RLS) – jeder Nutzer sieht nur, was ihm zusteht, unabhängig davon, welcher Client anfragt.
- **Alles Privilegierte läuft serverseitig in Edge Functions**: Einladungen erzeugen, Nutzer deaktivieren, Push-Nachrichten versenden, zeitgesteuerte Freischaltungen ausführen. Nur dort wird der Service-Role-Schlüssel verwendet – **niemals im Client**.
- **Push** läuft über den Expo Push Service; **E-Mail** (Einladungen, Passwort-Reset) über einen Transaktions-E-Mail-Versand, angebunden an Edge Functions bzw. Supabase Auth.
- **Dateien** (Videos, PDFs, Bilder, Abgaben) liegen privat im Storage und werden nur über kurzlebige Signed URLs ausgeliefert.

---

## 3. Monorepo-Struktur

Das Projekt lebt als Monorepo unter `handel-offensiv/` mit **pnpm workspaces** und **TypeScript strict** in allen Paketen.

```
handel-offensiv/
├── apps/
│   ├── mobile/          # Expo-App (Teilnehmer/Trainer): expo-router,
│   │                    # @tanstack/react-query, @supabase/supabase-js,
│   │                    # expo-notifications, expo-secure-store
│   └── admin/           # Next.js App Router: Tailwind CSS, minimale
│                        # shadcn/ui-Basis, @supabase/ssr
├── packages/
│   ├── types/           # Domain- und DB-Typen (eine Quelle der Wahrheit)
│   ├── validation/      # Zod-Schemas inkl. Content-Block-Configs
│   ├── domain/          # RBAC-Capabilities, Release Engine,
│   │                    # Fortschrittsberechnung – reine, getestete Funktionen
│   └── config/          # Design Tokens, Konstanten
├── supabase/
│   ├── config.toml
│   ├── migrations/      # versionierte SQL-Migrationen (einziger Weg für DB-Änderungen)
│   ├── functions/       # Deno Edge Functions
│   ├── seed.sql
│   └── tests/           # u. a. RLS-Tests
├── docs/                # gesamte Dokumentation
└── .github/workflows/ci.yml
```

**Warum Monorepo?**

- Mobile App, Admin-Web und Backend teilen dieselben Typen, Validierungsregeln und Geschäftslogik. Ein Monorepo verhindert, dass z. B. die Freischaltlogik in zwei Codebasen auseinanderläuft.
- **`packages/domain` ist die entscheidende Schicht**: Release Engine, Fortschrittsberechnung und RBAC-Capabilities sind reine Funktionen ohne Framework-Abhängigkeit. Sie werden isoliert getestet und von Mobile, Admin und Edge Functions identisch genutzt. Fehler in dieser Logik wären fachlich am teuersten – deshalb liegt sie zentral und testbar.
- **`packages/validation`** stellt sicher, dass jeder Content-Block (`config jsonb`) beim Schreiben im Admin und beim Lesen im Client gegen dasselbe Zod-Schema geprüft wird.
- Ein gemeinsames CI (`.github/workflows/ci.yml`: Typecheck, Lint, Tests, Builds bei jedem PR) prüft alle Pakete zusammen; API-Brüche zwischen App und Backend fallen beim PR auf, nicht in Produktion.

---

## 4. Technologie-Entscheidungen je Ebene

> **Hinweis für die Implementierung:** Alle genannten Bibliotheken werden in der **jeweils aktuellen stabilen Version zum Implementierungszeitpunkt** eingesetzt. Vor Projektstart und vor größeren Upgrades die aktuellen stabilen Versionen (Expo SDK, Next.js, Supabase-Clients, React Query, Zod) prüfen und im Lockfile fixieren.

### 4.1 Mobile App: Expo (React Native)

- **Expo mit aktuellem stabilem SDK**: eine Codebasis für iOS und Android, gemanagte Build-/Update-Pipeline (EAS), geringes Risiko bei nativen Abhängigkeiten. Für eine inhaltsgetriebene Lern-App ist keine tiefe native Sonderfunktionalität nötig – Expo ist hier die wartungsärmste Wahl.
- **expo-router**: dateibasiertes Routing mit sauberen Deep Links – wichtig, weil Push-Nachrichten direkt in konkrete Lektionen oder Ankündigungen führen sollen.
- **@tanstack/react-query**: Server-State-Verwaltung mit Caching, Hintergrund-Refetch und Retry. Trägt die Offline-Strategie (Kapitel 7) wesentlich mit.
- **@supabase/supabase-js**: direkter, typisierter Zugriff auf Auth, Datenbank und Storage.
- **expo-secure-store**: Auth-Tokens liegen im sicheren Gerätespeicher (Keychain/Keystore), **nie in AsyncStorage**.
- **expo-notifications**: Registrierung und Empfang von Push (Kapitel 8).

### 4.2 Admin-Web: Next.js (App Router)

- **Next.js App Router**: Server Components für datenlastige Verwaltungsansichten, klare Trennung von Server- und Client-Code, gutes TypeScript-Ökosystem.
- **@supabase/ssr**: korrekte Cookie-basierte Auth-Sitzungen über Server und Client hinweg – Voraussetzung dafür, dass RLS auch bei serverseitigem Rendern mit der Identität des angemeldeten Admins greift.
- **Tailwind CSS + minimale shadcn/ui-Basis**: schnelle, konsistente Umsetzung der Design Tokens (Kapitel 4.5) ohne schweres Komponenten-Framework. Bewusst nur eine schmale shadcn-Basis, um den eigenständigen visuellen Charakter zu behalten.

### 4.3 Backend: Supabase (PostgreSQL, Auth, Storage, Edge Functions)

- **PostgreSQL mit Row Level Security**: Zugriffsschutz liegt in der Datenbank selbst und gilt für jeden Zugriffspfad. RLS ist auf **allen** Client-Tabellen Pflicht; SECURITY-DEFINER-Hilfsfunktionen im Schema `app` (`app.is_super_admin()`, `app.org_role(org_id)`, `app.is_cohort_trainer(cohort_id)`, `app.is_cohort_member(cohort_id)`) halten die Policies lesbar und performant. Details: `docs/SECURITY.md`.
- **Supabase Auth**: E-Mail + Passwort, Einladungsfluss ohne öffentliche Registrierung, MFA (TOTP) für Super Admin und Trainer vorbereitet. Details: `docs/SECURITY.md` (Kapitel 4).
- **Edge Functions (Deno, TypeScript)**: alle privilegierten Operationen (Einladungen, Push-Versand, Release-Jobs, Admin-Aktionen mit Service Role). TypeScript durchgängig – dieselbe Sprache wie im Rest des Monorepos, Wiederverwendung von `packages/domain` und `packages/validation`.
- **Storage**: private Buckets, Auslieferung ausschließlich über Signed URLs, Pfadkonvention `organizations/{orgId}/...` als zusätzliche mandantenbezogene Ordnung.
- **Warum Supabase als Ganzes**: Auth, relationale Datenbank, Storage, serverlose Funktionen und Cron in einem EU-gehosteten Dienst – für ein kleines Team der beste Kompromiss aus Kontrolle (echtes PostgreSQL, eigene Migrationen) und Betriebsaufwand.

### 4.4 Geteilte Pakete

- **TypeScript strict überall**: ein Typsystem von der Datenbank bis in die UI; DB-Typen in `packages/types` sind die eine Quelle der Wahrheit.
- **Zod** in `packages/validation`: Laufzeitvalidierung an jeder Vertrauensgrenze (Admin-Formulare, Edge-Function-Inputs, Content-Block-Configs). Verhindert, dass fehlerhafte Inhalte die Mobile App zum Absturz bringen.
- **Reine Domänenlogik** in `packages/domain`: Release Engine, Fortschritt, RBAC-Capabilities als getestete Funktionen ohne I/O – identisches Verhalten in App, Admin und Edge Functions.

### 4.5 Design

Die Gestaltung übernimmt die Tokens der bestehenden Aigner-Offensiv-Website (`packages/config`): green `#A8C62B`, greenBright `#C5E33C`, dark `#12160E`, dark2 `#181D13`, paper `#F7F6F1`, ink `#131711`, inkSoft `#454B42`, line `#E3E3D8`; Schrift **Archivo** (lokal gebundelt, kein externer Font-Dienst); Radius 2 px; große Modulnummern 01–05; subtile Taktik-/Spielfeldlinien als grafisches Motiv. Es gibt einen **expliziten Light Mode** – keinen halbherzigen Dark Mode. Anspruch: hochwertig, erwachsen, ruhig; kein SaaS-Dashboard-Generik, kein Glassmorphism, keine Neonfarben.

---

## 5. Mandantenfähigkeit

Die App bedient mehrere Kundenunternehmen (Organisationen) in einer gemeinsamen Installation. Die Trennung ist auf Datenebene erzwungen, nicht nur in der Oberfläche.

**Ebenen des Modells:**

1. **Profil** (`profiles`, 1:1 zu `auth.users`): die Person mit Name, Avatar, Status, Sprache. `is_super_admin` markiert ausschließlich Aigner-Offensiv-Administratoren.
2. **Organisation** (`organizations`): das Kundenunternehmen mit Stammdaten, Logo, Ansprechpartner und Status (`active|inactive|archived`).
3. **Mitgliedschaft** (`organization_memberships`): verbindet Profil und Organisation mit Rolle (`org_admin|trainer|participant`) und optional feingranularen Rechten (`permissions jsonb`). Eine Person kann in mehreren Organisationen Mitglied sein (`UNIQUE(profile_id, organization_id)`).
4. **Cohort** (Gruppe, `cohorts`): ein konkreter Programmdurchlauf einer Organisation mit Zeitraum, Trainern (`cohort_trainers`), Teilnehmern (`cohort_members`) und Terminen (`cohort_sessions` = Offensivtage mit Ort, Raum, Anfahrt, Trainer).

**Sichtbarkeitsregeln (Defense in Depth – RLS + serverseitige Rechteprüfung + UI nur als UX):**

- **Teilnehmer** sehen nur eigene Daten und die Inhalte ihrer Cohorts.
- **Trainer** sehen nur zugewiesene Cohorts und dort nur Inhalte, die Teilnehmer explizit mit `visibility='trainer'` freigegeben haben.
- **Org-Admins** sehen Aggregate der eigenen Organisation (z. B. Fortschrittsquoten), **niemals Reflexionstexte** – die Sichtbarkeit von Reflexionen ist auf Datensatzebene gespeichert und standardmäßig privat.
- **Super Admin** arbeitet nicht über breite RLS-Ausnahmen im Client, sondern über serverseitige Edge Functions mit Service Role; jede solche Aktion ist über `audit_logs` (INSERT-only) nachvollziehbar.

Rechte werden nicht über verstreute `if role === ...`-Abfragen geprüft, sondern über zentrale **RBAC-Capabilities** in `packages/domain` (`organizations.read/manage`, `users.read/invite/manage`, `cohorts.read/manage`, `content.read/edit/publish`, `submissions.read/feedback`, `analytics.read`, `notifications.send`, `audit.read`, `settings.manage`). Rollen erhalten Capability-Bündel; kundenspezifische Rollen sind später ergänzbar, ohne Prüfstellen im Code anzufassen.

---

## 6. Environments

Es gibt drei strikt getrennte Umgebungen, jede mit **eigenem Supabase-Projekt**:

| Environment    | Zweck                                        | Daten                          |
|----------------|----------------------------------------------|--------------------------------|
| **local**      | Entwicklung (Supabase CLI lokal)             | Seed-/Testdaten (`seed.sql`)   |
| **staging**    | Abnahme, Tests mit realistischen Inhalten    | keine echten Teilnehmerdaten   |
| **production** | Live-Betrieb                                 | echte Daten, EU-Hostingregion  |

Regeln:

- **DB-Änderungen ausschließlich über versionierte Migrationen** (`supabase/migrations/*.sql`). Kein manuelles Schema-Editieren in Staging oder Produktion; jede Umgebung entsteht reproduzierbar aus denselben Migrationen.
- Konfiguration (URLs, Keys) pro Umgebung über Umgebungsvariablen bzw. EAS-/Vercel-Konfiguration; niemals im Code, der Service-Role-Key existiert nur serverseitig.
- CI prüft bei jedem PR Typecheck, Lint, Tests und Builds; Deployments nach staging/production erfolgen aus dem Hauptzweig heraus, Migrationen laufen vor dem App-Deploy.
- Für den App-Store-Review existiert ein Demo-Account mit unkritischen Beispieldaten.

---

## 7. Offline-Strategie

Teilnehmer arbeiten im Handel – auf der Fläche, im Lager, unterwegs – oft mit schlechter Verbindung. Die App ist **offline-tolerant**, aber keine vollständige Offline-App:

- **Lesen:** Zuletzt geladene Inhalte (Lektionen, Textblöcke, Fortschritt, Termine) werden lokal gecacht (React-Query-Cache mit Persistenz). Bereits besuchte Inhalte bleiben ohne Verbindung lesbar; nie geladene Inhalte zeigen einen ehrlichen Offline-Hinweis.
- **Schreiben:** Antworten, Reflexionen und Checklisten-Stände werden **zuerst lokal gesichert** und bei Wiederverbindung mit automatischem **Retry** übertragen. Kein Datenverlust durch Funkloch; der Sync-Status ist in der UI erkennbar.
- **Medien:** Videos und Audios werden gestreamt und nicht dauerhaft offline vorgehalten (bewusst kein Offline-Video-DRM in V1, siehe Kapitel 10). PDFs/Downloads können über den Systemmechanismus lokal gespeichert werden.
- **Konflikte:** Lerndaten sind pro Teilnehmer geschrieben, echte Schreibkonflikte sind daher selten; es gilt Last-Write-Wins mit serverseitigen Zeitstempeln.

---

## 8. Push-Architektur

Push-Nachrichten sind **sparsam** und immer anlassbezogen: Freischaltung einer Lektion, Erinnerung vor einem Offensivtag, Trainer-Feedback, wichtige Ankündigung. Kein tägliches „Streak"-Nudging.

Ablauf:

```
Anlass (Release-Job / Trainer-Feedback / Ankündigung)
   │
   ▼
Edge Function „Push-Versand"
   │  liest Empfänger + deren push_tokens (gerätebezogen),
   │  prüft Berechtigung (notifications.send), schreibt notifications-Datensatz
   ▼
Expo Push Service ──► APNs (iOS) / FCM (Android) ──► Gerät
   │
   ▼
App öffnet per Deep Link (expo-router) direkt das Ziel,
z. B. die freigeschaltete Lektion oder die Ankündigung
```

Entscheidungen:

- **expo-notifications + Expo Push Service**: eine Schnittstelle für iOS und Android, Token-Handling und Zustellberichte inklusive.
- **Gerätebezogene Tokens** (`push_tokens`): eine Person kann mehrere Geräte haben; Tokens werden beim Logout bzw. bei Zustellfehlern (Expo-Receipts) aufgeräumt.
- **Jede Push-Nachricht hat ein In-App-Gegenstück** (`notifications`-Tabelle): Wer Push deaktiviert, verpasst nichts – die Nachricht erscheint im Posteingang der App.
- **Deep Links** führen direkt zum Inhalt; die Release Engine liefert den Anlass, versendet wird ausschließlich serverseitig.

---

## 9. Performance-Grundsätze

- **Pagination statt Volllisten:** Alle potenziell wachsenden Listen (Teilnehmer, Abgaben, Benachrichtigungen, Audit-Logs) werden seitenweise geladen (Cursor- oder Range-basiert), im Admin wie in der App.
- **Lazy Loading von Inhalten:** Die App lädt Modul-/Lektionsübersichten schlank; Content-Blöcke und Medien erst beim Öffnen einer Lektion. Bilder in passenden Größen, Videos gestreamt.
- **Indexe entlang der Zugriffspfade:** Fremdschlüssel und häufige Filter sind indiziert – u. a. `organization_memberships(profile_id)`, `cohort_members(cohort_id, profile_id)`, `lesson_releases(cohort_id, lesson_id)`, `lesson_progress(profile_id, lesson_id)`, `notifications(profile_id, created_at)`. Neue Abfragen bekommen bei Bedarf Indexe per Migration.
- **RLS-Performance:** Policies rufen die `app.*`-Hilfsfunktionen auf (SECURITY DEFINER, als stabil markiert), statt Mitgliedschafts-Subqueries in jeder Policy zu duplizieren. Policy-Bedingungen bleiben index-freundlich (Vergleich auf `auth.uid()`/IDs, keine Funktionen über Tabellenspalten). Aggregierte Sichten wie `module_progress` sind als SQL-View definiert, damit die Berechnung in der Datenbank statt im Client stattfindet.
- **Client-Caching:** React Query dedupliziert Anfragen und hält Daten mit sinnvollen Stale-Zeiten frisch; Realtime/Refetch nur dort, wo Aktualität fachlich zählt (z. B. Freischaltungen), nicht flächendeckend.
- **Messen statt raten:** Langsame Abfragen werden über die Supabase-Query-Statistiken identifiziert; Optimierung folgt echten Zahlen.

---

## 10. Bewusste Nicht-Ziele der V1

Diese Punkte sind **absichtlich nicht** Teil der ersten Version – als Schutz vor Komplexität, nicht als Versäumnis:

- **Keine In-App-Käufe.** Der Zugang entsteht ausschließlich über Einladungen im Rahmen des Programms. Das vermeidet Store-Payment-Komplexität und passt zum B2B-Vertriebsmodell.
- **Kein Social Login** (Google/Apple/Microsoft). V1 nutzt nur E-Mail + Passwort mit Einladungsfluss; weniger Abhängigkeiten, klarere Datenschutzlage. Die Auth-Architektur schließt eine spätere Ergänzung nicht aus.
- **Kein Offline-Video-DRM.** Videos werden gestreamt; ein kopiergeschützter Offline-Download stünde in keinem Verhältnis zu Aufwand und Nutzen.
- **Kein öffentlicher Chat / Community-Feed.** Austausch findet an den Offensivtagen statt; in der App gibt es gerichtete Kommunikation (Ankündigungen, Trainer-Feedback), aber keinen moderationspflichtigen offenen Kanal.
- **Keine öffentliche Registrierung**, keine Gamification-Mechaniken (Punkte, Abzeichen, Ranglisten) und keine zusätzlichen Geräteberechtigungen (keine Kontakte, kein Standort, kein Mikrofon) – Datenminimierung ist Grundprinzip.

Was V1 dafür konsequent liefert: einen verlässlichen, ruhigen Begleiter durch das Programm – vorbereitet zum Spieltag, klar in der Kabine, wirksam auf dem Platz.

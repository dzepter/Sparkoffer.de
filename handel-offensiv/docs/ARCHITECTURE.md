# Architektur – Aigner Offensiv Digital (Website · Campus · Admin)

**Version 2 – Entwurf zur Freigabe (26.09.2026).** Ersetzt die Architektur der „Handel Offensiv Learning App" (Version 1, Sommer 2026), deren Bestand in `CURRENT_STATE.md` dokumentiert ist. Alles, was in Version 1 gebaut wurde (Datenbank, Rechte, Admin-Cockpit, native App, Edge Functions), bleibt Grundlage; neu hinzu kommen der **Web-Campus** für Teilnehmer und die **öffentliche Website** als dritte Anwendung auf derselben Basis.

Kapitel 1–3 sind ohne IT-Vorwissen lesbar. Ab Kapitel 4 wird es technischer; Details stehen in `DATA_MODEL.md`, `RBAC.md`, `SECURITY.md`, `IMPLEMENTATION_PLAN.md`.

> **Entscheidungen, die noch der Freigabe bedürfen**, sind mit **[ENTSCHEIDUNG K‑n]** markiert und in `IMPLEMENTATION_PLAN.md`, Abschnitt „Offene Entscheidungen", mit Optionen und Empfehlung ausgeführt. Dieses Dokument beschreibt die **empfohlene** Variante.

---

## 1. Produktkontext & Lernmodell

### 1.1 Was das Gesamtsystem ist – und was nicht

Aigner Offensiv (Institut für Führung und Vertrieb, München) bietet mit **HANDEL OFFENSIV – Der Führungsführerschein für den Handel** ein Präsenzprogramm aus fünf **Offensivtagen**. Claim: *Handel ist Mannschaftssport. Führung entscheidet das Spiel.*

Das digitale Gesamtsystem hat drei Bereiche, die sich für Nutzer wie **eine** Marke anfühlen:

1. **Öffentliche Website** (`www.aigner-offensiv.de`) – gewinnt Unternehmen und Entscheider.
2. **HANDEL OFFENSIV CAMPUS** (`campus.aigner-offensiv.de`) – „Der digitale Mannschaftsraum": begleitet Teilnehmer **zwischen** den Offensivtagen. Zugang nur auf Einladung.
3. **Admin-/Trainer-Cockpit** (`admin.aigner-offensiv.de`) – steuert Unternehmen, Gruppen, Termine, Inhalte, Freischaltungen; Trainer geben Feedback.

Später kann auf derselben Basis eine **native iOS-/Android-App** veröffentlicht werden (der bestehende Expo-Code bleibt dafür erhalten).

Der Campus ersetzt die Präsenz **nicht**. Er übernimmt die Zeit dazwischen: **Vorbereiten → Präsenz erleben → Vertiefen → Umsetzen → Reflektieren → auf den nächsten Offensivtag vorbereiten.** Produktversprechen: *„Fünf Offensivtage. Dazwischen bleibt Führung in Bewegung."*

### 1.2 Das Lernmodell: der Zyklus um jeden Offensivtag

```
   VORBEREITUNG ──► PRÄSENZTAG ──► TRANSFER ──► VORBEREITUNG NÄCHSTER OFFENSIVTAG
   (Campus: Video,   (vor Ort:       (Campus: Praxis-   (Campus: Video, Checkliste,
    Reflexionsfrage,  Termin, Ort,    aufgabe + Rück-    Beobachtungsauftrag,
    Selbsteinschätz.  Agenda,         fragen, Offensiv-  Fragebogen)
    Arbeitsblatt)     Notizen)        plan-Eintrag)
```

Technisch: jedes **Modul** (= Offensivtag) besitzt **Lernphasen** (`learning_phases.phase_type`: `before_day`, `day`, `after_day`, `prep_next`, `custom`), darin **Lektionen**, darin **Content-Blöcke**. Die **Release Engine** schaltet Lektionen nach den realen Terminen der Gruppe frei („7 Tage vor Offensivtag 3"); gesperrte Inhalte sind sichtbar, aber verschlossen („Wird am 11. Juni 2027 freigeschaltet").

Standardprogramm: 01 Führung beginnt bei mir · 02 Aus Mitarbeitern wird Mannschaft · 03 Die richtige Aufstellung · 04 Spielintelligenz mit KI · 05 Führen, wenn es darauf ankommt. Die Struktur ist **nicht** auf fünf Module festgelegt.

Nach jedem Modul füllt der Teilnehmer seinen **Offensivplan** (Erkenntnis, nächster Schritt, mit wem, bis wann, Erfolgskriterium, Status); nach Modul 5 entsteht daraus der **90-Tage-Offensivplan** (PDF-Export).

### 1.3 Wer das System nutzt

| Rolle | Arbeitet in | Sieht |
|---|---|---|
| **Teilnehmer** (Führungskräfte im Handel) | Campus (Browser/PWA, später App) | nur eigene Daten, eigene Gruppe, freigeschaltete Inhalte |
| **Trainer** (Rainer Aigner, ggf. weitere) | Admin-Cockpit (Trainer-Sicht) | zugewiesene Gruppen, freigegebene Reflexionen, Abgaben |
| **Organisationsadmin** (Ansprechpartner beim Kunden) | Admin-Cockpit (eingeschränkt) | nur eigene Firma, nur Aggregate – **nie** persönliche Reflexionen |
| **Super Admin** (Aigner Offensiv) | Admin-Cockpit | alles, privilegierte Aktionen nur serverseitig, protokolliert |
| **Interessenten/Entscheider** | Website | öffentliche Inhalte, Anfrage, Teilnehmer-Login-Link |

---

## 2. Systemübersicht

```
                  www.aigner-offensiv.de     campus.aigner-offensiv.de     admin.aigner-offensiv.de
                 ┌────────────────────┐     ┌────────────────────────┐    ┌────────────────────────┐
                 │  WEBSITE           │     │  CAMPUS                │    │  ADMIN / TRAINER       │
                 │  Next.js (öffentl.)│     │  Next.js + PWA         │    │  Next.js (bestehend)   │
                 │  Positionierung,   │     │  HEUTE · Programm ·    │    │  Unternehmen · Gruppen │
                 │  5 Offensivtage,   │     │  Offensivplan · Termine│    │  Teilnehmer · Programme│
                 │  Impulse, Kontakt, │     │  Material · Profil     │    │  Inhalte · Termine ·   │
                 │  Teilnehmer-Login →│     │  (nur eingeladene      │    │  Nachrichten · Auswert.│
                 │  Website-Texte aus │     │   Teilnehmer, noindex) │    │  System · Website-Texte│
                 │  Supabase (ISR)    │     │                        │    │  (noindex)             │
                 └─────────┬──────────┘     └───────────┬────────────┘    └───────────┬────────────┘
                           │ anon (nur       @supabase/ssr│ Cookie-Session   @supabase/ssr│
                           │ öffentl. Tabellen)           │ (Teilnehmer)                 │ (Admin/Trainer)
                           ▼                              ▼                              ▼
        ┌────────────────────────────────────────────────────────────────────────────────────────┐
        │                              SUPABASE (EU-Region Frankfurt)                            │
        │  Auth (E-Mail+Passwort, Einladung, Reset, MFA vorbereitet) · PostgreSQL mit RLS auf     │
        │  allen Client-Tabellen · Storage (privat, Signed URLs) · Edge Functions (Deno):         │
        │  invite-user · accept-invitation · release-scheduler (Cron) · send-push ·               │
        │  process-deletion-request · [neu] send-mail · [neu] revalidate-website                  │
        └───────────────────────────────┬──────────────────────────────┬─────────────────────────┘
                                        │ SMTP (Kunden-Postfach)       │ Expo Push (später, App)
                                        ▼                              ▼
                                   E-MAIL (Einladung, Reset,      NATIVE APP (Phase 9,
                                   Löschanfrage, optional         bestehender Expo-Code,
                                   „neue Lernphase")               gleiche Backend-Modelle)
```

Kernprinzipien:

- **Ein Backend, ein Datenmodell, eine Rechteschicht** für alle Oberflächen. Die Datenbank schützt sich selbst (RLS); jede Oberfläche ist nur eine Sicht darauf.
- **Alles Privilegierte läuft serverseitig** (Edge Functions, Next.js Server Actions/Route Handlers mit Service Role); der Service-Role-Schlüssel erreicht **niemals** Browser oder App.
- **Ein Designsystem** (`packages/ui` + `packages/config`-Tokens) für Website, Campus und Admin – dieselben Farben, Schriften, Abstände, Komponenten.
- **Die Website liest ihre redaktionellen Texte aus der Datenbank** (Tabellen `site_content`, `site_posts`), die im Admin-Cockpit gepflegt werden – ein Login für alles, kein zweites CMS. **[ENTSCHEIDUNG K‑2]**

---

## 3. Domains, Hosting, Betrieb

| Bereich | Domain | Hosting | Bemerkung |
|---|---|---|---|
| Website | `www.aigner-offensiv.de` (Apex → www) | Vercel (Region `fra1`) | ersetzt die WordPress-Site; `handel-offensiv.de` leitet per 301 auf `/handel-offensiv` weiter **[ENTSCHEIDUNG K‑1]** |
| Campus | `campus.aigner-offensiv.de` | Vercel | `noindex`, PWA-fähig |
| Admin | `admin.aigner-offensiv.de` | Vercel | `noindex`, MFA für Admin/Trainer |
| Backend | Supabase-Projekt (EU/Frankfurt), getrennt Staging/Production | Supabase | AVV mit Supabase abschließen |
| DNS, E-Mail, Domain | Strato (bestehend) | Strato | **MX-Einträge unangetastet**; nur A/AAAA/CNAME für www/campus/admin ändern |
| Alt-System | WordPress auf Strato-Webspace | Strato | nach Cutover abschalten (PHP 7.4, Sicherheitsrisiko) |

**Warum Vercel?** Strato-Shared-Hosting kann kein Next.js ausführen. Vercel ist der Referenz-Host für Next.js (ISR, Preview-Deployments je Pull Request, EU-Region, Auftragsverarbeitungsvertrag verfügbar). Auf der Website werden **keine personenbezogenen Daten verarbeitet** (Anfragen laufen über Supabase/E-Mail, kein Tracking); Campus und Admin übertragen personenbezogene Daten über TLS an Supabase in Frankfurt – Vercel rendert nur. Alternative mit mehr Betriebsaufwand: eigener EU-Server (Hetzner) mit Docker. **[ENTSCHEIDUNG K‑5]**

**Umgebungen:** `local` (Supabase CLI/Docker, Seed 2027) · `staging` (eigenes Supabase-Projekt, Vercel-Preview/Branch) · `production`. Datenbankänderungen ausschließlich über versionierte Migrationen; Konfiguration über Umgebungsvariablen; CI prüft Typecheck, Lint, Unit-Tests, **RLS-Tests gegen eine Wegwerf-Datenbank**, Builds aller Apps, Playwright-E2E.

---

## 4. Monorepo-Struktur (Zielbild)

```
handel-offensiv/
├── apps/
│   ├── website/         # NEU  Next.js: öffentliche Website (ISR, Texte aus Supabase)
│   ├── campus/          # NEU  Next.js + PWA: Teilnehmer-Campus
│   ├── admin/           # BESTAND Next.js: Admin-/Trainer-Cockpit (+ Bereich „Website")
│   └── mobile/          # BESTAND Expo (ruht bis Phase 9; bleibt baubar in der CI)
├── packages/
│   ├── ui/              # NEU  gemeinsame React-Komponenten (shadcn-Basis, Markenstil), Tailwind-Preset
│   ├── config/          # BESTAND Design-Tokens (→ Blau) + Konstanten
│   ├── domain/          # BESTAND Capabilities, Release Engine, Fortschritt, Quiz (rein, getestet)
│   ├── types/           # BESTAND DB-/Domain-Typen
│   └── validation/      # BESTAND Zod-Schemas (Blocktypen, Formulare, Function-Inputs)
├── supabase/
│   ├── migrations/      # 0001 Schema · 0002 RLS · 0003+ Erweiterungen v2
│   ├── functions/       # Edge Functions (Deno)
│   ├── tests/           # NEU  RLS-Tests (pgTAP/SQL) für Mandantentrennung
│   └── seed.sql         # Demo-Daten (2027, erfundene Unternehmen)
└── docs/
```

Die beiden statischen Sites (`aigner-offensiv/`, `handel-offensiv-website/`) bleiben bis zum Cutover im Repository als **Referenz und Bridge** (die Handel-Offensiv-Site ist live); danach werden sie archiviert.

---

## 5. Technologie-Entscheidungen je Ebene

> Alle Bibliotheken in der jeweils aktuellen stabilen Version; vor Upgrades prüfen und im Lockfile fixieren.

### 5.1 Website (`apps/website`) – Next.js

- **App Router, Server Components, ISR**: schnelle, indexierbare Seiten; redaktionelle Texte werden beim Build und bei Änderung (On-Demand-Revalidation per Webhook aus dem Admin) aus `site_content` gelesen. Kein clientseitiges Text-Injizieren mehr.
- **Kontaktformular** serverseitig (Server Action → E-Mail an `info@` + Eintrag in `inquiries` mit Rate Limit und Honeypot) statt `mailto:`; Einwilligung wird gespeichert.
- **SEO**: Canonicals, Open Graph, Sitemap, `robots.txt`; **Redirect-Map** für alle 16 alten WordPress-URLs und für `handel-offensiv.de`.
- **Keine Drittanbieter-Skripte**, Schrift Archivo self-hosted, kein Cookie-Banner nötig.

### 5.2 Campus (`apps/campus`) – Next.js + PWA **[ENTSCHEIDUNG K‑3]**

- **Warum Next.js statt Expo-Web:** gleiches Designsystem wie Website und Admin (§2 „eine Marke"), bestes Browser-Erlebnis (Formulare, Tabellen, Tastatur, Barrierefreiheit), Server Components für die HEUTE-Seite, saubere PWA. Der Expo-Code bleibt für die native App; fachliche Vorlage sind die Feature-Module der Mobile-App (heute, lesson mit 14 Block-Renderern, offensivplan, termine, profil, benachrichtigungen).
- **@supabase/ssr** (Cookie-Sessions), **React Query** für Client-State, **Zod** an jeder Eingabe.
- **PWA**: Web-App-Manifest, Service Worker (Serwist), Home-Screen-Icon, Offline-Grundzustände.
- **Offline-Toleranz**: gelesene Inhalte im Cache; **Autosave** für Reflexionen und Aufgaben in IndexedDB mit Sync-Warteschlange; sichtbarer Status *GESPEICHERT / WIRD GESPEICHERT / OFFLINE – WIRD SPÄTER SYNCHRONISIERT*. Entwürfe werden beim Logout gelöscht (kein Fremdzugriff am geteilten Gerät).
- **Benachrichtigungen**: In-App-Posteingang (Tabelle `notifications`) ab Start; Web Push (VAPID) vorbereitet, Aktivierung später.
- **Video**: Player-Komponente hinter einer Anbieterabstraktion (`VideoSource = storage | vimeo | …`), kein Autoplay, Untertitel-Spur (WebVTT) vorgesehen. Start mit privatem Supabase Storage + Signed URLs; Vimeo/Bunny als Upgrade. **[ENTSCHEIDUNG K‑6]**

### 5.3 Admin-/Trainer-Cockpit (`apps/admin`) – Bestand, erweitert

- Navigation entspricht bereits §21. Ergänzungen: Teilnehmer-Detailseite, Dashboard-Kennzahlen nach §22, Trainer-Sicht mit Feedback-Queue, Freischaltungs-UI für alle 10 Varianten, Editor für die neuen Blocktypen, Bereich **„Website"** (Texte, Impulse, Vorschau, „Veröffentlichen" → Revalidation).
- **MFA (TOTP)** für Super Admin und Trainer aktivieren (Seite existiert).

### 5.4 Backend – Supabase (Bestand, erweitert)

- PostgreSQL + RLS auf allen Client-Tabellen, Hilfsfunktionen `app.*` (SECURITY DEFINER). Erweiterungen v2: Blocktypen `practice_task`, `file_upload`, `photo_upload`, `announcement`; Tabellen `site_content`, `site_posts`, `inquiries`; Seed 2027 (Details `DATA_MODEL.md`).
- **Auth**: E-Mail + Passwort, Einladung (Token-Hash, Ablauf), Reset mit Redirect auf den Campus, MFA vorbereitet. Systemmails über **SMTP des Kunden-Postfachs** (z. B. `mannschaftsraum@aigner-offensiv.de`) – kein neuer Anbieter, EU, Absender der Marke. **[ENTSCHEIDUNG K‑4]**
- **Storage**: private Buckets, Signed URLs (kurz), Typ-/Größenprüfung, Pfad `organizations/{orgId}/…`; neue Buckets für Teilnehmer-Uploads (Datei/Foto) mit strikter RLS.
- **Edge Functions**: bestehend + `send-mail` (Template-Rendering im Markendesign) + `revalidate-website`.

### 5.5 Geteilte Pakete

- `packages/ui`: Button, Card, Kicker, ModuleNumber, ProgressLine, Field, Dialog, DataTable, EmptyState … als eine Quelle für drei Apps; Tailwind-Preset mit Tokens.
- `packages/domain`: unverändert die entscheidende Schicht (Release Engine, Fortschritt, Capabilities) – jetzt von drei Web-Apps, Edge Functions und später der App genutzt.
- `packages/types`: aus dem Schema generiert (`supabase gen types`) statt handgepflegt.

### 5.6 Design

Farbwelt **Blau** (Kundenentscheidung, live auf handel-offensiv.de): Navy `#101C2A` / `#16263A`, Blau `#2E6FB0`, Hellblau `#7FB8E8`, Tiefblau `#1F5E96`, Off-White `#F5F7F9`, Ink `#131A22`, Linien `#DEE4EA` / `#263A50`. Schrift **Archivo** (self-hosted, Expanded für Headlines). Radius 2 px, schräge Akzentbalken, große Modulnummern 01–05, dezente Taktiklinien. **Kein Gold** als zusätzliche Akzentfarbe – der Master-Prompt lässt „bestehende Markenakzentfarbe" ausdrücklich zu; eine zweite Akzentfarbe würde die Marke verwässern. **[ENTSCHEIDUNG K‑7]**
Rainer Aigner ist die sichtbare Trainerpersönlichkeit (Hero, Video, Begrüßung, Impulse); Teilnehmerfotos nur im Profil. Kein Baukastenlook: wenige Rahmen, keine Glaseffekte, keine bunten Icons, ruhige Bewegung. Light Mode; kein halber Dark Mode. Alle Demo-Screens mit Daten aus **2027**.

---

## 6. Mandantenfähigkeit

Mehrere Kundenunternehmen in einer Installation, getrennt auf **Datenebene**:

1. **Profil** (`profiles`, 1:1 `auth.users`), `is_super_admin` nur für Aigner Offensiv.
2. **Organisation** (`organizations`): Kunde mit Stammdaten, Logo, Ansprechpartner, Status, interner Notiz.
3. **Mitgliedschaft** (`organization_memberships`): Rolle `org_admin | trainer | participant`, optional `permissions jsonb`.
4. **Gruppe** (`cohorts`): Programmdurchlauf mit Zeitraum, Trainern, Teilnehmern und **eigenen Terminen** (`cohort_sessions`).

Sichtbarkeit (RLS + serverseitige Prüfung + UI nur als UX): Teilnehmer nur eigene Daten; Trainer nur zugewiesene Gruppen und dort nur `visibility='trainer'`; Org-Admin nur Aggregate, **nie Reflexionstexte**; Super Admin über Edge Functions/Server Actions mit Audit-Log. Rechteprüfung über Capabilities in `packages/domain` (`RBAC.md`).

---

## 7. Offline-Strategie (Campus & App)

Teilnehmer arbeiten auf der Fläche, im Lager, unterwegs. Der Campus ist **offline-tolerant**, keine Offline-App: gelesene Inhalte bleiben lesbar (Cache), Antworten werden **zuerst lokal gesichert** (IndexedDB) und mit Retry synchronisiert, Medien werden gestreamt, Konflikte per Last-Write-Wins mit Server-Zeitstempel. Status ist immer sichtbar. Beim Logout werden lokale Entwürfe gelöscht.

---

## 8. Benachrichtigungen

Sparsam und anlassbezogen: Lernimpuls verfügbar · „Noch 7 Tage bis Offensivtag 3" · Praxisaufgabe offen · neues Trainerfeedback · Nachricht von Rainer an die Gruppe. Jede Benachrichtigung existiert **zuerst** als Datensatz in `notifications` (In-App-Posteingang im Campus). Kanäle darüber: Web Push (später), E-Mail (optional, Opt-in), Expo Push (native App). Erzeugt ausschließlich serverseitig (Release Engine, Trainer-Aktionen, Ankündigungen).

---

## 9. Performance-Grundsätze

Pagination statt Volllisten · Lazy Loading von Content-Blöcken und Medien · Indexe entlang der Zugriffspfade · RLS über `app.*`-Helfer index-freundlich · Aggregate als SQL-Views (`module_progress`) · ISR für die Website · React-Query-Caching mit fachlich sinnvollen Stale-Zeiten · Messen über Supabase-Query-Statistiken und Vercel Analytics (ohne Tracking-Cookies).

---

## 10. Bewusste Nicht-Ziele

Keine In-App-Käufe · kein Social Login · kein Offline-Video-DRM · kein öffentlicher Chat/Community-Feed · keine öffentliche Registrierung · **keine Gamification** (Punkte, Abzeichen, Ranglisten, Teilnehmervergleiche) · keine zusätzlichen Geräteberechtigungen · **kein Tracking Dritter** auf der Website.

Was das System dafür konsequent liefert: einen ruhigen, verlässlichen Begleiter – vorbereitet zum Spieltag, klar in der Kabine, wirksam auf dem Platz.

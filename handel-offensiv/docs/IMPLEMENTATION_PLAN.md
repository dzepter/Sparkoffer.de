# Umsetzungsplan – Aigner Offensiv Digital (Website · Campus · Admin)

**Version 2 – Entwurf zur Freigabe (26.09.2026).** Grundlage: Master-Prompt September 2026 (§1–§54), Bestandsaufnahme `CURRENT_STATE.md`, Zielbild `ARCHITECTURE.md`. Dieser Plan ersetzt den neunphasigen Plan der Version 1 (Sommer 2026); dessen Phasen 1–8 sind umgesetzt (Datenbank, Rechte, Admin-Cockpit, native App, Edge Functions, Doku), Phase 9 (Store-Release) wurde zurückgestellt. **Es wird nichts davon verworfen** – Version 2 baut darauf auf.

**Wie dieses Dokument zu lesen ist:** Abschnitte 1–4 sind auch ohne IT-Hintergrund verständlich (Sitemaps, erster durchgehender Ablauf, Phasen, Migration). Abschnitte 5–9 sind die technische Arbeitsliste. Kalendertermine enthält der Plan bewusst nicht; verbindlich sind Reihenfolge und Fertigstellungskriterien.

> **Vor der Umsetzung ist die Freigabe der offenen Entscheidungen in Abschnitt 7 erforderlich** (Master-Prompt §54). Bis dahin wird nichts Großes umgebaut.

---

## 1. Sitemaps

### 1.1 Öffentliche Website – `www.aigner-offensiv.de` (§4, §5, §42)

Navigation: **HANDEL OFFENSIV · DIE 5 OFFENSIVTAGE · FÜR UNTERNEHMEN · RAINER AIGNER · IMPULSE · KONTAKT** — rechts abgesetzt **TEILNEHMER-LOGIN** (→ `campus.aigner-offensiv.de`). Primärer CTA **OFFENSIVTAG ANFRAGEN**, sekundär **DIE 5 OFFENSIVTAGE ENTDECKEN**.

| Pfad | Seite | Inhalt (Quelle) |
|---|---|---|
| `/` | HANDEL OFFENSIV | Hero mit Claim, Leitgedanken, Programm in Kürze, Lernmodell, Campus-Vorschau, Trainer, Zielgruppen, CTA (Texte 1:1 aus handel-offensiv.de) |
| `/die-5-offensivtage` | Die 5 Offensivtage | 01–05 mit Untertiteln §10, Lernzyklus (4 Phasen), Ablauf eines Offensivtags, Format-Fakten (sobald vom Kunden geliefert) |
| `/fuer-unternehmen` | Für Unternehmen | Inhouse-Gruppe vs. offene Gruppe, Ablauf einer Saison, Rolle des Org-Admins, Datenschutzversprechen (Org-Admin sieht keine Reflexionen), Referenzen (nur mit Freigabe); Unterseiten `/learn-to-lead` (LEARN TO LEAD®, 12 Module) und `/vortraege` als weitere Formate **[ENTSCHEIDUNG K‑8]** |
| `/rainer-aigner` | Rainer Aigner | Vita (Wikipedia-Zeitleiste, Unternehmer, Trainer), Bücher, Haltung; Fotos: echte Porträts |
| `/impulse`, `/impulse/[slug]` | Impulse | Fachbeiträge aus `site_posts`; Start mit den fünf gesicherten Altartikeln (nach Freigabe) |
| `/kontakt` | Offensivtag anfragen | Serverseitiges Formular (`inquiries`), Kontaktdaten, Antwortversprechen (sobald vom Kunden festgelegt) |
| `/anmelden` | Teilnehmer-Login-Weiche | kurze Erklärung + Weiterleitung zum Campus; Trainer/Admin-Hinweis |
| `/impressum`, `/datenschutz`, `/account-loeschen` | Rechtliches | aus Bestand, nach anwaltlicher Prüfung |
| `/404` | Fehlerseite | „Abseitsstellung." |
| `sitemap.xml`, `robots.txt` | SEO | nur öffentliche Seiten |

### 1.2 HANDEL OFFENSIV CAMPUS – `campus.aigner-offensiv.de` (§6–§9, §14, §17, §40, §42; komplett `noindex`)

Navigation Desktop **HEUTE · MEIN PROGRAMM · OFFENSIVPLAN · TERMINE · MATERIAL · PROFIL**; Mobile **HEUTE · PROGRAMM · OFFENSIVPLAN · TERMINE · PROFIL** (Material in den Modulen).

| Pfad | Seite | Kern |
|---|---|---|
| `/login` | Anmelden | Markenbotschaft links/oben, E-Mail/Passwort, Passwort vergessen, keine Registrierung, Links Datenschutz/Impressum/Support |
| `/einladung?token=…` | Einladung annehmen | Token prüfen → Name bestätigen → Passwort setzen → Einwilligung → Login |
| `/passwort-vergessen`, `/passwort-neu` | Reset | Supabase Auth, Redirect auf Campus |
| `/` | HEUTE | Begrüßung, Programm + Gruppe, nächster Offensivtag mit Countdown, nächste Aufgabe (JETZT BEARBEITEN), Fortschritt x/5 + %, Offensivplan (n aktive Maßnahmen), neue Nachricht |
| `/programm`, `/programm/[modul]` | Mein Programm | Module 01–05 mit Zustand ABGESCHLOSSEN / AKTUELL / VORBEREITUNG / NOCH GESPERRT, Lernphasen, Lektionen; gesperrt: „Wird am … freigeschaltet." |
| `/lektion/[id]` | Lektion | Block-Renderer (18 Typen), Autosave, Sync-Status, „Weiter zur Reflexion" |
| `/quiz/[id]` | Quiz | serverseitig bewertet |
| `/offensivplan`, `/offensivplan/export` | Offensivplan | Einträge je Modul (Erkenntnis, Schritt, mit wem, bis wann, Erfolg, Status); 90-Tage-Plan als PDF |
| `/termine`, `/termine/[id]` | Termine | Datum, Zeit, Ort, Adresse, Raum, Trainer, Modul, Hinweise; ZUM KALENDER HINZUFÜGEN (ICS) |
| `/material` | Material | freigeschaltete Downloads (Signed URLs) |
| `/nachrichten` | Posteingang | Benachrichtigungen + Gruppennachrichten |
| `/profil`, `/profil/datenschutz-konto` | Profil | Name, Foto, Passwort, Benachrichtigungen; ACCOUNTLÖSCHUNG ANFRAGEN |
| `/impressum`, `/datenschutz`, `/support` | Rechtliches/Support | – |

### 1.3 Admin-/Trainer-Cockpit – `admin.aigner-offensiv.de` (§20–§25, `noindex`)

Bestehende Navigation bleibt (entspricht §21). **Ergänzungen:** `/teilnehmer/[id]` (Detail: Stammdaten, Gruppen, Einladungsstatus, Fortschritt, Aktionen) · `/unternehmen/[id]` (Detail mit Gruppen, Trainern, Programmen, Logo) · `/nachrichten/[id]` (bearbeiten/zurückziehen) · `/trainer` (Trainer-Startseite: Feedback-Queue, offene Transferaufgaben, freigegebene Reflexionen, nächste Termine) · `/website` (Texte), `/website/impulse`, `/website/anfragen` · `/profil/sicherheit` (MFA für alle Rollen) · `/login` mit „Passwort vergessen".

---

## 2. Vertical Slice – der erste durchgehende Ablauf (§47)

Bevor weitere Features entstehen, muss dieser Ablauf **auf Staging, mit echten E-Mails, auf Desktop und Smartphone** funktionieren:

| # | Schritt | App | Bestand | Zu tun |
|---|---|---|---|---|
| 1 | Admin legt Demo-Unternehmen „Muster Handelsgruppe GmbH" an | Admin | ✔ `/unternehmen/neu` | Logo-Upload |
| 2 | Admin legt Gruppe „Marktleiter Süd – Frühjahr 2027" mit 5 Terminen an | Admin | ✔ `/gruppen/neu` + Termine | Platzhaltertexte 2027 |
| 3 | Admin fügt Teilnehmer hinzu | Admin | ◐ UI vorhanden, Function-Aufruf scheitert (I‑1) | Auth-Vertrag Admin → Function korrigieren |
| 4 | Teilnehmer erhält Einladung | Function | ◐ `invite-user` ohne Anbieter | SMTP konfigurieren, Template in Navy/Gold, Link auf Campus-Route (I‑4), Vertragstest |
| 5 | Teilnehmer setzt Passwort | **Campus** | ✖ (nur nativ) | `/einladung` bauen (nutzt `accept-invitation`) |
| 6 | Teilnehmer loggt sich ein | **Campus** | ✖ | `/login` (Vorlage: Admin-Login) |
| 7 | HEUTE-Seite erscheint | **Campus** | ✖ (nativ ✔) | `/` nach §8 |
| 8 | Modul 1 ist freigeschaltet | DB/Domain | ✔ Release Engine | S‑1: Freischaltung in RLS erzwingen |
| 9 | Teilnehmer sieht Video/Text | **Campus** | ✖ (nativ ✔) | `/lektion/[id]` mit Text-, Video-, Reflexionsblock |
| 10 | Teilnehmer beantwortet Reflexion (privat/Trainer wählbar) | **Campus** | ✖ | Reflexionsblock + Autosave |
| 11 | Teilnehmer trägt Maßnahme in Offensivplan ein | **Campus** | ✖ (nativ ✔) | `/offensivplan` Formular |
| 12 | Trainer sieht freigegebene Aufgabe/Reflexion | Admin | ◐ nur Einreichungen | Reflexionen anzeigen, `/trainer` |
| 13 | Trainer gibt Feedback | Admin | ✔ | – |
| 14 | Teilnehmer sieht Feedback | **Campus** | ✖ | Feedback in Lektion + Posteingang |
| 15 | Fortschritt aktualisiert sich | DB/Campus | ✔ View | Anzeige auf HEUTE/Programm |

**Voraussetzungen vor Schritt 1:** Seed v2 (Konfigurationen an Zod angeglichen, 2027), Design-Tokens Navy/Gold, `packages/ui`, `apps/campus` angelegt, Staging-Supabase + Vercel-Preview vorhanden.
**Definition of Done:** alle 15 Schritte als Playwright-Test (`e2e/vertical-slice.spec.ts`) grün gegen Staging; keine Konsolenfehler; Screenshots Desktop + iPhone-Breite im Repo.

---

## 3. Phasen und Fertigstellungskriterien

Reihenfolge: 0 → 1 → 2 → (3 ∥ 4) → 5 → 6 → 7 → 8 → 9. Jede Phase endet mit Typecheck, Lint (verbindlich), Tests, Production Build, Security-Check, Sichtprüfung Desktop + Mobile und einem Git-Checkpoint (§49).

| Phase | Name | Inhalt | Fertig, wenn … |
|---|---|---|---|
| **0** | Freigabe & Sicherung | Plan A–L freigegeben; WordPress-Inhalte gesichert (erledigt: `docs/archive/…`); Kundenkonten Supabase/Vercel angelegt; Entscheidungen K‑1…K‑11 getroffen | Freigabe liegt vor; Staging-Supabase erreichbar |
| **1** | Fundament v2 | Design-Tokens Navy/Off-White/Gold in `packages/config`; `packages/ui` (Tailwind-Preset + Kernkomponenten aus Admin extrahiert); Migrationen 0003–0006 (Blocktypen, Website-Tabellen, Härtungen S‑1/S‑3/S‑5/S‑8, Storage-Limits, `block_responses`, `session_notes`); Seed v2 (2027); **Integrationsfixes I‑1, I‑2, I‑5, I‑7, I‑8** (Auth-Vertrag Admin→Functions, gemeinsame Schemas statt Kopien, pg_cron, Redirect-URLs, Upload-Policies); Staging-Deployment Supabase + Vercel; pgTAP-RLS-Tests, `deno test`, ESLint verbindlich in CI; Archivo-Fonts in alle Apps | Migrationen laufen auf Staging; RLS-Tests grün (Mandantentrennung, gesperrte Lektion); Einladung aus dem Admin erzeugt nachweislich eine E-Mail; Admin im Navy/Gold-Design ohne Regressionen |
| **2** | Vertical Slice | `apps/campus` (Login, Einladung, Reset, HEUTE, eine Lektion mit Text/Video/Reflexion, Offensivplan-Eintrag, Feedback-Anzeige); Admin: Reflexionen für Trainer, `/trainer`, S‑2 IDOR-Fix, Einladungs-Redirect auf Campus; SMTP + Mail-Templates | Abschnitt 2 komplett grün auf Staging, Desktop + Mobile |
| **3** | Campus vollständig | Mein Programm mit Zuständen und Freischalt-Hinweisen; alle 18 Blocktypen; Quiz (serverseitig); Transfer-/Praxisaufgaben mit Datei-/Fotoupload; Termine + ICS; Material; Posteingang; Profil inkl. Accountlöschung; Autosave/Offline-Warteschlange mit Statusanzeige; PWA (Manifest, Service Worker, Icon); `noindex`, Security-Header | §44-Testfälle für Teilnehmer grün; PWA installierbar; Lighthouse Accessibility ≥ 95 |
| **4** | Admin-Ausbau | Teilnehmer-/Unternehmen-Detailseiten; Dashboard §22 (nächste Offensivtage, aktive Lernphasen, überfällige Aufgaben, offene Einladungen); Filter Programm/Einladungsstatus; Freischaltung je einzelnem Teilnehmer; Editor für neue Blocktypen inkl. Datei-Upload statt Pfadeingabe; Nachrichten bearbeiten/planen; Deaktivierung kaskadierend (S‑5); MFA für alle Rollen + AAL2-Pflicht; Rate Limiting; responsive Layout; Bereich „Website" (Texte, Impulse, Anfragen, Vorschau, Veröffentlichen → Revalidation) | §44-Testfälle Admin grün; Trainer kann auf Tablet arbeiten; Org A sieht Org B nicht (E2E) |
| **5** | Öffentliche Website | `apps/website` nach Sitemap 1.1; Texte aus `site_content` (Import aus `content.json`/Bestand); Impulse; Kontaktformular serverseitig; SEO (Canonicals, OG, Sitemap); Redirect-Map (Abschnitt 4); Performance (Core Web Vitals grün) | Staging-Website inhaltlich vom Kunden abgenommen; alle 16 Alt-URLs + handel-offensiv.de-URLs leiten korrekt (automatisierter Test) |
| **6** | Kommunikation | Release-Scheduler produktiv (Cron), Web-Benachrichtigungen im Posteingang, optionale E-Mail-Benachrichtigung („neue Lernphase") mit Opt-in, Gruppennachrichten, Web-Push vorbereitet (VAPID) | Erinnerung „Noch 7 Tage bis Offensivtag" erreicht Staging-Teilnehmer |
| **7** | Security & Privacy | Security-Review §45 (Broken Access Control, IDOR, RLS-Bypass, Privilege Escalation, File-URLs, Validierung, Sessions, offene Routen, Secrets, Injection, XSS, CSRF, Rate Limiting); Löschprozess Ende-zu-Ende; Audit vollständig; Datenschutztexte + AVVs; Unterauftragnehmerliste | Review-Protokoll ohne offene „hoch"-Befunde; Löschanfrage durchläuft alle Status |
| **8** | QA & Go-Live | Playwright-Suite §44 komplett; axe-core; Performance; Production Builds; **Cutover** (Abschnitt 4.3); Monitoring/Backups (`BACKUP_RESTORE.md`); Anleitungen für Rainer/Dennis aktualisiert | Abnahmeliste §50 vollständig abgehakt |
| **9** | Native App vorbereiten | Expo-App auf Tokens Navy/Gold, gemeinsame Pakete, Campus-Parität; TestFlight (später) | App baut in CI, Domain-Modelle identisch |

---

## 4. Migrations- und Cutover-Strategie (§1, §42)

### 4.1 Grundsätze

Kein Ausfall, kein Inhaltsverlust, keine SEO-Einbußen: alte Inhalte sind gesichert (`docs/archive/aigner-offensiv-wordpress-2026-09/`), jede alte URL erhält ein 301-Ziel, DNS wird erst umgestellt, wenn die neue Website auf Staging abgenommen ist. Die heute live laufende `handel-offensiv.de` bleibt bis zum Cutover unverändert online.

### 4.2 Redirect-Karte

| Alte URL | Neues Ziel (301) |
|---|---|
| `https://www.aigner-offensiv.de/` | `/` (neue Startseite) |
| `/uber-uns/` | `/rainer-aigner` |
| `/learn-to-lead/` | `/learn-to-lead` |
| `/vortraege/` | `/vortraege` |
| `/fuhrung-leicht-gemacht/`, `/potentiale-steuern/`, `/generation-y/` | `/fuer-unternehmen` |
| `/kontakt/` | `/kontakt` |
| `/blog/` | `/impulse` |
| `/impressum/`, `/datenschutz/` | `/impressum`, `/datenschutz` |
| 5 Blogartikel `/abkuerzungen-…/`, `/das-wohlstandsproblem-loesen/`, `/krisensituationen-…/` | `/impulse/<gleicher-slug>` (bis zur Freigabe der Artikel: `/impulse`) |
| `/angebote/fuhrung-leicht-gemacht/`, `/angebote/generation-y/`, `/angebote/high-potentials-intern/`, `/high-potentials-intern/` (heute 301 bzw. 404) | `/fuer-unternehmen` |
| `/category/allgemein/`, `/2020/*`, `/author/*`, `/feed/`, `/blog/page/*` | `/impulse` |
| Groß-/Kleinschreibung, Trailing Slash, `index.php` | Normalisierung in der Middleware, kettenfrei (kein 308→301-Doppelsprung) |
| `/wp-content/uploads/*` | erst **nach** Migration der Blogbilder 410 Gone |
| `/wp-json/*`, `/xmlrpc.php`, `/wp-login.php`, `/readme.html`, `/sitemap_index.xml` | 410 Gone bzw. neue `sitemap.xml` |
| `https://www.handel-offensiv.de/` und `/index.html` | `https://www.aigner-offensiv.de/` **[ENTSCHEIDUNG K‑1]** |
| `handel-offensiv.de/login.html` | `https://campus.aigner-offensiv.de/login` |
| `handel-offensiv.de/kontakt.html`, `/impressum.html`, `/datenschutz.html`, `/account-loeschen.html` | gleichnamige Seiten unter `www.aigner-offensiv.de` |
| `handel-offensiv.de/cms/*` | 410 Gone (Redaktion läuft im Admin) |

### 4.3 Cutover-Reihenfolge

0. **Sofort (Sichern):** WordPress-Vollbackup (DB-Dump, `wp-content/uploads`, Theme-Ordner mit `img/10.png`), Originale der echten Fotos und Blogbilder sichern; `content.json` und alle Live-Dateien von `handel-offensiv.de` sichern (Texte erledigt); Redaktionsstopp im PHP-CMS mit dem Kunden vereinbaren.
1. **Sofort (Risikominderung, ohne Designänderung):** PHP im Strato-Panel auf 8.2/8.3, WordPress-Core und Plugins aktualisieren, Auto-Updates aktivieren; per `.htaccess` `/readme.html`, `/wp-json/wp/v2/users`, `xmlrpc.php` sperren; totes Analytics-Script und externe Google Fonts entfernen; Security-Header setzen (S‑13).
2. **Phase 0/1:** Supabase-Projekte Staging/Production (Frankfurt) anlegen, AVV abschließen; Vercel-Team mit drei Projekten (website, campus, admin), Region `fra1`, AVV; Resend-Konto (EU) mit Versand-Subdomain `mail.aigner-offensiv.de` – SPF/DKIM/Return-Path-Records bei Strato setzen (DMARC-Apex bleibt `p=reject`); `campus.` und `admin.` als CNAME `cname.vercel-dns.com` (keine Auswirkung auf Website oder E-Mail).
3. **Phase 2–4:** Campus und Admin auf Staging, dann unter den Subdomains produktiv (beide `noindex` + `X-Robots-Tag`); Kunde testet mit Demo-Daten 2027. **Minimal-Patch der Live-Site `handel-offensiv.de`** beim Campus-Go-Live (einziger weiterer Upload): `login.html` mit aktivem Button „Zum Campus" → `campus.aigner-offensiv.de/login`, Texte „iPhone-App/App Store/cockpit.handel-offensiv.de" entfernen, `login.html` aus der Sitemap nehmen und `noindex` setzen.
4. **Phase 5:** Website auf Staging (Vercel-Preview-URL) abnehmen; Texte aus dem Handel-Offensiv-CMS importieren; Rechtstexte anwaltlich geprüft einspielen.
5. **Cutover Website:** DNS `www`/Apex von Strato auf Vercel (A/AAAA/CNAME) – **MX unangetastet**; Redirect-Map aktiv; Search Console: neue Sitemap einreichen, alte URLs beobachten.
6. **Cutover handel-offensiv.de:** Strato-Weiterleitung (301) auf `www.aigner-offensiv.de`; Ordner `handel-offensiv` archivieren.
7. **Abschaltung WordPress:** Datenbank-Export sichern, Site löschen, PHP-Webspace nur noch für Weiterleitungen.
8. Statische Repos-Ordner `aigner-offensiv/`, `handel-offensiv-website/` nach `archive/` verschieben.

---

## 5. Lücken je Bereich (aus der Bestandsanalyse)

Status: ✖ fehlt · ◐ teilweise · Aufwand: K klein · M mittel · G groß

### 5.1 Datenbank, RLS, Seed
| Lücke | § | Status | Aufwand | Phase |
|---|---|---|---|---|
| Freischaltzeit nur in App geprüft (S‑1) | 16, 27, 31 | ◐ | M | 1 |
| 4 Blocktypen fehlen (`practice_task`, `file_upload`, `photo_upload`, `announcement`) | 12 | ◐ | M | 1 |
| Seed-Konfigurationen passen nicht zu Zod-Schemas/Renderern | 12, 46 | ✖ | M | 1 |
| Demo-Daten relativ statt 2027; Demo-Firma trägt echte Marke | 17, 46 | ◐ | K | 1 |
| Demo-Nutzer per SQL in `auth.users` mit Klartextpasswort | 46 | ◐ | K | 1 |
| Quiz clientseitig bewertet, Lösungen lesbar (S‑3) | 45 | ◐ | M | 1 |
| Unique-Constraints ohne `cohort_id` | 30 | ◐ | K | 1 |
| Keine Konsistenzprüfung `cohort_members` ↔ `organization_memberships` | 27 | ◐ | K | 1 |
| Storage ohne MIME-/Größenlimits, kein Upload-Bucket | 32 | ◐ | K | 1 |
| `audit_logs` ohne `organization_id` | 41 | ◐ | K | 1 |
| Keine RLS-Tests (pgTAP) | 44, 50 | ✖ | M | 1 |
| Gesamtfortschritt nur clientseitig aggregiert | 15 | ◐ | K | 1 |
| Website-Tabellen (`site_content`, `site_posts`, `inquiries`) | 4, 5 | ✖ | M | 1 |
| `config.toml` Redirect-URLs | 33 | ◐ | K | 1 |

### 5.2 Admin-/Trainer-Cockpit
| Lücke | § | Status | Aufwand | Phase |
|---|---|---|---|---|
| IDOR in zwei Server Actions (S‑2) | 45 | ✖ | K | 2 |
| Trainer sieht freigegebene Reflexionen nicht | 19, 20 | ✖ | M | 2 |
| Trainer kann nicht manuell freischalten (`releases.manage`) | 20 | ✖ | M | 2 |
| „Passwort vergessen" im Admin-Login | 7, 33 | ✖ | K | 2 |
| Teilnehmer-Redirect/Wording zielt auf Mobile-App | 2, 6 | ✖ | K | 2 |
| Teilnehmer-Detailseite | 21, 25 | ✖ | M | 4 |
| Unternehmen-Detail, Logo-Upload | 23 | ◐ | M | 4 |
| Dashboard: nächste Offensivtage, aktive Lernphasen, überfällige Aufgaben | 22 | ✖ | M | 4 |
| Filter Programm / Einladungsstatus | 25 | ◐ | K | 4 |
| Freischaltung für einzelne Teilnehmer im UI | 16 | ◐ | K | 4 |
| Editor: neue Blocktypen, Datei-Upload statt Pfad | 12 | ◐ | M | 4 |
| Nachrichten bearbeiten/zurückziehen/planen | 21 | ✖ | K | 4 |
| Deaktivierung kaskadierend, Sessions beenden (S‑5) | 25, 33 | ◐ | K | 4 |
| MFA für alle Rollen, AAL2-Pflicht (S‑7) | 33 | ◐ | M | 4 |
| Security-Header, Rate Limiting, `X-Robots-Tag` (S‑6) | 42, 45 | ✖ | M | 4 |
| Responsive Layout (Sidebar fest) | 36 | ✖ | M | 4 |
| Archivo-Schriften fehlen im Admin | 34 | ◐ | K | 1 |
| Farbwelt grün | 34 | ◐ | K | 1 |
| Teilnehmerliste lädt alle `auth.users` (S‑10) | 39 | ◐ | K | 4 |
| Lint verschluckt Fehler; E2E nur 3 Smoke-Tests | 44, 49 | ◐ | G | 1, 8 |
| Bereich „Website" | 4, 5 | ✖ | G | 4 |

### 5.3 Web-Campus (neu)
Vollständig zu bauen (Sitemap 1.2); fachliche Vorlage: Mobile-Feature-Module `heute`, `lesson` (14 Renderer), `offensivplan`, `termine`, `profil`, `benachrichtigungen`; wiederverwendbar: `packages/domain|types|validation`, Admin-`middleware`/`lib/supabase`/`lib/auth`, Vorschau-Block-Renderer, ICS-Route, Sanitizer, Login-Formular.

### 5.4 Öffentliche Website (neu)
Vollständig zu bauen (Sitemap 1.1); Inhalte aus `handel-offensiv-website/` (Texte, OG-Bild) und `aigner-offensiv/` (Vita, LEARN TO LEAD®, Vorträge, Impulse, Buch); Archiv der Alt-Site.

### 5.5 Edge Functions, Auth-Flows, E-Mail, Betrieb (Integrationsbefunde I‑1 … I‑13, `CURRENT_STATE.md` 5.10)
| Lücke | § | Status | Aufwand | Phase |
|---|---|---|---|---|
| Admin → Functions: Service-Role-Bearer statt Nutzer-JWT (I‑1, S‑14) | 31, 45 | ✖ | K | 1 |
| Payload-Verträge App/Campus ↔ `accept-invitation` vereinheitlichen; Schemas aus `packages/*` importieren statt kopieren (I‑2, I‑8, S‑15) | 33 | ✖ | M | 1 |
| Passwort-Reset: Zielseite `/passwort-neu` (Campus), Reset im Admin-Login, Redirect-Allowlist (I‑3, S‑19) | 7, 33 | ✖ | K | 2 |
| Einladungslink auf Campus-Route `/einladung` (I‑4) | 7 | ✖ | K | 2 |
| `pg_cron` für `release-scheduler`; `config.toml` `site_url`/Redirects je Umgebung; `verify_jwt`-Einträge (I‑5) | 16, 18 | ✖ | K | 1 |
| Scheduler: Erinnerungs-Offset konfigurierbar (heute fix 3 Tage; §18 nennt 7), Benachrichtigung „neues Trainerfeedback" automatisch erzeugen, `after_lesson`/`after_module`/`manual` melden | 16, 18 | ◐ | M | 6 |
| E-Mail: Anbieter anbinden (K‑4), Templates in Navy/Gold, Absender/SPF/DKIM, `reminderEmail` nutzen oder entfernen (I‑12) | 43 | ◐ | M | 2 |
| Löschprozess: Aufrufer + Admin-Seite „Löschanträge", Bucket-Korrektur, E2E (I‑6, S‑18) | 40 | ◐ | M | 7 |
| Storage: INSERT-Policy/Bucket für Uploads, Server-Signierung mit kurzer TTL (I‑7, S‑17) | 32 | ◐ | M | 1, 3 |
| Rate Limiting DB-gestützt, Auth-Limits, Fehlversuche loggen (I‑11, S‑16) | 45 | ◐ | M | 4 |
| Web-Push vorbereiten: `push_tokens.platform` um `web` erweitern, Präferenzen serverseitig (`notification_preferences`) | 18 | ◐ | M | 6 |
| Doppelte Audit-Einträge (Admin + Function), Einladungs-TTL konfigurierbar | 41 | ◐ | K | 4 |
| CI: ESLint-Konfig, Lint verbindlich, `deno test` für Functions, pgTAP, Playwright mit Stack, Secret-Scan, Builds für Campus/Website (I‑13, S‑20) | 44, 49 | ✖ | M | 1 |
| Umgebungsdokumentation: fehlende Variablen (`APP_BASE_URL`, `CRON_SECRET`, `ALLOWED_ORIGINS`, `EMAIL_PROVIDER_URL/TOKEN`, `STORAGE_BUCKET_*`) ergänzen, ungenutzte streichen | 1, 49 | ◐ | K | 1 |
| Deployment: Supabase-Projekte verknüpfen, Secrets setzen, Vercel-Projekte, Deploy-Automation | 1, 49 | ✖ | M | 0–1 |

### 5.6 Fachliche Lücken aus der Native-App (gelten für den Web-Campus als Vorlage)
| Lücke | § | Status | Aufwand | Phase |
|---|---|---|---|---|
| HEUTE: Programm + Gruppe, Modulnummer des nächsten Offensivtags, konkrete Frage der nächsten Aufgabe, Offensivplan-Karte, Nachricht antippbar mit Absender | 8 | ◐ | M | 2 |
| Blockzustände Checkliste/Skala/Auswahl serverseitig (`block_responses`) statt Gerätespeicher; Selbsteinschätzung für Trainer sichtbar (I‑9) | 11 | ◐ | M | 3 |
| Transferaufgabe: drei strukturierte Nachfragen (Was ist passiert? Was hat funktioniert? Was anders?) in Schema, DB und UI | 11 | ◐ | M | 3 |
| Persönliche Notizen zum Präsenztag (`session_notes`) | 11 | ✖ | K | 3 |
| Video: Untertitel-Spur nutzen, Anbieter-Adapter (eingebettet statt Systembrowser), CTA „Weiter zur Reflexion" | 13 | ◐ | M | 3 |
| Offensivplan: Feldbezeichnungen gemäß §14 (Erkenntnis · Nächster Schritt · Mit wem · Bis wann · Erfolg), `due_at` in UI, PDF-Export im Web (Server-Route) | 14 | ◐ | M | 3 |
| Fortschrittsbegriffe ABGESCHLOSSEN / AKTUELL / VORBEREITUNG / NOCH GESPERRT | 15 | ◐ | K | 3 |
| Trainer-Feedback für Teilnehmer sichtbar (I‑10) | 20, 47 | ✖ | K | 2 |
| Mehrere Gruppen je Person: Umschalter statt „erste aktive Cohort" | 3 | ◐ | K | 3 |
| Ein Text-Renderer für Admin und Campus (Sanitizer aus Admin) | 12 | ◐ | K | 3 |
| Zeitzonen einheitlich Europe/Berlin (Countdown) | 17 | ◐ | K | 2 |
| Material-Bereich (Aggregation aller Downloads freigeschalteter Lektionen) | 9 | ✖ | M | 3 |
| Autosave zum Server mit Sync-Warteschlange und Feldstatus (heute nur lokale Entwürfe, `retry 0`) | 38 | ◐ | M | 3 |
| Login-Seite: Markensatz aus §7, Links Datenschutz/Impressum/Support | 7 | ◐ | K | 2 |

### 5.7 Geteilte Pakete und Toolchain
| Lücke | § | Status | Aufwand | Phase |
|---|---|---|---|---|
| Rechte-Matrix doppelt (`packages/domain` und `supabase/functions/_shared/auth.ts`) – Deno löst Workspace-Pakete nicht auf | 26 | ◐ | M | 1 |
| Zod-Schema für `permissions`-JSONB-Schlüssel fehlt (RBAC.md behauptet es) | 26 | ✖ | K | 1 |
| Neue Capabilities `releases.manage`, `website.*`, `inquiries.read` im Code | 20, 26 | ✖ | K | 1 |
| `packages/types` handgeschrieben (aktuell spaltengenau synchron, kein Drift-Schutz, kein `Database`-Typ) → `supabase gen types` | 28, 30 | ◐ | M | 1 |
| Kein Token-Export als CSS-Variablen/Tailwind-Preset; Admin spiegelt Tokens manuell; `.pitch-lines` nur im Admin | 29, 34 | ✖ | M | 1 |
| Kein `packages/ui`; UI-Bausteine doppelt (Admin 16 Komponenten, Mobile 13) | 29, 35 | ✖ | G | 1 |
| Tokens grün statt Navy/Gold; Token-Schlüssel heißen `green*` (≈45 Mobile-Dateien, Tailwind-Klassen) | 34 | ✖ | M | 1 |
| Geteilte Logik außerhalb der Pakete: `deriveModuleJourney`, `findMissingRequiredBlocks`, ICS-Builder, Zeitlogik im Scheduler (dritte Kopie) | 13, 15, 16, 17 | ◐ | M | 1–2 |
| Formular-Schemas ohne Tests (12 Schemas, 0 Tests); Reset-/Forgot-Schemas fehlen; Passwortregel nur `min(10)` | 33, 44 | ◐ | K | 2 |
| Kein ESLint/Prettier; kein vitest-Workspace/Coverage | 44, 49 | ✖ | K | 1 |
| Test-Fixtures durchgehend 2026 (32 Datumsangaben) | 17, 46 | ◐ | K | 1 |
| Zwei TypeScript-Versionen (5.6 Mobile / 5.9 übrige), React 18/19 – `packages/ui` darf nicht von Mobile importiert werden | 28 | ◐ | K | 1 |
| Domain-/URL-Konstanten (www/campus/admin) zentral in `packages/config` | 2, 5 | ✖ | K | 1 |
| `formatBerlin()` ignoriert `cohort_sessions.timezone` | 17 | ◐ | K | 3 |

### 5.8 Öffentliche Website (Bestand der statischen Sites → `apps/website`)
| Lücke | § | Status | Aufwand | Phase |
|---|---|---|---|---|
| Navigation und Seiten nach §5 (DIE 5 OFFENSIVTAGE mit §10-Untertiteln und 4-Phasen-Logik, FÜR UNTERNEHMEN, RAINER AIGNER, IMPULSE als eigene Routen) | 5, 10, 11 | ◐ | G | 5 |
| TEILNEHMER-LOGIN rechts → `campus.aigner-offensiv.de`; Live-Texte versprechen „iPhone-App", „Bald im App Store", `cockpit.handel-offensiv.de` | 5, 6 | ✖ | K | 2 (Minimal-Patch), 5 |
| CTA-Hierarchie: primär OFFENSIVTAG ANFRAGEN, sekundär DIE 5 OFFENSIVTAGE ENTDECKEN | 5 | ◐ | K | 5 |
| Botschaft „100 PROZENT PRÄSENZ" fehlt (Leitgedanken-Raster 3-spaltig) | 4 | ◐ | K | 5 |
| Hero beider Sites = Fußball-Stockfoto im Stadion; weitere Stock-Motive (Sprinter, Geschäftsmann); Rainer erst in der Trainer-Sektion; kein Video | 4, 34 | ✖ | M (+ Kunde: Fotos/Video) | 5 |
| Kontaktformular nur `mailto:` (keine Zustellung ohne Mail-Client, kein Spam-Schutz, keine Speicherung) | 5 | ◐ | M | 5 |
| Impulse: 5 Altartikel nur gekürzt (34–72 % des Textes) in `impulse.html`; Volltexte im Archiv; keine eigenen URLs/Meta | 5 | ◐ | M | 5 |
| SEO: `login.html` indexierbar und in der Sitemap (§42-Verstoß live); AO-Site ohne robots/sitemap/canonical/OG; kein JSON-LD | 42 | ◐ | K | 2 (Minimal-Patch), 5 |
| Security-Header (HSTS, CSP, X-Frame-Options) auf beiden Live-Hosts fehlen | 45 | ✖ | K | 5 |
| Personenbezogene Inhalte auf den Sites: Testimonials mit Klarnamen/Firmen, Phone-Mock-Name – Freigaben nicht dokumentiert | 46 | ◐ | K (Kunde) | 5 |
| CSS-Tokens semantisch falsch (`--green` = Blau), 8 hart kodierte grünstichige Grautöne, keine Spacing-Skala; Breakpoints desktop-first und uneinheitlich | 34, 36 | ◐ | M | 1 |
| Logo nur als Inline-SVG; keine Logodatei, kein Icon-Set, kein Manifest | 34, 37 | ✖ | K | 1 |
| Datenschutzerklärungen nennen keinen Hoster und decken Campus/Supabase/Vercel/E-Mail nicht ab | 39 | ✖ | M (Anwalt) | 5 |
| Deployment-Drift `handel-offensiv.de` (Live ≠ Repo; Kundentexte nur auf dem Server; Hoster/FTP-Zugang unklar) | 1, 49 | ◐ | K | 0 (Live-Stand sichern, Redaktionsstopp vereinbaren) |

### 5.9 Live-Site, SEO-Migration, Dokumentation
| Lücke | § | Status | Aufwand | Phase |
|---|---|---|---|---|
| Sofort-Härtung WordPress (PHP 8.x, Updates, REST-User-Endpoint/`readme.html`/`xmlrpc.php` sperren, Tracker entfernen, Backup) | 1, 45 | ✖ | K (Kunde/Strato) | 0 |
| Originale der echten Fotos (`10.png`, `vortrag-1-1.jpg`, `vortrag-2.jpg`) und Blogbilder sichern; WP-Vollbackup (DB + `uploads`) | 1, 4 | ◐ | K | 0 |
| Redirect-Karte vollständig (inkl. `/angebote/*`, `/high-potentials-intern/`, `/category/allgemein/`, `/2020/*`, `/author/*`, `/feed/`, Trailing-Slash/Case) als `next.config` + Middleware, kettenfrei, nur echte Routen als Ziel | 1, 42 | ◐ | K | 5 |
| Search Console: neue Sitemap, Adressänderung `handel-offensiv.de` → `aigner-offensiv.de`, 404-Monitoring 6 Monate | 42 | ✖ | K | 8 |
| Dokumentation: Kapitel 1 ff. von `DATA_MODEL`/`RBAC`/`SECURITY` an Code angleichen; `docs/README.md` als Index (erledigt); V1-Guides gebannert (erledigt); Campus-Handbuch neu; Guides neu; `ENVIRONMENT_SETUP` um Campus/Website/pg_cron/Resend; `PRIVACY_TECHNICAL` um Website/Campus/Vercel; `BACKUP_RESTORE` um neue Buckets/Website-Tabellen | 1, 49 | ◐ | M | 1, 5, 7, 8 |
| Master-Prompt im Repository versioniert (erledigt: `docs/briefings/`); Briefing V1 beschaffen oder Zitate kennzeichnen | 1 | ◐ | K | 0 |
| Repository-Hygiene: projektfremde Dateien im Root (Check24-Scraper) neben der Kundenplattform in einem öffentlichen Repo | 49 | ✖ | K | 0 (Entscheidung K‑12) |

---

## 6. Risiken

| Risiko | Schwere | Gegenmaßnahme |
|---|---|---|
| **Kundenkonten fehlen** (Supabase, Vercel, Apple) – ohne sie kein Staging, kein Go-Live | hoch | Phase 0: Konten gemeinsam anlegen (15 Min. je Konto), Zugänge als Team-Einladung |
| **Alte WordPress-Site ungepatcht** unter der Hauptdomain | hoch | sofort PHP anheben/aktualisieren oder read-only; Cutover priorisieren |
| **Domainstrategie-Wechsel** (handel-offensiv.de gerade erst live) verwirrt Kunden/Nutzer | mittel | klare Entscheidung K‑1, 301 dauerhaft, Kommunikation an Rainer |
| **Sicherheitsbefunde S‑1/S‑2** im Bestand | hoch | vor dem Vertical Slice beheben, Tests |
| **Scope**: drei Web-Apps + Admin-Ausbau + Migration | hoch | strikte Reihenfolge, Vertical Slice zuerst, keine Features ohne DoD |
| **Inhalte fehlen** (echte Lerninhalte, Videos, Fotos, Termine, Preise) | mittel | [DEMO]-Kennzeichnung; Vertical Slice mit Demo-Content; Kundenliste `NEEDED_FROM_CLIENT.md` |
| **Rechtstexte ungeprüft** (Impressum HRB/Rechtsform, Datenschutz App/Website) | mittel | anwaltliche Prüfung vor Cutover; Prüfvermerke im Code |
| **DSGVO Auftragsverarbeitung** (Vercel US-Anbieter, Supabase) | mittel | EU-Regionen, AVVs, Unterauftragnehmerliste, kein Tracking |
| **E-Mail-Zustellbarkeit** (SMTP-Limits, SPF/DKIM) | mittel | SPF/DKIM für Absender prüfen, Testversand in Phase 2, Fallback-Anbieter definiert |
| **React 18/19-Split** Mobile/Admin bei gemeinsamem `packages/ui` | niedrig | `packages/ui` nur für Web-Apps; Mobile behält eigene UI-Primitive |
| **Systemmails werden abgewiesen** (DMARC `p=reject`, SPF `-all` auf Microsoft 365; kein Versender autorisiert) | hoch | K‑4: Resend EU über `mail.aigner-offensiv.de` mit SPF/DKIM/Return-Path; Testversand vor Phase 2 |
| **Deployment-Drift handel-offensiv.de** (Live ≠ Repo, Kundentexte nur auf dem Server, Hoster/FTP unklar) | mittel | Live-Dateien und `content.json` sofort sichern (erledigt für Texte), Redaktionsstopp vereinbaren, Zugang klären, nur noch ein Minimal-Patch (Login → Campus) |
| **Personenbezogene Inhalte auf den Sites ohne dokumentierte Freigabe** (Testimonials mit Klarnamen, Zitat mit Firmenname) | mittel | Freigaben einholen oder entfernen (P5) |
| **Dokumentation mit zwei Wahrheiten** (V1-Kapitel vs. Code/Kap. 0) | mittel | Banner gesetzt, `docs/README.md` als Index; Angleichung in Phase 1/7; Guides erst nach Neufassung an den Kunden |
| **Offline-Entwürfe mit persönlichen Inhalten im Browser** | mittel | verschlüsselt, Logout löscht, kein `localStorage` |
| **Seed/Demo mit echter Marke oder Personen** | niedrig | Seed v2 mit erfundener Firma; Demo-Teilnehmer nur mit Freigabe (K‑10) |

---

## 7. Entscheidungen (freigegeben am 26.09.2026 – mit verbindlichen Änderungen)

**Stand der Freigabe:** Der Plan A–L ist freigegeben; K‑1 bis K‑14 gelten mit folgenden verbindlichen Änderungen des Auftraggebers:

| Nr. | Freigabe | Verbindliche Änderung / Auflage | Umsetzung |
|---|---|---|---|
| K‑1 | ✔ | `handel-offensiv.de` bleibt registriert, später permanente Weiterleitung; keine Domain aufgeben | `ARCHITECTURE.md` §3, Redirect-Karte 4.2 |
| K‑4 | ✔ mit Auflage | Resend; Versand-Subdomain `mail.aigner-offensiv.de`; M365‑MX unverändert; SPF/DKIM/DMARC + echter Zustelltest vor Produktion; Absender `Aigner Offensiv Campus <campus@mail.aigner-offensiv.de>`; Reply‑To auf M365-Postfach erlaubt | `EMAIL_DNS_PLAN.md`, `_shared/emails.ts`, `config.toml` |
| K‑5 | ✔ mit Auflage | Vercel nur mit Functions in `fra1`; Supabase `eu-central-1`; alle Dienste mit möglicher Verarbeitung außerhalb dokumentiert | `REGIONS_AND_DATA_FLOWS.md`, `vercel.json`, `x-region` |
| K‑6 | ✔ mit Auflage | Supabase Storage für Pilot/kurze Videos; `VideoProvider`-Abstraktion von Beginn an; Lernlogik/DB nicht vom Streaming abhängig | `packages/domain/src/video-provider.ts` |
| K‑7 | ✘ Empfehlung abgelehnt | Navy Hauptfarbe, Off-White, Gold/Ocker sehr sparsam (Modulnummern, aktive Navigation, wichtige CTA, Fortschritt, Taktiklinien, Hervorhebungen); kein generisches SaaS-Blau; finale Tokens nach Vergleich mit der HO-Website | `DESIGN_TOKENS.md`, `packages/config` |
| K‑8 | ✔ mit Auflage | LEARN TO LEAD / Vorträge nur nachgeordnet; Navigation und Startseite vollständig Handel Offensiv; Redundantes nicht mitnehmen; 301 für entfernte URLs | Sitemap 1.1, Redirect-Karte |
| Freischaltungen | Auflage | Zugriff darf NICHT von Cronjobs abhängen; DB/RLS prüft bei jedem Zugriff; Cron nur Folgeaktionen | Migration 0003 `app.lesson_is_released`, RLS-Tests |
| Sicherheit zuerst | Auflage | S‑1, S‑2, S‑14, I‑2, I‑3 vor neuen Campus-Funktionen; negative Tests verpflichtend | Phase 1 erledigt, `supabase/tests` |
| Apple-Account | Auflage | kein Blocker bis Phase 8 | Phase 9 |
| WordPress | Auflage | Vollbackup vor Änderungen, PHP nicht blind umstellen, Staging zuerst; Sofortmaßnahmen erlaubt | `WORDPRESS_BACKUP_UND_HAERTUNG.md` |
| Website-CMS | ✔ mit Auflage | Zustände draft/preview/published/archived, Audit-Spalten, nichts geht beim Tippen live | Migration 0005 |
| Repository | Auflage | privates Repository, keine Produktionsgeheimnisse/Kundendaten/Demo-Passwörter in Git | Seed v2 ohne Passwörter; Umzug sobald das Repo angelegt ist |
| Demo | Auflage | alles fiktiv, Termine 2027; Dennis Zepter nur in internen Mockups | Seed v2 |
| Reihenfolge | Auflage | Sicherheit → Infrastruktur → E‑Mail → Vertical Slice → Web-Campus → Admin → Website → Kommunikation → QA → native App; DNS-/DB-Änderungen vorher ankündigen (was/Auswirkung/Rollback); nach Phase 1 STOPP + Bericht | Abschnitt 3 |

Ursprüngliche Entscheidungsvorlage (zur Nachvollziehbarkeit):

| Nr. | Thema | Optionen | Empfehlung | Begründung |
|---|---|---|---|---|
| **K‑1** | **Domainstrategie** | A) alles unter `aigner-offensiv.de` (www/campus/admin), `handel-offensiv.de` → 301 · B) zwei Marken-Sites, Campus unter `handel-offensiv.de` | **A** | Master-Prompt §2; eine Marke; SEO-Autorität der seit Jahren bestehenden Domain; `handel-offensiv.de` bleibt als merkfähige Kurzadresse erhalten. **Achtung:** kehrt die Kundenentscheidung vom September („komplett neue Seite handel-offensiv.de") um – ausdrückliche Bestätigung nötig. |
| **K‑2** | **Website-Technologie & Redaktion** | A) Next.js auf Vercel, Texte im Admin-Cockpit (`site_content`) · B) statische Site + PHP-CMS behalten und auf aigner-offensiv.de umziehen · C) Next.js statisch exportiert auf Strato (Texte nur per Build) | **A** (B als Übergang) | ein Designsystem, ein Login, Impulse aus der DB, serverseitiges Formular, Revalidation statt Client-Injektion. B bleibt bis zum Cutover live; C ist nicht „für Dummies". |
| **K‑3** | **Campus-Technologie** | A) neue Next.js-App · B) Expo-Web-Build der bestehenden App | **A** | gleiches Designsystem wie Website/Admin, beste Browser-UX/PWA/Barrierefreiheit; Expo-Code bleibt für Phase 9. B wäre schneller, wirkt aber als Fremdkörper (§2). |
| **K‑4** | **E-Mail-Versand** | A) SMTP über das Kunden-Postfach (**Microsoft 365** – tatsächlicher Mailanbieter) · B) **Resend** (EU-Region) über Versand-Subdomain `mail.aigner-offensiv.de`, zugleich Custom-SMTP für Supabase Auth · C) Brevo (EU-Unternehmen) | **B** | `aigner-offensiv.de` führt **DMARC `p=reject` + SPF `-all`**: ohne SPF-Include und DKIM wird jede Systemmail abgewiesen – der Vertical Slice scheiterte an der Zustellung. M365-SMTP-AUTH ist kontingentiert, Basic Auth wird abgeschaltet, kein Bounce-Handling. Resend passt zur vorhandenen HTTP-Relay-Abstraktion, liefert Zustellstatus, AVV, EU-Region. Absender z. B. `campus@aigner-offensiv.de`. C als Alternative, falls ein europäischer Anbieter gewünscht ist. |
| **K‑5** | **Hosting Next.js** | A) Vercel (Region Frankfurt, AVV) · B) eigener EU-Server (Hetzner + Docker) | **A** | Referenz-Host, Preview-Deployments, kein Serverbetrieb; personenbezogene Daten liegen bei Supabase (EU). |
| **K‑6** | **Video** | A) privater Supabase Storage + Signed URLs · B) Vimeo Pro/Bunny Stream | **A zuerst** | ohne Drittanbieter startklar; Abstraktion erlaubt späteren Wechsel bei vielen/langen Videos. |
| **K‑7** | **Farbwelt** | A) Blau (live, Kundenentscheidung) · B) Dunkelblau + Gold | **A** | Master-Prompt erlaubt „bestehende Markenakzentfarbe"; Gold verwässert. Plattform-Tokens werden auf Blau gezogen. |
| **K‑8** | **Alt-Inhalte** (LEARN TO LEAD®, Vorträge, Angebotsseiten, Blog) | A) als Unterseiten von „Für Unternehmen"/„Rainer Aigner" behalten, Blog → Impulse · B) nur Handel Offensiv | **A** | Marke ®, bestehendes SEO, weitere Formate für Unternehmen; Angebotsseiten werden zusammengeführt. |
| **K‑9** | **Go-Live-Reihenfolge** | A) Campus/Admin zuerst, Website in Phase 5 · B) Website zuerst | **A** | Website läuft bereits (handel-offensiv.de); der Campus ist das fehlende Produkt. WordPress-Risiko separat sofort mindern. |
| **K‑10** | **Demo-Teilnehmer „Dennis Zepter"** | nur intern mit schriftlicher Freigabe · sonst fiktiv | fiktiv im Seed, real nur in Präsentationen | §46 |
| **K‑11** | **Rechtekatalog** | Code (`packages/domain`) + JSONB · DB-Tabellen `roles/permissions` | **Code** | getestet, konsistent, ohne Deployment keine Rechteänderung; §30-Abweichung dokumentiert (`DATA_MODEL.md` 0.1). |
| **K‑12** | **Repository** | A) eigenes **privates** Repository für die Kundenplattform · B) weiter im öffentlichen `Sparkoffer.de` neben einem projektfremden Scraper | **A** | Kundenplattform mit Rechtstexten, Seed und Betriebsdoku gehört nicht in ein öffentliches Repo mit fremdem Projekt (Verwechslungs-/Reputationsrisiko, Secret-Hygiene). Umzug per `git subtree`/Filter ohne Historienverlust. |
| **K‑13** | **Datenzugriff im Admin-Cockpit** | A) alles über Service Role mit `can()` · B) **Lesen über Nutzersitzung (RLS), Schreiben über Service Role mit Scope-Bindung** · C) alles über RLS | **B** | §27/§31: DB-seitige Absicherung „nicht nur UI". Heute schützt nur Code (zwei IDOR-Befunde). C wäre für Stammdaten des Super Admins unnötig komplex. |
| **K‑14** | **UI-Bibliothek** | A) shadcn/ui neu einführen · B) **`packages/ui` aus den 16 bestehenden Admin-Komponenten** (+ Radix-Primitives nur für Dialog/Select/Tabs) | **B** | §35 verbietet den generischen shadcn-Look, §28 gilt nur „wenn nichts Besseres im Bestand"; der Bestand ist tokenbasiert und frameworkfrei. |

---

## 8. Qualitätssicherung und Abnahme

**Automatisierte Tests (§44):** Login · falsches Passwort · Passwort-Reset · Einladung · abgelaufene Einladung · deaktivierter Teilnehmer · Teilnehmer A sieht B nicht · Unternehmen A sieht B nicht · Trainer nur eigene Gruppe · zeitgesteuerte Freischaltung · gesperrte Lektion · Lektion abschließen · Reflexion speichern · Aufgabe einreichen · Quiz abschließen · Offensivplan aktualisieren · Termin anzeigen · Admin erstellt Teilnehmer/Gruppe · Admin veröffentlicht Inhalt. Ebenen: pgTAP (RLS), Vitest (Domain/Validation), Playwright (Campus, Admin, Website, Redirects), axe-core.

**Pro Meilenstein (§49):** Typecheck · Lint · Tests · Production Build aller Apps · Security-Checkliste · Screenshots Desktop + Mobile · Git-Checkpoint.

**Abnahme MVP (§50):** Website · Login · Einladungen · Reset · Mandantentrennung · Admin · Trainerrechte · Programme · Module · Inhalte · Freischaltungen · Reflexion · Transfer · Offensivplan · Fortschritt · Termine · Mobile · Tests · Build · RLS getestet · Datenschutzlinks · Accountlöschung · keine Konsolenfehler · keine kaputten Links.

---

## 9. Zulieferungen des Kunden

Siehe `NEEDED_FROM_CLIENT.md` (aktualisiert). Für den Start von Phase 1 zwingend: Supabase-Konto, Vercel-Konto, Entscheidungen K‑1 bis K‑9, Absenderadresse für Systemmails. Für den Vertical Slice ausreichend: Demo-Inhalte. Für den Website-Cutover: Rechtstexte geprüft, Format-Fakten (Dauer, Abstand, Gruppengröße), Fotos.

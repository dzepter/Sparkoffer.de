# Sicherheitskonzept – Handel Offensiv Learning App

Dieses Dokument beschreibt das Sicherheitskonzept der Handel Offensiv Learning App
(Mobile App für Teilnehmer und Trainer, Admin-Oberfläche, Supabase-Backend).
Es richtet sich an Entwickler; die Kapitel 1 und 2 sind bewusst so geschrieben,
dass sie auch ohne IT-Hintergrund verständlich sind.

---

## 1. Überblick: Was schützen wir?

Die App verarbeitet personenbezogene und teilweise sehr persönliche Daten:

- **Stammdaten** der Teilnehmer, Trainer und Ansprechpartner (Name, E-Mail, Organisation)
- **Lernfortschritt** (bearbeitete Lektionen, Quiz-Ergebnisse)
- **Reflexionen und Transferaufgaben** – persönliche Texte der Teilnehmer über die
  eigene Führungsarbeit, teils ausdrücklich nur für die Person selbst bestimmt
- **Aktionspläne** (u. a. der 90-Tage-Offensivplan)
- **Organisationsdaten** der Kundenunternehmen (Handelsunternehmen)

Die wichtigsten Schutzziele, in einfacher Sprache:

1. **Jeder sieht nur seine eigenen Daten.** Ein Teilnehmer sieht niemals die
   Reflexionen, Aufgaben oder Ergebnisse eines anderen Teilnehmers.
2. **Organisationen sind strikt getrennt.** Kunde A kann unter keinen Umständen
   Daten von Kunde B einsehen – auch nicht dessen Admins.
3. **Private Reflexionen bleiben privat.** Was ein Teilnehmer als „privat" markiert,
   sieht kein Trainer und kein Admin. Was er für den Trainer freigibt, sieht nur der
   Trainer seiner Gruppe – nie der Org-Admin.
4. **Kein unbefugter Zugang.** Konten entstehen nur per Einladung; es gibt keine
   öffentliche Registrierung.
5. **Nachvollziehbarkeit.** Sicherheitsrelevante Aktionen werden protokolliert und
   können nachträglich nicht verändert werden.

## 2. Grundprinzip: Defense in Depth (mehrere Schutzschichten)

Wir verlassen uns nie auf eine einzelne Schutzmaßnahme. Jede Anfrage muss mehrere
unabhängige Schichten passieren:

| Schicht | Was sie leistet | Wo sie liegt |
|---|---|---|
| 1. UI / App | Blendet aus, was die Rolle nicht sehen darf | Mobile App, Admin-Oberfläche |
| 2. Serverseitige Rechteprüfung | Prüft Capabilities vor jeder Aktion | Edge Functions, Admin-Server (Next.js) |
| 3. Row Level Security (RLS) | Die Datenbank selbst gibt nur erlaubte Zeilen heraus | PostgreSQL / Supabase |
| 4. Storage-Policies + Signed URLs | Dateien sind privat und nur zeitlich begrenzt abrufbar | Supabase Storage |
| 5. Audit-Log | Macht sicherheitsrelevante Aktionen nachvollziehbar | Datenbank (INSERT-only) |

Wichtig: **Die UI ist reine Benutzerführung, keine Sicherheitsmaßnahme.** Selbst wenn
jemand die App manipuliert oder direkt mit der API spricht, greifen die Schichten 2–4.
Die eigentliche Autorität ist die Datenbank (RLS): Sie gibt Daten nur heraus, wenn die
Regeln es erlauben – unabhängig davon, welcher Client fragt.

---

## 3. Row Level Security (RLS)

### 3.1 Grundsätze

- RLS ist auf **allen Tabellen aktiviert, die vom Client erreichbar sind** –
  ohne Ausnahme. Eine Tabelle ohne Policies gibt damit standardmäßig **nichts** heraus
  (Default Deny).
- Policies werden ausschließlich über **versionierte Migrationen** angelegt und geändert,
  nie manuell in der Konsole.
- Für jede Tabelle werden SELECT/INSERT/UPDATE/DELETE getrennt betrachtet; wo Schreiben
  nicht vorgesehen ist, existiert schlicht keine Policy dafür.
- `supabase/tests/` enthält RLS-Tests (pgTAP bzw. SQL-Testskripte), die pro Rolle
  positive und negative Fälle prüfen („Teilnehmer B sieht Zeile von Teilnehmer A NICHT").
  Diese Tests laufen in der CI.

### 3.2 Hilfsfunktionen im Schema `app`

Zugriffslogik wird nicht in jeder Policy dupliziert, sondern in wenigen
SECURITY-DEFINER-Funktionen zentralisiert. SECURITY DEFINER ist nötig, damit die
Funktionen Mitgliedschaftstabellen lesen können, ohne dass diese für den Benutzer
selbst per RLS voll lesbar sein müssten (Vermeidung rekursiver Policies).

| Funktion | Bedeutung |
|---|---|
| `app.is_super_admin()` | `true`, wenn `profiles.is_super_admin` für `auth.uid()` gesetzt ist |
| `app.org_role(org_id)` | Rolle des aktuellen Benutzers in der Organisation (`org_admin`/`trainer`/`participant`) oder `NULL` |
| `app.is_cohort_trainer(cohort_id)` | `true`, wenn der Benutzer als Trainer der Gruppe eingetragen ist |
| `app.is_cohort_member(cohort_id)` | `true`, wenn der Benutzer aktives Mitglied der Gruppe ist |

Regeln für diese Funktionen:

- `STABLE`, `SECURITY DEFINER`, explizites `SET search_path = ''` (Schutz vor
  Search-Path-Hijacking).
- Sie prüfen zusätzlich den Status (`status = 'active'`) – deaktivierte
  Mitgliedschaften zählen nicht.
- `EXECUTE` nur für `authenticated`, nicht für `anon`.

### 3.3 Policy-Prinzip je Rollentyp

**Teilnehmer (participant)**
- Sieht und schreibt ausschließlich **eigene** Datensätze
  (`profile_id = auth.uid()`): Fortschritt, Abgaben, Reflexionen, Aktionspläne,
  Quiz-Versuche, Benachrichtigungen, Consents.
- Sieht Inhalte (Lektionen, Blöcke) nur für Kurse, in denen er über eine aktive
  Cohort-Mitgliedschaft eingeschrieben ist, und nur, wenn die Release Engine die
  Lektion freigegeben hat (Prüfung serverseitig, gespiegelt in der Lese-Policy).
- Sieht Basisdaten der eigenen Cohort (Termine, Ankündigungen), aber keine
  personenbezogenen Daten anderer Mitglieder über das Notwendige hinaus.

**Trainer**
- Sieht nur Daten von Cohorts, denen er über `cohort_trainers` zugewiesen ist.
- Bei Abgaben und Reflexionen zusätzlich: **nur** Datensätze mit
  `visibility = 'trainer'`. Private Einträge sind für Trainer unsichtbar –
  auf Datenbankebene, nicht nur in der UI.
- Schreibt Feedback (`trainer_feedback`) nur zu Abgaben aus eigenen Cohorts.

**Org-Admin**
- Sieht Organisations-, Cohort- und Mitgliederdaten **nur der eigenen Organisation**
  (`app.org_role(organization_id) = 'org_admin'`), verfeinert durch die
  `permissions`-JSONB der Mitgliedschaft (Capabilities, siehe `packages/domain`).
- Sieht **Aggregate** (Fortschrittsquoten, Teilnahme), aber **niemals Reflexionstexte
  oder private Inhalte** – es existiert schlicht keine Policy, die ihm
  `reflection_entries` oder `assignment_submissions`-Texte gibt. Aggregation erfolgt
  über Views/Edge Functions, die nur Kennzahlen liefern.

**Super Admin**
- Hat **keine breiten „is_super_admin ⇒ alles"-Client-Policies** auf sensiblen
  Inhaltstabellen. Administrative Vollzugriffe laufen über Edge Functions mit
  Service Role (Schicht 2 prüft dort `app.is_super_admin()` bzw. das Profil-Flag
  serverseitig). Wo Client-Lesezugriff für Super Admins sinnvoll ist
  (z. B. Organisationsliste), ist er explizit per Policy erlaubt.
- Auch der Super Admin sieht private Reflexionen **im Regelbetrieb nicht** – es gibt
  dafür keinen regulären Codepfad. Zugriff ist nur in dokumentierten Support-Fällen
  über Edge Functions mit Audit-Log-Eintrag möglich (siehe `docs/RBAC.md`).

**Nicht angemeldet (anon)**
- Kein Zugriff auf irgendeine Tabelle. Es gibt keine öffentlichen Inhalte.

### 3.4 Exemplarische Policies

Reflexionen – Teilnehmer sieht nur eigene, Trainer nur freigegebene aus eigenen Cohorts:

```sql
alter table public.reflection_entries enable row level security;

-- Teilnehmer: eigene Einträge lesen/schreiben
create policy reflection_owner_all
  on public.reflection_entries
  for all
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

-- Trainer: nur lesend, nur eigene Cohorts, nur visibility='trainer'
create policy reflection_trainer_read
  on public.reflection_entries
  for select
  to authenticated
  using (
    visibility = 'trainer'
    and app.is_cohort_trainer(cohort_id)
  );
-- Bewusst KEINE Policy für Org-Admins: sie sehen Reflexionen nie.
```

Cohort-Mitgliedschaften – Mandantentrennung über die Organisation:

```sql
alter table public.cohort_members enable row level security;

create policy cohort_members_read
  on public.cohort_members
  for select
  to authenticated
  using (
    profile_id = (select auth.uid())            -- eigene Mitgliedschaft
    or app.is_cohort_trainer(cohort_id)         -- Trainer der Gruppe
    or app.org_role(
         (select c.organization_id
            from public.cohorts c
           where c.id = cohort_id)
       ) = 'org_admin'                          -- Org-Admin der eigenen Organisation
  );
-- Schreiben (Einladen, Entfernen) nur über Edge Functions / Service Role,
-- daher keine INSERT/UPDATE/DELETE-Policies für Clients.
```

Audit-Log – jeder darf einfügen lassen (serverseitig), niemand ändern oder löschen:

```sql
alter table public.audit_logs enable row level security;

-- Lesen: nur wer die Capability audit.read hat (hier: Super Admin via Edge Function;
-- Client-Lesezugriff bewusst nicht vorgesehen -> keine SELECT-Policy).
-- Es existieren KEINE UPDATE- oder DELETE-Policies.
-- Zusätzlich harte Absicherung unabhängig von RLS:
revoke update, delete on public.audit_logs from authenticated, anon;
```

---

## 4. Authentifizierung und Sitzungen

### 4.1 Kontenanlage nur per Einladung

Es gibt **keine öffentliche Registrierung**. Der Ablauf:

1. Ein berechtigter Admin lädt eine Person ein (Capability `users.invite`).
2. Eine Edge Function erzeugt einen kryptografisch zufälligen Token
   (≥ 32 Byte Entropie). In der Tabelle `invitations` wird **nur der Hash**
   (`token_hash`, z. B. SHA-256) gespeichert – nie der Klartext-Token.
3. Die Person erhält eine E-Mail mit einem Einmallink, der den Klartext-Token trägt.
4. Beim Öffnen prüft die Edge Function: Hash-Übereinstimmung, `expires_at` nicht
   überschritten, `accepted_at` und `revoked_at` leer.
5. Die Person setzt ihr **eigenes Passwort** (es werden nie Anfangspasswörter erzeugt
   oder verschickt), akzeptiert die Datenschutzerklärung (`user_consents` mit
   Zeitstempel und Versionskennung) und kann sich dann anmelden.
6. `accepted_at` wird gesetzt; der Token ist damit verbraucht.

Zusätzlich:

- **Ablauf:** Einladungen haben eine feste Gültigkeit (`expires_at`); abgelaufene
  Tokens sind wertlos.
- **Widerruf:** Admins können Einladungen zurückziehen (`revoked_at`); der Link ist
  sofort ungültig.
- **Erneut senden:** erzeugt einen **neuen** Token und invalidiert den alten
  (alter Datensatz wird widerrufen).
- Die Antwort auf einen ungültigen Token ist immer dieselbe neutrale Meldung
  („Link ungültig oder abgelaufen") – kein Rückschluss, ob eine E-Mail existiert.

### 4.2 Passwörter und Reset

- Serverseitige Mindestanforderungen an Passwortlänge/-qualität (konfiguriert in
  Supabase Auth); Prüfung zusätzlich per Zod im Client für gute UX.
- **Passwort vergessen:** Standard-Reset-Flow von Supabase Auth mit zeitlich
  begrenztem Einmallink. Die Antwort ist unabhängig davon, ob die E-Mail existiert,
  immer gleich (keine Account-Enumeration).
- **Passwort ändern:** nur in angemeldetem Zustand, mit erneuter Eingabe des
  aktuellen Passworts.

### 4.3 Sitzungen (Sessions)

- Supabase-Sessions mit kurzlebigen Access Tokens und Refresh-Token-Rotation.
- **Mobile:** Tokens liegen ausschließlich in `expo-secure-store`
  (Keychain/Keystore), **niemals** in AsyncStorage oder anderem unverschlüsselten
  Speicher.
- **Admin (Next.js):** Sessions über `@supabase/ssr` in HttpOnly-Cookies
  (`Secure`, `SameSite=Lax`); Tokens sind für JavaScript im Browser nicht lesbar.
- **Alle Sitzungen beenden:** Benutzer (und Admins für fremde Konten, Capability
  `users.manage`) können alle Refresh Tokens eines Kontos widerrufen
  (`signOut({ scope: 'global' })` bzw. Admin-API). Pflicht-Bestandteil des Ablaufs
  bei Deaktivierung und bei Verdacht auf Kompromittierung.
- **Deaktivierung:** Bei `profiles.status`- bzw. Mitgliedschafts-Deaktivierung
  werden Sessions widerrufen; die `app.*`-Funktionen liefern zusätzlich `false`,
  sodass selbst ein noch gültiges Access Token keine Daten mehr erhält.

### 4.4 MFA

- **TOTP-basierte Zwei-Faktor-Authentifizierung** (Authenticator-App) ist über
  Supabase Auth vorbereitet.
- Für **Super Admins und Trainer** aktivierbar und für Super Admins organisatorisch
  verpflichtend vorgesehen; für Teilnehmer in V1 nicht vorgesehen.
- Enrollment und Verifizierung laufen über die Standard-MFA-API; Recovery erfolgt
  über den Admin (Einladung zur Neu-Einrichtung), nicht über abgeschwächte
  Umgehungspfade.

---

## 5. Service-Role-Key

Der Service-Role-Key umgeht RLS vollständig. Daher gelten absolute Regeln:

- **Nie im Client.** Weder in der Mobile App noch im Admin-Frontend, weder im
  Quellcode noch im gebauten Bundle. In Expo/Next.js heißt das konkret: der Key
  steht in **keiner** Variable mit `EXPO_PUBLIC_`- oder `NEXT_PUBLIC_`-Präfix.
- **Nie im Repository.** Keys leben ausschließlich in Environment-Secrets
  (Supabase Function Secrets, Vercel/Hosting-Secrets, CI-Secrets).
  `.env`-Dateien mit echten Keys sind per `.gitignore` ausgeschlossen;
  `.env.example` enthält nur Platzhalter.
- **Nur in Edge Functions** (und ggf. serverseitigen Next.js-Route-Handlern, die
  nachweislich nie an den Client gelangen). Jede Funktion, die den Key nutzt,
  prüft **zuerst** das JWT des Aufrufers und dessen Capabilities – der Key ist
  Werkzeug, nicht Berechtigung.
- Getrennte Keys je Environment (local/staging/production); Rotation ist über die
  Supabase-Konsole jederzeit möglich und im Betriebsrunbook dokumentiert.
- Ein CI-Check (Secret-Scanning, siehe Kap. 11) schlägt an, wenn ein Key-Muster im
  Repo auftaucht.

Gleiches Prinzip gilt abgeschwächt für den `anon`-Key: Er ist zwar für Clients
bestimmt, gewährt aber nur, was RLS erlaubt – er ist kein Geheimnis, aber auch
keine Berechtigung.

---

## 6. Storage-Sicherheit

- **Alle Buckets sind privat.** Es gibt keine öffentlichen Dateien; auch Logos und
  Lernmaterialien werden über Signed URLs ausgeliefert.
- **Signed URLs sind kurzlebig** (Richtwert: Minuten für Anzeige/Streaming, nicht
  Stunden). URLs werden bei Bedarf neu angefordert, nie dauerhaft gespeichert oder
  geteilt.
- **Pfadschema:** `organizations/{orgId}/...` (z. B.
  `organizations/{orgId}/cohorts/{cohortId}/submissions/{profileId}/{uuid}.pdf`).
  Storage-Policies und die serverseitige Prüfung verifizieren, dass der Aufrufer
  zur `orgId` im Pfad gehört – Mandantentrennung gilt auch für Dateien.
- **Uploads laufen über eine serverseitige Prüfung** (Edge Function erstellt den
  Zielpfad und die Upload-Berechtigung), nicht über frei wählbare Client-Pfade.
- **Validierung bei Upload:**
  - Allowlist erlaubter MIME-Typen und Endungen (z. B. PDF, JPEG/PNG/WebP, MP3/MP4);
    Prüfung von Content-Type **und** Magic Bytes, nicht nur der Dateiendung.
  - Maximalgrößen je Dateityp (serverseitig durchgesetzt).
  - **Namensnormalisierung:** Der Speichername wird serverseitig generiert
    (UUID + geprüfte Endung). Der Originalname wird höchstens als Metadatum
    gespeichert – niemals als Pfadbestandteil (keine Pfadtraversierung, keine
    Sonderzeichen-/Unicode-Tricks).
  - **Keine ausführbaren Dateien** (kein .exe, .sh, .bat, .apk, .html, .svg mit
    Skripten usw.); HTML/SVG sind ausgeschlossen, um Stored-XSS über Storage zu
    verhindern.
- Downloads erhalten `Content-Disposition`, sodass Browser Dateien nicht im
  App-Origin interpretieren.

---

## 7. Input-Validierung

- **Zod an jeder Vertrauensgrenze:** alle Edge-Function-Payloads, alle Formulareingaben
  im Admin (server- und clientseitig), alle Mobile-Eingaben vor dem Senden, alle
  `content_blocks.config`-JSONBs (Schemas in `packages/validation`, je `block_type`
  ein eigenes Schema mit `discriminatedUnion`).
- Serverseitige Validierung ist maßgeblich; Client-Validierung ist nur UX.
- Datenbankseitig zusätzlich CHECK-Constraints und Enums für Status-/Typfelder –
  ungültige Zustände sind auch bei Logikfehlern nicht speicherbar.
- Kein dynamisches SQL mit String-Konkatenation; Zugriffe laufen über PostgREST
  bzw. parametrisierte Queries in Edge Functions.
- Von Benutzern stammende Texte werden im Admin und in der App als Text gerendert,
  nie als HTML (kein `dangerouslySetInnerHTML` mit Benutzerdaten).

---

## 8. Rate Limiting

Sensible Endpunkte werden gegen Brute Force und Missbrauch gedrosselt:

| Endpunkt | Limit-Prinzip |
|---|---|
| Login / Passwort-Reset | Supabase-Auth-eigene Limits, konservativ konfiguriert |
| Einladungs-Annahme (Token-Prüfung) | Limit pro IP und pro Token; nach N Fehlversuchen zusätzliche Verzögerung |
| Einladungen versenden / erneut senden | Limit pro Admin und pro Ziel-E-Mail (Spam-Schutz) |
| Quiz-Versuche | fachlich über `max_attempts`, technisch gegen automatisiertes Abklopfen |
| Push-/Benachrichtigungsversand | Limit pro Absender-Rolle |

Umsetzung: Auth-Limits über die Supabase-Konfiguration; eigene Edge Functions
führen einen Zähler (z. B. Tabelle mit Zeitfenster oder Upstash-kompatibler Store)
und antworten mit HTTP 429 ohne Detailangaben. Fehlversuche auf Einladungs- und
Login-Endpunkten werden ins Audit-Log geschrieben.

---

## 9. Security Headers, CSP und CSRF (Admin)

Die Admin-Oberfläche (Next.js) setzt strikte Antwort-Header:

- `Content-Security-Policy`: `default-src 'self'`; `connect-src` nur auf die
  Supabase-Projekt-URL des jeweiligen Environments; `img-src 'self' data:` plus
  Supabase-Storage-Host; `frame-ancestors 'none'`; `object-src 'none'`;
  keine `unsafe-eval`; Inline-Skripte nur per Nonce (Next.js-Nonce-Mechanismus).
- `Strict-Transport-Security` (HSTS) mit langer Laufzeit.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `X-Frame-Options: DENY` (zusätzlich zu `frame-ancestors`),
  `Permissions-Policy`: Kamera, Mikrofon, Geolocation deaktiviert.

**CSRF-Betrachtung:**

- Auth-Cookies sind `HttpOnly`, `Secure`, `SameSite=Lax` – das blockiert die
  klassischen Cross-Site-POSTs bereits weitgehend.
- Zustandsändernde Aktionen laufen über Next.js Server Actions bzw. Route Handler,
  die Origin-/Host-Header prüfen (Next.js prüft bei Server Actions den Origin
  standardmäßig); reine GETs sind nebenwirkungsfrei.
- Edge Functions akzeptieren nur JWT-Bearer-Auth (kein Cookie-Auth) – damit sind
  sie von CSRF konstruktionsbedingt nicht betroffen.
- CORS der Edge Functions ist auf die bekannten Origins (Admin-Domains je
  Environment) beschränkt; die Mobile App ist von CORS nicht betroffen.

---

## 10. Sichere Fehlerausgaben

- Benutzer sehen **nur neutrale, deutschsprachige Fehlermeldungen**
  („Das hat leider nicht geklappt. Bitte versuche es erneut.").
- **Niemals an Clients:** Stacktraces, SQL-Fehlertexte, PGRST-/PostgREST-Codes,
  Constraint-Namen, interne Pfade oder Supabase-Fehlerobjekte im Original.
  Edge Functions und der Admin-Server mappen Fehler auf definierte, knappe
  Fehlercodes (`invalid_input`, `not_allowed`, `not_found`, `rate_limited`,
  `server_error`).
- Autorisierungsfehler antworten bevorzugt wie „nicht gefunden" (404 statt 403),
  wo das keine UX-Nachteile hat – so lässt sich die Existenz fremder Datensätze
  nicht erraten.
- Vollständige Fehlerdetails gehen ausschließlich ins serverseitige Logging
  (Function-Logs), das nur Betriebsberechtigten zugänglich ist. Logs enthalten
  keine Passwörter, Tokens oder Reflexionstexte.

---

## 11. Audit-Log

- Tabelle `audit_logs`, **INSERT-only**: keine UPDATE-/DELETE-Policies, zusätzlich
  `REVOKE UPDATE, DELETE` für alle Client-Rollen. Auch Org-Admins und Trainer
  können Einträge weder ändern noch löschen; Löschung erfolgt nur durch
  automatisierte Aufbewahrungsfristen (siehe Kap. 13).
- Geschrieben wird serverseitig (Edge Functions / Trigger), nicht vom Client frei
  befüllbar.
- **Inhalt je Eintrag:** Zeitstempel, handelnde Person (profile_id), Organisation,
  Aktion (z. B. `invitation.created`, `invitation.revoked`, `user.deactivated`,
  `role.changed`, `lesson.published`, `sessions.revoked`, `login.failed`),
  Zielobjekt (Typ + ID), Ergebnis, grobe Anforderungsmetadaten.
- **Niemals im Log:** Passwörter, Klartext-Tokens, Session-/Refresh-Tokens,
  Reflexions- oder Abgabetexte, vollständige Request-Bodies sensibler Endpunkte.
  Wo Kontext nötig ist, werden nur IDs oder Hashes gespeichert.
- Lesezugriff auf das Audit-Log nur über die Capability `audit.read`
  (nur Super Admin; für Org-Admins ist `audit.read` nicht gewährbar,
  siehe harte Grenzen in `docs/RBAC.md`).

---

## 12. Abhängigkeits- und Secret-Scanning in der CI

`.github/workflows/ci.yml` enthält neben Typecheck, Lint, Tests und Builds:

- **Dependency-Audit:** `pnpm audit` (Fehlschlag bei bekannten kritischen/hohen
  Schwachstellen) plus GitHub **Dependabot** für automatische Update-PRs auf
  npm-Pakete und GitHub Actions.
- **Secret-Scanning:** GitHub Secret Scanning / Push Protection aktiv; zusätzlich
  ein CI-Schritt (z. B. gitleaks) gegen versehentlich committete Keys
  (Service-Role-Key-Muster, JWTs, `.env`-Inhalte).
- **Lockfile-Pflicht:** `pnpm install --frozen-lockfile` in der CI – keine
  unbemerkten Versionssprünge.
- Renovate/Dependabot-PRs durchlaufen dieselbe CI wie normale PRs.
- Expo- und Supabase-CLI-Versionen sind gepinnt.

---

## 13. DSGVO-Architektur

Die App ist so gebaut, dass Datenschutz Standard ist (Privacy by Design / by Default).
Punkte mit rechtlichem Charakter sind markiert mit **[zur finalen
Datenschutz-/Anwaltsprüfung]** – sie beschreiben die technische Vorbereitung, ersetzen
aber keine Rechtsberatung.

**Datenminimierung**
- Erhoben wird nur, was das Programm braucht: Name, E-Mail, Organisation,
  Lernstände, freiwillige Texte. Kein Zugriff auf Kontakte, Standort oder Mikrofon;
  die App fordert diese Berechtigungen gar nicht erst an.
- Push-Benachrichtigungen sind sparsam und abschaltbar; `push_tokens` sind
  gerätebezogen und werden bei Abmeldung/Deaktivierung entfernt.

**Hosting und Auftragsverarbeitung**
- Supabase-Projekte (local/staging/production getrennt) in einer **EU-Region**;
  Produktivdaten verlassen die EU nicht.
- **AVV (Auftragsverarbeitungsvertrag)** mit Supabase sowie mit dem
  E-Mail-Versanddienst abschließen. **[zur finalen Datenschutz-/Anwaltsprüfung]**
- **Unterauftragnehmer-Liste** führen und in der Datenschutzerklärung nennen
  (mindestens: Supabase inkl. dessen Infrastruktur-Provider, E-Mail-Versand,
  Expo-Push-Dienst/Apple/Google für Push-Zustellung, Hosting des Admin-Frontends).
  **[zur finalen Datenschutz-/Anwaltsprüfung]**
- Hinweis: Push-Zustellung läuft technisch über Apple/Google; Inhalte von
  Push-Nachrichten bleiben deshalb generisch (kein sensibler Text in der
  Notification, Details erst nach Öffnen per Deep Link).

**Einwilligungen**
- `user_consents` speichert Zeitpunkt und Version der akzeptierten
  Datenschutzerklärung; ohne Zustimmung keine Nutzung. Neue Versionen erfordern
  erneute Zustimmung. Die Texte selbst: **[zur finalen
  Datenschutz-/Anwaltsprüfung]**

**Betroffenenrechte**
- **Datenexport (Art. 15/20):** Edge Function stellt auf Anfrage alle Daten einer
  Person maschinenlesbar (JSON, plus Dateien) zusammen; Auslösung durch die Person
  oder den Super Admin.
- **Löschung (Art. 17):** `account_deletion_requests` bildet den Prozess ab
  (Antrag → Prüfung → Ausführung). Die Ausführung löscht bzw. anonymisiert
  personenbezogene Daten inkl. Storage-Dateien; aggregierte, nicht mehr
  personenbeziehbare Statistiken dürfen bestehen bleiben.
  Konkrete **Löschfristen** (z. B. X Monate nach Programmende, Frist zwischen
  Antrag und Ausführung): **[zur finalen Datenschutz-/Anwaltsprüfung]**
- Audit-Log-Einträge werden bei Löschung pseudonymisiert (profile_id → gelöschter
  Benutzer), Aufbewahrungsdauer des Logs: **[zur finalen
  Datenschutz-/Anwaltsprüfung]**

**Backups und Wiederherstellung**
- Automatische Supabase-Backups (Point-in-Time-Recovery, sofern im Plan enthalten);
  Backups liegen in derselben EU-Region.
- Gelöschte Konten können in Backups nachlaufen; die Backup-Aufbewahrungsdauer wird
  in der Datenschutzerklärung genannt und begrenzt.
  **[zur finalen Datenschutz-/Anwaltsprüfung]**
- Restore-Prozess ist dokumentiert und wird auf Staging getestet.

**Zugriffsprotokollierung**
- Administrative Zugriffe und sicherheitsrelevante Aktionen stehen im Audit-Log
  (Kap. 11); Supabase-seitige Zugriffe auf die Projektkonsole sind auf wenige
  benannte Personen mit MFA beschränkt.

---

## 14. Bedrohungsmodell

Die acht wichtigsten Szenarien mit den jeweils greifenden Schichten:

| # | Angriff / Szenario | Gegenmaßnahmen |
|---|---|---|
| 1 | **Teilnehmer A liest Daten von Teilnehmer B** (manipulierte App, direkte API-Calls mit fremden IDs) | RLS: alle Lern-Entitäten nur mit `profile_id = auth.uid()` lesbar; keine Policy gibt fremde Zeilen heraus. Serverseitige Prüfung in Edge Functions. IDs sind UUIDs (nicht erratbar), aber Sicherheit hängt nicht davon ab. RLS-Tests decken genau diesen Fall ab. |
| 2 | **Organisation A liest Organisation B** (Org-Admin ändert org_id in Requests) | Mandantentrennung in jeder Policy über `app.org_role(org_id)`; Storage-Pfade `organizations/{orgId}/...` mit Pfad-Prüfung; Edge Functions leiten die Organisation aus der Mitgliedschaft ab, nie aus Client-Parametern; Aggregat-Views filtern serverseitig auf die eigene Organisation. |
| 3 | **Org-Admin oder Trainer liest private Reflexionen** | `visibility` auf Datensatzebene; Trainer-Policy verlangt `visibility='trainer'` UND eigene Cohort; für Org-Admins existiert keinerlei Lese-Policy auf Reflexionstexte; Aggregate enthalten nur Kennzahlen. |
| 4 | **Gestohlener/erratener Einladungslink** | Token mit hoher Entropie, nur als Hash gespeichert; kurze Gültigkeit (`expires_at`); Einmalverwendung (`accepted_at`); Widerruf (`revoked_at`); Rate Limiting + Audit-Log auf dem Annahme-Endpunkt; neutrale Fehlermeldungen. |
| 5 | **Service-Role-Key gelangt in Client-Bundle oder Repo** | Key existiert nur in Server-Secrets; keine `EXPO_PUBLIC_`/`NEXT_PUBLIC_`-Variablen; Secret-Scanning in CI und Push Protection; dokumentierte Rotation; Edge Functions prüfen Aufrufer-JWT unabhängig vom Key. |
| 6 | **Schadhafte Datei-Uploads** (getarnte ausführbare Dateien, Stored XSS über HTML/SVG, überlange Dateien) | Serverseitige Allowlist (MIME + Magic Bytes), Größenlimits, servergenerierte Dateinamen (UUID), Verbot ausführbarer Formate und von HTML/SVG, private Buckets, kurzlebige Signed URLs, `Content-Disposition` beim Download. |
| 7 | **Brute Force auf Login/Passwort-Reset, Account-Enumeration** | Auth-Rate-Limits; neutrale, identische Antworten unabhängig von Kontoexistenz; MFA für Super Admin/Trainer; Session-Widerruf („alle Sitzungen beenden"); fehlgeschlagene Versuche im Audit-Log. |
| 8 | **Kompromittiertes Trainer-/Admin-Konto** | MFA; Capabilities begrenzen den Schaden (Trainer sieht nur eigene Cohorts, Org-Admin nur eigene Organisation, nie Reflexionen); sofortige Deaktivierung + globaler Session-Widerruf; INSERT-only-Audit-Log macht Aktionen nachvollziehbar und nicht vertuschbar. |

Ergänzend gilt: Gerätediebstahl beim Teilnehmer wird durch `expo-secure-store`
(Bindung an Geräteschutz) und serverseitigen Session-Widerruf abgefedert; ein
kompromittiertes npm-Paket durch Lockfile-Pflicht, Audit und Dependabot (Kap. 12).

---

## 15. Verantwortlichkeiten und Pflege dieses Dokuments

- Änderungen an Policies, Auth-Flows oder Storage-Regeln erfordern eine
  Aktualisierung dieses Dokuments im selben Pull Request.
- Neue Tabellen gehen nur mit aktiviertem RLS, Policies und zugehörigen Tests
  in eine Migration (Review-Checkliste in der CI/PR-Vorlage).
- Vor jedem Produktiv-Release: Kurzabgleich gegen das Bedrohungsmodell (Kap. 14) –
  hat sich eine Annahme geändert?

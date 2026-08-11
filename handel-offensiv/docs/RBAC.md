# Rollen- und Rechtemodell (RBAC)

Handel Offensiv Learning App – Aigner Offensiv, Institut für Führung und Vertrieb

Dieses Dokument beschreibt verbindlich, **wer in der App was darf** – und mindestens genauso wichtig: **was nicht**. Es richtet sich an Entwickler (Abschnitte 4–7) und an Nicht-IT-Leser (Abschnitte 1–3 genügen für den Überblick).

---

## 1. Kurz erklärt (für Nicht-Techniker)

Die App wird von mehreren Organisationen (Handelsunternehmen) gleichzeitig genutzt. Jede Organisation sieht ausschließlich ihre eigenen Daten – wie getrennte Kabinen im selben Stadion. Innerhalb einer Organisation gibt es klar abgegrenzte Rollen:

| Rolle | In einem Satz |
|---|---|
| **Super Admin** | Aigner Offensiv selbst. Verwaltet die gesamte Plattform, alle Organisationen und die Programminhalte. |
| **Organisationsadmin** | Ansprechpartner beim Kundenunternehmen. Verwaltet die eigenen Teilnehmer und Gruppen, sieht Lernfortschritt nur als Überblickszahlen. |
| **Trainer** | Begleitet konkrete Gruppen (Cohorts). Sieht Einreichungen und ausdrücklich freigegebene Reflexionen seiner Gruppen, gibt Feedback. |
| **Teilnehmer** | Führungskraft im Programm. Arbeitet mit den freigeschalteten Inhalten, sieht ausschließlich eigene Daten. |

Drei Grundsätze gelten ohne Ausnahme:

1. **Persönliche Reflexionen sind privat.** Ein Teilnehmer entscheidet pro Eintrag, ob sein Trainer ihn sehen darf. Der Organisationsadmin sieht Reflexionstexte **nie** – standardmäßig und ohne Ausnahmemechanismus im Regelbetrieb.
2. **Teilnehmer sehen niemals Antworten anderer Teilnehmer.**
3. **Rechte werden auf dem Server durchgesetzt, nicht nur in der Oberfläche.** Was die App ausblendet, ist Komfort; was die Datenbank verweigert, ist Sicherheit.

---

## 2. Die vier Rollen im Detail

### 2.1 Super Admin

Technisch: `profiles.is_super_admin = true`. Der Super Admin ist **keine** Organisationsrolle – er steht über allen Organisationen. Privilegierte Aktionen laufen ausschließlich über serverseitige Edge Functions (Service Role); der Service-Role-Key existiert nie im Client.

**Kann:**
- Organisationen anlegen, bearbeiten, deaktivieren, archivieren (inkl. interner Notizen)
- Organisationsadmins, Trainer und Teilnehmer aller Organisationen einladen, verwalten, deaktivieren; Einladungen erneut senden und zurückziehen
- Programme, Module, Lernphasen, Lektionen und Content-Blöcke erstellen, bearbeiten, veröffentlichen, archivieren
- Cohorts, Termine (Offensivtage) und Freischaltregeln (Release Engine) aller Organisationen verwalten
- Ankündigungen und Push-Benachrichtigungen plattformweit oder gezielt versenden
- Aggregierte Auswertungen über alle Organisationen einsehen
- Audit-Logs lesen
- Plattformeinstellungen verwalten
- MFA (TOTP) für das eigene Konto aktivieren (vorbereitet, empfohlen)

**Kann nicht:**
- Private Reflexionseinträge (`visibility = 'private'`) von Teilnehmern im Regelbetrieb einsehen – auch der Super Admin arbeitet in der Anwendung nur mit den dafür vorgesehenen Sichten
- Audit-Logs ändern oder löschen (INSERT-only, für niemanden veränderbar)
- Client-seitig privilegierte Operationen ausführen – alles Privilegierte läuft über Edge Functions

### 2.2 Organisationsadmin (`role = 'org_admin'`)

Verwaltungsrolle **innerhalb genau einer Organisation** (Mehrfachmitgliedschaften in verschiedenen Organisationen sind möglich, jede mit eigener Rolle).

**Kann (Standardumfang):**
- Stammdaten der eigenen Organisation einsehen
- Nutzer der eigenen Organisation einsehen, einladen, deaktivieren; Einladungen erneut senden und zurückziehen
- Cohorts der eigenen Organisation anlegen und verwalten, Teilnehmer und Trainer zuordnen, Termine (Offensivtage) pflegen
- Aggregierte Fortschritts- und Aktivitätskennzahlen der eigenen Organisation einsehen (z. B. Modul-Fortschritt pro Cohort)
- Ankündigungen an eigene Cohorts senden (sofern per `permissions` gewährt, siehe 4.2)

**Kann nicht:**
- Andere Organisationen sehen oder verwalten – in keiner Form
- **Reflexionstexte von Teilnehmern lesen – niemals, auch nicht über feingranulare Zusatzrechte**
- Transfer-Einreichungen im Wortlaut lesen oder Trainer-Feedback geben (das ist Trainer-Sache); sichtbar sind nur Aggregate („eingereicht: ja/nein“ auf Kennzahlenebene)
- Programminhalte bearbeiten oder veröffentlichen (nur wenn per `permissions` ausdrücklich gewährt)
- Audit-Logs lesen oder Plattformeinstellungen ändern
- Sich selbst oder anderen Super-Admin-Rechte geben

Der Standardumfang kann pro Person über `organization_memberships.permissions` (JSONB) feingranular angepasst werden – ausschließlich innerhalb der eigenen Organisation und nie über die harten Grenzen dieses Dokuments hinaus (Details in 4.2).

### 2.3 Trainer (`role = 'trainer'`)

Fachrolle, wirksam nur für **explizit zugewiesene Cohorts** (`cohort_trainers`). Die Organisationsmitgliedschaft allein gewährt keinen Zugriff auf Teilnehmerdaten.

**Kann:**
- Zugewiesene Cohorts, deren Mitglieder und Termine einsehen
- Veröffentlichte Programminhalte einsehen (auch zur Vorbereitung, unabhängig von Freischaltungen der Teilnehmer)
- Transfer-Einreichungen mit `visibility = 'trainer'` seiner Cohorts lesen und Status setzen (`seen`, `feedback_given`, `done`)
- Reflexionseinträge lesen, die der Teilnehmer **selbst** auf `visibility = 'trainer'` gestellt hat
- Mit Trainer geteilte Maßnahmenpläne (`share_with_trainer = true`) einsehen
- Feedback geben (`trainer_feedback`)
- Fortschritts-Übersichten seiner Cohorts einsehen
- Ankündigungen an eigene Cohorts senden
- MFA (TOTP) aktivieren (vorbereitet, empfohlen)

**Kann nicht:**
- Cohorts sehen, denen er nicht zugewiesen ist – auch nicht innerhalb derselben Organisation
- Inhalte mit `visibility = 'private'` lesen (Reflexionen, private Einreichungen, nicht geteilte Maßnahmenpläne)
- Nutzer einladen oder verwalten, Cohorts anlegen, Freischaltregeln ändern
- Programminhalte bearbeiten oder veröffentlichen
- Organisationsweite Auswertungen jenseits der eigenen Cohorts einsehen

### 2.4 Teilnehmer (`role = 'participant'`)

**Kann:**
- Für ihn freigeschaltete Lektionen und Inhalte seiner Cohort nutzen; gesperrte Lektionen als Vorschau mit Freischalthinweis sehen („Wird nach Offensivtag 2 freigeschaltet.“)
- Eigene Einreichungen, Reflexionen, Quiz-Versuche und Maßnahmenpläne erstellen und bearbeiten
- Pro Reflexionseintrag und Einreichung entscheiden: privat oder für den Trainer sichtbar; Maßnahmenpläne per `share_with_trainer` teilen
- Erhaltenes Trainer-Feedback lesen
- Termine, Ankündigungen und Benachrichtigungen der eigenen Cohort sehen
- Eigenes Profil pflegen, Passwort ändern, Sitzungen beenden, Datenlöschung beantragen (`account_deletion_requests`)

**Kann nicht:**
- **Antworten, Einreichungen, Reflexionen oder Fortschritt anderer Teilnehmer sehen – niemals, in keiner Ansicht**
- Nicht freigeschaltete Inhalte öffnen (die Sperre gilt serverseitig, nicht nur optisch)
- Mitgliederlisten fremder Cohorts oder Daten anderer Organisationen sehen
- Irgendetwas verwalten (Nutzer, Cohorts, Inhalte, Freischaltungen)

---

## 3. Capability-Katalog: Rolle × Capability

Rechte werden nicht als verstreute Rollenabfragen implementiert, sondern als benannte **Capabilities**. Die Zuordnung Rolle → Capabilities liegt zentral in `packages/domain`.

Legende: ✔ = ja (im genannten Geltungsbereich) · P = nur wenn per `permissions`-JSONB gewährt · ✖ = nein

| Capability | Bedeutung | Super Admin | Org-Admin | Trainer | Teilnehmer |
|---|---|---|---|---|---|
| `organizations.read` | Organisationsdaten lesen | ✔ global | ✔ eigene Org | ✔ eigene Org (Basisdaten) | ✖ |
| `organizations.manage` | Organisationen anlegen/ändern/archivieren | ✔ global | ✖ | ✖ | ✖ |
| `users.read` | Nutzerlisten lesen | ✔ global | ✔ eigene Org | ✔ Mitglieder zugewiesener Cohorts | ✖ |
| `users.invite` | Einladen, Einladung erneut/zurückziehen | ✔ global | ✔ eigene Org | ✖ | ✖ |
| `users.manage` | Deaktivieren, Rollen/Rechte in der Org ändern | ✔ global | ✔ eigene Org | ✖ | ✖ |
| `cohorts.read` | Cohorts, Mitglieder, Termine lesen | ✔ global | ✔ eigene Org | ✔ zugewiesene Cohorts | ✔ eigene Cohort (Termine, Ankündigungen) |
| `cohorts.manage` | Cohorts/Termine/Freischaltregeln verwalten | ✔ global | ✔ eigene Org | ✖ | ✖ |
| `content.read` | Programminhalte lesen | ✔ global | ✔ veröffentlicht | ✔ veröffentlicht | ✔ freigeschaltet |
| `content.edit` | Inhalte erstellen/bearbeiten (Entwürfe) | ✔ global | P | ✖ | ✖ |
| `content.publish` | Inhalte veröffentlichen/archivieren | ✔ global | P | ✖ | ✖ |
| `submissions.read` | Einreichungen lesen (nur `visibility='trainer'`) | ✔ global | ✖ (nur Aggregate) | ✔ zugewiesene Cohorts | ✔ nur eigene |
| `submissions.feedback` | Feedback geben, Status setzen | ✔ global | ✖ | ✔ zugewiesene Cohorts | ✖ |
| `analytics.read` | Aggregierte Auswertungen | ✔ global | ✔ eigene Org (nur Aggregate) | ✔ zugewiesene Cohorts | ✔ eigener Fortschritt |
| `notifications.send` | Ankündigungen/Push senden | ✔ global | P (eigene Org) | ✔ zugewiesene Cohorts | ✖ |
| `audit.read` | Audit-Logs lesen | ✔ global | ✖ | ✖ | ✖ |
| `settings.manage` | Plattformeinstellungen | ✔ global | ✖ | ✖ | ✖ |

Harte Grenzen, die **keine** Capability und **kein** `permissions`-Eintrag aushebeln kann:

- Reflexionstexte: Org-Admin nie; Trainer nur bei `visibility = 'trainer'`.
- Teilnehmerdaten untereinander: nie.
- Organisationsgrenze: Capabilities wirken maximal innerhalb der eigenen Organisation (Ausnahme: Super Admin).
- Audit-Logs: für niemanden änderbar.

---

## 4. Speichermodell

### 4.1 Wo Rollen liegen

| Information | Tabelle/Spalte |
|---|---|
| Super Admin | `profiles.is_super_admin` (boolean) – global, unabhängig von Organisationen |
| Organisationsrolle | `organization_memberships.role` (`org_admin` \| `trainer` \| `participant`), `UNIQUE(profile_id, organization_id)` |
| Feingranulare Org-Admin-Rechte | `organization_memberships.permissions` (JSONB) |
| Trainer-Zuweisung je Gruppe | `cohort_trainers (cohort_id, profile_id)` |
| Teilnehmer-Zugehörigkeit je Gruppe | `cohort_members (cohort_id, profile_id, status)` |

Eine Person kann in mehreren Organisationen Mitglied sein, mit jeweils eigener Rolle. Die Rolle `trainer` in `organization_memberships` allein genügt nicht für Datenzugriff – wirksam wird sie erst über Einträge in `cohort_trainers`. Deaktivierte Mitgliedschaften (`status`) heben alle Rechte der Rolle auf.

### 4.2 `permissions` (JSONB) – feingranulare Org-Admin-Rechte

Jede Rolle hat einen festen **Basisumfang** (Tabelle in Abschnitt 3). Für Org-Admins kann der Super Admin einzelne Capabilities zusätzlich gewähren oder entziehen, z. B.:

```json
{ "content.edit": true, "notifications.send": true, "users.manage": false }
```

Regeln:

- Nur Schlüssel aus dem Capability-Katalog sind zulässig (Zod-validiert in `packages/validation`).
- Gewährungen wirken ausschließlich innerhalb der eigenen Organisation.
- Die harten Grenzen aus Abschnitt 3 sind nicht gewährbar (insbesondere kein Zugriff auf Reflexionstexte, keine `audit.read`, keine `settings.manage`, keine organisationsübergreifenden Rechte).
- Nicht gesetzte Schlüssel → Basisumfang der Rolle gilt.

---

## 5. Zentrale Berechtigungsschicht in `packages/domain`

Statt verstreuter `if (role === 'org_admin')`-Abfragen gibt es **eine** reine, vollständig getestete Funktion, die überall verwendet wird (Admin-UI, Mobile-App, Edge Functions):

```ts
// packages/domain/src/rbac.ts

export type Capability =
  | 'organizations.read' | 'organizations.manage'
  | 'users.read' | 'users.invite' | 'users.manage'
  | 'cohorts.read' | 'cohorts.manage'
  | 'content.read' | 'content.edit' | 'content.publish'
  | 'submissions.read' | 'submissions.feedback'
  | 'analytics.read'
  | 'notifications.send'
  | 'audit.read'
  | 'settings.manage';

export interface Actor {
  profileId: string;
  isSuperAdmin: boolean;
  memberships: ReadonlyArray<{
    organizationId: string;
    role: 'org_admin' | 'trainer' | 'participant';
    permissions: Partial<Record<Capability, boolean>>;
    status: 'active' | 'inactive';
  }>;
  trainerCohortIds: ReadonlyArray<string>; // aus cohort_trainers
  memberCohortIds: ReadonlyArray<string>;  // aus cohort_members
}

export interface Scope {
  organizationId?: string;
  cohortId?: string;
  /** Eigentümer der Ressource, z. B. bei Einreichungen/Reflexionen */
  ownerProfileId?: string;
  /** Sichtbarkeit der konkreten Ressource auf Datensatzebene */
  visibility?: 'private' | 'trainer';
}

/** Reine Funktion, keine Seiteneffekte, kein DB-Zugriff. */
export function can(actor: Actor, capability: Capability, scope: Scope): boolean;
```

Eigenschaften:

- **Rein und deterministisch:** keine Datenbankzugriffe, dadurch vollständig unit-testbar (Testfälle für jeden Sonderfall aus Abschnitt 7 sind Pflicht).
- **Eine Wahrheit:** Rolle→Capability-Mapping und `permissions`-Auswertung existieren genau einmal. UI-Sichtbarkeit, Edge-Function-Prüfungen und die RLS-Policies (siehe 6) folgen derselben Logik.
- **Scope-bewusst:** dieselbe Capability kann je nach Geltungsbereich unterschiedlich ausfallen – `submissions.read` ist für einen Trainer in Cohort A wahr, in Cohort B falsch, bei `visibility = 'private'` immer falsch (außer Eigentümer).

---

## 6. Durchsetzungsebenen (Defense in Depth)

Rechte werden auf drei Ebenen geprüft. Jede Ebene muss für sich allein standhalten.

| Ebene | Aufgabe | Charakter |
|---|---|---|
| **1. Row Level Security (Postgres)** | Letzte Verteidigungslinie direkt an den Daten. Pflicht auf allen Client-Tabellen. Nutzt SECURITY-DEFINER-Hilfsfunktionen im Schema `app`: `app.is_super_admin()`, `app.org_role(org_id)`, `app.is_cohort_trainer(cohort_id)`, `app.is_cohort_member(cohort_id)`. | Auch ein fehlerhafter oder manipulierter Client kommt nicht an fremde Daten. |
| **2. Edge Functions (Deno, Service Role)** | Alle privilegierten Operationen: Einladungen erzeugen, Nutzer deaktivieren, Organisationen verwalten, Push-Versand, Audit-relevante Aktionen. Jede Function prüft die Berechtigung serverseitig über `can()` aus `packages/domain`, bevor die Service Role eingesetzt wird. Der Service-Role-Key existiert ausschließlich hier. | Umgeht RLS bewusst – deshalb zwingend eigene Rechteprüfung vor jedem Schreibzugriff. |
| **3. UI (Mobile & Admin)** | Blendet Aktionen aus, die `can()` verneint. | **Nur UX**, niemals Sicherheitsmechanismus. Eine ausgeblendete Schaltfläche ist kein Schutz. |

Grundsatz: Die UI darf großzügig ausblenden, die Edge Functions müssen streng prüfen, und RLS muss auch dann korrekt verweigern, wenn beide vorherigen Ebenen versagen.

---

## 7. Sonderfälle (nicht verhandelbar)

1. **Reflexionen (`reflection_entries`):** Sichtbarkeit liegt **auf Datensatzebene** (`visibility = 'private' | 'trainer'`), Standard ist privat. Der Org-Admin sieht Reflexionstexte **nie** – es gibt dafür keine gewährbare Capability und keine RLS-Policy, die es erlauben würde. In Auswertungen erscheinen höchstens Zählwerte („3 von 5 Reflexionen bearbeitet“), nie Inhalte.
2. **Teilnehmer untereinander:** Ein Teilnehmer sieht **nie** Einreichungen, Reflexionen, Quiz-Antworten, Maßnahmenpläne oder Fortschritt anderer Teilnehmer. Alle RLS-Policies auf Lern-Entitäten filtern auf `profile_id = auth.uid()` (bzw. Trainer-/Admin-Pfade gemäß diesem Dokument).
3. **Trainer-Sichtbarkeit:** Trainer sehen ausschließlich Datensätze mit `visibility = 'trainer'` (bzw. `share_with_trainer = true` bei Maßnahmenplänen) und ausschließlich in zugewiesenen Cohorts. Beide Bedingungen werden in denselben RLS-Policies geprüft – eine allein genügt nicht.
4. **Audit-Logs:** INSERT-only. Kein UPDATE, kein DELETE – auch nicht für den Super Admin. Lesbar nur mit `audit.read` (Super Admin).
5. **Einladungen:** Es existieren keine Klartext-Anfangspasswörter. `invitations` speichert nur `token_hash`, `expires_at`, `accepted_at`, `revoked_at`; der Einmallink wird per Edge Function erzeugt und versandt.
6. **Dateien (`learning_assets`):** Privater Storage, Zugriff nur über Signed URLs, Pfadschema `organizations/{orgId}/...`; die Signatur-Erzeugung prüft dieselben Regeln wie die zugehörige Tabelle.

---

## 8. Erweiterbarkeit: kundenspezifische Rollen

Das Modell ist bewusst zweistufig – **Rollen sind nur benannte Bündel von Capabilities**:

- Neue Rollen (z. B. „Bereichsleiter mit reinem Lesezugriff auf Auswertungen“) entstehen durch einen neuen Eintrag im zentralen Rolle→Capability-Mapping in `packages/domain` plus eine Migration, die den `role`-Wertebereich in `organization_memberships` erweitert. Aufrufstellen ändern sich nicht, weil überall nur `can()` gefragt wird – nirgendwo Rollennamen.
- Kleinere Abweichungen brauchen gar keine neue Rolle: `permissions` (JSONB) passt den Basisumfang pro Person an.
- Der Capability-Katalog selbst bleibt stabil und wächst nur, wenn tatsächlich neue Funktionsbereiche entstehen. RLS-Policies referenzieren Rollen ausschließlich über die `app.*`-Hilfsfunktionen, sodass neue Rollen dort an genau einer Stelle nachgezogen werden.
- Die harten Grenzen aus Abschnitt 3 und die Sonderfälle aus Abschnitt 7 gelten für jede zukünftige Rolle unverändert.

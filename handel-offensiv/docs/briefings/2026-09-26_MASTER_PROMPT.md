# MASTER-PROMPT – AIGNER OFFENSIV / HANDEL OFFENSIV (September 2026)
Website + Teilnehmerplattform + Administration

Rollen des Umsetzenden: Senior Product Architect, UX/UI Designer, Full-Stack-Engineer, Security Engineer, Learning-Experience-Designer, QA Engineer.

Gesamtsystem von AIGNER OFFENSIV mit Kernprodukt HANDEL OFFENSIV – Der Führungsführerschein für den Handel.
Claim: HANDEL IST MANNSCHAFTSSPORT. FÜHRUNG ENTSCHEIDET DAS SPIEL.

Drei Bereiche: (1) Öffentliche Premium-Website zur Kundengewinnung, (2) geschützter HANDEL OFFENSIV CAMPUS für Teilnehmer, (3) geschütztes Admin-/Trainer-Cockpit. Später native iOS/Android-App auf derselben Basis.
Die fünf Offensivtage bleiben Präsenz. Der Campus ersetzt Präsenz NICHT; er übernimmt die Zeit dazwischen: VORBEREITEN → PRÄSENZ ERLEBEN → VERTIEFEN → UMSETZEN → REFLEKTIEREN → AUF DEN NÄCHSTEN OFFENSIVTAG VORBEREITEN. Versprechen: „Fünf Offensivtage. Dazwischen bleibt Führung in Bewegung."

## §1 Zuerst Bestand analysieren
Nicht sofort programmieren. Untersuchen: Repository, Stack, Produktionsdeployment, Domains, bestehende Website, Datenbank, Auth, APIs, Bilder, Logos, Schriften, Videos, Texte, SEO-Struktur, bestehende URLs, Formulare, Impressum, Datenschutz, Analytics, Hosting, Environment Variables, vorhandene Komponenten. Live-Website https://www.aigner-offensiv.de prüfen; Repo vs Live vergleichen; Unterschiede dokumentieren. Nichts blind ersetzen. Bestehende Inhalte und SEO-URLs sichern. Danach erstellen: ARCHITECTURE.md, CURRENT_STATE.md, IMPLEMENTATION_PLAN.md, DATA_MODEL.md, RBAC.md, SECURITY.md. Erst danach implementieren.

## §2 Gesamtkonzept
Aus Nutzersicht EINE Marke. Öffentlich: www.aigner-offensiv.de. Campus bevorzugt campus.aigner-offensiv.de. Admin bevorzugt admin.aigner-offensiv.de (alternativ Unterpfade, wenn für Stack sinnvoller). Dasselbe Designsystem für alle drei Bereiche. Nicht „Agentur A + Moodle + SaaS-Dashboard".

## §3 Produktarchitektur
Website gewinnt Unternehmen/Entscheider; Campus entwickelt Teilnehmer; Admin steuert Unternehmen, Gruppen, Termine, Inhalte.
Datenmodell: AIGNER OFFENSIV → UNTERNEHMEN → TEILNEHMERGRUPPE → PROGRAMM → 5 OFFENSIVTAGE → LERNPHASEN → LEKTIONEN → AUFGABEN/REFLEXION/TRANSFER → 90-TAGE-OFFENSIVPLAN.
Beispiel: Aigner Offensiv → Muster Handelsgruppe GmbH → Marktleiter Süd 2027 → Handel Offensiv → Offensivtag 1–5.

## §4 Öffentliche Website
Hauptpositionierung HANDEL OFFENSIV – Der Führungsführerschein für den Handel. Hauptclaim wie oben. Weitere Botschaften: AUS MITARBEITERN WIRD MANNSCHAFT. / FÜHRUNG AUF DER FLÄCHE. WIRKUNG IN DEN ZAHLEN. / AUS WISSEN KÖNNEN MACHEN. / 100 PROZENT PRÄSENZ.
Fußballbezug wesentlich, nicht kitschig (Mannschaft, Trainer, Kapitän, Aufstellung, Spielsystem, Vorbereitung, Spielfeld, Druckphase, Spielintelligenz, Umsetzung, Ergebnis). Keine Sportwettenoptik, keine beliebigen Stadionbilder, keine Fußball-Stockfotos wenn authentisches Material vorhanden. Authentische Bilder von Rainer Aigner priorisieren.

## §5 Navigation Website
HANDEL OFFENSIV · DIE 5 OFFENSIVTAGE · FÜR UNTERNEHMEN · RAINER AIGNER · IMPULSE · KONTAKT. Rechts deutlich: TEILNEHMER-LOGIN → campus.aigner-offensiv.de (nicht mit Verkaufs-CTA verwechseln). Primärer CTA: OFFENSIVTAG ANFRAGEN. Sekundär: DIE 5 OFFENSIVTAGE ENTDECKEN.

## §6 Campus
Name vorläufig HANDEL OFFENSIV CAMPUS, Unterzeile DER DIGITALE MANNSCHAFTSRAUM (alt.: DEIN BEGLEITER ZWISCHEN DEN OFFENSIVTAGEN). Nur eingeladene Teilnehmer, keine Selbstregistrierung, persönlicher Zugang von Aigner Offensiv.

## §7 Login
Hochwertige Login-Seite; links/oben Markenbotschaft + Satz „Der Campus begleitet Sie zwischen den Offensivtagen bei Vorbereitung, Umsetzung und persönlicher Weiterentwicklung." Felder E-Mail/Passwort; Einloggen; Passwort vergessen; KEINE Registrierung; Links Datenschutz/Impressum/Support. Passwörter nie für Admins lesbar. Einladungssystem: Admin legt Teilnehmer an → persönliche Einladung → zeitlich begrenzter Link → Teilnehmer setzt Passwort → Login.

## §8 Startseite Teilnehmer = HEUTE-Seite
Nicht Kursbibliothek. Beantwortet „Was muss ich jetzt tun?": Begrüßung; Programm + Gruppe; NÄCHSTER OFFENSIVTAG (Nr, Titel, Datum, Uhrzeit, Ort, Countdown); DEINE NÄCHSTE AUFGABE (Titel, Frage, Button JETZT BEARBEITEN); DEIN FORTSCHRITT (x von 5, %); MEIN OFFENSIVPLAN (n aktive Maßnahmen, Button); NEUE NACHRICHT (Trainer-Zitat).

## §9 Campus-Navigation
Desktop: HEUTE · MEIN PROGRAMM · OFFENSIVPLAN · TERMINE · MATERIAL · PROFIL. Mobile: HEUTE · PROGRAMM · OFFENSIVPLAN · TERMINE · PROFIL (Material in Module integriert; max. 5 primäre Elemente mobil).

## §10 Die fünf Offensivtage (Standardprogramm)
01 FÜHRUNG BEGINNT BEI MIR – Vom Fachspezialisten zum Mannschaftsführer.
02 AUS MITARBEITERN WIRD MANNSCHAFT – Motivation, Bindung und Verlässlichkeit.
03 DIE RICHTIGE AUFSTELLUNG – Personalmanagement und Mitarbeiterentwicklung.
04 SPIELINTELLIGENZ MIT KI – Informationen schneller verarbeiten und wirksam umsetzen.
05 FÜHREN, WENN ES DARAUF ANKOMMT – Unter Druck entscheiden, Probleme lösen und Umsatz aktivieren.
Technisch NICHT auf fünf Module festprogrammieren; beliebig viele Module.

## §11 Lernlogik – vier Phasen je Offensivtag
1 VORBEREITUNG (z. B. 5-Min-Video, Reflexionsfrage, Selbsteinschätzung 1–10, Arbeitsblatt-Download) · 2 PRÄSENZTAG (Termin, Ort, Agenda, Unterlagen, persönliche Notizen) · 3 TRANSFER (Praxisaufgabe + Nachfragen: Was ist passiert? Was hat funktioniert? Was anders?) · 4 VORBEREITUNG NÄCHSTER OFFENSIVTAG (kurzes Video, Checkliste, Beobachtungsauftrag, Fragebogen).

## §12 Content-Typen (mindestens)
TEXT, VIDEO, AUDIO, PDF, BILD, DOWNLOAD, CHECKLISTE, REFLEXIONSFRAGE, SINGLE CHOICE, MULTIPLE CHOICE, SKALA 1–10, QUIZ, PRAXISAUFGABE, TRANSFERAUFGABE, DATEIUPLOAD, OPTIONALER FOTOUPLOAD, EXTERNER LINK, ANKÜNDIGUNG. Ohne Programmierung erstellbar.

## §13 Video
Zentral; Videokarte mit echtem Bild von Rainer, Titel, Dauer; danach klare Aktion (WEITER ZUR REFLEXION). Kein Autoplay. Videoanbieter abstrahieren. Untertitel vorsehen.

## §14 Persönlicher Offensivplan
Nach jedem Modul: MEINE WICHTIGSTE ERKENNTNIS · MEIN NÄCHSTER SCHRITT · MIT WEM? · BIS WANN? (Datum) · WORAN ERKENNE ICH ERFOLG? · STATUS (geplant/begonnen/umgesetzt/reflektiert). Über fünf Module → FÜHRUNGS-OFFENSIVPLAN; nach Modul 5 → MEIN 90-TAGE-OFFENSIVPLAN, später als hochwertiges PDF exportierbar.

## §15 Fortschritt
Nicht kindlich gamifizieren; keine Punkte, Leaderboards, Ranglisten. Anzeige je Modul % bzw. Zustand; Gesamt-%. Begriffe: ABGESCHLOSSEN, AKTUELL, VORBEREITUNG, NOCH GESPERRT.

## §16 Freischaltung
Sofort · ab Datum · ab Uhrzeit · X Tage vor Offensivtag · X Tage nach Offensivtag · nach Abschluss Lektion · nach Abschluss Modul · manuell · nur für Gruppe · nur für einzelne Teilnehmer. Teilnehmer sieht vorher „Wird am … freigeschaltet."

## §17 Termine
Datum, Zeit, Ort, Adresse, Raum, Trainer, Modul, Hinweise; Button ZUM KALENDER HINZUFÜGEN (ICS). Demo-Daten IMMER aus 2027 (keine 2024/2025/2026).

## §18 Benachrichtigungen
Web-Plattform vorbereiten; native Push später. Beispiele: Lernimpuls verfügbar; Noch 7 Tage bis Offensivtag 3; Praxisaufgabe offen; neues Trainerfeedback; Rainer hat Nachricht für Gruppe. Keine Spam-Mechanik.

## §19 Reflexion & Privatsphäre
Jede Reflexion: PRIVAT (nur Teilnehmer) oder TRAINERFREIGABE. Private Reflexionen NIE automatisch Unternehmensadmins zeigen; Unternehmensadmins lesen keine Führungstagebücher.

## §20 Trainerrolle
Sieht: eigene Gruppen, Teilnehmer, Fortschritt, offene Transferaufgaben, freigegebene Reflexionen, eingereichte Aufgaben, nächste Termine. Kann: Feedback, Aufgaben kommentieren, Gruppennachricht, Inhalte freischalten, Teilnehmerstatus. Kann nicht: andere Unternehmen sehen, Systemrechte ändern, andere Trainer administrieren, globale Einstellungen.

## §21 Admin-Cockpit Navigation
ÜBERSICHT · UNTERNEHMEN · GRUPPEN · TEILNEHMER · PROGRAMME · INHALTE · TERMINE · NACHRICHTEN · AUSWERTUNG · SYSTEM (BENUTZER & ROLLEN, AUDIT LOG, EINSTELLUNGEN). Extrem einfach bedienbar.

## §22 Admin Dashboard
Aktive Unternehmen, Gruppen, Teilnehmer; nächste Offensivtage; offene Einladungen; aktuelle Lernphasen; überfällige Aufgaben; zuletzt veröffentlichte Inhalte. Keine Vanity Metrics.

## §23 Unternehmen
Name, Logo, Ansprechpartner, E-Mail, Telefon, Status, interne Notiz, Gruppen, Trainer, Programme.

## §24 Gruppen
z. B. „Marktleiter Süd – Frühjahr 2027", Programm, Trainer, Beginn 12.03.2027, Ende 17.09.2027, 18 Teilnehmer. Jede Gruppe eigene fünf Termine.

## §25 Teilnehmerverwaltung
Einzeln anlegen, CSV-Import (Vorschau, Fehlerprüfung, Duplikaterkennung, Bestätigung), Einladung senden/erneut senden, Gruppe ändern, deaktivieren/reaktivieren, Zugang widerrufen, Fortschritt ansehen. Filter: Firma, Gruppe, Programm, Status, Einladungsstatus.

## §26 Rollen
SUPER ADMIN, TRAINER, ORGANISATIONSADMIN, TEILNEHMER. Zentrale Permission-Schicht statt if role===trainer: organizations.read/manage, participants.read/manage, content.read/edit/publish, cohorts.read/manage, submissions.read/feedback, analytics.read, notifications.send, audit.read, settings.manage.

## §27 Mandantenfähigkeit
Von Anfang an; Teilnehmer A sieht nie Daten von Unternehmen B; auf DB-Ebene abgesichert, nicht nur UI.

## §28 Stack (wenn nichts Besseres im Bestand)
Website/Campus/Admin: Next.js, TypeScript, React; Tailwind; shadcn/ui angepasst; Backend Supabase (PostgreSQL, Auth, RLS, Storage, Edge Functions); Zod; Playwright; axe-core; später Expo/React Native/Expo Router. Gemeinsame Backend- und Domainmodelle für Website, Campus, Mobile.

## §29 Monorepo (falls sinnvoll)
apps/website, apps/campus, apps/admin, apps/mobile; packages/domain, types, validation, config, design-tokens; supabase/migrations, functions, seed.

## §30 Datenmodell (mindestens)
profiles, organizations, organization_memberships, roles, permissions, role_permissions, programs, modules, learning_phases, lessons, content_blocks, cohorts, cohort_members, sessions, enrollments, lesson_releases, lesson_progress, module_progress, assignments, assignment_submissions, reflections, action_plans, action_plan_items, quizzes, quiz_questions, quiz_options, quiz_attempts, trainer_feedback, announcements, notifications, invitations, learning_assets, user_consents, account_deletion_requests, audit_logs. Keine Allzweck-Tabelle.

## §31 RLS verpflichtend
Teilnehmer nur eigene Daten; Trainer nur zugewiesene Gruppen; Org-Admin nur eigene Firma; Super Admin über sichere Servermechanismen. Service Role nie im Browser oder in Mobile App.

## §32 Dateien
Lernmaterial privat; keine dauerhaft öffentlichen URLs; private Buckets; kurzlebige Signed URLs; Typ prüfen; Größe begrenzen; keine ausführbaren Dateien.

## §33 Auth
Keine Selbstregistrierung; E-Mail+Passwort; Passwort vergessen; Einladungsworkflow; abgelaufene Einladung; Account deaktivieren; Logout; alle Sessions beenden; MFA für Trainer/Admins vorbereiten.

## §34 Design
Eng an neue Handel-Offensiv-Website. Charakter: hochwertig, klar, erwachsen, sportlich, seriös, präzise, kraftvoll. Primär sehr dunkles Blau/Anthrazit; hochwertiges warmes Gold BZW. bestehende Markenakzentfarbe; Off-White; dezente Spielfeld-/Taktiklinien; große Modulnummern 01–05. Authentische Bilder Rainer als Trainer/Speaker. Teilnehmerbilder nur im Profil. Rainer = sichtbare Trainerpersönlichkeit (Hero, Video, Begrüßung, Impulse); Dennis Zepter o. a. nur als Teilnehmerprofil. Alle Demo-Screens/Termine aus 2027.

## §35 Kein Baukastenlook
Nicht wie Moodle, TalentLMS, Kajabi, generisches SaaS-Dashboard, generisches shadcn-Template, AI-Landingpage. Vermeiden: übermäßige Cards, zu viele Rahmen, Glassmorphism, Neongradients, riesige bunte Icons, übertriebene Schatten/Animationen. Zuerst eigenes Designsystem.

## §36 Responsive
Smartphone, Tablet, Laptop, Desktop; auf Smartphone fast appartig.

## §37 PWA prüfen
Home-Screen-Icon, Manifest, saubere Mobile-UX, Offline-Grundzustände – kein Ersatz für native App.

## §38 Offlineverhalten
Textinhalt lokal puffern; Antworten vor Datenverlust schützen; Autosave längerer Reflexionen; Status GESPEICHERT / WIRD GESPEICHERT / OFFLINE – WIRD SPÄTER SYNCHRONISIERT. Keine Antworten verlieren.

## §39 Datenschutz
Datenminimierung; keine Werbetracker; keine versteckte Mitarbeiterüberwachung; keine Rangliste/Vergleich; Fortschritt dient Entwicklung, nicht Kontrolle; Rechtstexte final qualifiziert prüfen.

## §40 Accountlöschung
Route /account-loeschen; Campus: PROFIL → DATENSCHUTZ & KONTO → ACCOUNTLÖSCHUNG ANFRAGEN.

## §41 Audit Log
Teilnehmer erstellt, Rolle geändert, Zugang deaktiviert, Inhalt veröffentlicht, Termin geändert, Trainer zugewiesen, Freischaltung geändert. Keine Passwörter/Tokens.

## §42 SEO
Nur öffentliche Website indexieren; Campus/Admin/Login noindex; keine Teilnehmerdaten indexierbar.

## §43 E-Mails
Einladung, Passwort zurücksetzen, Einladung erneut, neue Lernphase (optional), Löschanfrage. Markendesign. Keine Newsletter-Einwilligung mit Systemmails vermischen.

## §44 Tests (automatisiert)
Login; falsches Passwort; Reset; Einladung; abgelaufene Einladung; deaktivierter Teilnehmer; Mandantentrennung (A sieht B nicht; Unternehmen A sieht B nicht; Trainer nur eigene Gruppe); zeitgesteuerte Freischaltung; gesperrte Lektion; Lektion abschließen; Reflexion speichern; Aufgabe einreichen; Quiz abschließen; Offensivplan aktualisieren; Termin anzeigen; Admin erstellt Teilnehmer/Gruppe; Admin veröffentlicht Inhalt.

## §45 Security Review
Broken Access Control, IDOR, RLS-Bypass, Privilege Escalation, unsichere File-URLs, fehlende Servervalidierung, Sessionprobleme, offene Adminrouten, Secrets im Client, Injection, XSS, CSRF, Rate Limiting.

## §46 Demo-Daten
Nur erfundene Unternehmen. Dennis Zepter als Demo-Teilnehmer nur intern mit Freigabe; keine personenbezogenen Daten ohne Freigabe in öffentliches Repo/Production Seed. Beispieldaten 12.03.2027, 18.06.2027, 17.09.2027 – alles 2027.

## §47 Erster Implementierungsschritt = Vertical Slice
1 Admin legt Demo-Unternehmen an · 2 Gruppe · 3 Teilnehmer · 4 Einladung · 5 Passwort setzen · 6 Login · 7 Dashboard · 8 Modul 1 freigeschaltet · 9 Video/Text · 10 Reflexion · 11 Maßnahme im Offensivplan · 12 Trainer sieht freigegebene Aufgabe · 13 Feedback · 14 Teilnehmer sieht Feedback · 15 Fortschritt aktualisiert. Erst dann weitere Features.

## §48 Phasen
1 Bestandsanalyse, Architektur, Datenmodell, Rollen, RLS, Designsystem · 2 Auth, Unternehmen, Gruppen, Teilnehmer, Einladungen · 3 Programme, Module, Lektionen, Content Editor, Freischaltungen · 4 Teilnehmer-Dashboard, Programme, Lektionen, Fortschritt · 5 Reflexion, Transfer, Offensivplan, Trainerfeedback · 6 Termine, Nachrichten, E-Mail, Benachrichtigungen · 7 Security, Privacy, Accountlöschung, Audit Log · 8 Responsive QA, Playwright, Accessibility, Performance, Production Build · 9 Vorbereitung native App (Backend/Domainmodell wiederverwenden).

## §49 Git
Stand sichern; pro Phase Checkpoint; keine riesige unkontrollierte Änderung. Nach jedem Meilenstein: Typecheck, Lint, Tests, Production Build, Security-Tests, visuelle Prüfung Desktop + Mobile; Fehler beheben; dann nächster Meilenstein.

## §50 Abnahme (MVP fertig wenn …)
Website, Login, Einladungen, Reset, Mandantentrennung, Admin, Trainerrechte, Programme, Module, Inhalte, zeitliche Freischaltungen, Reflexion, Transfer, Offensivplan, Fortschritt, Termine, Mobile, Tests, Production Build, RLS getestet, Datenschutzlinks, Accountlöschung, keine kritischen Konsolenfehler, keine kaputten Links.

## §51–53 Ergebnis / Produktidee / Leitsatz
Teilnehmer: „Ich weiß sofort, was bis zum nächsten Offensivtag zu tun ist." Trainer: „Ich erkenne schnell, wo meine Mannschaft steht." Admin: „Ich kann alles selbst verwalten." Geschäftsführer: „Das ist ein systematisches Führungskräfteentwicklungsprogramm." Produkt = 5 Präsenztage + digitale Vor-/Nachbereitung + Transfer + Offensivplan + Trainerbegleitung + 90-Tage-Umsetzung. Leitsatz: „Baue den digitalen Mannschaftsraum von Handel Offensiv." Software dient der Methodik.

## §54 Vor dem Coding ausgeben, dann STOPP
A Analyse Bestand · B Zielarchitektur · C Datenmodell · D Rollen-/Rechtematrix · E Sitemap Website · F Sitemap Campus · G Sitemap Admin · H Vertical-Slice-Plan · I Migrationsstrategie · J Risiken · K offene Entscheidungen · L Implementierungsreihenfolge. Danach STOPP, nichts Großes umbauen, auf Freigabe warten.

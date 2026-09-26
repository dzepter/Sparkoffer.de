# Noch benötigte Zulieferungen und Entscheidungen des Auftraggebers

**Stand: 26.09.2026 (Version 2, Master-Prompt Website + Campus + Admin).**
Diese Liste sammelt alle Punkte, die bewusst **nicht erfunden** wurden (Master-Prompt §46, früheres Briefing §63) und vor dem jeweiligen Meilenstein geliefert bzw. entschieden werden müssen. Bis dahin arbeitet das System mit klar als **DEMO** gekennzeichneten Platzhaltern (alle Demo-Termine im Jahr 2027).

Legende: **[P0]** vor Phase 1 nötig · **[P2]** vor dem Vertical Slice · **[P5]** vor dem Website-Cutover · **[P9]** vor der nativen App

## 1. Entscheidungen (Freigabe des Plans, `IMPLEMENTATION_PLAN.md` Abschnitt 7)

- [ ] **[P0]** K‑1 Domainstrategie: alles unter `aigner-offensiv.de`, `handel-offensiv.de` leitet weiter (Empfehlung) – **Bestätigung**, da dies die Entscheidung vom September umkehrt
- [ ] **[P0]** K‑2 Website in Next.js mit Redaktion im Admin-Cockpit (Empfehlung) statt PHP-CMS
- [ ] **[P0]** K‑3 Campus als Next.js-Web-App (Empfehlung)
- [ ] **[P0]** K‑4 Systemmails über einen Transaktionsmail-Dienst (Empfehlung Resend, EU-Region) mit Versand-Subdomain `mail.aigner-offensiv.de` – gewünschte **Absenderadresse** (Vorschlag: `campus@aigner-offensiv.de`). Hintergrund: Ihr Mailsystem ist Microsoft 365 mit DMARC `p=reject`; ohne passende DNS-Einträge (SPF/DKIM) würden Einladungs- und Reset-Mails abgewiesen.
- [ ] **[P0]** K‑12 Eigenes privates Repository für die Plattform (Empfehlung) · K‑13 Admin liest über Nutzersitzung (Empfehlung) · K‑14 eigenes UI-Paket statt shadcn (Empfehlung)
- [ ] **[P0]** K‑5 Hosting Vercel (EU) – Bestätigung
- [ ] **[P0]** K‑7 Farbwelt Blau (Empfehlung) – Bestätigung; Gold nur, wenn ausdrücklich gewünscht
- [ ] **[P0]** K‑8 Alt-Inhalte (LEARN TO LEAD®, Vorträge, Blog) als Unterseiten behalten
- [ ] **[P0]** K‑9 Reihenfolge: Campus/Admin zuerst, Website-Cutover in Phase 5
- [ ] K‑6 Video-Ablage (Supabase Storage zuerst) · K‑10 Demo-Teilnehmer nur fiktiv · K‑11 Rechtekatalog im Code

## 2. Konten und Zugänge

- [ ] **[P0] Supabase-Konto** (Organisation „Aigner Offensiv"), Projekte Staging + Production, Region **EU/Frankfurt**; Auftragsverarbeitungsvertrag (AVV) mit Supabase abschließen
- [ ] **[P0] Vercel-Konto** (Team „Aigner Offensiv"), AVV; Team-Einladung für die Entwicklung
- [ ] **[P0] Strato-Zugang oder DNS-Änderungen durch den Kunden**: CNAME `campus.` und `admin.` → Vercel (sofort möglich); später `www`/Apex → Vercel; **MX unangetastet**
- [ ] **[P0] Resend-Konto** (oder gewählter Dienst) im Namen von Aigner Offensiv, EU-Region, AVV; DNS-Einträge für `mail.aigner-offensiv.de` bei Strato setzen (Werte liefern wir) – API-Schlüssel nur als Secret, nie im Repo
- [ ] **[P0] Hoster und FTP-Zugang von `handel-offensiv.de` klären** (Webspace liegt im IONOS/1&1-Adressraum, DNS bei Strato): Wer hat Zugang, welcher Vertrag?
- [ ] **[P0] Originale der echten Fotos** von der alten Website: Porträt (`10.png`), Rainer vor Gebäude (`vortrag-1-1.jpg`), Bühne (`vortrag-2.jpg`) – bisher nur grün eingefärbt vorhanden; sowie Zugang zum WordPress-Backend für ein Vollbackup
- [ ] **[P9] Apple Developer Account** (Organisation), Bundle Identifier bestätigen (Vorschlag `de.aigneroffensiv.handeloffensiv`)
- [ ] Wer erhält **Super-Admin-Zugänge**? (Namen + E-Mail-Adressen; MFA wird Pflicht)
- [ ] *(zurückgestellt)* Google-Play-Konto

## 3. Inhalte für die Website (Fragen aus dem Gesprächsleitfaden „50 Fragen")

- [ ] **[P5] Format in Zahlen**: Dauer eines Offensivtags, Abstand zwischen den Tagen, Gesamtdauer der Saison, Gruppengröße min/max
- [ ] **[P5] Termine 2027** (falls veröffentlicht) und Orte offener Gruppen
- [ ] **[P5] Preise**: nennen oder „auf Anfrage"; falls nennen: Beträge und Leistungsumfang
- [ ] **[P5] Referenzen**: Kundennamen/Logos mit schriftlicher Freigabe; Teilnehmerstimmen mit Name und Funktion
- [ ] **[P5] Belege**: „16 Firmen", „1.000 Arbeitsplätze", Bezeichnung der Trainer-Zertifizierung
- [ ] **[P5] Fotos**: Rainer Aigner in Aktion (Seminar, Bühne), Trainingssituationen, hochauflösend; besseres Buchcover „Lust auf Erfolg" (fehlt seit August)
- [ ] **[P5] Video** (optional): 60–90 Sekunden Programm-Erklärung durch Rainer
- [ ] **[P5] Freigabe der fünf Blogartikel (2020)** zur Wiederveröffentlichung als „Impulse" (ggf. Überarbeitung)
- [ ] Antwortversprechen für Anfragen (z. B. „binnen 24 Stunden") und ggf. eigene Anfrage-Adresse
- [ ] **[P5] Freigaben für Namen auf der bestehenden Website**: Testimonials mit Klarnamen/Firmen und das Zitat mit Firmenname – liegen schriftliche Einwilligungen vor? Sonst entfernen.

## 4. Inhalte für den Campus

- [ ] **[P2] Demo-Lektion Modul 1** mit einem echten kurzen Video oder Text von Rainer (sonst DEMO-Text)
- [ ] Echte Lerninhalte der fünf Module (Texte, Aufgaben, Reflexionsfragen, Checklisten, Quizfragen) – Demo-Inhalte bleiben als [DEMO] markiert
- [ ] Videos/Audios (Dateien) und Arbeitsblätter/PDFs
- [ ] Begrüßungstexte und Beispiel-Trainernachrichten von Rainer (Wortlaut)
- [ ] Bestehensgrenzen/Versuchsanzahl für Quizze; Standard-Freischaltlogik (Vorschlag: Vorbereitung 7 Tage vor, Transfer 1 Tag nach dem Offensivtag)
- [ ] Dürfen Organisationsadmins einzelner Kunden zusätzliche Rechte erhalten? (Standard: nur Aggregate)

## 5. Rechtliches (Prüfung durch Anwalt/Datenschutzberatung)

- [ ] **[P5] Impressum**: korrekte Firmierung/Rechtsform zum Handelsregistereintrag HRB 152556 (derzeit „Viola & Rainer Aigner" ohne Rechtsform)
- [ ] **[P5] Datenschutzerklärung Website** (Vercel, Supabase, Kontaktformular, keine Cookies) und **Campus/App** (technischer Entwurf: `PRIVACY_TECHNICAL.md`)
- [ ] Einwilligungstexte (Datenschutz beim ersten Login, optionale E-Mail-Benachrichtigungen, Fotoupload)
- [ ] Unterauftragnehmerliste bestätigen (Supabase, Vercel, ggf. Video-Anbieter, Expo Push später)
- [ ] Aufbewahrungs-/Löschfristen je Datenart; Verzeichnis der Verarbeitungstätigkeiten
- [ ] Markenstatus „Führungsführerschein" und ®-Kennzeichnung LEARN TO LEAD®

## 6. Marke & Store (Phase 9)

- [ ] Finale App-Bezeichnung, App-Icon (1024×1024), Splash-Motiv, Store-Texte, Screenshot-Freigabe

## 7. Support

- [ ] Support-Kontaktweg für Teilnehmer bestätigen (aktuell `info@aigner-offensiv.de`), FAQ-Inhalte

## Bereits geklärt (durch Master-Prompt September 2026)

- Zielbild: Website + Web-Campus + Admin auf einer Basis, native App später
- Domains: `www.` / `campus.` / `admin.aigner-offensiv.de` gewünscht
- Demo-Daten ausschließlich 2027; Beispielfirma „Muster Handelsgruppe GmbH"; Rainer als Trainerpersönlichkeit, Teilnehmerfotos nur im Profil
- Keine Gamification, keine Ranglisten, keine Werbetracker; Reflexionen privat/Trainerfreigabe; Org-Admins ohne Einsicht in persönliche Inhalte

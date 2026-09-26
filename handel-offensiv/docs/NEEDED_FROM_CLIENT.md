# Noch benötigte Zulieferungen und Entscheidungen des Auftraggebers

**Stand: 26.09.2026 (Version 2.1 – nach Freigabe des Plans und Abschluss von Phase 1).**
Diese Liste sammelt alle Punkte, die bewusst **nicht erfunden** wurden (Master-Prompt §46, früheres Briefing §63) und vor dem jeweiligen Meilenstein geliefert bzw. entschieden werden müssen. Bis dahin arbeitet das System mit klar als **DEMO** gekennzeichneten Platzhaltern (alle Demo-Termine im Jahr 2027).

Legende: **[P0]** vor Phase 1 nötig · **[P2]** vor dem Vertical Slice · **[P5]** vor dem Website-Cutover · **[P9]** vor der nativen App

## 1. Entscheidungen (Freigabe des Plans, `IMPLEMENTATION_PLAN.md` Abschnitt 7)

- [x] **[P0]** K‑1 Domainstrategie: **freigegeben** (26.09.2026) – alles unter `aigner-offensiv.de`; `handel-offensiv.de` bleibt registriert und leitet später permanent weiter; keine Domain wird aufgegeben
- [x] **[P0]** K‑2 Website in Next.js mit Redaktion im Admin-Cockpit – **freigegeben** (Zustände draft/preview/published/archived, Migration 0005)
- [x] **[P0]** K‑3 Campus als Next.js-Web-App – **freigegeben**
- [x] **[P0]** K‑4 Resend über `mail.aigner-offensiv.de` – **freigegeben**; Absender `Aigner Offensiv Campus <campus@mail.aigner-offensiv.de>`. **Noch zu liefern:** welches M365-Postfach als Reply-To dienen soll (Vorschlag `info@aigner-offensiv.de`), Resend-Konto + DNS-Einträge (`EMAIL_DNS_PLAN.md`), danach echter Zustelltest.
- [x] **[P0]** K‑12 privates Repository – **freigegeben**; **noch zu liefern:** das private GitHub-Repository anlegen und Zugriff erteilen (Umzug erfolgt dann ohne Historienverlust). K‑13/K‑14 freigegeben.
- [x] **[P0]** K‑5 Vercel – **freigegeben mit Auflage** Frankfurt/`fra1` und Supabase `eu-central-1` (`REGIONS_AND_DATA_FLOWS.md`)
- [x] **[P0]** K‑7 Farbwelt: **entschieden** – Navy Hauptfarbe, Off-White, Gold/Ocker sehr sparsam (Freigabe 26.09.2026); Feinabstimmung nach Sichtvergleich
- [x] **[P0]** K‑8 Alt-Inhalte – **freigegeben mit Auflage**: nur nachgeordnet, Startseite/Navigation vollständig Handel Offensiv, Redundantes nicht mitnehmen, 301 für entfernte URLs
- [x] **[P0]** K‑9 Reihenfolge – **freigegeben**: Sicherheit → Infrastruktur → E‑Mail → Vertical Slice → Web-Campus → Admin → Website → Kommunikation → QA → native App
- [x] K‑6 Video (Supabase Storage + `VideoProvider`-Abstraktion) · K‑10 Demo nur fiktiv, Termine 2027 · K‑11 Rechtekatalog im Code – **freigegeben**

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

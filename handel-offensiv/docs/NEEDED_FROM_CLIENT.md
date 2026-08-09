# Noch benötigte Zulieferungen des Auftraggebers

Diese Liste sammelt alle Punkte, die bewusst NICHT erfunden wurden (Briefing §63)
und vor dem Produktivstart von Aigner Offensiv geliefert bzw. entschieden werden
müssen. Bis dahin arbeitet das System mit klar markierten DEMO-/Platzhalterwerten.

## Marke & Store-Auftritt

- [ ] **Finale App-Bezeichnung** für App Store (Arbeitstitel: „Handel Offensiv")
- [ ] **App Icon** (1024×1024 px, ohne Transparenz) und Splash-Motiv
- [ ] **Apple Developer Account** (Organisation) – Zugang bzw. Team-Einladung
- [ ] Bundle Identifier bestätigen (Vorschlag: `de.aigneroffensiv.handeloffensiv`)
- [ ] App-Store-Texte: Kurzbeschreibung, Beschreibung, Keywords, Support-URL
- [ ] Screenshots-Freigabe (werden aus der fertigen App erzeugt)
- [ ] *(zurückgestellt)* Google-Play-Konto und Android-Assets

## Betrieb & Infrastruktur

- [ ] **Supabase-Projekte** anlegen (Staging + Production, Region EU/Frankfurt)
      und AVV (Auftragsverarbeitungsvertrag) mit Supabase abschließen
- [ ] **E-Mail-Versand**: gewünschter Anbieter (z. B. eigener SMTP, Resend, Postmark)
      + Absenderadresse (Vorschlag: keine noreply-Adresse, sondern z. B.
      mannschaftsraum@aigner-offensiv.de)
- [ ] **Hosting Admin-Cockpit**: Vercel-Konto oder Alternative; gewünschte Domain
      (Vorschlag: `admin.aigner-offensiv.de`)
- [ ] Wer erhält Super-Admin-Zugänge? (Namen + E-Mail-Adressen)

## Inhalte

- [ ] Echte Lerninhalte der fünf Module (Texte, Aufgaben, Reflexionsfragen,
      Checklisten, Quizfragen) – Demo-Inhalte sind als [DEMO] markiert
- [ ] Videos/Audios: Wo liegen sie bzw. welcher Video-Anbieter ist gewünscht?
- [ ] Arbeitsblätter/PDFs für die Downloads
- [ ] Authentische Fotos (Rainer Aigner, Seminare) für App-Startbereiche

## Fachliche Entscheidungen

- [ ] Bestehensgrenzen und Versuchsanzahl für Quizze
- [ ] Standard-Freischaltlogik je Modul (Vorschlag im Seed: Modul freischalten
      X Tage nach dem Offensivtag)
- [ ] Dürfen Organisationsadmins einzelner Kunden zusätzliche Rechte erhalten?
      (Standard: nur Aggregate, keine persönlichen Inhalte)
- [ ] Aufbewahrungs-/Löschfristen je Datenart (mit Datenschutzberatung festlegen)

## Rechtliches (zur finalen Prüfung durch Anwalt/Datenschutzbeauftragte)

- [ ] Datenschutzerklärung für die App (technischer Entwurf: PRIVACY_TECHNICAL.md)
- [ ] Impressum/Anbieterkennzeichnung in der App bestätigen
- [ ] Einwilligungstexte (Datenschutz beim ersten Login, Push)
- [ ] Verzeichnis der Verarbeitungstätigkeiten ergänzen
- [ ] Unterauftragnehmer-Liste bestätigen (Supabase, E-Mail-Anbieter, Expo Push,
      Hosting)

## Support

- [ ] Support-Kontaktweg für Teilnehmer bestätigen (aktuell: info@aigner-offensiv.de)
- [ ] FAQ-Inhalte für den Hilfebereich

# App-Store-Checkliste (iOS)

Vor der Einreichung Punkt für Punkt abhaken. Aktuelle Apple-Vorgaben
immer gegen die offizielle Dokumentation prüfen (App Review Guidelines,
App Privacy Details, Privacy Manifest).

## Technik

- [ ] Bundle Identifier final (`de.aigneroffensiv.handeloffensiv` bestätigt)
- [ ] `buildNumber` erhöht, Version in `app.json` korrekt
- [ ] App-Icon 1024×1024 (ohne Alpha) + Icon-Set über Expo generiert
- [ ] Launch Screen/Splash geprüft (dunkler Markenauftritt, kein Flackern)
- [ ] Nur benötigte Berechtigungen im Info.plist:
      KEINE Kamera/Mikrofon/Standort/Kontakte;
      Foto-Bibliothek nur mit Begründungstext (optionaler Aufgaben-Nachweis)
- [ ] Privacy Manifest (PrivacyInfo.xcprivacy) enthalten, Required-Reason-APIs
      der verwendeten SDKs abgedeckt (Expo erzeugt Basis – prüfen)
- [ ] Aktuelles iOS-SDK-Minimum erfüllt (bei Einreichung erneut prüfen)
- [ ] Push getestet (echtes Gerät, TestFlight-Build)
- [ ] Deep Links (`handeloffensiv://…`) getestet
- [ ] Offline-Verhalten getestet (Flugmodus: Cache, Banner, Retry)
- [ ] Safe Areas auf kleinem (SE) und großem (Pro Max) iPhone geprüft
- [ ] Größere Schrift (Dynamic Type) und VoiceOver-Grundprüfung

## App Store Connect

- [ ] App-Name final (Zulieferung Auftraggeber)
- [ ] Untertitel/Beschreibung/Keywords (deutsch)
- [ ] Screenshots 6,7" und 6,1" (aus finaler App, mit [DEMO]-freien Inhalten)
- [ ] Support-URL: https://www.aigner-offensiv.de/kontakt.html
- [ ] Datenschutz-URL: App-Datenschutzerklärung (Zulieferung/PRIVACY_TECHNICAL.md)
- [ ] **Konto-Löschung**: Link https://www.aigner-offensiv.de/account-loeschen.html
      hinterlegt; Löschung ist zusätzlich in der App möglich (Apple-Pflicht
      bei Apps mit Kontoerstellung/-nutzung)
- [ ] App-Privacy-Angaben („Nutzungsdaten"-Fragebogen) wahrheitsgemäß:
      Kontaktinfo (Name, E-Mail) + Nutzerinhalte (Antworten) – verknüpft mit
      Identität, kein Tracking, keine Werbung
- [ ] Altersfreigabe 4+ (keine bedenklichen Inhalte)
- [ ] Preis: Kostenlos, KEINE In-App-Käufe (V1)
- [ ] Kategorie: Bildung oder Wirtschaft (Entscheidung Auftraggeber)

## Review-Vorbereitung

- [ ] Demo-Review-Account angelegt und funktionsfähig (RELEASE_GUIDE.md)
- [ ] Zugangsdaten in „App-Review-Informationen" eingetragen
- [ ] Erklärungstext: geschlossene B2B-Lernbegleitung, Zugang nur per Einladung
- [ ] Kontakt für Rückfragen des Review-Teams hinterlegt

## Nach Freigabe

- [ ] Gestaffelter Rollout aktivieren
- [ ] Crash-/Fehlerlage in den ersten Tagen beobachten
- [ ] Demo-Account aktiv lassen (für spätere Updates erforderlich)

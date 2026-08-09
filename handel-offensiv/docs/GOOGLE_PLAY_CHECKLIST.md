# Google-Play-Checkliste (Android)

> **Status: zurückgestellt.** Auf Wunsch des Auftraggebers wird zunächst nur
> iOS veröffentlicht. Die App-Codebasis ist identisch (Expo/React Native) –
> für den späteren Android-Start ist ausschließlich diese Checkliste
> abzuarbeiten, es ist keine neue Entwicklung nötig.

## Technik

- [ ] Eindeutiger Package Name (Vorschlag: `de.aigneroffensiv.handeloffensiv`)
- [ ] Aktuelle Target-API-Level-Anforderung von Google prüfen und in
      `app.json`/EAS-Build erfüllen (ändert sich jährlich!)
- [ ] Adaptive Icon (Vorder-/Hintergrund-Ebene) gestalten
- [ ] Splash geprüft
- [ ] Release-Signing über EAS (Play App Signing aktivieren)
- [ ] Berechtigungen minimal (wie iOS: keine Kamera/Standort/Kontakte;
      Foto-Zugriff nur über Photo Picker ohne Permission)
- [ ] Build als AAB: `eas build --platform android --profile production`

## Play Console

- [ ] Google-Play-Entwicklerkonto (Organisation) anlegen
- [ ] Store-Eintrag (Texte, Grafiken, Screenshots Telefon + 7"/10" falls Tablet)
- [ ] Datenschutzerklärung-URL + **Datensicherheits-Formular** wahrheitsgemäß
- [ ] **Konto-Löschung**: URL https://www.aigner-offensiv.de/account-loeschen.html
      im Formular „Datenlöschung" hinterlegen (Google-Pflicht)
- [ ] Inhaltseinstufung-Fragebogen (IARC)
- [ ] Zielgruppe: Erwachsene / berufliche Nutzung
- [ ] Internal Testing Track mit Demo-Review-Zugang
- [ ] Gestaffelter Produktions-Rollout

## Hinweise für später

- Push funktioniert über denselben Expo-Push-Dienst (FCM-Credentials
  einmalig über `eas credentials` hinterlegen).
- E2E-Smoke-Test auf kleinem und großem Android-Gerät (Briefing §56)
  vor dem ersten Release nachholen.

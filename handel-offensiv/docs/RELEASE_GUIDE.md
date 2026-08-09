# Release Guide (iOS-Fokus)

Android ist auf Kundenwunsch zurückgestellt; die Codebasis ist dieselbe,
nur die Play-Store-Einrichtung entfällt vorerst (siehe GOOGLE_PLAY_CHECKLIST.md).

> Vor jedem Release die aktuell geltenden Apple-Anforderungen (iOS-SDK-Minimum,
> Privacy Manifest, Review-Richtlinien) anhand der offiziellen Apple-Dokumentation
> erneut prüfen – Store-Vorgaben ändern sich regelmäßig (Briefing §43).

## Voraussetzungen (einmalig)

1. Apple Developer Program (Organisation) – Konto von Aigner Offensiv.
2. `npm i -g eas-cli` und `eas login` (Expo-Konto des Projekts).
3. `eas init` im Ordner `apps/mobile` verknüpft das Projekt;
   `eas credentials` erzeugt/verwaltet Signing-Zertifikate automatisch.
4. Bundle Identifier in `apps/mobile/app.json` final bestätigen.

## Build-Profile

`apps/mobile/eas.json` definiert:

- **development** – Dev-Client für Simulator/Gerät (internes Testen mit Staging).
- **preview** – interner Verteilungs-Build (Ad-hoc/TestFlight) gegen Staging.
- **production** – Store-Build gegen Production-Supabase.

## TestFlight-Release

```bash
cd apps/mobile
eas build --platform ios --profile preview      # Build in der Expo-Cloud
eas submit --platform ios --latest              # Upload zu App Store Connect
```

In App Store Connect: TestFlight → interne Tester (Team Aigner Offensiv)
hinzufügen. Neue Builds erhöhen `buildNumber` automatisch (EAS `autoIncrement`).

## App-Store-Einreichung

1. Checkliste `APP_STORE_CHECKLIST.md` vollständig abarbeiten
   (Icon, Screenshots, Datenschutz-Angaben, Demo-Review-Account!).
2. `eas build --platform ios --profile production`
3. `eas submit --platform ios --latest`
4. In App Store Connect: Version anlegen, Metadaten eintragen,
   App-Review-Hinweise mit Demo-Zugang ausfüllen (siehe unten), einreichen.

## Review-Demo-Account (Briefing §44)

Die App ist loginpflichtig – Apple braucht einen funktionierenden Testzugang:

- In der **Production**-Umgebung eine Organisation „Aigner Offensiv Demo"
  mit Gruppe „Handel Offensiv Demo 2026" anlegen (Admin-Cockpit),
  alle fünf Module mit [DEMO]-Inhalten freischalten, einen Termin,
  eine Beispielaufgabe, ein Quiz, Trainerfeedback und einen Offensivplan
  befüllen (Vorlage: `supabase/seed.sql`).
- Demo-Benutzer mit eigenem Passwort einladen (kein echtes Personendatum).
- Zugangsdaten in App Store Connect unter „App-Review-Informationen" hinterlegen.
- Hinweistext für das Review-Team (englisch) beilegen: App ist der geschlossene
  digitale Begleiter eines gebuchten Präsenztrainings; Registrierung erfolgt
  ausschließlich per Einladung durch den Anbieter; keine Käufe in der App.

## Admin-Cockpit-Release (Web)

- Deploy über Vercel (empfohlen): Projekt auf `handel-offensiv/apps/admin`
  zeigen lassen, pnpm-Monorepo wird erkannt; Env-Variablen je Environment setzen.
- Domain `admin.aigner-offensiv.de` per CNAME aufschalten.
- Produktions-Deploys nur aus `main` (Briefing §51) – Branch-Protection aktivieren.

## Versionierung & Freigabe

- SemVer im Monorepo-Root (`package.json`), App-Version in `app.json` gespiegelt.
- Ein Release = Git-Tag `handel-offensiv-vX.Y.Z` + kurzer Changelog-Eintrag.
- Datenbank zuerst migrieren (`supabase db push`), dann App-Rollout —
  Migrationen müssen rückwärtskompatibel zur noch verbreiteten App-Version sein.

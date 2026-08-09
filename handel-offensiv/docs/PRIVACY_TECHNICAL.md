# Technische Datenschutz-Dokumentation

> Dieses Dokument beschreibt die technische Umsetzung des Datenschutzes.
> Es ist KEINE Rechtsberatung. Die nutzerseitigen Rechtstexte
> (Datenschutzerklärung der App, Einwilligungstexte) sind vor
> Veröffentlichung anwaltlich bzw. durch Datenschutzbeauftragte zu prüfen.

## Grundprinzip: Datenminimierung

Die App erhebt nur, was für den Lernbegleiter nötig ist:

| Datum | Zweck | Rechtsgrundlage (Entwurf) |
|---|---|---|
| Name, E-Mail | Konto, Einladung, Anzeige im Trainerkontext | Vertrag (Art. 6 I b) |
| Passwort (nur Hash) | Anmeldung | Vertrag |
| Lernfortschritt (Lektionen/Aufgaben-Status) | Kernfunktion, Traineransicht | Vertrag |
| Reflexionen/Aufgabentexte | Kernfunktion; standardmäßig privat | Vertrag |
| Offensivplan | Kernfunktion; Teilen mit Trainer nur aktiv gewählt | Vertrag |
| Push-Token (gerätebezogen) | Benachrichtigungen | Einwilligung (Art. 6 I a) |
| Profilbild (optional) | Personalisierung | Einwilligung |
| Server-Logs | Betrieb/Sicherheit | Berechtigtes Interesse (Art. 6 I f) |

**Nicht erhoben:** Standort, Kontakte, Mikrofon, Gesundheitsdaten,
Werbe-IDs, Cross-App-Tracking. Keine Werbe-SDKs, keine Marketing-Tracker.

## Sichtbarkeit persönlicher Inhalte

- Reflexionen und Aufgabenantworten tragen die Sichtbarkeit **auf Datensatzebene**
  (`private` | `trainer`). Standard: privat.
- Trainer sehen ausschließlich Antworten mit `trainer`-Freigabe – erzwungen
  durch Row Level Security in der Datenbank, nicht nur im Frontend.
- Organisationsadmins (Kundenunternehmen) sehen **niemals** Reflexionstexte,
  nur aggregierte Fortschritte („x von y haben Modul abgeschlossen").
- Teilnehmer sehen niemals Antworten anderer Teilnehmer.
- Kein Leaderboard, kein minutengenaues Tracking, keine Geräteprofile (§26).

## Einwilligungen (`user_consents`)

Versioniert gespeichert: `privacy` (Pflicht beim ersten Login, Version des
Textes), `push` (optional), `analytics` (derzeit ungenutzt – reserviert).
Widerruf setzt `revoked_at`; Push-Widerruf deaktiviert zusätzlich die Tokens.

## Speicherorte & Übermittlungen

| Verarbeitung | Anbieter | Region | Vertrag |
|---|---|---|---|
| Datenbank, Auth, Storage, Functions | Supabase | EU (Frankfurt, zu bestätigen) | AVV erforderlich |
| Push-Zustellung | Expo Push / Apple APNs | USA möglich (Token + Nachrichtentext) | in Datenschutzerklärung ausweisen; Nachrichten enthalten keine sensiblen Inhalte, nur neutrale Hinweise + Deep Link |
| E-Mail-Versand | (Zulieferung Auftraggeber) | zu klären | AVV erforderlich |
| Admin-Hosting | (z. B. Vercel) | zu klären | AVV erforderlich |

Regel für Push-Texte: neutral formulieren („Ihr neuer Lernimpuls ist
verfügbar."), niemals Reflexions- oder Bewertungsinhalte in die Nachricht.

## Betroffenenrechte – technische Umsetzung

- **Auskunft/Export:** Profil → Datenschutz & Konto → Anfrage; Export wird
  durch Super Admin über Edge Function erzeugt (JSON der eigenen Datensätze).
- **Löschung:** In-App-Antrag (`account_deletion_requests`, mit erneuter
  Authentifizierung) oder öffentliche Seite
  `https://www.aigner-offensiv.de/account-loeschen.html`.
  Verarbeitung durch `process-deletion-request`-Function:
  - gelöscht: Auth-Konto, Profildaten, Avatar, Reflexionen, Aufgabenantworten,
    Offensivpläne, Push-Tokens, Benachrichtigungen
  - anonymisiert: Quiz-/Fortschrittsstatistiken (ohne Personenbezug)
  - befristet aufbewahrt: Daten mit gesetzlicher Aufbewahrungspflicht
    (Fristen mit Datenschutzberatung festlegen – NEEDED_FROM_CLIENT.md)
- **Berichtigung:** Profilfelder in der App; übrige Daten über Support.

## Protokollierung

`audit_logs` erfasst sicherheitsrelevante Admin-Aktionen (wer, was, wann,
Ziel) – ohne Passwörter, ohne Tokens, ohne Inhaltstexte. Nur für Super Admin
lesbar; für Clients komplett gesperrt (INSERT-only über Server).

## Mobile-Speicher

- Auth-Tokens: iOS Keychain via `expo-secure-store` (nie AsyncStorage).
- Offline-Cache: nur bereits berechtigt geladene Inhalte, max. 24 h,
  wird bei Abmeldung geleert.
- Lokale Antwort-Entwürfe werden nach erfolgreichem Sync entfernt.

## Fehlerdiagnose

V1 ohne externes Crash-Reporting. Falls später ergänzt (z. B. Sentry):
EU-Region, PII-Scrubbing, keine Secrets, Datenschutzerklärung ergänzen (§46).

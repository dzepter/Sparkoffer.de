# Admin-Handbuch (Super Admin / Verwaltung)

Für die Verwaltung der Plattform durch Aigner Offensiv. Das Cockpit ist
erreichbar unter der Admin-Domain (z. B. `cockpit.handel-offensiv.de`) und
für Teilnehmer nicht sichtbar. Anmeldung mit E-Mail + Passwort;
für Admin-Konten ist die Aktivierung von MFA vorgesehen
(System → Einstellungen → MFA).

## Der Weg zu einer neuen Kundengruppe (Standard-Ablauf)

1. **Unternehmen anlegen** – UNTERNEHMEN → „Neu": Name, Ansprechpartner,
   Kontakt. Status bleibt „aktiv".
2. **Gruppe anlegen** – GRUPPEN → „Neu": Name (z. B. „Marktleiter Süd –
   Herbst 2026"), Unternehmen, Programm „Handel Offensiv", Zeitraum, Trainer.
3. **Termine eintragen** – in der Gruppe → Tab „Termine": die fünf
   Offensivtage mit Ort, Raum, Beginn/Ende.
4. **Freischaltungen planen** – Tab „Freischaltungen": pro Lektion festlegen,
   wann sie sichtbar wird (sofort, zu Datum/Uhrzeit, X Tage nach/vor einem
   Offensivtag, nach Abschluss einer Lektion/eines Moduls, oder manuell).
5. **Teilnehmer einladen** – TEILNEHMER → „Einladen" (einzeln) oder
   CSV-Import in der Gruppe: Datei hochladen → Vorschau prüfen (Duplikate
   und Fehler werden markiert) → bestätigen. Jede Person erhält eine
   persönliche Einladungs-E-Mail mit sicherem Link; dort setzt sie ihr
   eigenes Passwort und bestätigt die Datenschutzinformation.
   Es gibt keine öffentliche Registrierung und keine Anfangspasswörter.

## Inhalte pflegen (ohne Programmierkenntnisse)

PROGRAMME → Programm öffnen → Modul → Lernphase → Lektion.

- **Lektion bearbeiten:** Bausteine („Content-Blöcke") hinzufügen –
  Text, Video, Audio, PDF, Bild, Checkliste, Reflexionsfrage, Single/Multiple
  Choice, Quiz, Skala, Transferaufgabe, Download, externer Link.
  Reihenfolge über die Pfeiltasten ändern.
- **Workflow:** Entwurf speichern → VORSCHAU ALS TEILNEHMER prüfen →
  Freischaltung konfigurieren → Veröffentlichen. Archivieren nimmt Inhalte
  aus der App, ohne sie zu löschen.
- **Vorschau (wichtig!):** VORSCHAU → Organisation/Gruppe/optional Teilnehmer
  wählen – Sie sehen exakt, was diese Person sieht, inklusive gesperrter
  Lektionen („Wird nach Offensivtag 2 freigeschaltet.").
- **Quiz:** unter INHALTE → Quizze: Fragen (eine Antwort, mehrere Antworten,
  Richtig/Falsch, Freitext) mit Erklärungstexten; optional Bestehensgrenze
  und Versuchsanzahl. Quizze sind Lerninstrumente, keine Prüfungs-Arcade.

## Teilnehmer verwalten

TEILNEHMER: Filter nach Unternehmen/Gruppe/Rolle/Status. Aktionen:
Einladung erneut senden, Einladung zurückziehen, Gruppe ändern,
deaktivieren/reaktivieren. Rollen ändern kann nur der Super Admin.
Es gibt bewusst keinen „Endgültig löschen"-Knopf – Datenlöschung läuft
kontrolliert über Löschanträge (System/Support), damit Fristen und
Nachweispflichten eingehalten werden.

## Nachrichten & Push

NACHRICHTEN: Ankündigung an eine Gruppe schreiben; auf Wunsch als
Push-Benachrichtigung ausspielen. Bitte sparsam einsetzen – Push wirkt
nur, solange er selten ist. Automatische Hinweise (neuer Lernimpuls,
Termin-Erinnerung 3 Tage vorher, Fälligkeit) verschickt das System selbst.

## Auswertung

AUSWERTUNG zeigt je Gruppe: Modul-Fortschritt („x von y abgeschlossen"),
Durchschnittsfortschritt, offene Aufgaben; je Teilnehmer: Fortschritt,
letzte Aktivität (tagesgenau), eingereichte Aufgaben. Bewusst nicht
vorhanden: Rankings, minutengenaue Überwachung, Geräteinformationen.
Persönliche Reflexionstexte sind für Organisationsadmins nie einsehbar.

## System (nur Super Admin)

- **Benutzer & Rollen:** organisationsübergreifende Übersicht, Rollenpflege.
- **Audit-Log:** Protokoll sicherheitsrelevanter Aktionen (nur lesbar).
- **Einstellungen:** MFA-Verwaltung, Grundeinstellungen.

## Goldene Regeln

1. Erst Vorschau, dann veröffentlichen.
2. Push ist ein Weckruf, kein Newsletter.
3. Persönliches bleibt persönlich – die Plattform erzwingt es, Sie leben es.
4. Keine echten Personendaten in Demo-/Testgruppen.

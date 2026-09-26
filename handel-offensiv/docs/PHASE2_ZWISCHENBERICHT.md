# Zwischenbericht Phase 2 (Code-Seite) – Web-Campus, Quiz-Härtung, Rate Limit, CSP

**Stand: 26.09.2026 · Branch `claude/aigner-offensiv-redesign-fpxwht` · Priorität laut Auftraggeber: Handel Offensiv + Lernplattform; Relaunch aigner-offensiv.de zurückgestellt.**

## Was gebaut wurde

**HANDEL OFFENSIV CAMPUS (`apps/campus`, Next.js 15, Palette v2)** – der digitale Mannschaftsraum im Browser:

| Bereich | Routen | Inhalt |
|---|---|---|
| Anmeldung | `/login`, `/login/passwort-vergessen`, `/auth/callback`, `/passwort-neu`, `/logout` | E-Mail + Passwort, neutrale Fehlertexte, Passwort-Reset (nur mit frischer Recovery-Sitzung ≤ 15 min), globaler Logout nach Passwortwechsel |
| Einladung | `/einladung` | Code aus Link oder Eingabe → Prüfung über Edge Function → Name, Passwort, Datenschutz-Einwilligung (versioniert) → Konto → automatische Anmeldung |
| Heute | `/heute` | Begrüßung, wichtigste Lektion (eine Gold-CTA), aktuelle Phase, nächster Offensivtag, offene Aufgaben, Modul-Fortschritt, letzte Ankündigung |
| Programm | `/programm`, `/programm/[modulId]` | Module 01–05 (Modulnummern in Gold), Lernphasen, Lektionen mit Freischaltstatus („Wird am … freigeschaltet") |
| Lektion | `/lektionen/[lektionId]` | alle 18 Blocktypen (Text sicher gerendert, Video über VideoProvider mit signierten URLs, Audio/PDF/Download/Bild, Checkliste, Reflexion mit Sichtbarkeitswahl, Skala, Single/Multiple Choice, Quiz über Server-RPC, Transferaufgabe mit Nachfragen + Datei-Upload, Praxisaufgabe, Datei-/Foto-Upload, Ankündigung), Pflichtblöcke, „Lektion abschließen", Vor/Zurück |
| Termine | `/termine`, `/termine/[sessionId]`, `…/kalender.ics` | Offensivtage mit Ort/Zeit, Countdown, persönliche Notizen, Kalenderdatei |
| Offensivplan | `/offensivplan` | Umsetzungsplan je Modul + 90-Tage-Plan, Vorhaben mit fünf Feldern und Status, Freigabe an Trainer, Trainer-Feedback |
| Nachrichten | `/nachrichten` | Ankündigungen der Gruppe, Benachrichtigungen (gelesen markieren) |
| Profil | `/profil` | Name, Gruppe wechseln, Passwort ändern, Benachrichtigungseinstellungen, Einwilligung, Löschantrag, Link zum Cockpit |
| Rechtliches | `/datenschutz`, `/impressum` | Entwürfe, klar als „juristische Prüfung ausstehend" markiert |

**Gemeinsames UI-Paket** `packages/ui` (Button navy/gold, Card, Badge, Banner, Kicker, FormField mit aria-describedby, ProgressBar, ModuleNumber …) – Basis für Campus, Cockpit und spätere Website.

**Sicherheit / Datenbank**
- Migration `0007_quiz_server_grading.sql`: Quiz wird **serverseitig bewertet** (`submit_quiz_attempt`), Lösungen (`is_correct`) sind für Teilnehmer nicht mehr lesbar, Versuche nur noch über die Funktion (max. Versuche, nur freigeschaltete Lektionen, nur eigene Gruppe). Native App auf die neue Sicht/RPC umgestellt; Cockpit-Editor liest Lösungen über die Service-Rolle.
- Migration `0008_rate_limit_public.sql`: persistentes Rate Limit; angewendet auf Login, Passwort-Reset, Einladung (Campus + Cockpit) und in den Edge Functions (Besucher-IP signiert vom Campus weitergereicht, nie im Klartext gespeichert). Fehlkonfiguration → geschlossen (kein Zugang ohne Limiter), Netzstörung → offen, jeweils protokolliert.
- Content-Security-Policy mit Nonce je Request in Campus und Cockpit, Sicherheits-Header, Startprüfung der Pflicht-Umgebungsvariablen.
- Deaktivierte Konten landen auf einer neutralen Sperrseite (`/zugang-gesperrt`) statt in einer Umleitungsschleife.

## Prüfung

| Prüfung | Ergebnis |
|---|---|
| Typecheck (9 Pakete) | ✔ |
| ESLint Campus + Cockpit (0 Warnungen) | ✔ |
| Unit-Tests domain/validation | ✔ 143 |
| RLS-/DB-Tests (jetzt 8 Dateien, inkl. Quiz 06 und Rate Limit 07) | ✔ 144 |
| `deno check` (5 Edge Functions) | ✔ |
| Production-Build Campus | ✔ (21 Routen) |
| Playwright-Smoke-Tests Campus (ohne Backend) | ✔ 20/20 – Formulare, Auth-Gate, 404, Rechtsseiten, Header, CSP-Nonce, Hydration |
| Adversarialer Review (3 Perspektiven, 19 Befunde, 12 bestätigt) | alle 12 behoben (u. a. Rate-Limit-Schlüssel je Besucher, Cockpit-Quiz-Editor, CSP bei statischen Routen, Passwort-Reset nur mit Recovery-Sitzung, Umleitungsschleife, Fokusringe auf Navy, Impressum mobil, Quiz-Neustart, aria-describedby, Gold-Überschuss) |

Screenshots (Desktop 1440 px, Mobil 390 px): `docs/design/screenshots/campus-login-*.png`, `campus-einladung-*.png`, `campus-passwort-vergessen-*.png`, `campus-datenschutz-*.png`. Ansichten mit Sitzung (Heute, Lektion, Offensivplan) brauchen ein laufendes Supabase – Screenshots folgen mit Staging.

## Was noch fehlt (bis zum echten Durchlauf)

1. **Konten des Auftraggebers:** Supabase-Projekt (Frankfurt), Vercel, Resend + DNS `mail.aigner-offensiv.de`, privates Repository. Erst damit: Staging, echte Einladungs-E-Mail, Ende-zu-Ende-Test mit Demo-Gruppe 2027.
2. Cockpit (Admin) auf `packages/ui` umstellen und um Website-Redaktion ergänzen (Phase 4/5, Website zurückgestellt).
3. Restliche Befunde aus Phase 1: MFA-Pflicht für Admins/Trainer (S‑7), paginierte Teilnehmerliste (S‑10), Löschanträge-UI (S‑18).
4. Native App (Phase 9): neue Blocktypen und Palette v2 in der Expo-App.

## Ankündigung produktiver Änderungen (noch nichts ausgeführt)

- DNS: `campus.` und `admin.aigner-offensiv.de` → Vercel (CNAME), vier Einträge für `mail.aigner-offensiv.de` (Resend). Auswirkung: keine auf Website oder Microsoft 365; Rollback: Einträge löschen.
- Datenbank: Migrationen 0001–0008 auf ein leeres Staging-Projekt; Rollback: Projekt zurücksetzen.

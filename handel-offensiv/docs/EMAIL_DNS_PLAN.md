# E-Mail-Versand: Resend über `mail.handel-offensiv.de` – DNS-Plan und Zustelltest

**Stand: 26.09.2026 (Architekturaktualisierung; ersetzt den Plan mit `mail.aigner-offensiv.de`).** Verbindlich: Resend als transaktionaler Maildienst (EU), eigene Versand-Subdomain **`mail.handel-offensiv.de`**, **MX-Einträge der Hauptdomains bleiben unverändert** (Microsoft 365 bei `aigner-offensiv.de`; `handel-offensiv.de` behält seinen bestehenden MX), Reply-To auf ein bestehendes Microsoft-365-Postfach (Adresse liefert der Auftraggeber), SPF/DKIM/DMARC vollständig getestet vor Produktionsbetrieb.

## 1. Ausgangslage (aus `CURRENT_STATE.md`)

| Eintrag | Wert heute | Bedeutung |
|---|---|---|
| MX `aigner-offensiv.de` | Microsoft 365 | Postfächer (Reply-To) bleiben bei M365 – **nicht anfassen** |
| SPF/DMARC `aigner-offensiv.de` | `-all`, `p=reject` | fremde Absender *@aigner-offensiv.de* werden abgewiesen – deshalb keine Systemmails als `@aigner-offensiv.de` |
| MX `handel-offensiv.de` | `smtpin.rzone.de` (Strato) | bleibt unverändert |
| SPF/DMARC `handel-offensiv.de` | **kein SPF**; **DMARC `_dmarc` = `v=DMARC1;p=reject;`** (ohne `sp=`, gilt damit auch für Subdomains ohne eigenen `_dmarc`-Eintrag); Strato-DKIM-Selektoren `strato-dkim-0002`/`-0003` vorhanden (Befund 26.09.2026, `CURRENT_STATE.md` 2.1) | die Versand-Subdomain bekommt eigene SPF-/DKIM-/DMARC-Einträge; die Hauptdomain wird nicht verändert. Der eigene `_dmarc.mail`-Eintrag (Tabelle §3) ist damit **Pflicht**, sonst würde für `mail.` die Apex-Policy `p=reject` gelten |
| Wildcard `*.handel-offensiv.de` | `MX 5 smtpin.rzone.de` (Strato-Standard) | jeder nicht angelegte Name antwortet mit diesem MX – der MX für `send.mail` muss deshalb **explizit** angelegt werden (überschreibt den Wildcard nur für diesen Namen); Resend-Verifizierung schlägt sonst fehl |

Das System versendet ausschließlich als **`akademie@mail.handel-offensiv.de`**; DKIM (d=`mail.handel-offensiv.de`) und Return-Path liegen auf derselben Subdomain → SPF und DKIM sind ausgerichtet, DMARC besteht, ohne einen bestehenden Eintrag zu ändern.

## 2. Absender und Antwortadresse

| Zweck | Wert | Konfiguration |
|---|---|---|
| Absender Systemmails | `Handel Offensiv Akademie <akademie@mail.handel-offensiv.de>` | Edge Functions: `EMAIL_FROM` (Default im Code, `supabase/functions/_shared/email-core.ts`); Supabase Auth: `[auth.email.smtp] admin_email/sender_name` (`supabase/config.toml`) |
| Reply-To | bestehendes M365-Postfach – **Adresse liefert der Auftraggeber separat** (bis dahin Vorschlag `info@aigner-offensiv.de`) | `EMAIL_REPLY_TO` (Function Secret) |
| Erlaubte Absenderdomain | `mail.handel-offensiv.de` | `EMAIL_SENDER_DOMAIN`; der Adapter verweigert andere Absender (fail-closed) |

## 3. DNS-Einträge bei Strato (Zone `handel-offensiv.de`)

Die konkreten Werte (DKIM-Schlüssel, Return-Path-Host) zeigt Resend nach dem Anlegen der Domain **`mail.handel-offensiv.de`** (Region **EU** wählen). Erwartete Struktur:

| Typ | Name (relativ zur Zone) | Wert (Platzhalter, aus dem Resend-Dashboard übernehmen) | Zweck |
|---|---|---|---|
| TXT | `resend._domainkey.mail` | `p=MIGf…` (DKIM-Public-Key) | DKIM-Signatur d=mail.handel-offensiv.de |
| MX | `send.mail` | `feedback-smtp.eu-west-1.amazonses.com` (Prio 10) | Return-Path/Bounces (Resend EU) |
| TXT | `send.mail` | `v=spf1 include:amazonses.com ~all` | SPF für den Return-Path-Host |
| TXT | `_dmarc.mail` | `v=DMARC1; p=quarantine; rua=mailto:<Reply-To-Postfach>; adkim=r; aspf=r` | DMARC-Policy der Versand-Subdomain (Berichte an das M365-Postfach) |

**Nicht ändern:** MX/SPF/DMARC von `aigner-offensiv.de` und `handel-offensiv.de`, `www`/Apex (separater Schritt mit eigener Ankündigung, `DEPLOYMENT.md` §4).

### Ankündigung vor der produktiven DNS-Änderung (Pflicht laut Freigabe Punkt 14)

- **Was geändert wird:** vier neue Einträge unterhalb von `mail.handel-offensiv.de` (Tabelle oben). Keine bestehenden Einträge werden geändert oder gelöscht.
- **Mögliche Auswirkungen:** keine auf den Mailverkehr der Hauptdomains (andere Hostnamen). Bis zur Verifizierung (bis zu 24 h Propagation) versendet das System keine Mails – Einladungen zeigen im Cockpit den Link zum manuellen Versand.
- **Rollback:** die vier Einträge löschen; der Adapter fällt auf „kein Versand" zurück, nichts sonst ist betroffen.
- **Ausführung erst nach Bestätigung des Auftraggebers.**

## 4. Supabase-Konfiguration

| Stelle | Wert |
|---|---|
| Function Secrets | `RESEND_API_KEY` (nur Secret, nie im Repo), `EMAIL_FROM` (optional, Default siehe oben), `EMAIL_REPLY_TO` (M365-Postfach), `EMAIL_SENDER_DOMAIN=mail.handel-offensiv.de`, `APP_BASE_URL=https://www.handel-offensiv.de/akademie` (Staging: `<Shell-Host>/akademie`) |
| Auth SMTP | Host `smtp.resend.com`, Port 465, User `resend`, Passwort = `RESEND_API_KEY`, Absender `akademie@mail.handel-offensiv.de` (`supabase/config.toml`, `[auth.email.smtp]`) |
| Auth Redirects | `additional_redirect_urls` enthält `<Basis>/auth/callback` der Akademie (`/akademie`) und des Cockpits (`/admin`) sowie `handeloffensiv://passwort-neu` |

## 5. Zustelltest (vor Produktion, Ergebnis in den Zwischenbericht)

1. **Testadresse im M365-Postfach** des Auftraggebers und eine externe Adresse (Gmail/GMX) vorbereiten.
2. Aus dem Staging-Cockpit (`/admin`) eine **Einladung** an beide Adressen senden (`invite-user`); Link muss auf `<Shell-Host>/akademie/einladung?token=…` zeigen.
3. Aus dem Staging-Login (`/login`) **„Passwort vergessen"** anfordern (Supabase Auth → SMTP); Link muss auf `<Shell-Host>/akademie/auth/callback` zeigen.
4. Kopfzeilen der empfangenen Mails prüfen: `Authentication-Results` muss `spf=pass`, `dkim=pass (d=mail.handel-offensiv.de)`, `dmarc=pass` zeigen; Absender wird nicht als „unbekannt" gekennzeichnet; Reply-To zeigt auf das M365-Postfach.
5. Resend-Dashboard: Status *Delivered*, keine Bounces/Complaints.
6. Negativprobe: Absender absichtlich auf `test@handel-offensiv.de` setzen → der Adapter muss den Versand **verweigern** (Log-Eintrag), nicht versenden.

Erst wenn alle Punkte grün sind, wird `RESEND_API_KEY` in einem Produktionsprojekt gesetzt.

## 6. Stand

- Adapter, Absenderprüfung, Idempotenz und Vorlagen sind implementiert und mit Unit-Tests belegt (`supabase/tests/src/email-core.test.ts`); Standardabsender und erlaubte Domain auf `mail.handel-offensiv.de` umgestellt.
- **Echter Zustelltest steht aus**, weil Resend-Konto, API-Schlüssel und DNS-Einträge vom Auftraggeber angelegt bzw. bestätigt werden müssen (`NEEDED_FROM_CLIENT.md`, Abschnitt 2).

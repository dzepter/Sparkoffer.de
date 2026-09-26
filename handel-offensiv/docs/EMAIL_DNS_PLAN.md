# E-Mail-Versand: Resend über `mail.aigner-offensiv.de` – DNS-Plan und Zustelltest

**Stand: 26.09.2026 (Phase 1, Freigabe K‑4).** Verbindlich: Resend als transaktionaler Maildienst, eigene Versand-Subdomain `mail.aigner-offensiv.de`, **Microsoft‑365‑MX von `aigner-offensiv.de` bleibt unverändert**, SPF/DKIM/DMARC sauber, echter Zustelltest vor Produktion.

## 1. Ausgangslage (aus `CURRENT_STATE.md`)

| Eintrag | Wert heute | Bedeutung |
|---|---|---|
| MX `aigner-offensiv.de` | Microsoft 365 | Postfächer bleiben bei M365 – **nicht anfassen** |
| SPF `aigner-offensiv.de` | `v=spf1 include:spf.protection.outlook.com -all` | jeder fremde Absender *@aigner-offensiv.de* wird hart abgewiesen |
| DMARC `_dmarc.aigner-offensiv.de` | `p=reject` | nicht ausgerichtete Mails werden verworfen |

Deshalb versendet das System **nicht** als `@aigner-offensiv.de`, sondern als **`campus@mail.aigner-offensiv.de`**. DKIM (d=`mail.aigner-offensiv.de`) ist im relaxed-Modus mit der Organisationsdomain `aigner-offensiv.de` ausgerichtet → DMARC besteht, ohne die M365-Einträge zu ändern.

## 2. Absender und Antwortadresse

| Zweck | Wert | Konfiguration |
|---|---|---|
| Absender Systemmails | `Aigner Offensiv Campus <campus@mail.aigner-offensiv.de>` | Edge Functions: `EMAIL_FROM` (Default im Code, `supabase/functions/_shared/email-core.ts`); Supabase Auth: `[auth.email.smtp] admin_email/sender_name` |
| Reply-To | bestehendes M365-Postfach, Vorschlag `info@aigner-offensiv.de` | `EMAIL_REPLY_TO` (Function Secret) – **Kundenentscheidung, welches Postfach** |
| Erlaubte Absenderdomain | `mail.aigner-offensiv.de` | `EMAIL_SENDER_DOMAIN`; der Adapter verweigert andere Absender (fail-closed) |

## 3. DNS-Einträge bei Strato (Zone `aigner-offensiv.de`)

Die konkreten Werte (DKIM-Schlüssel, SPF-Include, Return-Path-Host) zeigt Resend nach dem Anlegen der Domain **`mail.aigner-offensiv.de`** (Region **EU** wählen). Erwartete Struktur:

| Typ | Name (relativ zur Zone) | Wert (Platzhalter, aus dem Resend-Dashboard übernehmen) | Zweck |
|---|---|---|---|
| TXT | `resend._domainkey.mail` | `p=MIGf…` (DKIM-Public-Key) | DKIM-Signatur d=mail.aigner-offensiv.de |
| MX | `send.mail` | `feedback-smtp.eu-west-1.amazonses.com` (Prio 10) | Return-Path/Bounces (Resend EU) |
| TXT | `send.mail` | `v=spf1 include:amazonses.com ~all` | SPF für den Return-Path-Host |
| TXT | `_dmarc.mail` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@aigner-offensiv.de; adkim=r; aspf=r` | eigene DMARC-Policy der Subdomain (optional; die Organisationspolicy `p=reject` gilt sonst) |

**Nicht ändern:** MX/SPF/DMARC von `aigner-offensiv.de` (Microsoft 365). Kein Eintrag betrifft `www`, `campus`, `admin` (die bekommen später CNAMEs auf Vercel – separater Schritt mit eigener Ankündigung).

### Ankündigung vor der produktiven DNS-Änderung (Pflicht laut Freigabe Punkt 14)

- **Was geändert wird:** vier neue Einträge unterhalb von `mail.aigner-offensiv.de` (Tabelle oben). Keine bestehenden Einträge werden geändert oder gelöscht.
- **Mögliche Auswirkungen:** keine auf den M365-Mailverkehr (andere Hostnamen). Bis zur Verifizierung (bis zu 24 h Propagation) versendet das System keine Mails – Einladungen zeigen den Link zum manuellen Versand.
- **Rollback:** die vier Einträge löschen; der Adapter fällt auf „kein Versand“ zurück, nichts sonst ist betroffen.

## 4. Supabase-Konfiguration

| Stelle | Wert |
|---|---|
| Function Secrets | `RESEND_API_KEY` (nur Secret, nie im Repo), `EMAIL_FROM` (optional, Default siehe oben), `EMAIL_REPLY_TO`, `EMAIL_SENDER_DOMAIN=mail.aigner-offensiv.de`, `APP_BASE_URL=https://campus.aigner-offensiv.de` |
| Auth SMTP | Host `smtp.resend.com`, Port 465, User `resend`, Passwort = `RESEND_API_KEY`, Absender `campus@mail.aigner-offensiv.de` (`supabase/config.toml`, `[auth.email.smtp]`) |
| Auth Redirects | `additional_redirect_urls` enthält `/auth/callback` der Web-Apps und `handeloffensiv://passwort-neu` |

## 5. Zustelltest (vor Produktion, Ergebnis in den Zwischenbericht)

1. **Testadresse im M365-Postfach** des Kunden (z. B. `info@aigner-offensiv.de`) und eine externe Adresse (Gmail/GMX) vorbereiten.
2. Aus dem Staging-Cockpit eine **Einladung** an beide Adressen senden (`invite-user`).
3. Aus dem Staging-Login **„Passwort vergessen“** anfordern (Supabase Auth → SMTP).
4. Kopfzeilen der empfangenen Mails prüfen: `Authentication-Results` muss `spf=pass`, `dkim=pass (d=mail.aigner-offensiv.de)`, `dmarc=pass` zeigen; Absender wird nicht als „unbekannt“ gekennzeichnet; Reply-To zeigt auf das M365-Postfach.
5. Resend-Dashboard: Status *Delivered*, keine Bounces/Complaints.
6. Negativprobe: Absender absichtlich auf `test@aigner-offensiv.de` setzen → der Adapter muss den Versand **verweigern** (Log-Eintrag), nicht versenden.

Erst wenn alle Punkte grün sind, wird `RESEND_API_KEY` im Produktionsprojekt gesetzt.

## 6. Stand Phase 1

- Adapter, Absenderprüfung, Idempotenz und Vorlagen sind implementiert und mit Unit-Tests belegt (`supabase/tests/src/email-core.test.ts`).
- **Echter Zustelltest steht aus**, weil Resend-Konto, API-Schlüssel und DNS-Einträge vom Auftraggeber angelegt werden müssen (`NEEDED_FROM_CLIENT.md`, Abschnitt 2).

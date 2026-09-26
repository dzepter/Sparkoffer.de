# Regionen und Datenflüsse – wo welche Daten verarbeitet werden

**Stand: 26.09.2026 (Phase 1). Verbindliche Vorgabe (Freigabe K‑5):** alle serverseitigen Funktionen mit personenbezogenen Campusdaten laufen in **Frankfurt** (Vercel `fra1`, Supabase `eu-central-1`). Dieses Dokument listet **jeden Dienst**, bei dem Daten oder Logs die Region verlassen könnten, und die getroffene Maßnahme.

## 1. Zielbild

| Baustein | Anbieter | Region | Personenbezogene Daten? | Maßnahme / Konfiguration |
|---|---|---|---|---|
| Datenbank, Auth, Storage | Supabase | **eu-central-1 (Frankfurt)** | ja (Konten, Lernstände, Reflexionen, Uploads) | Projekt beim Anlegen in `eu-central-1` erstellen; **nicht nachträglich änderbar** – vor dem Anlegen prüfen. AVV mit Supabase abschließen. |
| Edge Functions (`invite-user`, `accept-invitation`, `send-push`, `process-deletion-request`, `release-scheduler`) | Supabase | standardmäßig **nächstgelegene Region zum Aufrufer** (kann außerhalb der EU liegen) | ja | Jeder Aufruf aus dem Cockpit setzt den Header `x-region: eu-central-1` (`apps/admin/src/lib/edge-functions.ts`). Mobile/Campus: `supabase.functions.invoke(name, { region: FunctionRegion.EuCentral1 })` beim Aufbau des Web-Campus umsetzen. Function-Logs liegen im Supabase-Projekt (Frankfurt). |
| Website-Shell (`apps/web`), Akademie (`apps/campus`), Cockpit (`apps/admin`) – Serverless Functions / Server Actions | Vercel | **fra1** | ja (Cockpit/Akademie), Shell nur Weiterleitung der Anfragen (Rewrite) | `vercel.json` je App → `"regions": ["fra1"]` (alle drei vorhanden). Vercel-Projekt-Einstellung „Function Region“ zusätzlich auf Frankfurt prüfen. Der Rewrite der Shell auf die Zonen läuft über Vercels Netz zum Zonen-Deployment in `fra1`; Anfrageinhalte werden in der Shell nicht verarbeitet oder protokolliert. |
| Vercel Edge Middleware (`apps/admin/src/middleware.ts`, `apps/campus/src/middleware.ts`) | Vercel | **global** (läuft am Edge-Standort des Besuchers, nicht pinbar) | verarbeitet das Session-Cookie (JWT) zur Prüfung/Erneuerung | Middleware bleibt minimal: keine Datenbankzugriffe, keine Protokollierung personenbezogener Inhalte. Das JWT wird nur an Supabase (Frankfurt) weitergereicht. **Restrisiko dokumentiert** (transiente Verarbeitung außerhalb DE möglich). Alternative bei Bedarf: Auth-Gate in Server Components statt Middleware. |
| Vercel-Logs / Analytics | Vercel | Logs: Region der Function (fra1); Web Analytics/Speed Insights: **global, USA** | Request-Metadaten | Web Analytics und Speed Insights **nicht aktivieren**. Log Drains nur zu EU-Zielen. Vercel-AVV abschließen. |
| Statische Assets / CDN | Vercel | global (Cache) | nein (öffentliche Dateien, Bundles) | unkritisch; keine personenbezogenen Daten in statischen Assets. |
| Transaktionsmails | Resend | Konto in **EU-Region** wählen (Datenhaltung Irland); Zustellung an Empfänger weltweit systembedingt | ja (E-Mail-Adresse, Inhalte wie Einladungslink) | Resend-Konto mit EU-Datenresidenz anlegen (beim Anlegen der Domain `mail.handel-offensiv.de` „EU“ wählen), AVV abschließen. Keine Nachrichteninhalte über die Einladung hinaus. |
| Supabase Auth-Mails (Passwort-Reset, E-Mail-Änderung) | Supabase → SMTP Resend | Frankfurt → Resend EU | ja | `supabase/config.toml` `[auth.email.smtp]` mit `smtp.resend.com` (Port 465). Lokale Entwicklung: Inbucket. |
| Push (Expo) | Expo Push Service | **USA** | Gerätetoken, Titel/Text der Push-Nachricht | Erst Phase 9 (native App). Inhalte auf Titel/Kurztext beschränken, keine Reflexions-/Bewertungsinhalte pushen. Web-Push (Phase 6) läuft über die Browser-Anbieter (Apple/Google/Mozilla) – gleiche Inhaltsregel. |
| Video-Streaming | Supabase Storage (Pilot) | Frankfurt | Zugriffslogs (wer sieht welches Video) | Signierte URLs, kurze Gültigkeit. Ein späterer Streaming-Anbieter wird über die `VideoProvider`-Abstraktion (`packages/domain/src/video-provider.ts`) angebunden; Regionsprüfung dann erneut. |
| CI (GitHub Actions) | GitHub | **USA** | **nein** – ausschließlich fiktive Testdaten (`supabase/tests/fixtures`) | Keine Produktions-Secrets in CI; RLS-Tests laufen gegen einen Wegwerf-Postgres im Runner. |
| Quellcode | GitHub | USA | nein (keine Kundendaten, keine Secrets im Repo) | privates Repository (Freigabe Punkt 12), Secret-Scanning aktiv. |
| DNS | Strato (Zonen `handel-offensiv.de`, `aigner-offensiv.de`) | Deutschland | nein | nur Einträge, keine Inhalte. |
| Fehler-Monitoring | – | – | – | **noch nicht eingesetzt.** Vor Einführung (z. B. Sentry) Region EU wählen und PII-Filter aktivieren; hier nachtragen. |

## 2. Prüfliste vor Produktion

- [ ] Supabase-Projekt zeigt Region `eu-central-1` (Dashboard → Settings → General).
- [ ] Vercel-Projekte (`ho-web`, `ho-akademie`, `ho-admin`) zeigen Function Region `fra1`; `vercel.json` je App vorhanden.
- [ ] Vercel Web Analytics / Speed Insights deaktiviert.
- [ ] Resend-Domain `mail.handel-offensiv.de` in EU-Region verifiziert (DKIM/SPF grün), AVV abgeschlossen.
- [ ] Supabase-Auth-SMTP zeigt auf Resend; Testmail (Passwort-Reset) an ein M365-Postfach zugestellt, DMARC-Report ohne Reject.
- [ ] Edge-Function-Aufrufe tragen `x-region: eu-central-1` (Cockpit) bzw. `region: EuCentral1` (Campus).
- [ ] AVVs: Supabase, Vercel, Resend (später Expo, Video-Anbieter).

## 3. Datenflüsse (vereinfacht)

```
Besucher ──HTTPS──▶ www.handel-offensiv.de (Shell, fra1) ──Rewrite──▶ Zone /akademie bzw. /admin
                     └▶ Vercel Edge (global, nur Cookie-Prüfung) ──▶ Vercel Function fra1 ──▶ Supabase eu-central-1
                                                                                     │
Cockpit-Aktion (Einladung) ──Nutzer-JWT + x-region──▶ Edge Function eu-central-1 ──▶ Resend EU ──▶ Empfänger
Passwort vergessen ──▶ Supabase Auth (Frankfurt) ──SMTP──▶ Resend EU ──▶ Empfänger ──Link──▶ /akademie/auth/callback bzw. /admin/auth/callback (fra1)
```

Änderungen an dieser Liste sind Teil jeder Infrastruktur-Änderung (Review-Pflicht, `SECURITY.md` Kap. 15).

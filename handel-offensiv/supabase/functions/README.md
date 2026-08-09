# Edge Functions – Handel Offensiv

Deno-basierte Supabase Edge Functions. Der Service-Role-Key existiert
ausschließlich hier (Function Secrets) – **niemals im Client**. Jede Function
autorisiert selbst (Bearer-JWT + Rechte-Matrix, Spiegel von
`packages/domain/src/capabilities.ts`), bevor sie mit Service Role schreibt.

## Übersicht

| Function | Auth | Zweck |
| --- | --- | --- |
| `invite-user` | JWT + `users.invite` | Einladung anlegen / erneut senden / zurückziehen (nur Token-Hash in DB) |
| `accept-invitation` | öffentlich (Token) | Einladung prüfen (`validate`) und Konto anlegen (`complete`) |
| `send-push` | JWT + `notifications.send` | Push an Cohort/Profile via Expo, In-App-Spiegel in `notifications` |
| `process-deletion-request` | JWT, nur Super Admin | DSGVO-Löschantrag bestätigen/ablehnen (dokumentierter Löschablauf) |
| `release-scheduler` | `x-cron-secret` / Service-Role-Bearer | Cron: Freischaltungs-Pushes, Session- und Fälligkeits-Erinnerungen |

Gemeinsame Helfer in `_shared/`: `supabaseAdmin.ts`, `auth.ts` (JWT +
ActorContext + `can()`), `audit.ts`, `errors.ts` (deutsche Fehlermeldungen,
keine Stacktraces), `cors.ts` (nur `ALLOWED_ORIGINS`), `ratelimit.ts`
(In-Memory-Token-Bucket je IP+Route – Grenzen im Dateikommentar),
`emails.ts` (deutsche Vorlagen + generischer Provider-Versand),
`push.ts` (Expo-Batches à 100, `DeviceNotRegistered` → Token deaktivieren),
`tokens.ts` (base64url-Token + SHA-256-Hash).

## Benötigte Secrets

Automatisch von Supabase bereitgestellt: `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`.

Zusätzlich setzen (`supabase secrets set NAME=wert`):

| Secret | Pflicht | Verwendung |
| --- | --- | --- |
| `ALLOWED_ORIGINS` | ja (Web) | Kommaseparierte CORS-Origins, z. B. `https://app.example.de` |
| `APP_BASE_URL` | ja | Basis der Einladungslinks (`/einladung?token=…`) |
| `CRON_SECRET` | ja | Zugriffsschutz für `release-scheduler` |
| `EMAIL_PROVIDER_URL` | empfohlen | HTTP-Endpoint, der `{from,to,subject,html,text}` per JSON-POST versendet. Fehlt er, liefert `invite-user` die `inviteUrl` zum manuellen Versand zurück. |
| `EMAIL_PROVIDER_TOKEN` | optional | Bearer-Token für den E-Mail-Endpoint |
| `EMAIL_FROM` | optional | Absender, Default `Handel Offensiv <info@aigner-offensiv.de>` |
| `EXPO_ACCESS_TOKEN` | optional | Expo Enhanced Push Security |
| `STORAGE_BUCKET_AVATARS` | optional | Default `avatars` (Löschablauf) |
| `STORAGE_BUCKET_UPLOADS` | optional | Default `uploads` (Löschablauf) |

## Deploy

```bash
# Aus dem Repo-Root (handel-offensiv/)
supabase functions deploy invite-user
supabase functions deploy send-push
supabase functions deploy process-deletion-request

# Diese beiden OHNE JWT-Pflicht (Token- bzw. Secret-basiert):
supabase functions deploy accept-invitation --no-verify-jwt
supabase functions deploy release-scheduler --no-verify-jwt
```

Alternativ dauerhaft in `supabase/config.toml` (noch nicht eingetragen –
siehe „Offene Punkte“):

```toml
[functions.accept-invitation]
verify_jwt = false

[functions.release-scheduler]
verify_jwt = false
```

Lokal testen: `supabase functions serve --env-file supabase/.env.local`.

## Cron-Einrichtung (release-scheduler)

Stündlich reicht; die Function ist idempotent (Dedupe über vorhandene
`notifications`-Zeilen gleicher Art + Deep-Link). Variante Supabase
Dashboard: *Integrations → Cron* (pg_cron + pg_net), oder per SQL:

```sql
select cron.schedule(
  'release-scheduler-hourly',
  '17 * * * *',  -- einmal pro Stunde, versetzte Minute
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/release-scheduler',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '<CRON_SECRET>'
    ),
    body    := '{}'::jsonb
  );
  $$
);
```

`<CRON_SECRET>` idealerweise über Vault referenzieren statt im Klartext
(`vault.decrypted_secrets`).

## Sicherheits-Notizen

- **Einladungen:** In der DB liegt nur der SHA-256-Hash des Tokens
  (`invitations.token_hash`); TTL = `LIMITS.invitationTtlHours` (14 Tage).
  `accept-invitation` ist streng rate-limitiert und antwortet bei
  unbekanntem Token bewusst generisch.
- **Löschablauf:** Der auth-User wird **soft**-gelöscht (E-Mail vorher
  verschleiert, Bann), weil ein harter Delete per FK-CASCADE auch die
  anonymisiert aufbewahrten `quiz_attempts` entfernen würde. Details im
  Kopfkommentar von `process-deletion-request/index.ts`.
- **Rate-Limit:** In-Memory je Isolate, also Best Effort – für harte
  Garantien zentralen Store nachrüsten (siehe `_shared/ratelimit.ts`).

## Offene Punkte

1. `supabase/config.toml`: `verify_jwt = false`-Einträge für
   `accept-invitation` und `release-scheduler` ergänzen (Datei gehört einem
   anderen Arbeitsbereich, daher hier nicht angefasst).
2. Konkreten E-Mail-Provider anbinden (Resend/Postmark/SMTP-Relay hinter
   `EMAIL_PROVIDER_URL`); bis dahin manueller Linkversand über die
   `inviteUrl` in der Antwort von `invite-user`.
3. Storage-Bucket-Namen (`avatars`, `uploads`) mit der tatsächlichen
   Storage-Konfiguration abgleichen.
4. Deep-Link-Pfade (`/lektionen/…`, `/termine/…`, `/einladung`) mit dem
   Routing der Apps abstimmen.
5. Rechte-Matrix in `_shared/auth.ts` ist eine bewusste Kopie aus
   `packages/domain` (Deno kann Workspace-Pakete nicht auflösen) – bei
   Änderungen synchron halten; optional Codegen/Import-Map einrichten.

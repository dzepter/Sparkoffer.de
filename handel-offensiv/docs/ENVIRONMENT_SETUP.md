# Environment-Setup

Drei Umgebungen (Briefing §52): **local**, **staging**, **production** –
mit getrennten Supabase-Projekten für Staging und Production.
Keine Testdaten in Production. Keine Production-Secrets in committeten Dateien.

## 1. Lokale Entwicklung

Voraussetzungen: Node ≥ 22, pnpm (via `corepack enable`), Docker (für Supabase lokal),
Xcode (für iOS-Simulator).

```bash
cd handel-offensiv
pnpm install
cp .env.example .env
```

Supabase lokal starten und Datenbank aufsetzen:

```bash
npx supabase start          # startet Postgres, Auth, Storage, Studio lokal
npx supabase db reset       # spielt migrations/ + seed.sql ein
```

`npx supabase status` zeigt URL und anon key – in `.env` eintragen
(`SUPABASE_URL`, `SUPABASE_ANON_KEY` sowie die `NEXT_PUBLIC_*`/`EXPO_PUBLIC_*`-Varianten).

Demo-Logins (nur lokal, aus `seed.sql`):

| Rolle | E-Mail | Passwort |
|---|---|---|
| Super Admin | superadmin@demo.handel-offensiv.test | demo1234! |
| Trainer | trainer@demo.handel-offensiv.test | demo1234! |
| Org-Admin | orgadmin@demo.handel-offensiv.test | demo1234! |
| Teilnehmer | max.muster@demo.handel-offensiv.test | demo1234! |
| Teilnehmerin | anna.beispiel@demo.handel-offensiv.test | demo1234! |

Apps starten:

```bash
pnpm dev:admin     # http://localhost:3000
pnpm dev:mobile    # Expo Dev Server; "i" für iOS-Simulator
```

## 2. Staging

1. Supabase-Projekt **handel-offensiv-staging** anlegen (Region **EU – Frankfurt**).
2. Migrationen deployen:
   ```bash
   npx supabase link --project-ref <staging-ref>
   npx supabase db push
   ```
3. Seed NICHT automatisch einspielen; für Abnahmetests kann `seed.sql`
   manuell über den SQL-Editor laufen (klar als DEMO markierte Daten).
4. Edge Functions deployen: siehe `supabase/functions/README.md`.
5. Auth-Einstellungen im Dashboard prüfen: Signups deaktiviert,
   E-Mail-Templates (deutsch), Site-URL = Staging-Admin-URL,
   Redirect-URLs für die App (`handeloffensiv://…`).
6. Admin-Cockpit auf Vercel (o. ä.) mit Staging-Env-Variablen deployen.
7. Mobile: EAS-Build mit `EXPO_PUBLIC_SUPABASE_URL` der Staging-Instanz
   → TestFlight Internal Testing.

## 3. Production

Wie Staging, mit eigenem Projekt **handel-offensiv-prod**. Zusätzlich:

- Secrets ausschließlich über die Secret-Stores der Plattformen
  (Vercel Env, `npx supabase secrets set`, EAS Secrets).
- `SUPABASE_SERVICE_ROLE_KEY` NUR in Edge Functions / Admin-Server –
  niemals in App- oder Browser-Bundles (siehe SECURITY.md).
- Backups & Restore-Test vor dem ersten echten Teilnehmer: BACKUP_RESTORE.md.
- DSGVO-Checkliste aus SECURITY.md Abschnitt „EU/DSGVO" abarbeiten
  (AVV, Unterauftragnehmer, Löschfristen).

## 4. Secrets-Übersicht

| Variable | local | staging/prod | Verwendung |
|---|---|---|---|
| SUPABASE_URL / ANON_KEY | aus `supabase start` | Projekt-Dashboard | alle Clients |
| SUPABASE_SERVICE_ROLE_KEY | aus `supabase start` | Dashboard → nur Server | Edge Functions, Admin-Server-Actions |
| NEXT_PUBLIC_SUPABASE_URL/_ANON_KEY | = oben | = oben | Admin-Browser |
| EXPO_PUBLIC_SUPABASE_URL/_ANON_KEY | = oben | = oben | Mobile App |
| EMAIL_FROM / EMAIL_PROVIDER_API_KEY | leer (Links werden angezeigt) | vom Anbieter | Einladungs-Mails |
| ALLOWED_ORIGINS | http://localhost:3000 | Admin-Domain | CORS der Edge Functions |
| EXPO_ACCESS_TOKEN | – | expo.dev | Push-Versand (optional) |

Migrationsregel (Briefing §53): Schemaänderungen ausschließlich über neue,
versionierte Dateien in `supabase/migrations/` – niemals manuell in Production.

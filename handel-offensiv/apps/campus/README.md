# HANDEL OFFENSIV CAMPUS (`apps/campus`)

Der digitale Mannschaftsraum im Browser – Zielhost `campus.aigner-offensiv.de` (Vercel `fra1`, `noindex`).

## Grundsätze

- **Nur Nutzersitzung.** Lerndaten werden ausschließlich über `@supabase/ssr` im Nutzerkontext gelesen und geschrieben; Row Level Security entscheidet. Der Service-Role-Key wird nur für das persistente Rate Limit verwendet (`src/lib/supabase/admin.ts`).
- **Freischaltung entscheidet die Datenbank** (`app.lesson_is_released`). Der Campus zeigt Sperrzustände nur an (`isLessonReleased` aus `@handel-offensiv/domain` für die Anzeige „Wird am … freigeschaltet").
- **Palette v2** (Navy / Off-White / Gold) über `@handel-offensiv/ui` und das Tailwind-Preset; Gold nur für Modulnummern, aktive Navigation, wichtige CTA, Fortschritt.
- **Deutsch, Sie-Form, mobile-first, barrierearm** (Labels, 44-px-Ziele, Kontrast AA).

## Struktur

```
src/app/(auth)/…        Login, Einladung annehmen, Passwort vergessen/neu
src/app/auth/callback   PKCE-Code-Tausch (Passwort-Reset)
src/app/(campus)/…      Heute · Programm · Lektionen · Termine · Offensivplan · Nachrichten · Profil
src/lib/session.ts      Sitzung + aktive Gruppe (Cookie ho_cohort)
src/lib/edge-functions  Aufruf der Edge Functions (x-region eu-central-1)
```

## Lokal starten

```bash
cp apps/campus/.env.example apps/campus/.env.local   # Werte aus `supabase start`
pnpm dev:campus                                       # http://localhost:3001
```

Demo-Konten: `supabase/seed.sql` + `node supabase/seed-users.mjs` (Passwort aus `SEED_DEMO_PASSWORD`).

## Testing

```bash
pnpm --filter @handel-offensiv/campus typecheck   # tsc --noEmit (inkl. e2e/ und playwright.config.ts)
pnpm --filter @handel-offensiv/campus lint        # ESLint, 0 Warnungen erlaubt
```

### Playwright-Smoke-Tests (`e2e/`)

Die Smoke-Tests laufen **ohne Supabase-Backend** (Platzhalter-Env) und brauchen keinen gültigen Login. Sie prüfen:

- `e2e/auth.spec.ts` – Login-Formular und Links, Einladung (Schritt 1), Passwort vergessen (neutrale Antwort, nie ein Konto-Urteil), Auth-Gate (`/`, `/heute`, `/passwort-neu` → `/login`; `?weiter=` nur relativ), 404-Seite.
- `e2e/rechtliches.spec.ts` – `/datenschutz` und `/impressum` ohne Sitzung, Entwurfskennzeichnung, kein horizontales Scrollen auf 360 px.
- `e2e/sicherheit.spec.ts` – Sicherheits-Header (`X-Robots-Tag: noindex`, `nosniff`, `X-Frame-Options`, `Referrer-Policy`, kein `X-Powered-By`), Content-Security-Policy mit Nonce (tolerant, solange die Middleware-CSP fehlt: Annotation statt Fehler), Robots-Meta.

Lokal gegen den gebauten Stand (wie in CI, Job `campus-e2e`):

```bash
cd handel-offensiv
export NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co \
       NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder \
       NEXT_PUBLIC_APP_URL=http://localhost:3001
pnpm build:campus
pnpm --filter @handel-offensiv/campus start &          # Port 3001
pnpm --filter @handel-offensiv/campus exec playwright install chromium   # einmalig
pnpm --filter @handel-offensiv/campus test:e2e
```

Oder gegen den laufenden Dev-Server (`pnpm dev:campus`, echte Supabase-Keys in `.env.local`) – dann ist die Passwort-vergessen-Antwort die neutrale Bestätigung.

Umgebungsvariablen: `E2E_BASE_URL` (Default `http://localhost:3001`), `PW_CHROMIUM_PATH` (optional: eigene Chromium-Binary, falls die von Playwright erwartete Revision nicht installiert ist), `CI` (2 Retries, GitHub-Reporter, `test.only` verboten).

Die Tests sind bewusst auf öffentliche Pfade beschränkt. Tests mit Sitzung (Heute, Lektionen, Offensivplan) benötigen `supabase start` + Seed und gehören in einen eigenen, backend-abhängigen Job.

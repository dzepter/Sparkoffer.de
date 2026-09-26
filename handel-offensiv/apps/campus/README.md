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

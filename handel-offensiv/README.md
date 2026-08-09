# Handel Offensiv – Der digitale Mannschaftsraum

Lernplattform für das Präsenzprogramm **HANDEL OFFENSIV – Der Führungsführerschein
für den Handel** von Aigner Offensiv.

> Handel ist Mannschaftssport. Führung entscheidet das Spiel.

Die Plattform ergänzt fünf Präsenztage („Offensivtage") – sie ersetzt sie nicht.
Ihre Aufgabe: **Vorbereiten. Vertiefen. Umsetzen. Reflektieren.**

## Bestandteile

| Ordner | Inhalt |
|---|---|
| `apps/mobile` | Native App für iOS & Android (Expo / React Native / TypeScript) |
| `apps/admin` | Admin- & Trainer-Cockpit (Next.js / Tailwind) |
| `packages/types` | Gemeinsame Domain- und Datenbank-Typen |
| `packages/validation` | Zod-Schemas (u. a. Content-Block-Konfiguration) |
| `packages/domain` | RBAC-Capabilities, Release Engine, Fortschrittslogik (reine Funktionen) |
| `packages/config` | Design Tokens & Konstanten |
| `supabase/` | Datenbank-Migrationen, RLS-Policies, Edge Functions, Seed |
| `docs/` | Architektur-, Sicherheits-, Betriebs- und Store-Dokumentation |

## Schnellstart (lokal)

```bash
corepack enable            # aktiviert pnpm
pnpm install
cp .env.example .env       # Werte eintragen (siehe docs/ENVIRONMENT_SETUP.md)

# Supabase lokal (Docker erforderlich)
npx supabase start
npx supabase db reset      # spielt Migrationen + Seed ein

pnpm dev:admin             # Admin-Cockpit auf http://localhost:3000
pnpm dev:mobile            # Expo Dev Server (Expo Go oder Dev Build)
```

## Dokumentation

Einstieg: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) ·
Datenmodell: [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) ·
Rollen & Rechte: [`docs/RBAC.md`](docs/RBAC.md) ·
Sicherheit: [`docs/SECURITY.md`](docs/SECURITY.md) ·
Umsetzungsplan: [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md)

Betrieb & Release: `docs/ENVIRONMENT_SETUP.md`, `docs/RELEASE_GUIDE.md`,
`docs/APP_STORE_CHECKLIST.md`, `docs/GOOGLE_PLAY_CHECKLIST.md`,
`docs/BACKUP_RESTORE.md`

Anleitungen: `docs/ADMIN_GUIDE.md` (Verwaltung), `docs/TRAINER_GUIDE.md` (Trainer)

Noch offene Zulieferungen des Auftraggebers: `docs/NEEDED_FROM_CLIENT.md`

## Grundprinzipien

- **Mandantenfähig ab Tag 1** – Trennung der Kundenunternehmen per Row Level
  Security in der Datenbank, nicht nur im Frontend.
- **Keine öffentliche Registrierung** – Zugang ausschließlich über persönliche
  Einladungen.
- **Datenschutz by Design** – Datenminimierung, private Storage-Buckets,
  Reflexionen standardmäßig privat, EU-Hosting, Löschweg in der App.
- **Kein Onlinekurs-Look** – hochwertig, ruhig, sportlich; Fußballsprache subtil.
- **V1 ohne Bezahlfunktionen** – Zugang kommt über das gebuchte Präsenzprogramm.

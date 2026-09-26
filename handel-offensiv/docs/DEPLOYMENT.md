# Deployment: eine Domain, drei Apps (Vercel `fra1` + Supabase `eu-central-1`)

**Stand: 26.09.2026 – Architekturaktualisierung des Auftraggebers.** Version 1 läuft vollständig unter `handel-offensiv.de`:

| Adresse | Inhalt | App im Monorepo | Vercel-Projekt (Vorschlag) |
|---|---|---|---|
| `https://www.handel-offensiv.de` | öffentliche Website (statisch, bestehende Seiten) | `apps/web` (Website-Shell) | `ho-web` – **Root-Projekt**, bekommt die Domain |
| `https://www.handel-offensiv.de/login` | Teilnehmer-Login | `apps/campus` (Zone „akademie", `basePath: /akademie`) | `ho-akademie` |
| `https://www.handel-offensiv.de/akademie` | geschützte Teilnehmer-Akademie | `apps/campus` | `ho-akademie` |
| `https://www.handel-offensiv.de/admin` | geschützter Admin-/Trainerbereich | `apps/admin` (Zone „admin", `basePath: /admin`) | `ho-admin` |

**Keine produktiven Subdomains** (`campus.`/`admin.aigner-offensiv.de` entfallen). Die Zonen-Projekte haben nur interne Vercel-Hosts (`*.vercel.app`), auf die die Shell per Rewrite zeigt. Interne Vercel-Preview-/Staging-URLs sind ausdrücklich erlaubt.

## 1. Wie die Integration funktioniert (Next.js Multi-Zones)

```
Browser ── https://www.handel-offensiv.de/… ──▶ Vercel-Projekt ho-web (apps/web, fra1)
                                                 ├─ /, /kontakt.html, /assets/…  → statische Website (public/)
                                                 ├─ /login[/…]                   → Rewrite → ho-akademie /akademie/login[/…]
                                                 ├─ /akademie[/…]                → Rewrite → ho-akademie /akademie[/…]
                                                 ├─ /admin[/…]                   → Rewrite → ho-admin    /admin[/…]
                                                 ├─ /login.html, /index.html     → 308 auf /login bzw. /
                                                 ├─ /akademie/login[/…]          → 307 auf /login[/…] (eine kanonische Login-Adresse)
                                                 └─ alles andere                 → public/404.html (Status 404)
```

- **Rewrite statt Redirect:** Die Adresse im Browser bleibt `www.handel-offensiv.de/…`; Cookies, Sicherheits-Header und die Nonce-CSP der Zonen laufen unverändert durch (`apps/web/next.config.ts`).
- **Kein Code neu geschrieben:** Campus und Cockpit bekommen nur `basePath` (`apps/campus/next.config.ts`, `apps/admin/next.config.ts`). Links (`next/link`), `redirect()` und `request.nextUrl` tragen das Präfix automatisch; die drei Stellen mit `new URL("/login", request.url)` wurden auf `request.nextUrl.clone()` umgestellt, die Schriftpfade in `globals.css` tragen das Präfix ausdrücklich.
- **Formulare über die Shell:** Server Actions prüfen den `Origin`-Header gegen den eigenen Host. Weil die Zonen unter dem Host der Shell ausgeliefert werden, ist der Shell-Host in `SERVER_ACTIONS_ALLOWED_ORIGINS` freizugeben (beide Zonen).
- **Getrennte Sitzungen:** Akademie und Cockpit verwenden eigene Cookie-Namen (`ho-akademie-auth` mit Pfad `/`, `ho-admin-auth` mit Pfad `/admin`, `src/lib/supabase/cookie.ts`). Eine Cockpit-Anmeldung ist damit keine Akademie-Anmeldung und umgekehrt; der Browser sendet das Cockpit-Cookie nie an Akademie-Routen.
- **Auth-Mails:** `NEXT_PUBLIC_APP_URL` (Apps) und `APP_BASE_URL` (Edge Functions) enthalten das Präfix (`…/akademie` bzw. `…/admin`); die Callback-Route ist `<Basis>/auth/callback` und steht so in `supabase/config.toml` (`additional_redirect_urls`).
- **Website-CSP:** Die Shell setzt für Website-Seiten eine strenge CSP (`script-src 'self'`, keine Inline-Skripte); für Zonenpfade setzt sie keine Header, dort gelten die Header der Zonen. Die 404-Seite wird deshalb als statische Datei ausgeliefert (`src/app/[...rest]/route.ts`).

Lokal nachvollziehbar (drei Server, Platzhalter-Env, kein Supabase nötig):

```bash
cd handel-offensiv
export NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder \
       SUPABASE_SERVICE_ROLE_KEY=placeholder-service-role RATE_LIMIT_SALT=placeholder-salt-only-for-local-smoke-tests
NEXT_PUBLIC_APP_URL=http://localhost:3100/akademie pnpm build:campus && pnpm --filter @handel-offensiv/campus start &   # 3001
NEXT_PUBLIC_APP_URL=http://localhost:3100/admin    pnpm build:admin  && pnpm --filter @handel-offensiv/admin start &    # 3000
pnpm build:web && pnpm --filter @handel-offensiv/web start &                                                             # 3100 (Shell)
pnpm --filter @handel-offensiv/web test:e2e      # 15 Integrationstests: Rewrites, Redirects, Assets, Header, Formulare
```

## 2. Vercel-Projekte

Alle drei Projekte: Framework Next.js, **Region `fra1`** (`vercel.json` je App), Root Directory = Ordner der App im Monorepo (`apps/web`, `apps/campus`, `apps/admin`), Install Command im Repository-Root (`pnpm install --frozen-lockfile`, Corepack/pnpm 10), Node 22, **Web Analytics und Speed Insights aus** (`REGIONS_AND_DATA_FLOWS.md`).

| Projekt | Root Directory | Build | Domain |
|---|---|---|---|
| `ho-web` | `apps/web` | `pnpm --filter @handel-offensiv/web build` | Production: `www.handel-offensiv.de` (+ Apex-Redirect auf `www`); Staging: Vercel-Host des Branches `staging` |
| `ho-akademie` | `apps/campus` | `pnpm --filter @handel-offensiv/campus build` | nur Vercel-Host (intern) |
| `ho-admin` | `apps/admin` | `pnpm --filter @handel-offensiv/admin build` | nur Vercel-Host (intern) |

**Deployment Protection:** Für die Zonen-Projekte muss der Vercel-Host von der Shell ohne Anmeldung erreichbar sein (sonst liefert der Rewrite die Vercel-Login-Seite). Die Zonen sind selbst auth-gesichert und `noindex`; Schutz für Staging daher **auf der Shell** (Passwortschutz/Vercel-Authentication für `ho-web`-Previews), Zonen-Previews ohne Deployment Protection oder mit „Protection Bypass" – Entscheidung beim Einrichten dokumentieren.

### 2.1 Umgebungsvariablen (nur Namen – Werte ausschließlich in Vercel/Supabase, nie im Repository)

| Variable | `ho-web` | `ho-akademie` | `ho-admin` | Art |
|---|---|---|---|---|
| `AKADEMIE_ZONE_URL`, `ADMIN_ZONE_URL` | ✔ (Vercel-Hosts der Zonen, je Umgebung) | – | – | Konfiguration |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | – | ✔ | ✔ | öffentlich (Build) |
| `SUPABASE_SERVICE_ROLE_KEY` | – | ✔ | ✔ | **Secret** (Vercel „Sensitive") |
| `RATE_LIMIT_SALT` | – | ✔ (gleicher Wert wie Functions) | ✔ | **Secret** |
| `CAMPUS_CLIENT_IP_SECRET` | – | ✔ (gleicher Wert wie Function Secret) | – | **Secret** |
| `NEXT_PUBLIC_APP_URL` | – | `https://www.handel-offensiv.de/akademie` (Staging: `<Shell-Host>/akademie`) | `https://www.handel-offensiv.de/admin` (Staging: `<Shell-Host>/admin`) | Konfiguration |
| `SERVER_ACTIONS_ALLOWED_ORIGINS` | – | `www.handel-offensiv.de,handel-offensiv.de` (Staging: Shell-Host) | dito | Konfiguration (Build) |
| `NEXT_PUBLIC_ADMIN_URL` | – | optional (Default `/admin`) | – | Konfiguration |

Supabase Function Secrets (`supabase/functions/README.md`): `RESEND_API_KEY`, `EMAIL_REPLY_TO`, `EMAIL_SENDER_DOMAIN=mail.handel-offensiv.de`, `APP_BASE_URL=https://www.handel-offensiv.de/akademie`, `RATE_LIMIT_SALT`, `CAMPUS_CLIENT_IP_SECRET`, `CRON_SECRET`.

`.env.example`-Dateien enthalten nur Variablennamen und Platzhalter. Kein Chat, kein Ticket, keine Datei im Repository enthält reale Schlüssel.

## 3. Staging (erster Schritt, sobald Konten vorliegen)

1. **Supabase** `handel-offensiv-staging`, Region `eu-central-1` (beim Anlegen prüfen – nicht änderbar). Migrationen `0001`–`0008` **nur dort** (`supabase db push` gegen das Staging-Projekt), Seed 2027 (`supabase/seed.sql`, `seed-users.mjs` verweigert Nicht-Staging-Ziele). Keine echten Kundendaten. Auth: `site_url` und `additional_redirect_urls` auf den Staging-Shell-Host (+ `/akademie/auth/callback`, `/admin/auth/callback`).
2. **Vercel**: drei Projekte wie oben, Branch `staging` des privaten Repositories; Zonen-Hosts in `ho-web` eintragen, Shell-Host in den Zonen freigeben. Ergebnis: eine Staging-Adresse `https://<ho-web-staging>.vercel.app` mit `/login`, `/akademie`, `/admin`.
3. **Resend** (EU) mit Domain `mail.handel-offensiv.de`; DNS-Einträge nach `EMAIL_DNS_PLAN.md` (Ankündigung, Bestätigung, dann setzen); Zustelltest §5 dort.
4. **Durchlauf** (der entscheidende Test, unverändert): Admin → Teilnehmer einladen → echte E-Mail → Passwort setzen → `/akademie` → freigeschaltete Lektion → Reflexion → Offensivplan → Trainerfreigabe → Trainerfeedback → Fortschritt. Dazu RLS-/Mandantentests (CI grün), MFA für Admin/Trainer, Screenshots Desktop + Mobile, Zwischenbericht.

## 4. Produktion: DNS-Umstellung `www.handel-offensiv.de` → Vercel (**nur nach Bestätigung**)

Heute zeigt `www.handel-offensiv.de` per A-Eintrag auf einen Webspace (IONOS-Adressraum, `217.160.0.88`), Zone bei Strato; die Website liegt dort als statische Dateien mit PHP-Mini-CMS. Für Version 1 muss die Domain auf das Vercel-Projekt `ho-web` zeigen.

- **Exakte Änderung (Strato-DNS, Zone `handel-offensiv.de`):** `www` → `CNAME cname.vercel-dns.com`; Apex `@` → `A 76.76.21.21` (Vercel; leitet auf `www` weiter). Vorher die Domain im Vercel-Projekt `ho-web` hinterlegen (Vercel zeigt die exakten Werte an; ggf. TXT-Verifikation `_vercel`).
- **Nicht angefasst:** MX (`smtpin.rzone.de` bzw. Microsoft 365 – je Domain), bestehende TXT-Einträge, alles unter `mail.` (Resend) und alles der Domain `aigner-offensiv.de`.
- **Auswirkung:** Website kommt von Vercel (gleiche Dateien aus `apps/web/public`), `/login` wird der echte Teilnehmer-Login, `/akademie` und `/admin` werden erreichbar. **Das PHP-Mini-CMS (`cms/admin.php`) entfällt** – vorher `cms/content.json` vom Webspace sichern und die dort gepflegten Texte in die HTML-Dateien übernehmen (`apps/web/strato-legacy/README.md`). Propagation bis 24 h; Vercel stellt das TLS-Zertifikat automatisch aus.
- **Rollback:** A-Eintrag `www`/Apex auf `217.160.0.88` zurücksetzen (Webspace bleibt mindestens 30 Tage unverändert bestehen); Wirkung nach TTL.

Bis zur Bestätigung dieser Änderung bleibt die Website unverändert auf dem Webspace; Staging läuft parallel unter Vercel-Hosts.

## 5. Betrieb, Prüfungen

- CI (`.github/workflows/handel-offensiv-ci.yml`): Typecheck, Lint, Unit- und RLS-Tests, `deno check`, Builds aller drei Apps, Smoke-Tests je Zone und **Integrationstests Shell + Zonen** (`apps/web/e2e`).
- Vor jedem Produktions-Deploy: `REGIONS_AND_DATA_FLOWS.md` §2 abhaken, `SECURITY.md` Kap. 0 Status.
- Später (Phase 5): Redaktion der Website im Cockpit; `apps/web` wird dann von der statischen Shell zur Next.js-Website – die Zonen-Rewrites bleiben.

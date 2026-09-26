# Architekturaktualisierung: alles unter `handel-offensiv.de` – Umsetzung und Stand

**Stand: 26.09.2026 · Branch `claude/aigner-offensiv-redesign-fpxwht` · Grundlage: Architekturaktualisierung des Auftraggebers nach Freigabe von Phase 2.**

## 1. Zielstruktur (umgesetzt im Code, lokal geprüft)

| Adresse | Inhalt | Umsetzung |
|---|---|---|
| `https://www.handel-offensiv.de` | öffentliche Website | Website-Shell `apps/web` (Vercel-Root-Projekt): bestehende statische Website unverändert aus `public/`, Navigation zeigt auf `/login` |
| `https://www.handel-offensiv.de/login` | Teilnehmer-Login | Rewrite der Shell auf die Akademie (`apps/campus`), Adresse bleibt `/login`; `/akademie/login` leitet auf `/login` (eine kanonische Adresse) |
| `https://www.handel-offensiv.de/akademie` | geschützte Teilnehmer-Akademie | `apps/campus` mit `basePath: /akademie` |
| `https://www.handel-offensiv.de/admin` | geschützter Admin-/Trainerbereich | `apps/admin` mit `basePath: /admin` |

Keine produktiven Subdomains. Die Zonen haben nur interne Vercel-Hosts, auf die die Shell per Rewrite zeigt (`docs/DEPLOYMENT.md`).

## 2. Was geändert wurde (ohne funktionierenden Code neu zu schreiben)

- **`apps/campus`, `apps/admin`:** `basePath` in `next.config.ts`; Freigabe des Shell-Hosts für Formulare (`SERVER_ACTIONS_ALLOWED_ORIGINS`); drei Weiterleitungen, die `new URL("/login", request.url)` nutzten, auf `request.nextUrl.clone()` umgestellt (Logout, Kalender-Downloads); Schriftpfade in `globals.css` mit Präfix; Profil-Link „Zum Cockpit" = `/admin` (gleicher Host); Basis-URLs für Auth-Mails enthalten das Präfix.
- **Getrennte Sitzungen:** eigene Cookie-Namen `ho-akademie-auth` (Pfad `/`) und `ho-admin-auth` (Pfad `/admin`). Vorher hätten beide Apps unter einem Host dasselbe Supabase-Cookie geteilt: Cockpit-Anmeldung = Akademie-Anmeldung, Logout in einer App = Logout in beiden.
- **`apps/web` (neu, klein):** Next.js-Shell mit Rewrites/Redirects/Sicherheits-Headern, statische Website in `public/`, 404 aus `public/404.html`. Strato-spezifische Dateien (`.htaccess`, PHP-Mini-CMS, Upload-Anleitung) liegen in `apps/web/strato-legacy/` mit Hinweisen.
- **E-Mail:** Standardabsender `Handel Offensiv Akademie <akademie@mail.handel-offensiv.de>`, erlaubte Absenderdomain `mail.handel-offensiv.de`; Supabase-Auth-Redirects auf `/akademie/auth/callback` und `/admin/auth/callback`; Einladungslinks auf `<Basis>/akademie/einladung`.
- **CI:** Build der Shell, Cockpit-Smoke-Tests mit eigenem Server, neuer Job **Integration Shell + Zonen** (drei Server, 15 Tests).
- **Dokumente:** `DEPLOYMENT.md` (neu), `EMAIL_DNS_PLAN.md` (neu gefasst), `ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md`, `REGIONS_AND_DATA_FLOWS.md`, `NEEDED_FROM_CLIENT.md`, `CURRENT_STATE.md`, `README.md`.

## 3. Prüfung

| Prüfung | Ergebnis |
|---|---|
| Typecheck (10 Pakete, inkl. `apps/web`) | ✔ |
| ESLint Shell, Akademie, Cockpit (0 Warnungen) | ✔ |
| Unit-Tests domain/validation | ✔ 143 |
| RLS-/DB-Tests inkl. E-Mail-Kern (neue Absenderdomain) | ✔ 144 |
| `deno check` (5 Edge Functions) | ✔ |
| Production-Builds Akademie (`/akademie`), Cockpit (`/admin`), Shell | ✔ |
| Playwright Akademie direkt (Zone) | ✔ 20/20 |
| Playwright Cockpit direkt (Zone) | ✔ 3/3 |
| **Playwright Integration über die Shell** (`/`, `/login`, `/akademie/*`, `/admin/*`): Rewrites, Redirects `login.html`/`index.html`/`/akademie/login`, Assets aus `/akademie/_next` bzw. `/admin/_next`, Header-Durchleitung (noindex, Nonce-CSP) vs. Website-CSP, statische 404, Formulare (Passwort vergessen, Cockpit-Login) über die Shell ohne Cross-Origin-Fehler | ✔ 15/15 |

Screenshots (Desktop 1440 px, Mobil 390 px, alles über die Shell auf einem Host): `docs/design/screenshots/eine-domain-{website,login,akademie-einladung,admin-login,404}-{desktop,mobile}.png`.

## 4. Offene Punkte und Hinweise

1. **PHP-Mini-CMS entfällt** mit dem Umzug der Website auf Vercel (kein PHP). Vor der DNS-Umstellung: aktuelle `cms/content.json` vom Webspace sichern und Texte in die HTML-Dateien übernehmen. Redaktion später im Cockpit (Phase 5).
2. **Live-Website heute:** bleibt bis zur bestätigten DNS-Umstellung unverändert auf dem Webspace. Die Repository-Fassung verlinkt bereits `/login`; ein erneuter Upload auf den alten Webspace wäre ohne Rückbau dieses Links nicht sinnvoll (`apps/web/strato-legacy/README.md`).
3. **Benennung:** Die Oberfläche heißt weiterhin „HANDEL OFFENSIV CAMPUS", der Pfad `/akademie` und der Absender „Handel Offensiv Akademie" folgen der Zielstruktur. Falls die Oberfläche durchgängig „Akademie" heißen soll: kurze Rückmeldung, dann werden die Texte angepasst (kein Komfortfeature, reine Wortwahl).
4. **Reply-To-Postfach** (Microsoft 365) wird separat geliefert; bis dahin Vorschlag `info@aigner-offensiv.de`.
5. Optional, separat zu entscheiden: eigener DMARC-Eintrag für die Hauptdomain `handel-offensiv.de` (heute ohne SPF/DMARC) – nicht Teil dieser Umstellung.

## 5. Angekündigte produktive Änderungen – **noch nichts ausgeführt, Bestätigung erforderlich**

**A) DNS für E-Mail (Zone `handel-offensiv.de`, Strato):** vier neue Einträge unter `mail.handel-offensiv.de` (DKIM-TXT, MX + SPF-TXT für `send.mail`, DMARC-TXT) mit den Werten aus dem Resend-Dashboard. Auswirkung: keine auf bestehende Mails (andere Hostnamen); bis zur Verifizierung kein Systemversand. Rollback: Einträge löschen.

**B) DNS für die Website (später, nach Staging-Abnahme):** `www` → `CNAME cname.vercel-dns.com`, Apex `@` → `A 76.76.21.21` (Vercel). MX, TXT und alles unter `mail.` unberührt. Auswirkung: Website von Vercel, `/login`, `/akademie`, `/admin` erreichbar, PHP-CMS entfällt. Rollback: A-Eintrag auf `217.160.0.88` (heutiger Webspace, bleibt ≥ 30 Tage bestehen).

**C) Datenbank:** Migrationen `0001`–`0008` ausschließlich auf das leere Staging-Projekt `handel-offensiv-staging` (eu-central-1), Seed nur 2027. Rollback: Projekt zurücksetzen. Kein Produktionsprojekt.

## 6. Nächster Schritt (sobald Konten vorliegen)

Staging-Deployment (drei Vercel-Projekte, `fra1`) → Migrationen auf Staging → Seed 2027 → DNS A nach Bestätigung → echte Test-E-Mail → kompletter Vertical Slice (Admin → Einladung → E-Mail → Passwort → `/akademie` → Lektion → Reflexion → Offensivplan → Trainerfreigabe → Feedback → Fortschritt) → RLS-/Mandantentests → MFA für Admin/Trainer → Screenshots → Zwischenbericht. Bis dahin keine weiteren Komfortfeatures.

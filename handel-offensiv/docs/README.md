# Dokumentation – Übersicht und Status

Stand: 26.09.2026 · Grundlage: Master-Prompt September 2026 (`briefings/2026-09-26_MASTER_PROMPT.md`)

| Dokument | Zweck | Version | Status |
|---|---|---|---|
| `CURRENT_STATE.md` | Bestandsaufnahme: Domains, Live-Sites, Repository, Plattform, Design, Inhalte, Recht, Integrationsbefunde, Deckungsgrad | v2 | **aktuell** (Analyse-Ergebnis; nach jeder Phase fortschreiben) |
| `ARCHITECTURE.md` | Zielbild: Website · Campus · Admin auf gemeinsamem Backend | v2 | **Entwurf zur Freigabe** |
| `IMPLEMENTATION_PLAN.md` | Sitemaps, Vertical Slice, Phasen 0–9, Migration/Redirects, Lücken, Risiken, offene Entscheidungen K‑1…K‑13 | v2 | **Entwurf zur Freigabe** |
| `DATA_MODEL.md` | Kapitel 0: Änderungen v2 · Kapitel 1–13: Modell der Version 1 (teilweise vom Schema abweichende Namen – maßgeblich sind Migrationen und Kapitel 0) | v2/v1 | Kap. 0 aktuell; Kap. 1 ff. Angleichung in Phase 1 |
| `RBAC.md` | Kapitel 0: Änderungen v2 · Kapitel 1–8: Rollenmodell v1 (Matrix Kap. 3 weicht in Org-Admin-Rechten vom Code ab – maßgeblich `packages/domain`) | v2/v1 | Kap. 0 aktuell; Kap. 3 Angleichung in Phase 1 |
| `SECURITY.md` | Kapitel 0: Befunde S‑1…S‑20 · Kapitel 1–15: Sicherheitskonzept (teils Zielzustand als Gegenwart formuliert) | v2/v1 | Kap. 0 aktuell; Kap. 1 ff. Angleichung in Phase 7 |
| `NEEDED_FROM_CLIENT.md` | Entscheidungen und Zulieferungen des Kunden je Phase | v2 | aktuell |
| `PHASE1_ZWISCHENBERICHT.md` | Zwischenbericht nach Phase 1 (A–H): behobene Befunde, Restrisiken, Migrationen, Testresultate, CI, Screenshots, nächster Schritt | – | abgenommen (Freigabe 26.09.2026) |
| `PHASE2_ZWISCHENBERICHT.md` | Zwischenbericht Phase 2 (Code): Web-Campus `apps/campus`, `packages/ui`, Quiz serverseitig (0007), Rate Limit (0008), CSP, Smoke-Tests | – | abgenommen (Freigabe 26.09.2026) |
| `ARCHITEKTUR_UPDATE_EINE_DOMAIN.md` | Bericht zur Architekturaktualisierung: alles unter `handel-offensiv.de` (`/login`, `/akademie`, `/admin`), Website-Shell `apps/web`, Cookie-Trennung, E-Mail-Domain, Tests | – | **zur Kenntnis; DNS-Änderungen warten auf Bestätigung** |
| `DEPLOYMENT.md` | Vercel-Projekte (Shell + zwei Zonen, `fra1`), Umgebungsvariablen (nur Namen), Staging-Ablauf, DNS-Umstellung `www` mit Ankündigung/Rollback | – | aktuell |
| `DESIGN_TOKENS.md` | Palette v2 Navy/Off-White/Gold, Kontrastnachweis, Vergleich mit handel-offensiv.de | v2 | aktuell |
| `REGIONS_AND_DATA_FLOWS.md` | Alle Dienste mit Regionsbezug (Frankfurt-Vorgabe), Prüfliste vor Produktion | – | aktuell |
| `EMAIL_DNS_PLAN.md` | Resend über `mail.handel-offensiv.de`: DNS-Einträge, Ankündigung, Zustelltest | – | aktuell; DNS-Bestätigung und Zustelltest offen |
| `WORDPRESS_BACKUP_UND_HAERTUNG.md` | Vollbackup, Sofortmaßnahmen, PHP-Umstellung nur über Staging | – | aktuell |
| `supabase/tests/` | RLS-Regressionstests (Vitest + PostgreSQL 16, Supabase-Shim) | – | grün (144 Tests) |
| `ADMIN_GUIDE.md`, `TRAINER_GUIDE.md` | Anleitungen Cockpit | v1 | **überholt** (Banner) – Neufassung nach Phase 4/5, zusätzlich Campus-Handbuch |
| `RELEASE_GUIDE.md`, `APP_STORE_CHECKLIST.md`, `GOOGLE_PLAY_CHECKLIST.md` | Native App / Stores | v1 | überholt (Banner) – Phase 9 |
| `ENVIRONMENT_SETUP.md`, `BACKUP_RESTORE.md`, `PRIVACY_TECHNICAL.md` | Betrieb, Backup, technischer Datenschutz | v1 | überholt (Banner) – Ergänzung um Campus/Website in Phase 1/7 |
| `archive/aigner-offensiv-wordpress-2026-09/` | Sicherung der alten WordPress-Site (Texte, Indizes, Logo) | – | abgeschlossen |
| `briefings/2026-09-26_MASTER_PROMPT.md` | Kundenbriefing (Master-Prompt) in der hier verwendeten Gliederung §1–§54 | – | Referenz. **Achtung:** ältere Dokumente und Code-Kommentare zitieren §‑Nummern eines früheren Briefings (Sommer 2026, §1–§63), das nicht im Repository liegt; dieselben Nummern bedeuten dort etwas anderes. |

**Lesereihenfolge für die Freigabe:** `CURRENT_STATE.md` → `ARCHITECTURE.md` → `IMPLEMENTATION_PLAN.md` (Abschnitt 7: Entscheidungen) → `NEEDED_FROM_CLIENT.md`.

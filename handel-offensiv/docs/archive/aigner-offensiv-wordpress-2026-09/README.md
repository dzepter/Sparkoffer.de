# Archiv: www.aigner-offensiv.de (WordPress) – Stand 26.09.2026

Sicherung der bis dahin live geschalteten WordPress-Website **vor** dem Relaunch
(Master-Prompt §1: „Bestehende Inhalte und SEO-relevante URLs zuerst sichern").

| Datei | Inhalt |
|---|---|
| `page-*.md` | 11 Seiten, Text aus dem gerenderten HTML extrahiert (die REST-API liefert für Seiten leere Inhalte, da das Theme Inhalte außerhalb des Beitragstexts baut) |
| `post-*.md` | 5 Blogartikel (2020) mit vollem Text aus der REST-API |
| `*.raw.html` | Roh-HTML zur Nachprüfung |
| `INDEX.json` | Beiträge/Seiten aus der REST-API (URL, Titel, Datum, Wortzahl, Bilder) |
| `PAGES_INDEX.json` | Gerenderte Seiten (URL, Titel, Meta-Description, Wortzahl, verwendete Upload-Bilder) |
| `MEDIA.json` | Medienbibliothek (76 Dateien mit URL, Maßen) |
| `media/` | Altes Logo (`logo.jpg`, `aigner-offensiv.png`) sowie die **drei echten Fotos von Rainer Aigner** der alten Site – grün eingefärbt, Originale beim Kunden anzufordern: `10.png` (freigestelltes Porträt, 800×1045, aus dem Theme-Ordner), `vortrag-1-1.jpg` (vor Gebäude, 2000×850), `vortrag-2.jpg` (Bühne, 2000×850). Die übrigen Medien (`stage-aigner-*.jpg`, `lust-auf-erfolg.jpg` …) sind eingefärbte Stock-Grafiken und bleiben über `MEDIA.json` erreichbar, solange die alte Site läuft. Hinweis: Die `*.raw.html`-Dateien liegen nicht im Repo (nur Scratch), die Markdown-Fassungen sind vollständig. |

Redirect-Karte (alte → neue URLs) siehe `docs/IMPLEMENTATION_PLAN.md`, Abschnitt Migration.

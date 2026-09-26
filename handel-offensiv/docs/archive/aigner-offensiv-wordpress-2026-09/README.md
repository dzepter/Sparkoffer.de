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
| `media/` | Nur das alte Logo (`logo.jpg`, `aigner-offensiv.png`). Die übrigen Medien sind eingefärbte Stock-Grafiken (u. a. `stage-aigner-*.jpg`, `lust-auf-erfolg.jpg`) – keine authentischen Fotos; sie bleiben über die URLs in `MEDIA.json` erreichbar, solange die alte Site läuft. |

Redirect-Karte (alte → neue URLs) siehe `docs/IMPLEMENTATION_PLAN.md`, Abschnitt Migration.

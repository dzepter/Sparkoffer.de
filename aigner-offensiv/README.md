# Aigner Offensiv – Neue Website

Moderner Neuaufbau von **www.aigner-offensiv.de** als schnelle, statische Website –
ohne Baukasten, ohne WordPress, ohne externe Dienste.

## Seiten

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite: Hero, Kennzahlen, drei Säulen, Handlungsmodell, Buch, Teilnehmerstimmen |
| `ueber-rainer-aigner.html` | Vita und Stationen von Rainer Aigner |
| `leistungen.html` | Führung & Coaching, Vertrieb, High Potentials intern, Generation Y |
| `learn-to-lead.html` | Das Zertifizierungsprogramm mit allen 12 Modulen |
| `vortraege.html` | Vortragsthemen und Teilnehmerstimmen |
| `impulse.html` | Die fünf Blog-Artikel („Abkürzungen“ u. a.) zum Aufklappen |
| `bestellung.html` | Bestellformular für das Buch „Lust auf Erfolg“ |
| `kontakt.html` | Kontaktdaten, Öffnungszeiten, Formular |
| `impressum.html` / `datenschutz.html` | Pflichtseiten |
| `404.html` | Fehlerseite |

## Technik

- **Reines HTML/CSS/JS** – keine Frameworks, keine Abhängigkeiten, kein Build-Schritt.
- **DSGVO-freundlich:** Schriften (Archivo) werden lokal gehostet, keine Cookies,
  kein Tracking, keine externen Einbindungen. Das Kontaktformular öffnet nur das
  E-Mail-Programm des Besuchers – es überträgt selbst keine Daten.
- Responsiv (Mobil bis Desktop), Barrierefreiheit: Skiplink, Tastatur-Navigation,
  reduzierte Animationen bei `prefers-reduced-motion`.

## Veröffentlichen

Einfach den kompletten Ordner `aigner-offensiv/` zu einem beliebigen Hoster
hochladen (z. B. per FTP zum bisherigen Webspace, oder kostenlos bei
GitHub Pages, Netlify, Render Static Site). Es wird kein PHP und keine
Datenbank benötigt.

## Hinweise

- **Termine:** Auf den Seiten steht derzeit „Termine auf Anfrage“ – konkrete
  Seminar-/Vortragstermine einfach in `learn-to-lead.html` bzw. `vortraege.html` ergänzen.
- **Rechtstexte:** Impressum wurde von der alten Website übernommen; die
  Datenschutzerklärung wurde an die neue, technisch schlankere Website angepasst.
  Beide bitte vor Veröffentlichung noch einmal juristisch prüfen (lassen).
- **Bilder:** Die Fotos stammen von der bisherigen Website und werden per CSS
  modern eingefärbt. Eigene, aktuelle Fotos (z. B. ein Porträt und echte
  Vortragsbilder) würden die Seite noch stärker machen – einfach die Dateien in
  `assets/img/` austauschen.

# Rechner-Portal 🧮 – deine AdSense-Website

Eine komplette Website mit **23 deutschen Online-Rechnern** (Brutto-Netto, Kredit,
BMI, Benzinkosten u. v. m.), die über **Google-AdSense-Werbung** Geld verdient.
Statisch gebaut = blitzschnell, kostenlos zu hosten, praktisch wartungsfrei.

## Wie die Seite Geld verdient
Menschen googeln Alltagsfragen („2800 brutto wieviel netto“), landen auf deinem
Rechner, und Google zeigt dort bezahlte Werbung. Du bekommst ~80 % dessen, was
Werbetreibende zahlen – ausgezahlt monatlich ab 70 € Guthaben. Besucher zahlen nie
etwas. Faustregel Deutschland: 2–5 € pro 1.000 Aufrufe bei Alltagsthemen, 8–25 €
bei Finanzthemen.

## Schnellstart (einmalig, ca. 1–2 Stunden)

### 1. Domain kaufen (~10–15 €/Jahr)
Kurz, deutsch, merkbar – z. B. bei INWX, Namecheap oder IONOS. Ideen zum Prüfen:
`alltagsrechner24.de`, `rechnerheld.de`, `schnellrechner.net` … (Verfügbarkeit checken!)

### 2. Konfiguration eintragen
`site.config.json` öffnen und ausfüllen:
- `siteName` – Name der Seite (z. B. „AlltagsRechner24“)
- `siteUrl` – deine Domain mit https://
- `impressum` – **Name, Adresse, E-Mail sind Pflicht!** Ohne vollständiges
  Impressum ist die Seite in Deutschland nicht zulässig und AdSense lehnt ab.
- `adsenseClient` bleibt zunächst leer (kommt in Schritt 5)

### 3. Lokal bauen und ansehen (optional)
```
node build.js          # erzeugt den Ordner dist/
```
Dann `dist/index.html` im Browser öffnen.

### 4. Kostenlos veröffentlichen
Empfehlung: **Cloudflare Pages** oder **Render (Static Site)** – beide gratis,
ohne Einschlafen, mit SSL:
- Render: New → **Static Site** → dieses Repository wählen →
  Root Directory: `rechner-portal`, Build Command: `node build.js`,
  Publish Directory: `dist` → Create. Danach unter „Custom Domains" deine Domain
  verbinden (DNS-Eintrag wie angezeigt setzen).

### 5. Bei Google AdSense bewerben
1. [adsense.google.com](https://adsense.google.com) → Konto erstellen, Domain angeben.
2. Warten bis die Seite **2–4 Wochen online und in Google indexiert** ist
   (Google Search Console einrichten und Sitemap `deine-domain.de/sitemap.xml`
   einreichen – das beschleunigt beides).
3. Nach der Freischaltung: deine `ca-pub-…`-Nummer in `site.config.json` bei
   `adsenseClient` eintragen → neu deployen (bei Render: einfach committen).
   Der Build erzeugt dann automatisch alle Werbeblöcke **und die ads.txt**.
4. In AdSense unter „Datenschutz & Mitteilungen" die **EU-Einwilligungsabfrage
   (CMP)** aktivieren – Pflicht für Besucher aus der EU, sonst keine Anzeigen.

## Dein 10-Stunden-Wochenplan
- **~4 h: Neue Rechner.** Jede Woche 1–2 Rechner ergänzen (Vorlage: jede Datei in
  `calculators/` – Struktur kopieren, Inhalte anpassen, `node build.js`). Ideen:
  Elterngeld, Kurzarbeit, Notendurchschnitt, Fliesenbedarf, Pool-Volumen,
  Zeitzonen, Wärmepumpen-Stromkosten … Ziel: 50+ Rechner nach 6 Monaten.
  Du kannst dir jeden neuen Rechner auch von Claude bauen lassen.
- **~3 h: Bekanntmachen.** Rechner in passenden Kontexten verlinken (eigene
  Pinterest-Pins, hilfreiche Antworten in Foren/Facebook-Gruppen mit Link,
  gutefrage.net), 1–2 Webkataloge/Branchenverzeichnisse pro Woche.
- **~2 h: Beobachten.** Google Search Console: Welche Rechner bekommen
  Impressionen? Deren Texte ausbauen (mehr FAQ, Beispiele) – das hebt Rankings.
- **~1 h: Puffer/Ideen.**

## Budgetvorschlag für 2.500 €
| Posten | ca. |
|---|---|
| Domain (2 Jahre) | 30 € |
| Hosting | 0 € (statisch = gratis) |
| Logo (optional, Fiverr) | 50 € |
| 15–20 begleitende Ratgeber-Artikel schreiben lassen (bringen Google-Traffic auf die Rechner) | 1.200 € |
| Gezielter Linkaufbau: Gastbeiträge/Erwähnungen auf themennahen Blogs | 600 € |
| Reserve (Rechtstexte prüfen, Tools, Tests) | 620 € |

## Ehrliche Erwartungen
- **Monat 1–4: ~0 €.** Neue Domains brauchen Monate, bis Google ihnen vertraut.
  Das ist normal – nicht aufgeben, weiter Rechner ergänzen.
- **Monat 6–12:** bei stetigem Ausbau realistisch 50–300 €/Monat, danach wachsend.
  Große Rechnerportale erreichen fünfstellige Monatsbesucherzahlen – aber erst
  nach 1–2 Jahren konsequenter Arbeit.
- **Niemals:** selbst auf eigene Anzeigen klicken oder Klicks organisieren, und
  keinen Traffic per Google Ads einkaufen, nur um AdSense-Erlöse zu erzeugen –
  beides führt zur Kontosperrung.
- Die Rechner-Ergebnisse sind Näherungen mit Disclaimern (Steuer, Gesundheit).
  Halte die Jahreszahlen aktuell (z. B. Steuertarif in
  `calculators/brutto-netto.js` jährlich anpassen).

## Technik-Überblick
- `build.js` – Generator: baut aus `calculators/*.js` die fertige Seite in `dist/`
- `site.config.json` – Name, Domain, AdSense-ID, Impressum
- `calculators/*.js` – je Datei ein Rechner: Formular, Rechenlogik (läuft im
  Browser), SEO-Texte, FAQ (wird auch als strukturierte Daten für Google ausgegeben)
- Keine Datenbank, kein Server, keine Abhängigkeiten – nur Node.js zum Bauen.

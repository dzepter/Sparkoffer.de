# Vom Auftraggeber zu bestätigende Inhalte

Diese Liste dokumentiert alle Angaben, die vor dem Livegang bestätigt oder
nachgeliefert werden müssen. Kein Punkt blockiert die Entwicklung – die
Website verwendet bis dahin zurückhaltende Formulierungen oder Platzhalter.

## Inhalte / Fakten

- [ ] **Biografische Angaben Rainer Aigner** (`src/content/rainer.ts`):
      Stationen 1860 München / FC Bayern / Fortuna Düsseldorf,
      „16 Firmen in 20 Jahren“, „über 1.000 Arbeitsplätze“,
      „über 100 Vorträge“ – alle Zahlen von der bisherigen Website
      übernommen, vor Veröffentlichung bestätigen.
- [ ] **Testimonials** (`src/content/testimonials.ts`): Freigaben weiterhin
      gültig? Namen/Funktionen aktuell? (Dr. Würmseher/Isoware,
      A. Gelbert/Redseven, Dr. Braun/REDPOINT.TESEON)
- [ ] **Mobilnummer** 0157 733 888 55 (`src/content/site.ts`): weiterhin
      gültig und gewünscht?
- [ ] **Erreichbarkeitszeiten** Mo–Fr 08–18 Uhr: bestätigen.
- [ ] **Vortragsdauern** (`src/content/impulse.ts`): aktuell bewusst
      „nach Vereinbarung“ – konkrete Dauern nachtragen, falls gewünscht.
- [ ] **Programm-Rahmendaten** (`src/content/program.ts`): Gruppengröße,
      Abstände zwischen den Offensivtagen, konkrete Dauer je Tag – derzeit
      bewusst unverbindlich formuliert.
- [ ] **Buch „Lust auf Erfolg“**: weiterhin lieferbar? Preis/Bestellweg?
      (Derzeit: „Erhältlich auf Anfrage“ ohne Preis.)
- [ ] **Zitat-Freigabe**: „Aus Wissen Können machen.“ wird als Leitsatz der
      Marke dargestellt, nicht als wörtliches Zitat – bei Freigabe durch
      Rainer Aigner kann es als persönliches Zitat gekennzeichnet werden.
- [ ] **Domain**: Es wird von www.aigner-offensiv.de als Produktionsdomain
      ausgegangen (`src/content/site.ts` → `siteConfig.url`).
- [ ] **Kontaktformular – Feld „Bevorzugter Veranstaltungsort“**: derzeit
      optional umgesetzt (niedrigschwellige Anfrage). Klären, ob es ein
      Pflichtfeld sein soll.
- [ ] **Hinweis Impressum**: Auf der bisherigen Website war der DSA als
      „Verordnung (EU) 2022/265“ zitiert – korrekt ist 2022/2065; im neuen
      Impressum bereits korrigiert, alte Website ggf. ebenfalls anpassen.

## Bilder (siehe PHOTO-GUIDE.md)

- [ ] 4 Porträtfotos als Dateien nachliefern (Zuordnung im PHOTO-GUIDE).
- [ ] Originale ohne Grünfilter für Bühnen-/Fassadenfoto.
- [ ] Buchcover in höherer Auflösung.
- [ ] Logo als Vektordatei (SVG), falls vorhanden.
- [ ] „Mia san mia“-Poster: Markenrechte (FC-Bayern-Logo) klären, bevor es
      verwendet werden darf.

## Rechtliches

- [ ] **Impressum**: Angaben (HRB 152556, USt-ID DE 234431321, Fax) auf
      Aktualität prüfen.
- [ ] **Datenschutzerklärung**: rechtliche Prüfung durch qualifizierte
      Stelle. Abschnitte zu Google Analytics, YouTube, Borlabs Cookie und
      reCAPTCHA/Turnstile wurden entfernt (Dienste werden nicht mehr
      eingesetzt); Abschnitt „Kontaktformular“ ist neu.
- [ ] **Hosting-Abschnitt** der Datenschutzerklärung: derzeit Strato (wie
      bisher). Falls die neue Website woanders gehostet wird (z. B. Vercel,
      eigener Node-Server), Abschnitt anpassen und AVV schließen.
- [ ] **Barrierefreiheitserklärung**: falls gewünscht/erforderlich, ergänzen.

## Technik vor Livegang

- [ ] SMTP-Zugangsdaten als Umgebungsvariablen setzen (siehe .env.example).
- [ ] Finale Domain in `src/content/site.ts` prüfen.
- [ ] Backup der alten WordPress-Website erstellen.
- [ ] DNS-Umstellung und Weiterleitungstest aller alten URLs
      (Liste in `next.config.ts`).

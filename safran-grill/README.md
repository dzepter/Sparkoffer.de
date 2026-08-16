# Safran Grill – Website

Produktionsreife Website für **Safran Grill**, Hauptstraße 115, 67433 Neustadt an der Weinstraße.

Next.js (App Router, TypeScript, Tailwind CSS 4), vollständig statisch gerendert, ohne Tracker, ohne externe Fonts, ohne Cookie-Banner-Pflicht.

## Entwicklung

```bash
npm install
npm run dev     # Entwicklung auf http://localhost:3000
npm run build   # Produktions-Build
npm start       # Produktionsserver
npm run lint    # ESLint
```

## Wo wird was gepflegt?

| Inhalt | Datei |
| --- | --- |
| Name, Adresse, Telefon, Öffnungszeiten, Links, Buffet (Preis/Zeiten/an-aus) | `lib/restaurant-config.ts` |
| Speisekarte (Kategorien, Gerichte, Preise) | `lib/menu-data.ts` |
| Bilder & Alt-Texte | `lib/images.ts` + `public/images/restaurant/` |
| Domain | `NEXT_PUBLIC_SITE_URL` (Env) bzw. Fallback in `lib/restaurant-config.ts` |

Alle Seiten, Metadaten und das JSON-LD (Schema.org `Restaurant`) lesen aus
`lib/restaurant-config.ts` – Geschäftsdaten werden nirgendwo doppelt gepflegt.

### Buffet abschalten oder Preis ändern

In `lib/restaurant-config.ts` → `buffet`: `enabled: false` blendet den
Buffet-Abschnitt der Startseite aus; `price`, `regularPrice` und `times`
steuern alle Preis-/Zeitangaben der Website.

### Gericht ergänzen

In `lib/menu-data.ts` in der passenden Kategorie:

```ts
{ name: "Qabuli Palau", description: "…", price: "14,50 €", tags: ["vegetarisch"] }
```

`available: false` zeigt „zurzeit nicht verfügbar" statt des Preises.

## Datenherkunft (Stand August 2026)

- **NAP, Öffnungszeiten, Koordinaten, Bewertung**: verifiziert gegen das
  öffentliche Google-Unternehmensprofil (Place ID `ChIJB7PZ5dVJlkcRjOhvvpceJYI`).
- **Speisekarte**: übernommen aus der Lieferando-Karte
  (vom Auftraggeber bereitgestellte Aufnahme). Preise = Lieferando-Preise;
  Hinweis auf mögliche Abweichungen im Restaurant steht auf der Seite.
- **Buffet**: Preis/Zeiten laut Werbeplakat des Restaurants
  (10,00 € statt regulär 20–25 €, jeden Tag außer Dienstag, 11–22 Uhr).
- **Fotos**: Google-Unternehmensprofil + vom Eigentümer bereitgestellte
  Aufnahmen; Verwendung ausdrücklich freigegeben. Die Buffet-Bilder sind
  Video-Stills (1170 px) – sie können später 1:1 durch hochauflösende
  Originale ersetzt werden (gleiche Dateinamen in
  `public/images/restaurant/`, Maße in `lib/images.ts` anpassen).

## Offene Punkte vor dem Livegang (TODO)

1. **Domain**: `NEXT_PUBLIC_SITE_URL` setzen (steuert Canonicals, Sitemap,
   OG-URLs, JSON-LD). Aktueller Platzhalter: `https://www.safran-grill-neustadt.de`.
2. **Impressum** (`app/impressum/page.tsx`): Inhaber-Name, E-Mail und ggf.
   USt-IdNr. ergänzen – Platzhalter sind mit `[BITTE ERGÄNZEN]` markiert.
   Ohne vollständiges Impressum nicht veröffentlichen.
3. **Datenschutz** (`app/datenschutz/page.tsx`): verantwortliche Person und
   Hosting-Anbieter eintragen, rechtlich prüfen lassen.
4. **Öffnungszeiten & Buffet-Preis** kurz vor Livegang noch einmal mit dem
   Eigentümer bestätigen (`verifyBeforePublish` in der Config).
5. Nach dem Livegang: Website im Google-Unternehmensprofil eintragen
   (dort ist aktuell keine Website hinterlegt) und Sitemap in der Google
   Search Console einreichen.

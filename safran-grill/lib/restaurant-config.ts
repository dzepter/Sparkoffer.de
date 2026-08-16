/**
 * Zentrale Restaurant-Konfiguration für Safran Grill.
 *
 * Alle Geschäftsdaten (Name, Adresse, Telefon, Öffnungszeiten, Links, Buffet)
 * leben ausschließlich hier. Komponenten, Metadata und JSON-LD lesen aus
 * dieser Datei – nichts davon wird in Komponenten hart codiert.
 *
 * Verifiziert am 16.08.2026 gegen das öffentliche Google-Unternehmensprofil
 * (Place ID ChIJB7PZ5dVJlkcRjOhvvpceJYI).
 */

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  // TODO(Domain): Vor dem Livegang durch die echte Domain ersetzen bzw.
  // NEXT_PUBLIC_SITE_URL im Hosting setzen.
  "https://www.safran-grill-neustadt.de";

export interface OpeningHoursDay {
  /** Wochentag, ausgeschrieben (Anzeige) */
  day: string;
  /** Schema.org-Kürzel für openingHoursSpecification */
  schemaDay: string;
  /** "11:00" – null, wenn geschlossen */
  opens: string | null;
  /** "22:00" – null, wenn geschlossen */
  closes: string | null;
}

export const restaurant = {
  name: "Safran Grill",
  /** Kurzbeschreibung für Metadaten und strukturierte Daten */
  tagline: "Afghanische Küche, Grillgerichte und Buffet in Neustadt an der Weinstraße",

  address: {
    street: "Hauptstraße 115",
    zip: "67433",
    city: "Neustadt an der Weinstraße",
    country: "Deutschland",
    countryCode: "DE",
  },

  phone: {
    /** Anzeigeformat */
    display: "06321 9547657",
    /** Internationales Format für tel:-Links und JSON-LD */
    e164: "+4963219547657",
    international: "+49 6321 9547657",
  },

  /** E-Mail-Adresse des Restaurants – derzeit nicht öffentlich bekannt. */
  email: null as string | null,

  /** Verifizierte Koordinaten aus dem Google-Unternehmensprofil */
  geo: {
    latitude: 49.354946,
    longitude: 8.1368446,
  },

  links: {
    lieferando: "https://www.lieferando.de/speisekarte/safran-grill-neustadt",
    googleMaps:
      "https://www.google.com/maps/place/?q=place_id:ChIJB7PZ5dVJlkcRjOhvvpceJYI",
    googleRoute:
      "https://www.google.com/maps/dir/?api=1&destination=Safran+Grill%2C+Hauptstra%C3%9Fe+115%2C+67433+Neustadt+an+der+Weinstra%C3%9Fe&destination_place_id=ChIJB7PZ5dVJlkcRjOhvvpceJYI",
    googleReviews:
      "https://search.google.com/local/reviews?placeid=ChIJB7PZ5dVJlkcRjOhvvpceJYI",
    /** Social-Media-Profile – derzeit keine verifizierten Profile bekannt. */
    social: [] as { label: string; url: string }[],
  },

  /**
   * Öffnungszeiten – verifiziert gegen Google (Stand 16.08.2026).
   * Vor dem finalen Deployment noch einmal mit dem Eigentümer abgleichen.
   */
  openingHours: [
    { day: "Montag", schemaDay: "Monday", opens: "11:00", closes: "22:00" },
    { day: "Dienstag", schemaDay: "Tuesday", opens: null, closes: null },
    { day: "Mittwoch", schemaDay: "Wednesday", opens: "11:00", closes: "22:00" },
    { day: "Donnerstag", schemaDay: "Thursday", opens: "11:00", closes: "22:00" },
    { day: "Freitag", schemaDay: "Friday", opens: "11:00", closes: "22:00" },
    { day: "Samstag", schemaDay: "Saturday", opens: "11:00", closes: "22:00" },
    { day: "Sonntag", schemaDay: "Sunday", opens: "11:00", closes: "22:00" },
  ] satisfies OpeningHoursDay[],

  /** Kompakte Anzeige der Öffnungszeiten, z. B. im Footer */
  openingHoursCompact: "Mo & Mi–So 11:00–22:00 Uhr · Dienstag Ruhetag",

  buffet: {
    enabled: true,
    /**
     * Aktionspreis laut aktuellem Werbematerial des Restaurants
     * (Plakat am Restaurant, Stand August 2026).
     * Vor Veröffentlichung von Preisänderungen mit dem Eigentümer bestätigen.
     */
    price: "10,00 €",
    priceSuffix: "pro Person",
    /** Regulärer Preis laut Plakat ("50 % Rabatt") */
    regularPrice: "20,00–25,00 €",
    drinksIncluded: false,
    /** Bestandteile laut Werbematerial – keine Einzelgerichte erfinden */
    includes: [
      "Reisgerichte",
      "Fleisch- und Grillgerichte",
      "Vegetarische und vegane Gerichte",
      "Salate",
      "Dessert",
    ],
    /** Buffet-Zeiten laut Plakat: jeden Tag außer Dienstag, 11–22 Uhr */
    times: "jeden Tag außer Dienstag, 11:00–22:00 Uhr",
    verifyBeforePublish: true,
  },

  cuisine: ["Afghanisch", "Orientalisch"],

  /**
   * Google-Bewertung – nur als sichtbarer Social Proof mit Quellenangabe
   * verwenden, NICHT als eigenes AggregateRating ins JSON-LD schreiben.
   */
  googleRating: {
    value: "4,9",
    count: 46,
    asOf: "August 2026",
  },
} as const;

export type Restaurant = typeof restaurant;

/** "Hauptstraße 115, 67433 Neustadt an der Weinstraße" */
export const fullAddress = `${restaurant.address.street}, ${restaurant.address.zip} ${restaurant.address.city}`;

import { fullAddress, restaurant, siteUrl } from "./restaurant-config";
import { ogImagePath } from "./images";

/**
 * JSON-LD für strukturierte Daten – vollständig aus der zentralen
 * Restaurant-Konfiguration generiert.
 *
 * Bewusst KEIN AggregateRating: Google-Bewertungen werden nur sichtbar
 * als Social Proof mit Quellenangabe dargestellt (siehe Aufgabenstellung).
 */

export function restaurantJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${siteUrl}/#restaurant`,
    name: restaurant.name,
    url: siteUrl,
    image: `${siteUrl}${ogImagePath}`,
    telephone: restaurant.phone.e164,
    servesCuisine: restaurant.cuisine,
    priceRange: "€",
    menu: `${siteUrl}/speisekarte`,
    address: {
      "@type": "PostalAddress",
      streetAddress: restaurant.address.street,
      postalCode: restaurant.address.zip,
      addressLocality: restaurant.address.city,
      addressCountry: restaurant.address.countryCode,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: restaurant.geo.latitude,
      longitude: restaurant.geo.longitude,
    },
    openingHoursSpecification: restaurant.openingHours
      .filter((d) => d.opens && d.closes)
      .map((d) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: d.schemaDay,
        opens: d.opens,
        closes: d.closes,
      })),
    sameAs: [restaurant.links.googleMaps, restaurant.links.lieferando],
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Startseite", path: "/" }, ...crumbs].map(
      (crumb, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: crumb.name,
        item: `${siteUrl}${crumb.path === "/" ? "" : crumb.path}`,
      }),
    ),
  };
}

/** Hilfsbaustein: Adresse als eine Zeile */
export { fullAddress };

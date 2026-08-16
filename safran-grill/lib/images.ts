/**
 * Zentrale Bild-Metadaten.
 *
 * Alle Fotos stammen aus dem Google-Unternehmensprofil von Safran Grill –
 * die Verwendung wurde vom Eigentümer ausdrücklich freigegeben.
 * Breite/Höhe sind hier fest hinterlegt, damit next/image ohne Layout-Shift
 * rendern kann.
 *
 * Weitere freigegebene Fotos (Buffet, Gerichte, Grill) einfach unter
 * public/images/restaurant/ ablegen und hier ergänzen.
 */

export interface SiteImage {
  src: string;
  width: number;
  height: number;
  alt: string;
}

/** Gastraum im Hochformat – Logo-Wand, Tische und Fensterfront (Hero) */
export const gastraumPortrait: SiteImage = {
  src: "/images/restaurant/gastraum-safran-grill-neustadt.jpg",
  width: 1600,
  height: 2133,
  alt: "Gastraum des Safran Grill in Neustadt an der Weinstraße mit Holzwand, Logo und Tischen am Fenster",
};

/** Tische am Fenster zur Hauptstraße – Querformat */
export const gastraumLandscape: SiteImage = {
  src: "/images/restaurant/tische-am-fenster-safran-grill.jpg",
  width: 2000,
  height: 1333,
  alt: "Gedeckte Tische am Fenster des Safran Grill mit Blick auf die Hauptstraße in Neustadt",
};

/** Holzwand mit Safran-Grill-Logo – Quadrat */
export const logoWand: SiteImage = {
  src: "/images/restaurant/logo-wand-safran-grill.jpg",
  width: 1200,
  height: 1200,
  alt: "Holzvertäfelte Wand im Safran Grill mit dem Logo und Bildern der Neustadter Altstadt",
};

/* — Buffet-Fotos (vom Eigentümer bereitgestellte Video-Stills) — */

/** Reisgericht und gegrilltes Fleisch in Chafing-Dishes */
export const buffetReisGrill: SiteImage = {
  src: "/images/restaurant/buffet-reis-und-grillfleisch-safran-grill.jpg",
  width: 1170,
  height: 657,
  alt: "Buffet im Safran Grill Neustadt mit Reisgericht und gegrilltem Fleisch in Chafing-Dishes",
};

/** Große Wanne mit aromatischem Reis am Buffet */
export const buffetReisgericht: SiteImage = {
  src: "/images/restaurant/reisgericht-buffet-safran-grill-neustadt.jpg",
  width: 1170,
  height: 657,
  alt: "Aromatischer Reis mit Karotten am All-you-can-eat-Buffet im Safran Grill Neustadt",
};

/** Warme Gerichte in runden Chafing-Dishes */
export const buffetGerichte: SiteImage = {
  src: "/images/restaurant/buffet-gerichte-safran-grill.jpg",
  width: 1170,
  height: 657,
  alt: "Warme Fleisch- und Gemüsegerichte in Chafing-Dishes am Buffet des Safran Grill",
};

/** Die Buffetstrecke mit Chafing-Dishes, Suppe und Salat */
export const buffetStrecke: SiteImage = {
  src: "/images/restaurant/buffetstrecke-safran-grill-neustadt.jpg",
  width: 1170,
  height: 657,
  alt: "Buffetstrecke im Safran Grill Neustadt mit Chafing-Dishes, Suppe und frischem Salat",
};

/** Open-Graph-Bild (1200x630) – absolute URL wird in den Metadaten gebildet */
export const ogImagePath = "/images/og/safran-grill-neustadt.jpg";

/**
 * Open-Graph-Bildobjekt für Seiten-Metadata.
 * Muss in jedem seiteneigenen `openGraph`-Block mitgegeben werden,
 * da Next.js das openGraph-Objekt des Layouts vollständig ersetzt.
 */
export const ogImage = {
  url: ogImagePath,
  width: 1200,
  height: 630,
  alt: "Gastraum des Safran Grill in Neustadt an der Weinstraße",
};

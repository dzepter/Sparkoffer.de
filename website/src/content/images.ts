/**
 * Zentrales Bildregister.
 *
 * `available: true`  → Datei liegt unter public/images/… und wird gerendert.
 * `available: false` → Es wird ein hochwertiger, klar beschrifteter
 *                      Platzhalter gerendert, bis die Datei geliefert ist.
 *
 * Die Zuordnung der bereits per Chat übermittelten Fotos zu diesen Slots
 * ist in PHOTO-GUIDE.md dokumentiert. Sobald eine Datei unter dem hier
 * angegebenen Pfad abgelegt wird, muss nur `available` auf true gesetzt
 * werden – alle Seiten aktualisieren sich automatisch.
 */

export type ImageSlot = {
  src: string;
  alt: string;
  width: number;
  height: number;
  available: boolean;
  /** Beschreibung des benötigten Motivs (für Platzhalter-Darstellung) */
  neededDescription?: string;
  /** Schwarz-Weiß-Behandlung (neutralisiert alte Grünfilter) */
  grayscale?: boolean;
};

export const images = {
  /** Startseiten-Hero: Rainer, an Wand gelehnt, Arme verschränkt, Blick in die Kamera. */
  heroHome: {
    src: "/images/rainer/rainer-aigner-portrait-hero.jpg",
    alt: "Rainer Aigner lehnt mit verschränkten Armen an einer Wand und blickt direkt in die Kamera.",
    width: 1024,
    height: 1500,
    available: false,
    neededDescription:
      "Porträt: Rainer an der Betonwand, Arme verschränkt, lächelnd in die Kamera (Outdoor-Shooting)",
  },
  /** Rainer auf der Bühne bei einem Vortrag (von bisheriger Website, S/W-Behandlung). */
  rainerStage: {
    src: "/images/rainer/rainer-aigner-vortrag-buehne.jpg",
    alt: "Rainer Aigner auf der Bühne bei einem Vortrag vor Publikum.",
    width: 2000,
    height: 850,
    available: true,
    grayscale: true,
  },
  /** Rainer präsentierend vor Glasfassade (von bisheriger Website, S/W-Behandlung). */
  rainerPresenting: {
    src: "/images/rainer/rainer-aigner-praesentation-fassade.jpg",
    alt: "Rainer Aigner lacht und zeigt einladend auf den Eingang eines modernen Gebäudes.",
    width: 2000,
    height: 850,
    available: true,
    grayscale: true,
  },
  /** Rainer-Seite: sitzend am Tisch, offener Kragen (aktuelles Office-Shooting). */
  rainerPortraitCasual: {
    src: "/images/rainer/rainer-aigner-portrait-buero.jpg",
    alt: "Rainer Aigner sitzt entspannt an einer Tischkante in einem hellen Büro.",
    width: 1035,
    height: 1044,
    available: false,
    neededDescription:
      "Porträt: Rainer sitzt lächelnd an der Tischkante, offener Kragen (Office-Shooting)",
  },
  /** Für-Unternehmen-Seite: stehend im Büro mit Krawatte. */
  rainerPortraitFormal: {
    src: "/images/rainer/rainer-aigner-portrait-business.jpg",
    alt: "Rainer Aigner steht in dunkelblauem Anzug mit Krawatte in einem modernen Büro.",
    width: 1152,
    height: 1560,
    available: false,
    neededDescription:
      "Porträt: Rainer stehend im Büro, dunkelblauer Anzug mit Krawatte (Office-Shooting)",
  },
  /** Kontakt-/Zitatbereich: Nahaufnahme mit dunkelroter Krawatte. */
  rainerPortraitClose: {
    src: "/images/rainer/rainer-aigner-portrait-nah.jpg",
    alt: "Porträt von Rainer Aigner in dunklem Anzug mit dunkelroter Krawatte.",
    width: 1033,
    height: 1038,
    available: false,
    neededDescription:
      "Nahaufnahme: Rainer, dunkler Anzug, dunkelrote Krawatte (Office-Shooting)",
  },
  /** Buchcover „Lust auf Erfolg“ (von bisheriger Website, kleine Auflösung). */
  bookCover: {
    src: "/images/buch/lust-auf-erfolg-cover.jpg",
    alt: "Buchcover: Lust auf Erfolg von Rainer Aigner.",
    width: 279,
    height: 324,
    available: true,
  },
} as const satisfies Record<string, ImageSlot>;

export type ImageKey = keyof typeof images;

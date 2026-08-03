/**
 * Zentrale Website-Konfiguration.
 * Alle Kontaktdaten, Markenbotschaften und Routen werden ausschließlich
 * hier gepflegt und von allen Seiten/Komponenten wiederverwendet.
 */

export const siteConfig = {
  /** Unternehmensmarke */
  brand: "Aigner Offensiv",
  /** Zentrales Leistungsangebot */
  product: "Handel Offensiv",
  productLabel: "Der Führungsführerschein für den Handel",
  claim: "Handel ist Mannschaftssport. Führung entscheidet das Spiel.",
  benefitLine: "Führung auf der Fläche. Wirkung in den Zahlen.",
  teamLine: "Aus Mitarbeitern wird Mannschaft.",
  knowledgeLine: "Aus Wissen Können machen.",
  activationLine: "Wir bringen den Handel ins Handeln.",
  presenceLine: "100 Prozent Präsenz.",
  /**
   * Produktions-Domain der neuen Website.
   * VOR LIVEGANG PRÜFEN: finale Domain bestätigen.
   */
  url: "https://www.aigner-offensiv.de",
  footerShort:
    "Aigner Offensiv entwickelt Führungskräfte im stationären Handel – persönlich, praxisnah und zu 100 Prozent in Präsenz.",
} as const;

export const contactData = {
  company: "Aigner Offensiv",
  owner: "Viola & Rainer Aigner",
  street: "Hohenzollernstr. 76",
  zip: "80801",
  city: "München",
  phone: "089 / 33 03 50-55",
  phoneHref: "+498933035055",
  /** Mobilnummer aus dem Header der bisherigen Website. ZU BESTÄTIGEN. */
  mobile: "0157 733 888 55",
  mobileHref: "+4915773388855",
  fax: "089 / 33 03 50-56",
  email: "info@aigner-offensiv.de",
  /** Persönliche Adresse von Rainer Aigner (bisherige Website). */
  emailPersonal: "aigner@aigner-offensiv.de",
  /** Erreichbarkeit laut bisheriger Website. ZU BESTÄTIGEN. */
  hours: [
    { days: "Montag – Freitag", time: "08:00 – 18:00 Uhr" },
    { days: "Samstag + Sonntag", time: "geschlossen" },
  ],
  register: {
    court: "Amtsgericht München",
    number: "HRB 152556",
    vatId: "DE 234431321",
  },
} as const;

/** Interne Routen – einzige Quelle für alle Links und CTAs. */
export const routes = {
  home: "/",
  handelOffensiv: "/handel-offensiv",
  offensivtage: "/offensivtage",
  fuerUnternehmen: "/fuer-unternehmen",
  rainerAigner: "/rainer-aigner",
  impulse: "/impulse",
  kontakt: "/kontakt",
  impressum: "/impressum",
  datenschutz: "/datenschutz",
} as const;

export type RouteKey = keyof typeof routes;

export type NavItem = { label: string; href: string };

/** Hauptnavigation (schlank, Reihenfolge laut Konzept). */
export const navigation: readonly NavItem[] = [
  { label: "Handel Offensiv", href: routes.handelOffensiv },
  { label: "Die 5 Offensivtage", href: routes.offensivtage },
  { label: "Für Unternehmen", href: routes.fuerUnternehmen },
  { label: "Rainer Aigner", href: routes.rainerAigner },
  { label: "Impulse", href: routes.impulse },
  { label: "Kontakt", href: routes.kontakt },
];

export const footerNavigation = {
  main: navigation,
  legal: [
    { label: "Impressum", href: routes.impressum },
    { label: "Datenschutz", href: routes.datenschutz },
  ],
} as const;

/**
 * Konsistentes CTA-System.
 * Anfragen laufen über die Kontaktseite; das gewünschte Angebot wird
 * per Query-Parameter vorausgewählt.
 */
export const cta = {
  primary: {
    label: "Offensivtag anfragen",
    href: `${routes.kontakt}?angebot=offensivtag`,
  },
  /** Allgemeine Anfrage ohne Vorauswahl im Formular */
  handelOffensiv: {
    label: "Handel Offensiv anfragen",
    href: routes.kontakt,
  },
  secondary: {
    label: "Die 5 Offensivtage ansehen",
    href: routes.offensivtage,
  },
  fuehrerschein: {
    label: "Führungsführerschein anfragen",
    href: `${routes.kontakt}?angebot=fuehrerschein`,
  },
  unternehmenstag: {
    label: "Handel-Offensivtag anfragen",
    href: `${routes.kontakt}?angebot=unternehmenstag`,
  },
  wirkungscheck: {
    label: "Wirkungscheck anfragen",
    href: `${routes.kontakt}?angebot=wirkungscheck`,
  },
  impulsvortrag: {
    label: "Impulsvortrag anfragen",
    href: `${routes.kontakt}?angebot=impulsvortrag`,
  },
  kontakt: {
    label: "Persönlich Kontakt aufnehmen",
    href: routes.kontakt,
  },
  erstgespraech: {
    label: "Unverbindliches Erstgespräch vereinbaren",
    href: routes.kontakt,
  },
} as const;

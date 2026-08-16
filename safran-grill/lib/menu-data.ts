/**
 * Speisekarten-Daten für Safran Grill.
 *
 * Quelle: aktuelle Lieferando-Speisekarte
 * (https://www.lieferando.de/speisekarte/safran-grill-neustadt),
 * übernommen aus einer vom Auftraggeber bereitgestellten Aufnahme
 * (Stand: August 2026). Preise wie bei Lieferando angegeben –
 * im Restaurant können die Preise abweichen.
 *
 * Pflege: Gerichte einfach im jeweiligen `items`-Array ändern/ergänzen.
 * `available: false` blendet den Preis aus und zeigt einen Hinweis.
 */

export interface MenuItem {
  name: string;
  description?: string;
  price?: string;
  /** z. B. ["vegetarisch"] */
  tags?: string[];
  /** false = zurzeit nicht verfügbar (Preis wird ausgeblendet) */
  available?: boolean;
}

export interface MenuCategory {
  /** URL-Anker, z. B. "grill-spezialitaeten" */
  id: string;
  title: string;
  /** Kurze redaktionelle Beschreibung der Kategorie */
  description: string;
  items: MenuItem[];
}

export const menuCategories: MenuCategory[] = [
  {
    id: "vorspeisen",
    title: "Vorspeisen",
    description: "Kleine Gerichte für den Anfang – ideal zum Teilen.",
    items: [
      {
        name: "Sambusa Fleisch",
        description:
          "Afghanische frittierte Teigtaschen mit Hackfleisch und Gemüse, serviert mit Safran-Sauce",
        price: "7,99 €",
      },
      {
        name: "Sambusa Vegetarisch",
        description:
          "Afghanische frittierte Teigtaschen mit Gemüse, serviert mit Safran-Sauce",
        price: "5,99 €",
        tags: ["vegetarisch"],
      },
      {
        name: "Gegrillte Peperoni",
        description:
          "Gegrillte Peperoni mit Knoblauch und Olivenöl, serviert mit Naan",
        price: "6,99 €",
        tags: ["vegetarisch"],
      },
    ],
  },
  {
    id: "suppen",
    title: "Suppen",
    description: "Hausgemachte warme Suppen.",
    items: [
      {
        name: "Hühnersuppe",
        description: "Hausgemachte Suppe mit Hähnchenfleisch und Gemüse",
        price: "5,50 €",
      },
      {
        name: "Linsensuppe",
        description: "Traditionelle Linsensuppe mit Gemüse",
        price: "5,50 €",
        tags: ["vegetarisch"],
      },
    ],
  },
  {
    id: "salate",
    title: "Salate",
    description:
      "Frische Salate – als leichte Mahlzeit oder Begleitung zum Grillgericht.",
    items: [
      {
        name: "Kleiner Salat",
        description: "Gurken, Tomaten und Karotten",
        price: "3,00 €",
        tags: ["vegetarisch"],
      },
      {
        name: "Großer Salat",
        description: "Gemischter Salat mit Gurken, Tomaten und Karotten",
        price: "5,50 €",
        tags: ["vegetarisch"],
      },
      {
        name: "Großer Salat mit Hähnchen-Spieß",
        description: "Salat mit mariniertem Hähnchen-Spieß",
        price: "11,99 €",
      },
      {
        name: "Großer Salat mit Kalbfleischspieß",
        description: "Salat mit Kalbfleischspieß",
        price: "12,99 €",
      },
      {
        name: "Großer Salat mit Lachsspieß",
        description: "Salat mit Lachsspieß",
        available: false,
      },
    ],
  },
  {
    id: "beilagen",
    title: "Beilagen",
    description: "Reis, Naan und mehr zu den Hauptgerichten.",
    items: [
      {
        name: "Safran Reis",
        description: "Basmati-Reis mit Safran",
        price: "4,50 €",
        tags: ["vegetarisch"],
      },
      { name: "Basmati Reis", price: "4,00 €", tags: ["vegetarisch"] },
      { name: "Pommes", price: "4,00 €", tags: ["vegetarisch"] },
      { name: "Naanbrot", available: false },
    ],
  },
  {
    id: "grill-spezialitaeten",
    title: "Grill-Spezialitäten",
    description:
      "Frisch gegrillt und würzig mariniert – das Herzstück unserer Küche.",
    items: [
      {
        name: "Gegrillter Hähnchen-Spieß",
        description:
          "Saftiger Hähnchenspieß, mariniert mit orientalischen Gewürzen und Milch, serviert mit Salat und Naan",
        price: "14,50 €",
      },
      {
        name: "Gegrillter Kalbfleischspieß",
        description:
          "Zarter Spieß aus mariniertem Kalbfleisch, serviert mit Salat und Naan",
        price: "16,50 €",
      },
      {
        name: "Gegrillter Leberspieß",
        description:
          "Spieß aus frischer Rinderleber, traditionell gewürzt, serviert mit Salat und Naan",
        price: "13,99 €",
      },
      {
        name: "Chapli Kebab",
        description:
          "2 Stück – afghanische Frikadellen, serviert mit Salat und Naan",
        price: "14,50 €",
      },
      {
        name: "Lammkotelett",
        description:
          "Zarte Lammkoteletts vom Grill, serviert mit Salat und Naan",
        price: "24,99 €",
      },
      {
        name: "Grillteller",
        description:
          "Ein saftiger Hähnchenspieß und ein Kalbspieß, serviert mit Safran-Reis, Salat und Naan",
        price: "20,00 €",
      },
      {
        name: "Safran Grill Teller",
        description:
          "Gemischte Grillplatte mit Hähnchen-Spieß, Kalbfleisch-Spieß und Lammkotelett",
        price: "26,99 €",
      },
      {
        name: "Gegrillter Lachsspieß",
        description: "Frischer Lachs am Spieß, serviert mit Salat und Naan",
        available: false,
      },
    ],
  },
  {
    id: "hausgemachte-sossen",
    title: "Hausgemachte Soßen",
    description: "Aus eigener Zubereitung – passend zu Grill und Beilagen.",
    items: [
      { name: "Safran Sauce Mild", price: "1,50 €" },
      { name: "Safran Sauce Scharf", price: "1,50 €" },
      { name: "Afghanisches Chutney", price: "1,50 €" },
      { name: "Joghurt-Knoblauch-Sauce", price: "1,50 €" },
    ],
  },
  {
    id: "afghanische-speisen",
    title: "Afghanische Speisen",
    description:
      "Traditionelle Gerichte der afghanischen Küche – von Kabuli Palau bis Mantu.",
    items: [
      {
        name: "Kabuli Palau",
        description:
          "Afghanisches Nationalgericht: gedämpfter Basmatireis mit Kalbfleisch, Karotten, Rosinen und orientalischen Gewürzen",
        price: "14,50 €",
      },
      {
        name: "Mantu Fleisch",
        description:
          "Gedämpfte afghanische Teigtaschen mit Hackfleischfüllung, serviert mit Joghurt-Knoblauch-Sauce, Tomatensoße und Minze",
        price: "14,50 €",
      },
      {
        name: "Mantu Vegetarisch",
        description:
          "Gedämpfte afghanische Teigtaschen mit Gemüse, serviert mit Joghurt-Knoblauch-Sauce, Tomatensoße und Minze",
        price: "12,50 €",
        tags: ["vegetarisch"],
      },
      {
        name: "Chicken Curry",
        description:
          "Hähnchenfleisch in cremiger Tomaten-Sahne-Curry-Sauce mit orientalischen Gewürzen, serviert mit Safran-Reis",
        price: "14,50 €",
      },
      {
        name: "Karahi Hähnchen",
        description:
          "Hähnchenkeulen in Tomaten-Joghurt-Sauce mit Knoblauch und Ingwer",
        price: "14,00 €",
      },
      {
        name: "Sabzi Chalau",
        description:
          "Traditionelles Spinatgericht mit Zwiebeln, Tomaten, Knoblauch und orientalischen Gewürzen, serviert mit Reis",
        price: "9,99 €",
        tags: ["vegetarisch"],
      },
      {
        name: "Kartoffel Curry Korma",
        description:
          "Kartoffeln in cremiger Tomaten-Sahne-Curry-Sauce mit orientalischen Gewürzen, serviert mit Reis",
        price: "10,99 €",
        tags: ["vegetarisch"],
      },
      {
        name: "Qurma Lubia",
        description:
          "Rote Bohnen in Tomaten-Sahne-Sauce, serviert mit Basmati-Reis",
        price: "13,50 €",
        tags: ["vegetarisch"],
      },
      {
        name: "Qurma Dal Nakhod",
        description:
          "Halbe Kichererbsen (Dal Nakhod) in cremiger Tomatensauce mit Sahne und orientalischen Gewürzen",
        price: "10,00 €",
        tags: ["vegetarisch"],
      },
      {
        name: "Qurma Nakhod",
        description:
          "Kichererbsen in cremiger Tomatensauce mit Sahne und orientalischen Gewürzen, serviert mit duftendem Basmatireis",
        price: "10,00 €",
        tags: ["vegetarisch"],
      },
      {
        name: "Lammleber Curry",
        description:
          "Zarte Lammleber in cremiger Tomatensauce mit Sahne, Knoblauch und orientalischen Gewürzen, dazu Reis",
        price: "12,90 €",
      },
      {
        name: "Bolani Kartoffel",
        description:
          "Frittierte afghanische Teigtaschen mit Kartoffel-Paprika-Füllung, verfeinert mit orientalischen Gewürzen, serviert mit Knoblauch-Joghurt-Sauce",
        price: "7,99 €",
        tags: ["vegetarisch"],
      },
      {
        name: "Bolani Spinat",
        description:
          "Frittierte afghanische Teigtaschen mit Spinat und Gemüse, verfeinert mit orientalischen Gewürzen, serviert mit Knoblauch-Joghurt-Sauce",
        price: "7,99 €",
        tags: ["vegetarisch"],
      },
      {
        name: "Bolani Hähnchen",
        description:
          "Gebackene afghanische Teigtaschen mit Hähnchen und Gemüse, serviert mit Knoblauch-Joghurt-Sauce",
        price: "9,99 €",
      },
      {
        name: "Bolani Hackfleisch",
        description:
          "Gebackene afghanische Teigtaschen mit Hackfleisch und Gemüse, serviert mit Joghurt-Knoblauch-Sauce",
        price: "12,99 €",
      },
      {
        name: "Lamm Do Pyaza",
        description:
          "Zartes Lammfleisch mit Knochen, mit vielen Zwiebeln in würziger Sauce geschmort, dazu Reis",
        available: false,
      },
      {
        name: "Kofta",
        description:
          "Bällchen aus Rinderhackfleisch und Gemüse in cremiger Tomatensoße mit gelben Kichererbsen, dazu Basmatireis und frischer Salat",
        available: false,
      },
    ],
  },
  {
    id: "nudelgerichte",
    title: "Nudelgerichte",
    description: "Bandnudeln mit Safran-Note aus unserer Küche.",
    items: [
      {
        name: "Fettuccini mit Hähnchen",
        description:
          "Bandnudeln in Tomaten-Safran-Sahnesauce mit Knoblauch und orientalischen Gewürzen, serviert mit gegrilltem Hähnchen",
        price: "11,99 €",
      },
      {
        name: "Fettuccini mit Lachsspieß",
        description:
          "Bandnudeln in Tomaten-Safran-Sahnesauce mit Knoblauch und orientalischen Gewürzen, serviert mit gegrilltem Lachs",
        available: false,
      },
    ],
  },
  {
    id: "pizzen",
    title: "Pizzen",
    description: "Klassische Pizzen, frisch belegt und gebacken.",
    items: [
      {
        name: "Pizza Brot",
        description: "Pizzabrot mit Knoblauch und Olivenöl",
        price: "5,50 €",
        tags: ["vegetarisch"],
      },
      {
        name: "Pizza Margherita",
        description: "28 cm – Tomatensoße und Käse",
        price: "7,50 €",
        tags: ["vegetarisch"],
      },
      {
        name: "Pizza Salami",
        description: "Tomatensoße, Käse und Rindersalami",
        price: "9,00 €",
      },
      {
        name: "Pizza Schinken",
        description: "Tomatensoße, Käse und Putenschinken",
        price: "9,00 €",
      },
      {
        name: "Pizza Tonno",
        description: "Tomatensoße, Käse, Zwiebeln und Thunfisch",
        price: "9,50 €",
      },
      {
        name: "Pizza Pilze",
        description: "Tomatensoße, Käse und Champignons",
        price: "9,50 €",
        tags: ["vegetarisch"],
      },
      {
        name: "Pizza Gemüse",
        description: "Tomatensoße, Käse, Spinat, Paprika, Pilze und Zwiebeln",
        price: "8,99 €",
        tags: ["vegetarisch"],
      },
    ],
  },
  {
    id: "orientalische-pizzen",
    title: "Orientalische Pizzen",
    description: "Pizza trifft Grillspieß – eine Spezialität des Hauses.",
    items: [
      {
        name: "Pizza Hähnchen-Spieß",
        description:
          "Pizza mit Tomatensoße und Käse, nach dem Backen mit Rucola, Olivenöl und einem Hähnchen-Spieß serviert",
        price: "11,99 €",
      },
      {
        name: "Pizza mit Kalbfleischspieß",
        description:
          "Pizza mit Tomatensoße und Käse, nach dem Backen mit Rucola, Olivenöl und einem Kalbfleischspieß serviert",
        price: "13,50 €",
      },
      {
        name: "Pizza mit Lachsspieß",
        description:
          "Pizza mit Tomatensoße und Käse, nach dem Backen mit Rucola, Olivenöl und einem Lachsspieß serviert",
        price: "ab 12,50 €",
      },
    ],
  },
  {
    id: "getraenke",
    title: "Getränke",
    description: "Hausgemachte Limonade, Lassi, Ayran und Klassiker.",
    items: [
      { name: "Hausgemachte Zitronenlimo, 0,5 l", price: "4,00 €" },
      { name: "Mango Lassi, 0,5 l", price: "4,50 €" },
      { name: "Afghanischer Ayran, 0,5 l", price: "4,50 €" },
      { name: "Fanta", price: "4,00 €" },
      { name: "Sprite", price: "4,00 €" },
      { name: "Cola Zero", price: "4,00 €" },
      { name: "Mineralwasser Still", price: "4,00 €" },
      { name: "Mineralwasser Classic", price: "4,00 €" },
    ],
  },
  {
    id: "dessert",
    title: "Dessert",
    description: "Etwas Süßes zum Abschluss.",
    items: [
      {
        name: "Afghanisches Eis",
        description: "Afghanisches Eis mit Pistazien",
        price: "4,99 €",
      },
    ],
  },
];

/** true, sobald mindestens ein Gericht gepflegt ist */
export const hasMenuItems = menuCategories.some((c) => c.items.length > 0);

import { cta } from "./site";

/**
 * Angebote für Unternehmen – zentrale Datenquelle für /fuer-unternehmen
 * und die Angebotsauswahl im Kontaktformular.
 */

export type Offer = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  suitedFor: string[];
  /** Optionaler Ablauf (nur Unternehmens-Offensivtag) */
  agenda?: string[];
  cta: { label: string; href: string };
};

export const offers: Offer[] = [
  {
    id: "offensivtag",
    eyebrow: "Angebot 01",
    title: "Der einzelne Offensivtag",
    description:
      "Ein fokussierter Präsenztag zu einer konkreten Führungsherausforderung – als klarer Einstieg oder gezielter Impuls für ein bestehendes Team.",
    suitedFor: [
      "Führungsklausuren",
      "Jahresauftakte",
      "interne Entwicklungstage",
      "neue Führungskräfte",
      "akute Veränderungsphasen",
      "Marktleiter- oder Filialleitertagungen",
    ],
    cta: cta.primary,
  },
  {
    id: "fuehrerschein",
    eyebrow: "Angebot 02",
    title: "Der Führungsführerschein",
    description:
      "Das vollständige Entwicklungsprogramm mit fünf aufeinander aufbauenden Offensivtagen – für Führungskräfte, die ihre Mannschaft dauerhaft wirksam führen sollen.",
    suitedFor: [
      "systematische Führungskräfteentwicklung",
      "neue Markt- und Filialleiter",
      "Nachwuchsprogramme",
      "Führungsteams mehrerer Standorte",
      "nachhaltige Veränderung über mehrere Monate",
    ],
    cta: cta.fuehrerschein,
  },
  {
    id: "unternehmenstag",
    eyebrow: "Angebot 03",
    title: "Handel-Offensivtag für das gesamte Unternehmen",
    description:
      "Ein gemeinsamer Präsenztag aus Impuls, Arbeitsphasen und verbindlicher Umsetzung – für alle, die im Unternehmen Verantwortung tragen.",
    suitedFor: [
      "Unternehmen, die ein gemeinsames Führungsverständnis aufbauen wollen",
      "Auftakt größerer Entwicklungs- oder Veränderungsvorhaben",
      "Jahres- und Führungskräftetagungen",
    ],
    agenda: [
      "inspirierender Auftakt",
      "gemeinsame Standortbestimmung",
      "Arbeit in Führungsgruppen",
      "konkrete Unternehmensfälle",
      "Maßnahmenplanung",
      "verbindlicher 30-Tage-Startplan",
    ],
    cta: cta.unternehmenstag,
  },
];

/** Der 50.000-Euro-Wirkungscheck. */
export const impactCheck = {
  eyebrow: "Wirtschaftliche Perspektive",
  title: "Der 50.000-Euro-Wirkungscheck",
  description:
    "Unklare Verantwortung, unnötige Überstunden, schwache Einarbeitung, vermeidbare Fehler und ungenutzte Verkaufschancen können erhebliche Kosten verursachen. Im Wirkungscheck betrachten wir gemeinsam, an welchen Stellen Führungs- und Prozessverbesserungen wirtschaftliche Potenziale erschließen können.",
  fields: [
    "Fluktuation",
    "Einarbeitungsaufwand",
    "Überstunden",
    "Doppelarbeit",
    "Kommunikationsfehler",
    "Qualitätsmängel",
    "unnötige Besprechungen",
    "schwache Delegation",
    "vermeidbare Kundenbeschwerden",
    "ungenutzte Verkaufschancen",
    "fehlende Zusatzverkäufe",
    "vakante Führungspositionen",
    "mangelnde interne Entwicklung",
  ],
  disclaimer:
    "Der Wirkungscheck ist keine Garantie für eine bestimmte Ersparnis. Er schafft Transparenz über mögliche wirtschaftliche Hebel und konkrete Handlungsfelder.",
  cta: cta.wirkungscheck,
} as const;

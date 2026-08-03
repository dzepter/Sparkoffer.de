/**
 * Impulsvorträge – nachgeordnet gegenüber Handel Offensiv.
 * Dauern und Formate sind pflegbare Felder.
 * ZU BESTÄTIGEN: Dauerangaben erst veröffentlichen, wenn bestätigt.
 */

export type Impulsvortrag = {
  slug: string;
  title: string;
  audience: string;
  situation: string;
  coreIdea: string;
  /** Pflegbares Feld – bewusst unverbindlich formuliert, bis bestätigt. */
  duration: string;
  formats: string[];
};

export const impulsvortraege: Impulsvortrag[] = [
  {
    slug: "handel-ist-mannschaftssport",
    title: "Handel ist Mannschaftssport",
    audience:
      "Führungskräfte und Mitarbeiter im stationären Handel, Tagungen und Jahresauftakte",
    situation:
      "Teams im Handel arbeiten unter Druck: knappe Besetzung, steigende Anforderungen, anspruchsvolle Kunden. Einzelkämpfer stoßen dabei an Grenzen.",
    coreIdea:
      "Was Handelsunternehmen von funktionierenden Mannschaften lernen können: klare Aufstellung, verstandene Rollen, Kommunikation und gemeinsames Handeln in Drucksituationen.",
    duration: "nach Vereinbarung",
    formats: [
      "Jahresauftakt",
      "Führungskräftetagung",
      "Mitarbeiterveranstaltung",
      "Verbands- und Branchenevent",
    ],
  },
  {
    slug: "fuehrungskraft-ja-bitte",
    title: "Führungskraft – ja, bitte",
    audience:
      "Nachwuchsführungskräfte, Fachkräfte vor dem nächsten Karriereschritt, Personalentwicklung",
    situation:
      "Viele gute Fachkräfte zögern, Führungsverantwortung zu übernehmen – aus Respekt vor der Rolle oder aus Sorge, zwischen allen Stühlen zu sitzen.",
    coreIdea:
      "Führung ist kein Schicksal, sondern eine Entscheidung. Der Vortrag macht Lust auf Verantwortung und zeigt, was den Schritt vom Mitarbeiter zur Führungskraft trägt.",
    duration: "nach Vereinbarung",
    formats: [
      "Nachwuchsprogramm",
      "interner Entwicklungstag",
      "Führungskräftetagung",
    ],
  },
  {
    slug: "pilot-oder-passagier",
    title: "Pilot oder Passagier",
    audience:
      "Führungskräfte, Vertriebsmannschaften, Unternehmensveranstaltungen",
    situation:
      "Warten, abwarten, zuschauen – oder selbst steuern? In vielen Teams entscheidet die Haltung einzelner darüber, ob Dinge ins Rollen kommen.",
    coreIdea:
      "Eigenverantwortung als Grundhaltung: Wer steuert, gestaltet. Ein Impuls für mehr Initiative, Verbindlichkeit und Handlungsfreude im Arbeitsalltag.",
    duration: "nach Vereinbarung",
    formats: [
      "Management-Forum",
      "Kundenveranstaltung",
      "Jahresauftakt",
      "Abendveranstaltung",
    ],
  },
  {
    slug: "aus-wissen-koennen-machen",
    title: "Aus Wissen Können machen",
    audience:
      "Unternehmen, die Weiterbildung in sichtbares Verhalten übersetzen wollen",
    situation:
      "Seminare besucht, Bücher gelesen, Konzepte diskutiert – und auf der Fläche ändert sich trotzdem wenig. Wissen allein verändert kein Verhalten.",
    coreIdea:
      "Können entsteht durch Anwendung. Der Vortrag zeigt, wie aus Wissen konkretes Handeln wird: durch Training, Wiederholung und verbindliche Umsetzung.",
    duration: "nach Vereinbarung",
    formats: [
      "Führungskräftetagung",
      "Personalentwicklungs-Auftakt",
      "interner Entwicklungstag",
    ],
  },
  {
    slug: "in-der-entscheidenden-phase-fuehren",
    title: "In der entscheidenden Phase führen",
    audience:
      "Führungskräfte und Führungsteams in Veränderungs- und Drucksituationen",
    situation:
      "Wenn der Plan nicht mehr funktioniert, zeigt sich Führungsqualität: bei Engpässen, Konflikten, Veränderungen und wirtschaftlichem Druck.",
    coreIdea:
      "Ruhig bleiben, Prioritäten setzen, Orientierung geben – was Führung in Drucksituationen wirksam macht, aus der Erfahrung von Profisport und Unternehmertum.",
    duration: "nach Vereinbarung",
    formats: [
      "Führungsklausur",
      "Krisen- und Veränderungsbegleitung",
      "Führungskräftetagung",
    ],
  },
];

/**
 * Die fünf Offensivtage – zentrale Datenquelle.
 * Startseitenübersicht und Detaildarstellung werden ausschließlich
 * aus diesen Daten erzeugt.
 */

export type OffensivModule = {
  /** "01" … "05" */
  number: string;
  slug: string;
  title: string;
  subtitle: string;
  /** Visuelle Leitidee der Dramaturgie (Kapitän, Mannschaft, …) */
  motif: string;
  /** Fußballbezogene Leitidee */
  footballPrinciple: string;
  challenge: string;
  contents: string[];
  /** Optionale sprachliche Leitlinie / Hinweis */
  note?: string;
  workResult: string;
  benefits: string[];
  /** Ein-Satz-Nutzen für die kompakte Startseitenübersicht */
  shortBenefit: string;
  ctaLabel: string;
};

export const modules: OffensivModule[] = [
  {
    number: "01",
    slug: "fuehrung-beginnt-bei-mir",
    title: "Führung beginnt bei mir",
    subtitle: "Vom besten Fachmitarbeiter zum wirksamen Mannschaftsführer.",
    motif: "Kapitän",
    footballPrinciple: "Wer die Kapitänsbinde trägt, muss seine Rolle kennen.",
    challenge:
      "Viele Führungskräfte im Handel bleiben operativ die besten Mitarbeiter ihrer Abteilung. Sie lösen Probleme selbst, springen überall ein und haben zu wenig Zeit, ihre Mannschaft zu führen.",
    contents: [
      "die eigene Führungsrolle verstehen",
      "persönliche Führungsstärken erkennen",
      "Wirkung auf andere reflektieren",
      "Erwartungen klar formulieren",
      "Entscheidungen treffen und vertreten",
      "Nähe und professionelle Distanz ausbalancieren",
      "Verantwortung übernehmen, ohne alles selbst zu erledigen",
      "vom Fachspezialisten zur Führungskraft werden",
      "persönliche Verhaltensmuster erkennen",
      "einen eigenen Führungsstil entwickeln",
    ],
    workResult:
      "Jeder Teilnehmer erstellt seinen persönlichen Führungskompass mit konkreten Verhaltenszielen für den Arbeitsalltag.",
    benefits: [
      "mehr Rollenklarheit",
      "sichereres Auftreten",
      "bessere Entscheidungen",
      "weniger operative Selbstüberlastung",
      "klarere Führungskommunikation",
    ],
    shortBenefit:
      "Rollenklarheit und ein eigener Führungsstil – statt operativer Selbstüberlastung.",
    ctaLabel: "Offensivtag 01 anfragen",
  },
  {
    number: "02",
    slug: "aus-mitarbeitern-wird-mannschaft",
    title: "Aus Mitarbeitern wird Mannschaft",
    subtitle: "Motivation, Bindung und Verlässlichkeit im täglichen Miteinander.",
    motif: "Mannschaft",
    footballPrinciple:
      "Elf gute Einzelspieler sind noch keine funktionierende Mannschaft.",
    challenge:
      "Motivation entsteht nicht durch einen einzelnen Vortrag oder gelegentliches Lob. Sie entwickelt sich aus Klarheit, Zugehörigkeit, Verantwortung, Wertschätzung und konsequentem Führungsverhalten.",
    contents: [
      "unterschiedliche Motivationsmuster erkennen",
      "Verlässlichkeit im Alltag fördern",
      "Erwartungen nachvollziehbar formulieren",
      "Anerkennung konkret und glaubwürdig aussprechen",
      "Leistung und Verhalten unterscheiden",
      "innere Kündigung frühzeitig erkennen",
      "häufige Ausfälle professionell ansprechen",
      "Teilzeitkräfte und Aushilfen integrieren",
      "verschiedene Generationen führen",
      "Zugehörigkeit im Schichtbetrieb fördern",
      "Leistungsabfall und Rückzug früh thematisieren",
      "konstruktives Feedback geben",
      "verbindliche Vereinbarungen treffen",
    ],
    note: "Eine gute Führungskultur kann Motivation, Verbundenheit, Kommunikation und einen verantwortungsvollen Umgang mit Belastungen stärken.",
    workResult:
      "Jeder Teilnehmer entwickelt einen konkreten Aktivierungs- und Bindungsplan für ausgewählte Mitarbeiter seines Verantwortungsbereichs.",
    benefits: [
      "höhere Verbindlichkeit",
      "bessere Zusammenarbeit",
      "frühere Konfliktklärung",
      "stärkere Mitarbeiterbindung",
      "mehr Eigeninitiative",
      "klarere Erwartungen",
    ],
    shortBenefit:
      "Mitarbeiterbindung und Verlässlichkeit durch konsequentes Führungsverhalten.",
    ctaLabel: "Offensivtag 02 anfragen",
  },
  {
    number: "03",
    slug: "die-richtige-aufstellung",
    title: "Die richtige Aufstellung",
    subtitle:
      "Personalmanagement, das Orientierung schafft und Führungsfehler reduziert.",
    motif: "Aufstellung",
    footballPrinciple:
      "Ein gutes Spielsystem setzt die richtigen Menschen an den richtigen Positionen ein.",
    challenge:
      "Personalentscheidungen im Handel werden häufig unter Zeitdruck getroffen. Gleichzeitig wirken sich unklare Rollen, schwache Einarbeitung und aufgeschobene Gespräche unmittelbar auf Team, Kunden und Ergebnis aus.",
    contents: [
      "Mitarbeiter passend einsetzen",
      "Verantwortlichkeiten eindeutig festlegen",
      "realistische Erwartungen vereinbaren",
      "Vorstellungsgespräche strukturiert vorbereiten",
      "neue Mitarbeiter systematisch einarbeiten",
      "Probezeiten aktiv nutzen",
      "Aufgaben sinnvoll delegieren",
      "Fortschritt kontrollieren, ohne Mikromanagement",
      "Talente und Nachwuchsführungskräfte erkennen",
      "Minderleistung früh ansprechen",
      "schwierige Gespräche vorbereiten",
      "Konflikte sachlich dokumentieren",
      "Zusammenarbeit mit der Personalabteilung verbessern",
      "Trennungsgespräche professionell vorbereiten",
      "rechtliche Grenzen erkennen und bei Bedarf Fachberatung einholen",
    ],
    note: "Handel Offensiv vermittelt Führungspraxis und ersetzt keine individuelle arbeitsrechtliche Beratung.",
    workResult:
      "Die Teilnehmer entwickeln eine praxistaugliche Führungs- und Personalcheckliste für Einstellung, Einarbeitung, Delegation, Entwicklung und schwierige Gespräche.",
    benefits: [
      "weniger vermeidbare Fehlentscheidungen",
      "schnellere Orientierung neuer Mitarbeiter",
      "klarere Verantwortlichkeiten",
      "sicherere Personalgespräche",
      "bessere Entwicklung interner Talente",
    ],
    shortBenefit:
      "Klare Rollen, systematische Einarbeitung und sichere Personalgespräche.",
    ctaLabel: "Offensivtag 03 anfragen",
  },
  {
    number: "04",
    slug: "spielintelligenz-mit-ki",
    title: "Spielintelligenz mit KI",
    subtitle:
      "Informationen schneller verarbeiten, verständlich vermitteln und konsequent umsetzen.",
    motif: "Spielintelligenz",
    footballPrinciple:
      "Geschwindigkeit entsteht nicht nur durch schnelleres Laufen, sondern durch schnelleres Erkennen und Entscheiden.",
    challenge:
      "Viele Unternehmen sprechen über künstliche Intelligenz. Markt- und Abteilungsleiter benötigen jedoch keine allgemeine Technologiediskussion, sondern sichere, verständliche und direkt nutzbare Anwendungen für ihren Führungsalltag.",
    contents: [
      "sinnvolle KI-Anwendungen im Handelsalltag erkennen",
      "Mitarbeiterinformationen verständlich formulieren",
      "Tages- und Wochenbriefings vorbereiten",
      "Checklisten und Arbeitsanweisungen erstellen",
      "Besprechungen strukturieren",
      "Gesprächsleitfäden vorbereiten",
      "schwierige Mitarbeitergespräche simulieren",
      "Verkaufsargumente und Kundenansprachen entwickeln",
      "Aktionen in konkrete Teamaufgaben übersetzen",
      "Schulungsunterlagen vorbereiten",
      "Wissen erfahrener Mitarbeiter strukturieren",
      "Aufgaben und Entscheidungen dokumentieren",
      "Ergebnisse kritisch prüfen",
      "sensible Daten schützen",
      "Grenzen und Fehlerquellen von KI erkennen",
      "menschliche Verantwortung beibehalten",
    ],
    note: "KI kann Informationen beschleunigen. Verantwortung, Bewertung und Führung bleiben menschliche Aufgaben.",
    workResult:
      "Jeder Teilnehmer erstellt ein persönliches KI-Handbuch mit konkreten, geprüften Anwendungsfällen für seinen Führungsalltag.",
    benefits: [
      "schnellere Vorbereitung",
      "verständlichere Kommunikation",
      "bessere Wissenssicherung",
      "weniger unnötige Routinetätigkeit",
      "strukturiertere Umsetzung",
      "höhere Informationsgeschwindigkeit",
    ],
    shortBenefit:
      "KI als Werkzeug im Führungsalltag – sicher, verständlich und direkt anwendbar.",
    ctaLabel: "Offensivtag 04 anfragen",
  },
  {
    number: "05",
    slug: "fuehren-wenn-es-darauf-ankommt",
    title: "Führen, wenn es darauf ankommt",
    subtitle: "Unter Druck entscheiden, Probleme lösen und Umsatz aktivieren.",
    motif: "Entscheidende Phase",
    footballPrinciple:
      "Führungsqualität zeigt sich in der entscheidenden Phase des Spiels.",
    challenge:
      "Nicht der perfekte Plan entscheidet über Führungsqualität, sondern der Umgang mit Abweichungen, Konflikten, Beschwerden, Ausfällen, Veränderungen und wirtschaftlichem Druck.",
    contents: [
      "in Drucksituationen ruhig bleiben",
      "Prioritäten schnell und nachvollziehbar setzen",
      "Probleme analysieren, statt nur Symptome zu behandeln",
      "Entscheidungen klar kommunizieren",
      "Konflikte frühzeitig bearbeiten",
      "mit Widerstand und Veränderung umgehen",
      "Verantwortung statt Ausreden fördern",
      "Beschwerden als Lern- und Verkaufschance nutzen",
      "Teams durch personelle Engpässe führen",
      "Kennzahlen verständlich übersetzen",
      "Verkaufsziele in tägliche Aktivitäten übertragen",
      "aktive Kundenansprache führen",
      "Zusatzverkauf sinnvoll unterstützen",
      "Besprechungen ergebnisorientiert gestalten",
      "aus Fehlern konkrete Verbesserungen ableiten",
      "einen verbindlichen Umsetzungsplan entwickeln",
    ],
    workResult:
      "Jeder Teilnehmer erstellt einen 90-Tage-Offensivplan mit konkreten Führungsmaßnahmen, Prozessverbesserungen und Umsatzaktivitäten.",
    benefits: [
      "höhere Handlungssicherheit",
      "bessere Entscheidungen",
      "schnellere Problemlösung",
      "klarere Umsetzung wirtschaftlicher Ziele",
      "stärkerer Kundenfokus",
      "mehr Verantwortungsbereitschaft im Team",
    ],
    shortBenefit:
      "Handlungssicherheit unter Druck – und Kennzahlen, die auf der Fläche ankommen.",
    ctaLabel: "Offensivtag 05 anfragen",
  },
];

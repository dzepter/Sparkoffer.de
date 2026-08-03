/**
 * Rainer Aigner – biografische Inhalte.
 *
 * Es werden ausschließlich Angaben verwendet, die auf der bisherigen
 * Website veröffentlicht waren. VOR LIVEGANG PRÜFEN: alle Zahlen und
 * Stationen bestätigen lassen (siehe CONTENT-TODO.md).
 */

export const rainer = {
  name: "Rainer Aigner",
  headline: "Führung lernt man nicht auf der Zuschauertribüne.",
  intro:
    "Rainer Aigner kennt Mannschaften, Leistungsdruck, Rückschläge und Verantwortung aus unterschiedlichen Perspektiven: als ehemaliger Fußballprofi, Unternehmer und Führungskräftetrainer.",
  approach:
    "Seine Arbeit verbindet die Klarheit des Leistungssports mit der Realität des Unternehmensalltags. Dabei geht es nicht um Fußballromantik, sondern um übertragbare Prinzipien: Rollenverständnis, Vorbereitung, Verantwortung, Kommunikation, Motivation und Handlungsfähigkeit unter Druck.",

  /** Belegte Stationen (bisherige Website). ZU BESTÄTIGEN vor Livegang. */
  stations: [
    {
      label: "Profifußball",
      text: "Karriere als Fußballprofi mit Stationen unter anderem beim TSV 1860 München, beim FC Bayern München und bei Fortuna Düsseldorf – mit Höhen und Tiefen, die Leistungssport ausmachen.",
    },
    {
      label: "Unternehmertum",
      text: "Langjährige unternehmerische Erfahrung: Gründung und Entwicklung mehrerer Unternehmen in verschiedenen Branchen – laut bisheriger Unternehmensdarstellung 16 Firmen in 20 Jahren mit über 1.000 geschaffenen Arbeitsplätzen.",
    },
    {
      label: "Führungskräftetraining",
      text: "Ausgebildeter und zertifizierter Führungskräftetrainer. Er hat zahlreiche Führungskräfte dabei unterstützt, ihre Fähigkeiten in Führung, Teamdynamik und Entscheidungsfindung zu entwickeln.",
    },
    {
      label: "Vorträge und Programme",
      text: "Über 100 Vorträge bei Unternehmen, Verbänden und Vereinen sowie Entwicklungsprogramme für Führungskräfte – an der Schnittstelle von Sport, Wirtschaft und persönlicher Entwicklung.",
    },
  ],

  /** Persönliches Führungsverständnis. */
  principles: [
    "Erfolg ist eine persönliche Entscheidung.",
    "Wissen allein verändert kein Verhalten.",
    "Können entsteht durch Anwendung.",
    "Führung muss sichtbar und erlebbar sein.",
    "Menschen benötigen Orientierung und Vertrauen.",
    "Offensive bedeutet nicht Aggressivität.",
    "Offensive bedeutet, Verantwortung zu übernehmen und zu handeln.",
  ],

  /**
   * Leitsatz der Marke. Wird als Markenbotschaft dargestellt,
   * nicht als wörtliches Zitat gekennzeichnet, bis eine Freigabe vorliegt.
   */
  quote: "Aus Wissen Können machen.",

  /** Buch (bisherige Website). ZU BESTÄTIGEN: weiterhin lieferbar? */
  book: {
    title: "Lust auf Erfolg",
    subtitle:
      "Offensives Verhalten als Strategie für Führung, Motivation & Karriere",
    note: "Erhältlich auf Anfrage.",
  },
} as const;

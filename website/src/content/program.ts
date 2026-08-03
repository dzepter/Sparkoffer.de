/**
 * Programmformat "Der Führungsführerschein Handel Offensiv".
 * Diese Darstellungswerte sind zentral pflegbar.
 *
 * ZU BESTÄTIGEN: Es werden bewusst keine festen Gruppengrößen, Dauern
 * oder Zertifizierungen behauptet, solange diese nicht verbindlich
 * vorliegen. Siehe CONTENT-TODO.md.
 */

export const programFormat = {
  headline: "Fünf Tage. Fünf spielentscheidende Kompetenzen.",
  description:
    "Der Führungsführerschein Handel Offensiv besteht aus fünf intensiven Präsenztagen. Zwischen den einzelnen Tagen setzen die Teilnehmer konkrete Führungsaufgaben im Unternehmen um. Erfahrungen und Ergebnisse werden am folgenden Offensivtag aufgegriffen.",
  facts: [
    { label: "Format", value: "Fünf Präsenztage" },
    { label: "Zeitraum", value: "Durchführung über mehrere Wochen oder Monate" },
    { label: "Ort", value: "Inhouse oder ausgewählter Veranstaltungsort" },
    { label: "Gruppe", value: "Kompakte Teilnehmergruppen" },
    {
      label: "Arbeitsweise",
      value:
        "Praxisübungen, Gesprächssimulationen und reale Unternehmensfälle",
    },
    { label: "Transfer", value: "Persönliche Umsetzungsaufträge zwischen den Tagen" },
    { label: "Abschluss", value: "90-Tage-Offensivplan" },
  ],
  certificate: {
    label: "Teilnahmebestätigung",
    name: "Teilnahmebestätigung „Führungsführerschein Handel Offensiv“",
  },
} as const;

/** Präsenz als Differenzierungsmerkmal. */
export const presence = {
  headline: "100 Prozent Präsenz",
  statement:
    "Keine Videobibliothek. Keine anonymen Onlinelektionen. Keine Führung aus der Distanz. Wir arbeiten persönlich mit den Menschen, ihren tatsächlichen Situationen und den konkreten Herausforderungen des Unternehmens.",
  reason:
    "Führung entsteht in der Begegnung. Deshalb findet Handel Offensiv dort statt, wo Menschen gemeinsam lernen, diskutieren, trainieren und Verantwortung übernehmen.",
  locations: [
    "direkt im Unternehmen",
    "in einer Zentrale",
    "an einem ausgewählten Veranstaltungsort",
    "als unternehmensinterne Gruppe",
    "auf Anfrage als offene Präsenzveranstaltung",
  ],
} as const;

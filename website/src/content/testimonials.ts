/**
 * Teilnehmerstimmen – unverändert von der bisherigen Website übernommen.
 *
 * VOR LIVEGANG PRÜFEN: Freigaben, Namen, Funktionen und
 * Unternehmensangaben bestätigen (siehe CONTENT-TODO.md).
 * Keine erfundenen Testimonials, keine Sternebewertungen.
 */

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  /** true = groß hervorgehobenes Haupttestimonial */
  featured?: boolean;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      "Ein guter Mann, um die Gedanken wieder in Bewegung zu bringen. Durch seine kompetente und offene Art schaffte es Rainer Aigner, festgefahrene Ansatzpunkte bei mir als Geschäftsführer zu verändern. Durch seinen motivierenden Vortrag wurde mir bewusst, dass Erfolg nur durch ständiges aktives und offensives Handeln möglich ist. Vielen Dank für die offenen Worte!",
    name: "Dr. Herbert Würmseher",
    role: "Geschäftsführer Isoware GmbH, München",
    featured: true,
  },
  {
    quote:
      "Selten so einen unterhaltsamen Motivationsabend erlebt. Rainer Aigner rüttelt alle auf, die sich in der lauwarmen Komfortzone eingerichtet haben. Die Message ist klar: runter vom Sofa – die nächste Challenge wartet schon!",
    name: "Anna Gelbert",
    role: "Redseven Entertainment, ProSiebenSat.1 Group",
  },
  {
    quote:
      "Pure Begeisterung in den Augen unserer Gäste – erzeugt durch Rainer Aigners Impulsvortrag ‚Pilot oder Passagier‘. Das Dinner unseres diesjährigen Management-Forums wurde so zum Highlight der Veranstaltung.",
    name: "Dr. Thomas Braun",
    role: "Vorstand REDPOINT.TESEON AG",
  },
];

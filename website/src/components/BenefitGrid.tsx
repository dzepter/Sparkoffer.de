import { Reveal } from "./Reveal";
import { Container, SectionHeading, TacticLines } from "./ui";

const benefits = [
  {
    title: "Mitarbeiter halten",
    text: "Klarheit, Anerkennung und Verbindlichkeit stärken die Zusammenarbeit und reduzieren vermeidbare Abwanderung.",
  },
  {
    title: "Verantwortung aktivieren",
    text: "Mitarbeiter lernen, Aufgaben nicht nur auszuführen, sondern Verantwortung für Qualität und Ergebnis zu übernehmen.",
  },
  {
    title: "Führung sicherer machen",
    text: "Markt- und Abteilungsleiter gewinnen Orientierung für Entscheidungen, Gespräche und Konflikte.",
  },
  {
    title: "Abläufe verbessern",
    text: "Klare Kommunikation und sinnvolle Delegation reduzieren Reibung, Doppelarbeit und unnötige Fehler.",
  },
  {
    title: "Umsatz bewegen",
    text: "Aus Kennzahlen und Verkaufszielen werden konkrete, täglich umsetzbare Mannschaftsaufgaben.",
  },
];

export function BenefitGrid() {
  return (
    <section className="relative overflow-hidden bg-paper-2 py-16 sm:py-24">
      <TacticLines
        variant="corner"
        className="-left-20 -top-20 h-80 w-80 rotate-180 text-gruen/15"
      />
      <Container className="relative">
        <Reveal>
          <SectionHeading
            eyebrow="Die Lösung"
            title="Aus Mitarbeitern wird Mannschaft."
            intro="Handel Offensiv verbindet moderne Führungskompetenz mit der Realität des stationären Handels. Die Teilnehmer arbeiten nicht an abstrakten Modellen, sondern an ihren tatsächlichen Mitarbeitern, Abläufen, Gesprächen und Entscheidungen."
          />
        </Reveal>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, i) => (
            <Reveal
              as="li"
              key={benefit.title}
              delay={i * 60}
              className="group h-full border border-line bg-paper p-6 transition-colors hover:border-rot"
            >
              <span
                aria-hidden="true"
                className="tactic-number text-2xl text-rot"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="display mt-3 text-xl text-ink">
                {benefit.title}
              </h3>
              <p className="mt-3 leading-relaxed text-mute">{benefit.text}</p>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}

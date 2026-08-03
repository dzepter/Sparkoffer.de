import { cta } from "@/content/site";
import { Reveal } from "./Reveal";
import { ButtonLink, Container, Eyebrow, TacticLines } from "./ui";

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

/**
 * Die Lösung: großes Statement links, fünf Nutzenfelder als
 * nummerierte Taktik-Liste rechts – bewusst kein Kartenraster.
 */
export function BenefitGrid() {
  return (
    <section className="relative overflow-hidden bg-paper-2 py-16 sm:py-24">
      <TacticLines
        variant="run"
        className="-bottom-8 left-0 hidden h-40 w-[32rem] text-gruen/15 lg:block"
      />
      <Container className="relative">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
          <Reveal>
            <Eyebrow>Die Lösung</Eyebrow>
            <h2 className="display mt-3 text-3xl text-ink sm:text-4xl lg:text-[2.75rem]">
              Aus Mitarbeitern wird Mannschaft.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-mute">
              Handel Offensiv verbindet moderne Führungskompetenz mit der
              Realität des stationären Handels. Die Teilnehmer arbeiten nicht
              an abstrakten Modellen, sondern an ihren tatsächlichen
              Mitarbeitern, Abläufen, Gesprächen und Entscheidungen.
            </p>
            <p className="mt-5 border-l-4 border-rot pl-5 text-lg font-semibold leading-relaxed text-ink">
              Fünf Nutzenfelder entscheiden dabei über das Ergebnis auf der
              Fläche – und genau dort setzt das Training an.
            </p>
            <div className="mt-8">
              <ButtonLink href={cta.secondary.href} variant="outline-dark">
                {cta.secondary.label}
              </ButtonLink>
            </div>
          </Reveal>

          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute bottom-5 left-[1.05rem] top-5 hidden w-px bg-line sm:block"
            />
            <ol>
              {benefits.map((benefit, i) => (
                <Reveal
                  as="li"
                  key={benefit.title}
                  delay={i * 60}
                  className="relative flex gap-5 border-b border-line py-5 last:border-0"
                >
                  <span
                    aria-hidden="true"
                    className="tactic-number relative z-10 flex h-9 w-9 shrink-0 items-center justify-center border-2 border-rot bg-paper-2 text-sm text-rot"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <h3 className="display text-xl text-ink">
                      {benefit.title}
                    </h3>
                    <p className="mt-1.5 leading-relaxed text-mute">
                      {benefit.text}
                    </p>
                  </span>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </Container>
    </section>
  );
}

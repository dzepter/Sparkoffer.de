import { Reveal } from "./Reveal";
import { Container, Eyebrow } from "./ui";

/**
 * Verbindet die Fußball-Analogie mit einer konkreten Führungssituation –
 * gezielt und dosiert, nie als Dekoration.
 */
export function FootballPrinciple() {
  return (
    <section className="relative overflow-hidden border-b border-line bg-paper py-16 sm:py-20">
      {/* Dezente Spielfeldlinie */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-px w-full text-gruen/25 lg:block"
        preserveAspectRatio="none"
      >
        <line x1="0" y1="0" x2="100%" y2="0" stroke="currentColor" strokeWidth="2" strokeDasharray="12 10" />
      </svg>
      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow>Warum Fußball?</Eyebrow>
            <p className="display mt-5 text-2xl leading-snug text-ink sm:text-3xl">
              Eine gute Aufstellung allein gewinnt noch kein Spiel.
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-mute">
              Mitarbeiter müssen ihre Rolle verstehen, Verantwortung annehmen
              und in entscheidenden Situationen handlungsfähig bleiben. Genau
              dafür nutzt Handel Offensiv die Logik des Mannschaftssports:
              Aufstellung, Rollen, Kommunikation – und Umsetzung auf dem
              Platz statt Theorie in der Besprechung.
            </p>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

import { Reveal } from "./Reveal";
import { Container, SectionHeading } from "./ui";

const problemSignals = [
  "Gute Mitarbeiter verlassen das Unternehmen.",
  "Entscheidungen und schwierige Gespräche werden aufgeschoben.",
  "Führungskräfte übernehmen zu viele Aufgaben selbst.",
  "Ziele und Informationen kommen nicht wirksam bei der Mannschaft an.",
];

export function ProblemSection() {
  return (
    <section className="border-b border-line bg-paper py-16 sm:py-24">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Die Ausgangslage"
            title="Im Handel wird Führung zur entscheidenden Position."
          />
        </Reveal>
        <div className="mt-8 grid gap-10 grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
          <Reveal>
            <div className="space-y-5 text-lg leading-relaxed text-mute">
              <p>
                Mitarbeiter werden knapper. Anforderungen steigen.
                Informationen müssen schneller umgesetzt werden. Gleichzeitig
                sollen Markt-, Filial- und Abteilungsleiter für
                Kundenorientierung, Verlässlichkeit, Leistung und
                wirtschaftliche Ergebnisse sorgen.
              </p>
              <p>
                Viele dieser Führungskräfte wurden aufgrund ihrer fachlichen
                Leistung befördert. Auf ihre neue Rolle als Mannschaftsführer
                wurden sie jedoch häufig nicht systematisch vorbereitet.
              </p>
            </div>
            <p className="display mt-8 border-l-4 border-rot pl-5 text-xl text-ink sm:text-2xl">
              Wer auf der Fläche Verantwortung trägt, braucht mehr als
              Fachwissen. Er braucht Klarheit, Menschenkenntnis und echte
              Handlungskompetenz.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <h3 className="eyebrow text-mute">Vier typische Signale</h3>
            <ul className="mt-5 divide-y divide-line border-y border-line">
              {problemSignals.map((signal, i) => (
                <li key={signal} className="flex items-start gap-4 py-4">
                  <span
                    aria-hidden="true"
                    className="tactic-number mt-0.5 text-lg text-rot"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[1.0625rem] leading-relaxed text-ink">
                    {signal}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

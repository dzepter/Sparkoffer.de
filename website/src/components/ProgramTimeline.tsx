import { programFormat } from "@/content/program";
import { Reveal } from "./Reveal";
import { Container, SectionHeading } from "./ui";

/** Programmformat: Fünf Tage. Fünf spielentscheidende Kompetenzen. */
export function ProgramTimeline() {
  return (
    <section className="border-b border-line bg-paper-2 py-16 sm:py-24">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Das Format"
            title={programFormat.headline}
            intro={programFormat.description}
          />
        </Reveal>
        <Reveal delay={100}>
          <dl className="mt-12 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {programFormat.facts.map((fact) => (
              <div key={fact.label} className="bg-paper p-6">
                <dt className="eyebrow text-mute">{fact.label}</dt>
                <dd className="mt-2 font-medium leading-relaxed text-ink">
                  {fact.value}
                </dd>
              </div>
            ))}
            <div className="bg-paper p-6">
              <dt className="eyebrow text-mute">
                {programFormat.certificate.label}
              </dt>
              <dd className="mt-2 font-medium leading-relaxed text-ink">
                {programFormat.certificate.name}
              </dd>
            </div>
          </dl>
        </Reveal>
      </Container>
    </section>
  );
}

import { offers } from "@/content/offers";
import { Reveal } from "./Reveal";
import { ButtonLink, Container, SectionHeading } from "./ui";

/** Drei Einstiegsmöglichkeiten für Unternehmen. */
export function OfferCards() {
  return (
    <section className="border-b border-line bg-paper py-16 sm:py-24">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Drei Wege in die Offensive"
            title="So starten Unternehmen mit Handel Offensiv"
            intro="Vom fokussierten Einzeltag bis zum vollständigen Entwicklungsprogramm – der Einstieg richtet sich nach Ihrer Ausgangssituation, nicht nach einem Schema."
          />
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {offers.map((offer, i) => (
            <Reveal key={offer.id} delay={i * 80}>
              <article className="flex h-full flex-col border border-line bg-paper-2 p-7 transition-colors hover:border-rot">
                <p className="eyebrow text-rot">{offer.eyebrow}</p>
                <h3 className="display mt-3 text-2xl text-ink">
                  {offer.title}
                </h3>
                <p className="mt-4 leading-relaxed text-mute">
                  {offer.description}
                </p>

                <h4 className="eyebrow mt-6 text-mute">Geeignet für</h4>
                <ul className="mt-3 space-y-2 text-[0.9375rem] text-ink">
                  {offer.suitedFor.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rot"
                      />
                      {item}
                    </li>
                  ))}
                </ul>

                {offer.agenda ? (
                  <>
                    <h4 className="eyebrow mt-6 text-mute">Möglicher Ablauf</h4>
                    <ol className="mt-3 space-y-2 text-[0.9375rem] text-ink">
                      {offer.agenda.map((step, stepIndex) => (
                        <li key={step} className="flex items-start gap-3">
                          <span
                            aria-hidden="true"
                            className="tactic-number mt-0.5 text-sm text-rot"
                          >
                            {String(stepIndex + 1).padStart(2, "0")}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </>
                ) : null}

                <div className="mt-auto pt-7">
                  <ButtonLink
                    href={offer.cta.href}
                    variant="primary"
                    className="w-full"
                  >
                    {offer.cta.label}
                  </ButtonLink>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

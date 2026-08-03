import { impactCheck } from "@/content/offers";
import { Reveal } from "./Reveal";
import { ButtonLink, Container, TacticLines } from "./ui";

/** Der 50.000-Euro-Wirkungscheck – seriös, ohne Garantieversprechen. */
export function ImpactCheckSection() {
  return (
    <section className="on-dark relative overflow-hidden bg-ink py-16 text-white sm:py-24">
      <TacticLines
        variant="corner"
        className="-right-24 -bottom-24 h-96 w-96 rotate-90 text-white/[0.05]"
      />
      <Container className="relative">
        <div className="grid gap-10 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-16">
          <Reveal>
            <p className="eyebrow text-rot-hell">{impactCheck.eyebrow}</p>
            <h2 className="display mt-3 text-4xl text-white sm:text-5xl">
              {impactCheck.title}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-mute-dark">
              {impactCheck.description}
            </p>
            <p className="mt-6 border-l-4 border-rot-hell bg-ink-2 p-5 leading-relaxed text-white/90">
              <strong className="font-display uppercase tracking-wider text-rot-hell">
                Wichtig:{" "}
              </strong>
              {impactCheck.disclaimer}
            </p>
            <div className="mt-8">
              <ButtonLink href={impactCheck.cta.href} variant="primary">
                {impactCheck.cta.label}
              </ButtonLink>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <h3 className="eyebrow text-mute-dark">
              Diese Felder betrachten wir gemeinsam
            </h3>
            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {impactCheck.fields.map((field) => (
                <li
                  key={field}
                  className="flex items-start gap-2.5 border-b border-line-dark pb-2.5 text-[0.9375rem] text-white/85"
                >
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rot"
                  />
                  {field}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

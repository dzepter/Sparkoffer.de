import { testimonials } from "@/content/testimonials";
import { Reveal } from "./Reveal";
import { Container, TacticLines } from "./ui";

/**
 * Großzügiges, hervorgehobenes Einzeltestimonial im oberen Drittel der
 * Startseite – echtes Zitat, unverändert übernommen.
 */
export function QuoteBand() {
  const featured = testimonials.find((t) => t.featured) ?? testimonials[0];

  return (
    <section className="on-dark relative overflow-hidden bg-ink py-14 text-white sm:py-20">
      <TacticLines
        variant="corner"
        className="-left-24 -top-24 h-80 w-80 rotate-180 text-white/[0.05]"
      />
      <Container className="relative">
        <Reveal>
          <figure className="mx-auto max-w-4xl">
            <span
              aria-hidden="true"
              className="tactic-number block text-7xl leading-none text-rot-hell/40 select-none"
            >
              „
            </span>
            <blockquote className="-mt-6 text-xl leading-relaxed text-white sm:text-2xl">
              {featured.quote}
            </blockquote>
            <figcaption className="mt-6 flex flex-wrap items-baseline gap-x-3">
              <span className="font-display font-semibold uppercase tracking-wider text-white">
                {featured.name}
              </span>
              <span className="text-[0.9375rem] text-mute-dark">
                {featured.role}
              </span>
            </figcaption>
          </figure>
        </Reveal>
      </Container>
    </section>
  );
}

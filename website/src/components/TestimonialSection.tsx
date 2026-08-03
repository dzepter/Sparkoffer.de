import { testimonials } from "@/content/testimonials";
import { Reveal } from "./Reveal";
import { Container, SectionHeading } from "./ui";

/**
 * Teilnehmerstimmen: ein großes Haupttestimonial, weitere darunter.
 * Kein Karussell, keine Sternebewertungen.
 */
export function TestimonialSection() {
  const featured = testimonials.find((t) => t.featured) ?? testimonials[0];
  const others = testimonials.filter((t) => t !== featured);

  return (
    <section className="bg-paper-2 py-16 sm:py-24">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Stimmen"
            title="Das sagen Zuhörer über Rainer Aigner"
            intro="Stimmen von Teilnehmern und Gastgebern seiner Vorträge und Impulsveranstaltungen."
          />
        </Reveal>

        <Reveal>
          <figure className="mt-10 border-l-4 border-rot bg-paper p-7 sm:p-10">
            <blockquote className="text-xl leading-relaxed text-ink sm:text-2xl">
              „{featured.quote}“
            </blockquote>
            <figcaption className="mt-6">
              <span className="font-display font-semibold uppercase tracking-wider text-ink">
                {featured.name}
              </span>
              <span className="mt-0.5 block text-sm text-mute">
                {featured.role}
              </span>
            </figcaption>
          </figure>
        </Reveal>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {others.map((t, i) => (
            <Reveal key={t.name} delay={i * 80}>
              <figure className="h-full border border-line bg-paper p-6 sm:p-8">
                <blockquote className="leading-relaxed text-ink">
                  „{t.quote}“
                </blockquote>
                <figcaption className="mt-5">
                  <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink">
                    {t.name}
                  </span>
                  <span className="mt-0.5 block text-sm text-mute">
                    {t.role}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

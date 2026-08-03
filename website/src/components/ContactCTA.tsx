import { cta, siteConfig } from "@/content/site";
import { Reveal } from "./Reveal";
import { ButtonLink, Container, TacticLines } from "./ui";

/** Abschluss-CTA für Start- und Hauptseiten. */
export function ContactCTA({
  headline = "Bringen Sie Ihre Führungskräfte in die Offensive.",
  text = "Gute Führung beginnt nicht mit einem weiteren Handbuch. Sie beginnt mit einer klaren Entscheidung und dem ersten gemeinsamen Trainingstag.",
  primary = cta.handelOffensiv,
  secondary = cta.kontakt,
}: {
  headline?: string;
  text?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <section className="on-dark relative overflow-hidden bg-ink py-16 text-white sm:py-24">
      <TacticLines
        variant="run"
        className="-bottom-6 right-0 h-44 w-[40rem] text-white/[0.06]"
      />
      <Container className="relative">
        <Reveal>
          <div className="max-w-3xl">
            <h2 className="display text-4xl text-white sm:text-5xl">
              {headline}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-mute-dark">
              {text}
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <ButtonLink href={primary.href} variant="primary">
                {primary.label}
              </ButtonLink>
              <ButtonLink href={secondary.href} variant="outline-light">
                {secondary.label}
              </ButtonLink>
            </div>
            <p className="eyebrow mt-12 text-mute-dark">
              {siteConfig.knowledgeLine}
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

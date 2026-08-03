import { images } from "@/content/images";
import { cta, siteConfig } from "@/content/site";
import { Reveal } from "./Reveal";
import { SitePhoto } from "./SitePhoto";
import { ButtonLink, Container, TacticLines } from "./ui";

const trustItems = [
  "100 Prozent Präsenz",
  "Fünf intensive Offensivtage",
  "Konkrete Fälle aus dem Unternehmen",
];

export function Hero() {
  return (
    <section className="on-dark relative overflow-hidden bg-ink text-white">
      <TacticLines
        variant="halfway"
        className="-right-40 -top-40 h-[32rem] w-[32rem] text-white/[0.05]"
      />
      <TacticLines
        variant="run"
        className="bottom-10 left-0 hidden h-40 w-[36rem] text-rot/25 lg:block"
      />
      <Container className="relative">
        <div className="grid grid-cols-1 items-center gap-10 py-14 sm:py-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16 lg:py-24">
          <div>
            <Reveal>
              <p className="eyebrow text-mute-dark">
                Aigner Offensiv präsentiert
              </p>
              <h1 className="mt-4">
                <span className="display block text-5xl text-white sm:text-6xl lg:text-7xl">
                  Handel <span className="text-rot-hell">Offensiv</span>
                </span>
                <span className="mt-3 block font-display text-xl font-medium uppercase tracking-[0.08em] text-mute-dark sm:text-2xl">
                  {siteConfig.productLabel}
                </span>
              </h1>
            </Reveal>
            <Reveal delay={100}>
              <p className="display mt-8 max-w-xl text-2xl leading-snug text-white sm:text-[1.75rem]">
                {siteConfig.claim}
              </p>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-mute-dark">
                Wir entwickeln Marktleiter, Filialleiter, Abteilungsleiter und
                Nachwuchsführungskräfte zu Führungspersönlichkeiten, die
                Mitarbeiter binden, Verantwortung aktivieren und
                wirtschaftliche Ziele auf die Fläche bringen – persönlich, mit
                Rainer Aigner.
              </p>
            </Reveal>
            <Reveal delay={200}>
              <div className="mt-9 flex flex-wrap gap-4">
                <ButtonLink href={cta.erstgespraech.href} variant="primary">
                  {cta.erstgespraech.label}
                </ButtonLink>
                <ButtonLink href={cta.secondary.href} variant="outline-light">
                  {cta.secondary.label}
                </ButtonLink>
              </div>
            </Reveal>
          </div>

          <Reveal delay={150} className="relative">
            <div className="absolute -left-4 -top-4 hidden h-full w-full border border-white/15 lg:block" />
            <SitePhoto
              image={images.heroHome}
              fallback={images.rainerPresenting}
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="relative aspect-[4/5] w-full"
              imgClassName={
                images.heroHome.available ? "" : "object-[22%_center]"
              }
              preload
            />
            <p className="absolute inset-x-0 -bottom-0 bg-gradient-to-t from-ink/90 to-transparent px-5 pb-4 pt-10 text-sm text-white/90">
              Rainer Aigner – Ex-Profi, Unternehmer, Führungskräftetrainer
            </p>
          </Reveal>
        </div>

        {/* Vertrauenselemente */}
        <ul className="relative grid gap-px border-t border-white/10 pb-0 sm:grid-cols-3">
          {trustItems.map((item, i) => (
            <li
              key={item}
              className="flex items-center gap-3 py-5 sm:justify-center"
            >
              <span className="tactic-number text-sm text-rot-hell" aria-hidden="true">
                0{i + 1}
              </span>
              <span className="font-display text-sm font-medium uppercase tracking-wider text-white/85">
                {item}
              </span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

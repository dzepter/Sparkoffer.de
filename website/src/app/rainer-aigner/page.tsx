import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContactCTA } from "@/components/ContactCTA";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { SitePhoto } from "@/components/SitePhoto";
import {
  Container,
  Eyebrow,
  QuoteBlock,
  SectionHeading,
  TacticLines,
} from "@/components/ui";
import { images } from "@/content/images";
import { rainer } from "@/content/rainer";
import { cta, routes, siteConfig } from "@/content/site";

export const metadata: Metadata = pageMetadata({
  title: "Rainer Aigner | Aigner Offensiv",
  description:
    "Rainer Aigner verbindet Erfahrungen aus Profifußball, Unternehmertum und Führungskräftetraining. Warum er Führungskräfte im Handel entwickelt – und wie er arbeitet.",
  path: routes.rainerAigner,
});

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: rainer.name,
  jobTitle: "Führungskräftetrainer",
  worksFor: { "@type": "Organization", name: siteConfig.brand, url: siteConfig.url },
  url: `${siteConfig.url}${routes.rainerAigner}`,
  description:
    "Ehemaliger Fußballprofi, Unternehmer und Führungskräftetrainer. Entwickelt Führungskräfte im stationären Handel.",
};

export default function RainerAignerPage() {
  return (
    <>
      <JsonLd data={personJsonLd} />
      <Breadcrumbs
        items={[{ label: "Rainer Aigner", href: routes.rainerAigner }]}
      />

      {/* Einstieg */}
      <section className="on-dark relative overflow-hidden bg-ink py-14 text-white sm:py-20">
        <TacticLines
          variant="run"
          className="right-0 top-10 hidden h-40 w-[34rem] text-white/[0.06] lg:block"
        />
        <Container className="relative">
          <div className="grid items-center gap-10 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-16">
            <Reveal>
              <Eyebrow className="text-rot-hell">{rainer.name}</Eyebrow>
              <h1 className="display mt-3 text-4xl text-white sm:text-5xl lg:text-[3.5rem]">
                {rainer.headline}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-mute-dark">
                {rainer.intro}
              </p>
              <p className="mt-4 max-w-xl leading-relaxed text-mute-dark">
                {rainer.approach}
              </p>
            </Reveal>
            <Reveal delay={150}>
              <SitePhoto
                image={images.rainerPortraitCasual}
                fallback={images.rainerStage}
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="aspect-square w-full min-w-0 sm:max-w-md lg:ml-auto"
                imgClassName={
                  images.rainerPortraitCasual.available
                    ? ""
                    : "object-[52%_center]"
                }
              />
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Stationen */}
      <section className="border-b border-line bg-paper py-16 sm:py-24">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Die Perspektiven"
              title="Vier Erfahrungswelten, ein Führungsverständnis"
            />
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {rainer.stations.map((station, i) => (
              <Reveal key={station.label} delay={i * 70}>
                <article className="h-full border border-line bg-paper-2 p-7">
                  <span
                    aria-hidden="true"
                    className="tactic-number text-2xl text-rot"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="display mt-3 text-xl text-ink">
                    {station.label}
                  </h3>
                  <p className="mt-3 leading-relaxed text-mute">
                    {station.text}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="mt-8 max-w-2xl text-sm leading-relaxed text-mute">
              Alle biografischen Angaben stammen aus der bisherigen
              Unternehmensdarstellung von Aigner Offensiv.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* Auszeichnung „Mia san mia“ */}
      <section className="on-dark relative overflow-hidden border-b border-line-dark bg-ink py-16 text-white sm:py-20">
        <TacticLines
          variant="halfway"
          className="-right-40 -bottom-40 h-96 w-96 text-white/[0.05]"
        />
        <Container className="relative">
          <div
            className={
              images.miaSanMia.available
                ? "grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-16"
                : "max-w-3xl"
            }
          >
            {images.miaSanMia.available ? (
              <Reveal>
                <SitePhoto
                  image={images.miaSanMia}
                  sizes="(max-width: 1024px) 100vw, 30vw"
                  className="aspect-[3/4] w-full max-w-sm"
                />
              </Reveal>
            ) : null}
            <Reveal delay={120}>
              <Eyebrow className="text-rot-hell">{rainer.award.eyebrow}</Eyebrow>
              <h2 className="display mt-3 text-3xl text-white sm:text-4xl">
                {rainer.award.title}
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-mute-dark">
                {rainer.award.text}
              </p>
              <p className="mt-4 max-w-xl leading-relaxed text-white/85">
                {rainer.award.conclusion}
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Führungsverständnis */}
      <section className="border-b border-line bg-paper-2 py-16 sm:py-24">
        <Container>
          <div className="grid gap-12 grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
            <Reveal>
              <SectionHeading
                eyebrow="Haltung"
                title="Sein Führungsverständnis"
              />
              <div className="mt-10">
                <QuoteBlock
                  quote={rainer.quote}
                  attribution="Leitsatz von Aigner Offensiv"
                />
              </div>
            </Reveal>
            <Reveal delay={100}>
              <ul className="divide-y divide-line border-y border-line">
                {rainer.principles.map((principle) => (
                  <li
                    key={principle}
                    className="flex items-start gap-4 py-4 text-lg text-ink"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-rot"
                    />
                    {principle}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Buch */}
      <section className="border-b border-line bg-paper py-16 sm:py-20">
        <Container>
          <div className="flex flex-col items-start gap-10 sm:flex-row sm:items-center">
            <Reveal>
              <SitePhoto
                image={images.bookCover}
                sizes="180px"
                className="w-44 shrink-0 shadow-lg"
              />
            </Reveal>
            <Reveal delay={100}>
              <Eyebrow>Das Buch</Eyebrow>
              <h2 className="display mt-3 text-3xl text-ink">
                {rainer.book.title}
              </h2>
              <p className="mt-3 max-w-xl text-lg leading-relaxed text-mute">
                {rainer.book.subtitle}
              </p>
              <p className="mt-3 text-sm text-mute">{rainer.book.note}</p>
            </Reveal>
          </div>
        </Container>
      </section>

      <ContactCTA
        headline="Lernen Sie Rainer Aigner persönlich kennen."
        text="Am besten dort, wo Führung stattfindet: in Ihrem Unternehmen. Vereinbaren Sie ein Erstgespräch – persönlich, konkret und mit Blick auf Ihre Mannschaft."
        primary={cta.erstgespraech}
        secondary={cta.secondary}
      />
    </>
  );
}

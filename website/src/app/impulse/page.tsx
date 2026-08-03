import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContactCTA } from "@/components/ContactCTA";
import { Reveal } from "@/components/Reveal";
import { SitePhoto } from "@/components/SitePhoto";
import { ButtonLink, Container, Eyebrow } from "@/components/ui";
import { images } from "@/content/images";
import { impulsvortraege } from "@/content/impulse";
import { cta, routes } from "@/content/site";

export const metadata: Metadata = pageMetadata({
  title: "Impulse & Vorträge | Aigner Offensiv",
  description:
    "Impulsvorträge für Tagungen, Jahresauftakte und Führungskräfteveranstaltungen: Handel ist Mannschaftssport, Pilot oder Passagier, Aus Wissen Können machen und mehr.",
  path: routes.impulse,
});

export default function ImpulsePage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Impulse", href: routes.impulse }]} />

      <section className="border-b border-line bg-paper py-14 sm:py-20">
        <Container>
          <div className="grid items-center gap-10 grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
            <Reveal>
              <Eyebrow>Impulse & Vorträge</Eyebrow>
              <h1 className="display mt-3 text-4xl text-ink sm:text-5xl lg:text-6xl">
                Der Impuls vor dem Anpfiff
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-mute">
                Ein Impulsvortrag ersetzt kein Training – aber er öffnet Türen:
                für neue Perspektiven, für Gespräche im Team und oft für den
                ersten Offensivtag. Rainer Aigner spricht bei Tagungen,
                Jahresauftakten und Führungskräfteveranstaltungen – persönlich,
                konkret und mit der Erfahrung aus Profifußball und
                Unternehmertum.
              </p>
            </Reveal>
            <Reveal delay={150}>
              <SitePhoto
                image={images.rainerStage}
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="aspect-[16/10] w-full"
              />
              <p className="mt-3 text-sm text-mute">
                Rainer Aigner auf der Bühne.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="border-b border-line bg-paper-2 py-16 sm:py-24">
        <Container>
          <div className="grid gap-6 md:grid-cols-2">
            {impulsvortraege.map((vortrag, i) => (
              <Reveal key={vortrag.slug} delay={(i % 2) * 80}>
                <article className="flex h-full flex-col border border-line bg-paper p-7">
                  <p className="eyebrow text-rot">Impulsvortrag</p>
                  <h2 className="display mt-3 text-2xl text-ink">
                    {vortrag.title}
                  </h2>

                  <dl className="mt-5 space-y-4 text-[0.9375rem]">
                    <div>
                      <dt className="eyebrow text-mute">Für wen</dt>
                      <dd className="mt-1.5 leading-relaxed text-ink">
                        {vortrag.audience}
                      </dd>
                    </div>
                    <div>
                      <dt className="eyebrow text-mute">Ausgangssituation</dt>
                      <dd className="mt-1.5 leading-relaxed text-mute">
                        {vortrag.situation}
                      </dd>
                    </div>
                    <div>
                      <dt className="eyebrow text-mute">Kerngedanke</dt>
                      <dd className="mt-1.5 leading-relaxed text-ink">
                        {vortrag.coreIdea}
                      </dd>
                    </div>
                    <div>
                      <dt className="eyebrow text-mute">Dauer</dt>
                      <dd className="mt-1.5 text-mute">{vortrag.duration}</dd>
                    </div>
                    <div>
                      <dt className="eyebrow text-mute">Mögliche Formate</dt>
                      <dd className="mt-1.5 text-mute">
                        {vortrag.formats.join(" · ")}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-auto pt-6">
                    <ButtonLink
                      href={`${cta.impulsvortrag.href}&vortrag=${vortrag.slug}`}
                      variant="outline-dark"
                      className="w-full"
                    >
                      {cta.impulsvortrag.label}
                    </ButtonLink>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <ContactCTA
        headline="Ein Impuls, der in die Umsetzung führt."
        text="Sie planen eine Tagung, einen Jahresauftakt oder eine Führungskräfteveranstaltung? Wir besprechen persönlich, welcher Impuls zu Ihrem Anlass passt – und wie daraus mehr wird als ein Vortrag."
        primary={cta.impulsvortrag}
        secondary={cta.kontakt}
      />
    </>
  );
}

import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContactCTA } from "@/components/ContactCTA";
import { ImpactCheckSection } from "@/components/ImpactCheckSection";
import { OfferCards } from "@/components/OfferCards";
import { Reveal } from "@/components/Reveal";
import { SitePhoto } from "@/components/SitePhoto";
import { Container, Eyebrow } from "@/components/ui";
import { images } from "@/content/images";
import { cta, routes } from "@/content/site";

export const metadata: Metadata = pageMetadata({
  title: "Für Unternehmen | Handel Offensiv",
  description:
    "Einzelner Offensivtag, vollständiger Führungsführerschein oder Handel-Offensivtag für das gesamte Unternehmen: drei Wege, Führungskräfte im Handel zu entwickeln.",
  path: routes.fuerUnternehmen,
});

export default function FuerUnternehmenPage() {
  return (
    <>
      <Breadcrumbs
        items={[{ label: "Für Unternehmen", href: routes.fuerUnternehmen }]}
      />

      <section className="border-b border-line bg-paper py-14 sm:py-20">
        <Container>
          <div className="grid items-center gap-10 grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
            <Reveal>
              <Eyebrow>Für Unternehmen</Eyebrow>
              <h1 className="display mt-3 text-3xl text-ink sm:text-5xl lg:text-6xl">
                Führungskräfteentwicklung, die zu Ihrem Handel passt
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-mute">
                Ob einzelner Schwerpunkttag, vollständiger
                Führungsführerschein oder ein gemeinsamer Offensivtag für das
                ganze Unternehmen: Inhalt und Umfang richten sich nach Ihrer
                Führungsstruktur, Ihren Standorten und Ihrer konkreten
                Ausgangssituation.
              </p>
            </Reveal>
            <Reveal delay={150}>
              <SitePhoto
                image={images.rainerPortraitFormal}
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="aspect-[4/5] w-full min-w-0 sm:max-w-md lg:ml-auto"
              />
            </Reveal>
          </div>
        </Container>
      </section>

      <OfferCards />
      <ImpactCheckSection />

      <ContactCTA
        headline="Welcher Einstieg passt zu Ihrem Unternehmen?"
        text="Beschreiben Sie uns kurz Ihre Ausgangssituation – wir melden uns persönlich und besprechen, welcher Weg für Ihre Führungsmannschaft sinnvoll ist."
        primary={cta.erstgespraech}
        secondary={cta.wirkungscheck}
      />
    </>
  );
}

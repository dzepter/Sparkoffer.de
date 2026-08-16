import type { Metadata } from "next";
import Image from "next/image";
import { ArrowLink, Cta } from "@/components/cta";
import { PageIntro } from "@/components/page-intro";
import { restaurant } from "@/lib/restaurant-config";
import {
  buffetReisGrill,
  gastraumLandscape,
  logoWand,
  ogImage,
} from "@/lib/images";

export const metadata: Metadata = {
  title: "Über uns",
  description:
    "Safran Grill in Neustadt an der Weinstraße: afghanische Küche, Grillgerichte und ein warmer, unkomplizierter Gastraum mitten in der Altstadt.",
  alternates: { canonical: "/ueber-uns" },
  openGraph: {
    images: [ogImage],
    url: "/ueber-uns",
    title: "Über uns | Safran Grill Neustadt",
    description:
      "Afghanische Küche, Grillgerichte und ein warmer, unkomplizierter Gastraum mitten in der Neustadter Altstadt.",
  },
};

export default function UeberUnsPage() {
  return (
    <>
      <PageIntro
        crumbs={[{ name: "Über uns", path: "/ueber-uns" }]}
        eyebrow="Das Restaurant"
        title="Gutes Essen, ehrlich gemacht"
      >
        <p>
          Safran Grill ist ein kleines Restaurant an der Hauptstraße in
          Neustadt an der Weinstraße – mit afghanischer Küche, Frischem vom
          Grill und einem Buffet für alle, die gern probieren.
        </p>
      </PageIntro>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <figure>
          <Image
            src={gastraumLandscape.src}
            alt={gastraumLandscape.alt}
            width={gastraumLandscape.width}
            height={gastraumLandscape.height}
            sizes="(min-width: 1280px) 72rem, 100vw"
            className="w-full object-cover"
            priority
          />
          <figcaption className="mt-3 text-[0.85rem] text-ink-faint">
            Unser Gastraum mit Blick auf die Hauptstraße
          </figcaption>
        </figure>

        <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              Unsere Küche
            </h2>
            <div className="mt-5 space-y-5 leading-relaxed text-ink-soft">
              <p>
                Im Mittelpunkt stehen die Aromen der afghanischen Küche:
                würziger Reis, frisch gebackenes Naan, langsam geschmorte
                Spezialitäten und mariniertes Fleisch vom Grill. Dazu kommen
                Salate, vegetarische Gerichte, hausgemachte Soßen und
                orientalische Pizzen.
              </p>
              <p>
                Wer sich nicht entscheiden kann, nimmt das
                All-you-can-eat-Buffet – ein Querschnitt durch unsere Küche,
                bei dem sich jeder nach Appetit bedient.
              </p>
            </div>

            <h2 className="mt-12 font-display text-2xl font-semibold sm:text-3xl">
              Mitten in Neustadt
            </h2>
            <div className="mt-5 space-y-5 leading-relaxed text-ink-soft">
              <p>
                Du findest uns in der {restaurant.address.street}, mitten in
                der Neustadter Altstadt. Der Gastraum ist klein und warm:
                helles Holz, bequeme Stühle, Blick auf die Straße. Zum
                schnellen Mittagessen, zum Abendessen mit der Familie – oder
                zum Mitnehmen auf die Hand.
              </p>
              <p>
                Herzlich, unkompliziert und zu fairen Preisen. Vorbeikommen,
                Platz nehmen, genießen.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Cta href="/speisekarte">Speisekarte ansehen</Cta>
              <Cta href="/kontakt" variant="outline">
                Kontakt &amp; Anfahrt
              </Cta>
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="mb-8 grid grid-cols-2 gap-4">
              <figure>
                <Image
                  src={logoWand.src}
                  alt={logoWand.alt}
                  width={logoWand.width}
                  height={logoWand.height}
                  sizes="(min-width: 1024px) 14rem, 50vw"
                  className="w-full object-cover"
                />
              </figure>
              <figure>
                <Image
                  src={buffetReisGrill.src}
                  alt={buffetReisGrill.alt}
                  width={buffetReisGrill.width}
                  height={buffetReisGrill.height}
                  sizes="(min-width: 1024px) 14rem, 50vw"
                  className="aspect-square w-full object-cover"
                />
              </figure>
            </div>
            <div className="border border-line bg-cream-deep/50 p-7">
              <h2 className="text-[0.72rem] font-semibold uppercase tracking-eyebrow text-ink-faint">
                Das sagen unsere Gäste
              </h2>
              <p className="mt-4 font-display text-4xl font-semibold">
                {restaurant.googleRating.value}
                <span className="text-xl text-ink-faint"> / 5</span>
              </p>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">
                {restaurant.googleRating.count} Bewertungen bei Google · Stand{" "}
                {restaurant.googleRating.asOf}
              </p>
              <p className="mt-5">
                <ArrowLink href={restaurant.links.googleReviews} external>
                  Bewertungen bei Google lesen
                </ArrowLink>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

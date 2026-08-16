import type { Metadata } from "next";
import Image from "next/image";
import { Cta, Eyebrow } from "@/components/cta";
import { PageIntro } from "@/components/page-intro";
import { fullAddress, restaurant } from "@/lib/restaurant-config";
import { pageOpenGraph } from "@/lib/og";
import {
  buffetGerichte,
  buffetReisgericht,
  buffetStrecke,
  grillfleischDetail,
} from "@/lib/images";

export const metadata: Metadata = {
  title: { absolute: "All-you-can-eat-Buffet Neustadt | Safran Grill" },
  description:
    "All-you-can-eat bei Safran Grill in Neustadt an der Weinstraße: Reis, Fleischgerichte, vegetarische Auswahl, Salate und Dessert entdecken.",
  alternates: { canonical: "/buffet" },
  openGraph: pageOpenGraph({
    url: "/buffet",
    title: "All-you-can-eat-Buffet Neustadt | Safran Grill",
    description:
      "Reisgerichte, Fleisch- und Grillspezialitäten, vegetarische Gerichte, Salate und Dessert – das Buffet im Safran Grill.",
  }),
};

export default function BuffetPage() {
  const { buffet } = restaurant;

  return (
    <>
      {/* ————— Buffet-Hero ————— */}
      <PageIntro
        crumbs={[{ name: "Buffet", path: "/buffet" }]}
        eyebrow="All you can eat"
        title={
          <>
            All you can eat
            <br />
            in Neustadt.
          </>
        }
      >
        <p>
          Unser All-you-can-eat-Buffet in Neustadt an der Weinstraße ist für
          alle, die gern probieren: Du nimmst dir, worauf du Appetit hast –
          so oft du magst.
        </p>
      </PageIntro>

      {/* Großes Buffetfoto + Preis als typografisches Element */}
      <section className="bg-cream">
        <div className="mx-auto max-w-[85rem] px-5 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-16">
            <figure className="lg:col-span-8">
              <Image
                src={buffetReisgericht.src}
                alt={buffetReisgericht.alt}
                width={buffetReisgericht.width}
                height={buffetReisgericht.height}
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="w-full object-cover"
                priority
                fetchPriority="high"
              />
              <figcaption className="mt-3 text-[0.8rem] text-ink-faint">
                Aromatischer Reis, frisch aufgefüllt – direkt an unserem Buffet
              </figcaption>
            </figure>
            <div className="lg:col-span-4 lg:pb-10">
              <p className="text-[0.72rem] font-semibold uppercase tracking-eyebrow text-saffron-deep">
                Aktueller Aktionspreis
              </p>
              <p className="mt-3 font-display display-black text-[5rem] font-bold leading-none text-ink sm:text-[6rem]">
                {buffet.price}
              </p>
              <p aria-hidden className="mt-4 h-px w-24 bg-saffron" />
              <p className="mt-4 text-lg text-ink-soft">
                {buffet.priceSuffix}
                <br />
                <span className="text-[0.95rem] text-ink-faint">
                  Getränke separat · regulär {buffet.regularPrice}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ————— Das Angebot als große Zeile ————— */}
      <section className="bg-cream">
        <div className="mx-auto max-w-[85rem] px-5 py-20 sm:px-8 lg:py-28">
          <h2 className="font-display text-3xl font-bold leading-snug text-ink sm:text-4xl lg:text-[2.8rem]">
            <span className="whitespace-nowrap">
              Reis <span aria-hidden className="text-saffron">·</span>
            </span>{" "}
            <span className="whitespace-nowrap">
              Grill <span aria-hidden className="text-saffron">·</span>
            </span>{" "}
            <span className="whitespace-nowrap">
              Vegetarisch <span aria-hidden className="text-saffron">·</span>
            </span>{" "}
            <span className="whitespace-nowrap">
              Salate <span aria-hidden className="text-saffron">·</span>
            </span>{" "}
            Dessert
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Am Buffet stehen Reisgerichte, Fleisch- und Grillgerichte,
            vegetarische und vegane Gerichte, frische Salate und Dessert
            bereit. Die Auswahl kann je nach Tag variieren – langweilig wird
            es nie.
          </p>
        </div>
      </section>

      {/* ————— Großes Foodfoto, volle Breite ————— */}
      <Image
        src={buffetStrecke.src}
        alt={buffetStrecke.alt}
        width={buffetStrecke.width}
        height={buffetStrecke.height}
        sizes="100vw"
        className="max-h-[70vh] w-full object-cover"
      />

      {/* ————— Details: Wann? / Was kostet es? (dunkel) ————— */}
      <section className="bg-coal text-paper">
        <div className="mx-auto max-w-[85rem] px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <Eyebrow onDark>Wann?</Eyebrow>
              <h2 className="font-display text-3xl font-bold first-letter:uppercase sm:text-4xl">
                {buffet.times}
              </h2>
              <p className="mt-5 max-w-md leading-relaxed text-paper/70">
                Das Buffet gibt es zu unseren Öffnungszeiten – dienstags ist
                Ruhetag. Du kommst mit einer größeren Gruppe? Ruf kurz an,
                dann ist alles vorbereitet.
              </p>
              <p className="mt-5 text-lg">
                <a
                  href={`tel:${restaurant.phone.e164}`}
                  className="font-semibold text-saffron-bright transition-colors duration-fast hover:text-paper"
                >
                  {restaurant.phone.display}
                </a>
              </p>
            </div>
            <div>
              <Eyebrow onDark>Was kostet es?</Eyebrow>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                {buffet.price} {buffet.priceSuffix}
              </h2>
              <p className="mt-5 max-w-md leading-relaxed text-paper/70">
                Der aktuelle Preis ist ein Aktionspreis – regulär kostet das
                Buffet {buffet.regularPrice}. Getränke sind nicht enthalten
                und werden separat berechnet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ————— Weitere Bilder ————— */}
      <section className="bg-cream">
        <div className="mx-auto max-w-[85rem] px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-12">
            <figure className="col-span-2 lg:col-span-8">
              <Image
                src={buffetGerichte.src}
                alt={buffetGerichte.alt}
                width={buffetGerichte.width}
                height={buffetGerichte.height}
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="w-full object-cover"
              />
              <figcaption className="mt-3 text-[0.8rem] text-ink-faint">
                Warme Gerichte aus unserer Küche
              </figcaption>
            </figure>
            <figure className="col-span-2 lg:col-span-4">
              <Image
                src={grillfleischDetail.src}
                alt={grillfleischDetail.alt}
                width={grillfleischDetail.width}
                height={grillfleischDetail.height}
                sizes="(min-width: 1024px) 28vw, 100vw"
                className="h-full w-full object-cover"
              />
            </figure>
          </div>
        </div>
      </section>

      {/* ————— Abschluss: Besuch planen ————— */}
      <section className="border-t border-line bg-paper">
        <div className="mx-auto max-w-[85rem] px-5 py-20 sm:px-8 lg:py-28">
          <h2 className="font-display display-black text-5xl font-bold leading-[0.98] sm:text-6xl">
            Hungrig?
            <br />
            Dann komm vorbei.
          </h2>
          <address className="mt-7 text-lg not-italic leading-relaxed">
            {restaurant.name} · {fullAddress}
          </address>
          <div className="mt-8 flex flex-wrap gap-4">
            <Cta href={restaurant.links.googleRoute}>Route öffnen</Cta>
            <Cta href={`tel:${restaurant.phone.e164}`} variant="outline">
              {restaurant.phone.display}
            </Cta>
          </div>
        </div>
      </section>
    </>
  );
}

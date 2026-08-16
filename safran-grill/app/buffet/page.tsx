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
      <PageIntro
        crumbs={[{ name: "Buffet", path: "/buffet" }]}
        eyebrow="All you can eat"
        title="All-you-can-eat-Buffet in Neustadt an der Weinstraße"
      >
        <p>
          Ein Buffet für alle, die gern probieren: Bei Safran Grill stehen
          Reisgerichte, Fleisch- und Grillspezialitäten, vegetarische Gerichte,
          Salate und Dessert bereit. Du nimmst dir, worauf du Appetit hast – so
          oft du magst.
        </p>
      </PageIntro>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <figure>
              <Image
                src={buffetReisgericht.src}
                alt={buffetReisgericht.alt}
                width={buffetReisgericht.width}
                height={buffetReisgericht.height}
                sizes="(min-width: 1024px) 40rem, 100vw"
                className="w-full object-cover"
                priority
              />
              <figcaption className="mt-3 text-[0.85rem] text-ink-faint">
                Aromatischer Reis, frisch aufgefüllt – direkt an unserem Buffet
              </figcaption>
            </figure>

            <h2 className="mt-12 font-display text-2xl font-semibold sm:text-3xl">
              Das erwartet dich am Buffet
            </h2>
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {buffet.includes.map((item) => (
                <li key={item} className="flex items-center gap-4 py-4 text-lg">
                  <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-saffron" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[0.95rem] text-ink-faint">
              Die Auswahl kann je nach Tag variieren.
            </p>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              <figure>
                <Image
                  src={buffetGerichte.src}
                  alt={buffetGerichte.alt}
                  width={buffetGerichte.width}
                  height={buffetGerichte.height}
                  sizes="(min-width: 640px) 20rem, 100vw"
                  className="w-full object-cover"
                />
                <figcaption className="mt-3 text-[0.85rem] text-ink-faint">
                  Warme Gerichte, täglich frisch zubereitet
                </figcaption>
              </figure>
              <figure>
                <Image
                  src={buffetStrecke.src}
                  alt={buffetStrecke.alt}
                  width={buffetStrecke.width}
                  height={buffetStrecke.height}
                  sizes="(min-width: 640px) 20rem, 100vw"
                  className="w-full object-cover"
                />
                <figcaption className="mt-3 text-[0.85rem] text-ink-faint">
                  Die Buffetstrecke mit Suppe und Salaten
                </figcaption>
              </figure>
            </div>

            <h2 className="mt-12 font-display text-2xl font-semibold sm:text-3xl">
              Gut zu wissen
            </h2>
            <div className="mt-6 space-y-5 leading-relaxed text-ink-soft">
              <p>
                Das Buffet gibt es {restaurant.buffet.times} – direkt bei uns
                im Restaurant in der {restaurant.address.street}, mitten in{" "}
                {restaurant.address.city}. Getränke sind nicht im Preis
                enthalten und werden separat berechnet.
              </p>
              <p>
                Der aktuelle Preis von {restaurant.buffet.price}{" "}
                {restaurant.buffet.priceSuffix} ist ein Aktionspreis – regulär
                kostet das Buffet {restaurant.buffet.regularPrice}.
              </p>
              <p>
                Du hast Fragen oder kommst mit einer größeren Gruppe? Ruf uns
                kurz an unter{" "}
                <a
                  href={`tel:${restaurant.phone.e164}`}
                  className="font-semibold text-saffron-deep transition-colors duration-fast hover:text-ink"
                >
                  {restaurant.phone.display}
                </a>{" "}
                – wir freuen uns auf dich.
              </p>
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-28 space-y-6">
              <div className="bg-espresso p-8 text-cream sm:p-10">
                <Eyebrow onDark>Aktueller Aktionspreis</Eyebrow>
                <p className="font-display text-6xl font-semibold">
                  {buffet.price}
                </p>
                <p className="mt-1 text-cream/75">
                  {buffet.priceSuffix}
                  {!buffet.drinksIncluded && " · Getränke separat"}
                </p>
                <p className="mt-2 text-[0.85rem] text-cream/70">
                  regulär {buffet.regularPrice}
                </p>
                <div className="mt-8 flex flex-col gap-3">
                  <Cta href={restaurant.links.googleRoute} variant="primaryOnDark">
                    Route öffnen
                  </Cta>
                  <Cta href={`tel:${restaurant.phone.e164}`} variant="outlineOnDark">
                    Jetzt anrufen
                  </Cta>
                </div>
              </div>

              <div className="border border-line p-7">
                <h2 className="text-[0.72rem] font-semibold uppercase tracking-eyebrow text-ink-faint">
                  Adresse &amp; Zeiten
                </h2>
                <address className="mt-4 not-italic leading-relaxed">
                  {restaurant.name}
                  <br />
                  {fullAddress}
                </address>
                <p className="mt-4 text-[0.95rem] text-ink-soft">
                  Buffet: {restaurant.buffet.times}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

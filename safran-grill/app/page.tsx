import type { Metadata } from "next";
import Image from "next/image";
import { ArrowLink, BrandRule, Cta, Eyebrow } from "@/components/cta";
import { fullAddress, restaurant } from "@/lib/restaurant-config";
import { menuCategories } from "@/lib/menu-data";
import { pageOpenGraph } from "@/lib/og";
import {
  buffetGerichte,
  buffetReisGrill,
  buffetReisgericht,
  buffetStrecke,
  gastraumLandscape,
  gastraumPanorama,
  gastraumPortrait,
  logoWand,
} from "@/lib/images";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: pageOpenGraph({
    url: "/",
    title: "Safran Grill Neustadt | Afghanische Küche & Buffet",
    description:
      "Afghanische Spezialitäten, Grillgerichte und Buffet bei Safran Grill in Neustadt an der Weinstraße.",
  }),
};

/** Ausgewählte Gerichte aus den echten Speisekarten-Daten */
function signatureDishes() {
  const wanted = [
    "Kabuli Palau",
    "Mantu Fleisch",
    "Gegrillter Hähnchen Spieß",
    "Chapli Kebab",
  ];
  const all = menuCategories.flatMap((c) => c.items);
  return wanted
    .map((name) => all.find((i) => i.name === name))
    .filter((i): i is NonNullable<typeof i> => Boolean(i));
}

export default function HomePage() {
  const dishes = signatureDishes();

  return (
    <>
      {/* ————— Hero: Text links, großes Foodfoto rechts bis an den Rand ————— */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-[85rem] px-5 sm:px-8">
          <div className="grid lg:min-h-[82vh] lg:grid-cols-12 lg:items-stretch">
            <div className="order-2 flex flex-col justify-center py-10 sm:py-14 lg:order-1 lg:col-span-6 lg:py-24 lg:pr-14">
              <Eyebrow>Afghanische Küche · Neustadt</Eyebrow>
              <h1 className="font-display display-black text-[2rem] font-bold leading-[0.98] min-[380px]:text-[2.35rem] min-[420px]:text-[2.55rem] sm:text-[3.4rem] lg:text-[3.8rem] xl:text-[4.4rem]">
                Feuer. Gewürze.
                <br />
                Gastfreundschaft.
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft">
                Afghanische Spezialitäten, saftige Grillgerichte und unser
                All-you-can-eat-Buffet – mitten in Neustadt an der Weinstraße.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Cta href="/speisekarte">Speisekarte ansehen</Cta>
                <Cta href="/buffet" variant="outline">
                  Buffet entdecken
                </Cta>
              </div>
              <p className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.95rem] text-ink-faint">
                <ArrowLink href={restaurant.links.lieferando} external>
                  Online bestellen
                </ArrowLink>
                <span>{fullAddress}</span>
              </p>
            </div>

            <div className="order-1 -mx-5 sm:-mx-8 lg:order-2 lg:col-span-6 lg:mx-0">
              <div className="relative h-[46vh] min-h-72 lg:absolute lg:inset-y-0 lg:right-0 lg:h-full lg:w-[48vw] lg:max-w-[58rem]">
                <Image
                  src={buffetReisGrill.src}
                  alt={buffetReisGrill.alt}
                  fill
                  priority
                  fetchPriority="high"
                  sizes="(min-width: 1024px) 48vw, 100vw"
                  className="object-cover object-[35%_70%] [filter:saturate(1.08)]"
                />
                {/* Dezente warme Abdunklung, kaschiert das ausgefressene Fenster oben */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-b from-coal/25 via-transparent to-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ————— Infozeile ————— */}
      <section aria-label="Auf einen Blick" className="border-y border-line bg-paper">
        <div className="mx-auto max-w-[85rem] px-5 sm:px-8">
          <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 py-4 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-ink-soft sm:gap-x-6">
            <li>All you can eat</li>
            {restaurant.buffet.enabled && (
              <>
                <li aria-hidden className="hidden text-saffron sm:block">·</li>
                <li>{restaurant.buffet.price} pro Person</li>
              </>
            )}
            <li aria-hidden className="hidden text-saffron sm:block">·</li>
            <li>{restaurant.address.street}</li>
            <li aria-hidden className="hidden text-saffron sm:block">·</li>
            <li>{restaurant.openingHoursShort}</li>
          </ul>
        </div>
      </section>

      {/* ————— Positionierung ————— */}
      <section className="bg-cream">
        <div className="mx-auto max-w-[85rem] px-5 py-20 sm:px-8 lg:py-32">
          <div className="max-w-3xl">
            <BrandRule />
            <h2 className="mt-6 font-display text-4xl font-bold leading-[1.05] sm:text-5xl">
              Afghanische Küche.
              <br />
              Frisch vom Grill.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
              Aromatischer Reis, Naan, würzig mariniertes Fleisch und
              traditionelle Gerichte wie Kabuli Palau oder Mantu – ehrlich
              gekocht, herzlich serviert. Hungrig kommen. Lieblingsgerichte
              entdecken.
            </p>
            <p className="mt-7">
              <ArrowLink href="/speisekarte">Zur Speisekarte</ArrowLink>
            </p>
          </div>
        </div>
      </section>

      {/* ————— Food-Moment: volle Breite ————— */}
      <section aria-label="Frisch aus der Küche">
        <div className="relative max-h-[72vh] overflow-hidden">
          <Image
            src={buffetReisgericht.src}
            alt={buffetReisgericht.alt}
            width={buffetReisgericht.width}
            height={buffetReisgericht.height}
            sizes="100vw"
            className="w-full object-cover"
          />
        </div>
      </section>

      {/* ————— Buffet-Highlight (dunkel) ————— */}
      {restaurant.buffet.enabled && (
        <section className="bg-coal text-paper">
          <div className="mx-auto max-w-[85rem] px-5 py-20 sm:px-8 lg:py-32">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
              <figure className="lg:col-span-6">
                <Image
                  src={buffetStrecke.src}
                  alt={buffetStrecke.alt}
                  width={buffetStrecke.width}
                  height={buffetStrecke.height}
                  sizes="(min-width: 1024px) 44vw, 100vw"
                  className="w-full rounded-xs object-cover"
                />
                <figcaption className="mt-3 text-[0.8rem] text-paper/50">
                  Unsere Buffetstrecke – Suppe, Salate und warme Gerichte
                </figcaption>
              </figure>

              <div className="min-w-0 lg:col-span-6">
                <Eyebrow onDark>All you can eat</Eyebrow>
                <h2 className="font-display text-[2rem] font-bold leading-[1.05] min-[380px]:text-4xl xl:text-5xl">
                  Ein Buffet.
                  <br />
                  Viele Lieblingsgerichte.
                </h2>
                <p className="mt-5 max-w-md text-lg leading-relaxed text-paper/75">
                  Reisgerichte, Grill- und Fleischgerichte, vegetarische
                  Auswahl, Salate und Dessert. Nimm dir, worauf du Appetit
                  hast – so oft du magst.
                </p>

                <p className="mt-10 flex flex-wrap items-end gap-x-4 gap-y-1">
                  <span className="font-display display-black text-[3.6rem] font-bold leading-none text-saffron-bright min-[380px]:text-[4.6rem] sm:text-[5.4rem]">
                    {restaurant.buffet.price}
                  </span>
                  <span className="pb-2 text-[0.95rem] leading-snug text-paper/70">
                    {restaurant.buffet.priceSuffix}
                    <br />
                    Getränke separat
                  </span>
                </p>
                <p className="mt-2 text-[0.85rem] text-paper/60 first-letter:uppercase">
                  {restaurant.buffet.times}
                </p>

                <div className="mt-9 flex flex-wrap gap-4">
                  <Cta href="/buffet" variant="primaryOnDark">
                    Buffet entdecken
                  </Cta>
                  <Cta href={restaurant.links.googleRoute} variant="outlineOnDark">
                    Route öffnen
                  </Cta>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ————— Aus unserer Küche: echte Gerichte ————— */}
      <section className="bg-cream">
        <div className="mx-auto max-w-[85rem] px-5 py-20 sm:px-8 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <Eyebrow>Aus unserer Küche</Eyebrow>
              <h2 className="font-display text-4xl font-bold leading-[1.05] sm:text-5xl">
                Vier Gerichte,
                <br />
                die du probieren
                <br />
                solltest.
              </h2>
              <p className="mt-6 max-w-sm leading-relaxed text-ink-soft">
                Von der kompletten Karte mit Vorspeisen, Suppen, Pizzen und
                hausgemachten Soßen – das hier sind die Klassiker.
              </p>
              <p className="mt-7">
                <ArrowLink href="/speisekarte">Die ganze Karte</ArrowLink>
              </p>
            </div>

            <div className="lg:col-span-7">
              <ul>
                {dishes.map((dish, i) => (
                  <li key={dish.name} className="border-b border-line py-6 first:border-t">
                    <div className="flex items-baseline gap-5">
                      <span aria-hidden className="text-[0.7rem] font-semibold tabular-nums text-saffron-deep">
                        0{i + 1}
                      </span>
                      <h3 className="font-display text-2xl font-semibold sm:text-[1.7rem]">
                        {dish.name}
                      </h3>
                      <span aria-hidden className="mx-1 hidden h-px flex-1 bg-line sm:block" />
                      {dish.price && (
                        <span className="ml-auto shrink-0 font-semibold tabular-nums text-saffron-deep sm:ml-0">
                          {dish.price}
                        </span>
                      )}
                    </div>
                    {dish.description && (
                      <p className="mt-2 max-w-xl pl-8 text-[0.95rem] leading-relaxed text-ink-soft">
                        {dish.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ————— Vom Grill (dunkel) ————— */}
      <section className="bg-coal-soft text-paper">
        <div className="mx-auto max-w-[85rem] px-5 py-20 sm:px-8 lg:py-32">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="flex flex-col justify-center lg:col-span-5">
              <h2 className="font-display display-black text-5xl font-bold leading-[0.98] sm:text-6xl">
                Vom Grill.
                <br />
                Auf den Tisch.
              </h2>
              <p className="mt-6 max-w-sm text-lg leading-relaxed text-paper/70">
                Hähnchen- und Kalbspieße, Chapli Kebab, Lammkoteletts:
                mariniert, gegrillt und mit Naan, Salat und hausgemachten
                Soßen serviert.
              </p>
              <p className="mt-7">
                <ArrowLink
                  href="/speisekarte#grill-spezialitaeten"
                  className="text-saffron-bright hover:text-paper"
                >
                  Grill-Spezialitäten ansehen
                </ArrowLink>
              </p>
            </div>
            <figure className="lg:col-span-7">
              <Image
                src={buffetGerichte.src}
                alt={buffetGerichte.alt}
                width={buffetGerichte.width}
                height={buffetGerichte.height}
                sizes="(min-width: 1024px) 48vw, 100vw"
                className="w-full rounded-xs object-cover"
              />
              <figcaption className="mt-3 text-[0.8rem] text-paper/50">
                Warme Gerichte, frisch aus unserer Küche
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ————— Atmosphäre: Panorama mit überlappender Textfläche ————— */}
      <section className="bg-cream">
        <div className="mx-auto max-w-[85rem] px-5 pt-20 sm:px-8 lg:pt-32">
          <div className="relative">
            <figure className="lg:w-[78%]">
              <Image
                src={gastraumPanorama.src}
                alt={gastraumPanorama.alt}
                width={gastraumPanorama.width}
                height={gastraumPanorama.height}
                sizes="(min-width: 1024px) 62vw, 100vw"
                className="w-full object-cover"
              />
            </figure>
            <div className="mt-8 max-w-xl border-l-2 border-saffron bg-paper p-8 sm:p-10 lg:absolute lg:-bottom-12 lg:right-0 lg:mt-0 lg:w-[38%] lg:border-l-0 lg:shadow-[0_1px_0_var(--color-line)]">
              <Eyebrow>Vor Ort</Eyebrow>
              <h2 className="font-display text-3xl font-bold leading-[1.05] sm:text-4xl">
                Klein, warm und mitten in Neustadt.
              </h2>
              <p className="mt-4 leading-relaxed text-ink-soft">
                Helles Holz, bequeme Stühle, Blick auf die Hauptstraße.
                Vorbeikommen, Platz nehmen, genießen.
              </p>
              <p className="mt-6 text-[0.95rem] leading-relaxed">
                <a
                  href={restaurant.links.googleReviews}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-ink underline decoration-saffron decoration-2 underline-offset-4 transition-colors duration-fast hover:text-saffron-deep"
                >
                  {restaurant.googleRating.value} / 5 bei Google
                </a>
                <span className="text-ink-faint">
                  {" "}
                  · {restaurant.googleRating.count} Bewertungen · Stand{" "}
                  {restaurant.googleRating.asOf}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* ————— Galerie: kuratiert, unterschiedliche Formate ————— */}
        <div className="mx-auto max-w-[85rem] px-5 pb-20 pt-16 sm:px-8 lg:pb-32 lg:pt-36">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-12">
            <figure className="col-span-2 lg:col-span-8">
              <Image
                src={gastraumLandscape.src}
                alt={gastraumLandscape.alt}
                width={gastraumLandscape.width}
                height={gastraumLandscape.height}
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="h-full w-full object-cover"
              />
            </figure>
            <figure className="lg:col-span-4">
              <Image
                src={gastraumPortrait.src}
                alt={gastraumPortrait.alt}
                width={gastraumPortrait.width}
                height={gastraumPortrait.height}
                sizes="(min-width: 1024px) 28vw, 50vw"
                className="h-full w-full object-cover"
              />
            </figure>
            <figure className="lg:col-span-4">
              <Image
                src={logoWand.src}
                alt={logoWand.alt}
                width={logoWand.width}
                height={logoWand.height}
                sizes="(min-width: 1024px) 28vw, 50vw"
                className="aspect-square w-full object-cover"
              />
            </figure>
            <div className="col-span-2 flex flex-col justify-end pb-2 lg:col-span-8 lg:pl-6">
              <BrandRule />
              <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-soft">
                Ein kleiner Gastraum, ein großes Buffet und eine Küche, die
                nach Safran und Grillfeuer duftet.
              </p>
              <p className="mt-5">
                <ArrowLink href="/ueber-uns">Mehr über uns</ArrowLink>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ————— Besuch planen ————— */}
      <section className="border-t border-line bg-paper">
        <div className="mx-auto max-w-[85rem] px-5 py-20 sm:px-8 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <Eyebrow>Besuch planen</Eyebrow>
              <h2 className="font-display display-black text-5xl font-bold leading-[0.98] sm:text-6xl">
                Komm hungrig.
              </h2>
              <address className="mt-7 text-lg not-italic leading-relaxed">
                {restaurant.name}
                <br />
                {restaurant.address.street}
                <br />
                {restaurant.address.zip} {restaurant.address.city}
              </address>
              <p className="mt-3 text-lg">
                <a
                  href={`tel:${restaurant.phone.e164}`}
                  className="font-semibold text-saffron-deep transition-colors duration-fast hover:text-ink"
                >
                  {restaurant.phone.display}
                </a>
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Cta href={restaurant.links.googleRoute}>Route öffnen</Cta>
                <Cta href="/kontakt" variant="outline">
                  Kontakt &amp; Anfahrt
                </Cta>
              </div>
            </div>

            <div className="lg:col-span-3">
              <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-ink-faint">
                Öffnungszeiten
              </h3>
              <table className="mt-4 w-full text-[0.95rem]">
                <tbody className="divide-y divide-line">
                  {restaurant.openingHours.map((d) => (
                    <tr key={d.day}>
                      <th scope="row" className="py-2.5 pr-4 text-left font-medium">
                        {d.day}
                      </th>
                      <td className="py-2.5 text-right text-ink-soft">
                        {d.opens ? `${d.opens}–${d.closes}` : "Ruhetag"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:col-span-3">
              <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-ink-faint">
                Lieber zuhause?
              </h3>
              <p className="mt-4 leading-relaxed text-ink-soft">
                Liefern lassen oder abholen – die Bestellung läuft über
                Lieferando.
              </p>
              <p className="mt-5">
                <ArrowLink href={restaurant.links.lieferando} external>
                  Bei Lieferando bestellen
                </ArrowLink>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLink, Cta, Eyebrow } from "@/components/cta";
import { fullAddress, restaurant } from "@/lib/restaurant-config";
import { pageOpenGraph } from "@/lib/og";
import {
  buffetReisGrill,
  buffetStrecke,
  gastraumLandscape,
  gastraumPortrait,
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

export default function HomePage() {
  return (
    <>
      {/* ————— Hero ————— */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid items-stretch gap-10 py-12 sm:py-16 lg:grid-cols-12 lg:gap-14 lg:py-0">
            <div className="flex flex-col justify-center lg:col-span-7 lg:py-24">
              <Eyebrow>
                Afghanische Küche · Neustadt an der Weinstraße
              </Eyebrow>
              <h1 className="font-display text-[2.6rem] font-semibold leading-[1.06] sm:text-6xl lg:text-[4.25rem]">
                Grillfeuer, Gewürze und echte Gastfreundschaft.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
                Afghanische Spezialitäten, saftige Grillgerichte, aromatischer
                Reis und ein vielfältiges Buffet – mitten in Neustadt an der
                Weinstraße.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Cta href="/speisekarte">Speisekarte ansehen</Cta>
                <Cta href="/buffet" variant="outline">
                  Buffet entdecken
                </Cta>
              </div>
              <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.95rem] text-ink-faint">
                <ArrowLink href={restaurant.links.lieferando} external>
                  Online bestellen
                </ArrowLink>
                <span>{fullAddress}</span>
              </p>
            </div>

            <div className="relative lg:col-span-5">
              <figure className="lg:absolute lg:inset-y-0 lg:left-0 lg:w-[calc(100%+((100vw-72rem)/2)+2rem)] lg:max-w-[40rem]">
                <div className="relative aspect-3/4 h-full w-full overflow-hidden lg:aspect-auto">
                  <Image
                    src={gastraumPortrait.src}
                    alt={gastraumPortrait.alt}
                    fill
                    priority
                    sizes="(min-width: 1024px) 40rem, 100vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-3 text-[0.85rem] text-ink-faint lg:sr-only">
                  Unser Gastraum an der Hauptstraße 115
                </figcaption>
              </figure>
              {/* Platzhalter, damit die absolute Figur auf Desktop Höhe bekommt */}
              <div aria-hidden className="hidden lg:block lg:h-full lg:min-h-[36rem]" />
            </div>
          </div>
        </div>
      </section>

      {/* ————— Info-Streifen ————— */}
      <section aria-label="Auf einen Blick" className="border-b border-line bg-cream-deep/60">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 py-4 text-[0.82rem] font-medium uppercase tracking-[0.07em] text-ink-soft sm:justify-between sm:gap-x-5">
            <li>All-you-can-eat-Buffet</li>
            <li aria-hidden className="hidden text-saffron sm:block">·</li>
            <li>Afghanische Spezialitäten</li>
            <li aria-hidden className="hidden text-saffron sm:block">·</li>
            <li>{restaurant.address.street}, Neustadt</li>
            <li aria-hidden className="hidden text-saffron sm:block">·</li>
            <li>{restaurant.openingHoursShort}</li>
          </ul>
        </div>
      </section>

      {/* ————— Unsere Küche ————— */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5">
              <Eyebrow>Unsere Küche</Eyebrow>
              <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
                Afghanische Küche.
                <br />
                Frisch vom Grill.
              </h2>
              <p className="mt-5 max-w-md leading-relaxed text-ink-soft">
                Bei Safran Grill treffen aromatische Gewürze, Reis, Naan und
                Grillgerichte auf eine unkomplizierte, herzliche Atmosphäre.
                Hungrig kommen. Lieblingsgerichte entdecken.
              </p>
              <p className="mt-6">
                <ArrowLink href="/speisekarte">Zur Speisekarte</ArrowLink>
              </p>
            </div>

            <div className="lg:col-span-7">
              <ol className="divide-y divide-line border-t border-line">
                {[
                  {
                    n: "01",
                    title: "Afghanische Spezialitäten",
                    text: "Traditionelle Gerichte mit aromatischem Reis und Gewürzen – zubereitet, wie man sie aus der afghanischen Küche kennt.",
                  },
                  {
                    n: "02",
                    title: "Vom Grill",
                    text: "Würzig mariniertes Fleisch, frisch gegrillt. Dazu Naan, hausgemachte Soßen und Salat.",
                  },
                  {
                    n: "03",
                    title: "Vegetarisch & vielfältig",
                    text: "Vegetarische und vegane Gerichte, Salate und Beilagen – auch am Buffet immer dabei.",
                  },
                ].map((row) => (
                  <li key={row.n} className="grid gap-2 py-6 sm:grid-cols-12 sm:gap-6">
                    <span className="font-display text-lg text-saffron-deep sm:col-span-1">
                      {row.n}
                    </span>
                    <h3 className="text-xl font-semibold sm:col-span-4">
                      {row.title}
                    </h3>
                    <p className="leading-relaxed text-ink-soft sm:col-span-7">
                      {row.text}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ————— Buffet-Highlight ————— */}
      {restaurant.buffet.enabled && (
        <section className="border-b border-line bg-espresso text-cream">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
              <div className="lg:col-span-7">
                <Eyebrow onDark>All you can eat</Eyebrow>
                <h2 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
                  Ein Buffet. Viele Lieblingsgerichte.
                </h2>
                <p className="mt-5 max-w-xl leading-relaxed text-cream/75">
                  Nimm dir, worauf du Appetit hast: Reisgerichte, Fleisch- und
                  Grillspezialitäten, vegetarische Gerichte, Salate und Dessert.
                  Die Auswahl kann je nach Tag variieren.
                </p>
                <ul className="mt-8 grid max-w-xl grid-cols-1 divide-y divide-line-dark border-y border-line-dark text-[1.05rem] sm:grid-cols-2 sm:gap-x-10">
                  {restaurant.buffet.includes.map((item) => (
                    <li key={item} className="py-3 sm:border-line-dark [&:nth-child(2)]:sm:border-t-0">
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-8">
                  <ArrowLink href="/buffet" className="text-cream hover:text-cream/70">
                    Mehr zum Buffet
                  </ArrowLink>
                </p>
              </div>

              <div className="flex flex-col justify-center lg:col-span-5">
                <div className="border border-line-dark p-8 sm:p-10">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-eyebrow text-cream/60">
                    Aktueller Aktionspreis
                  </p>
                  <p className="mt-4 font-display text-6xl font-semibold text-cream">
                    {restaurant.buffet.price}
                  </p>
                  <p className="mt-1 text-cream/75">
                    {restaurant.buffet.priceSuffix}
                    {!restaurant.buffet.drinksIncluded && " · Getränke separat"}
                  </p>
                  <p className="mt-2 text-[0.85rem] text-cream/70">
                    regulär {restaurant.buffet.regularPrice} · {restaurant.buffet.times}
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
              </div>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2">
              <figure>
                <Image
                  src={buffetReisGrill.src}
                  alt={buffetReisGrill.alt}
                  width={buffetReisGrill.width}
                  height={buffetReisGrill.height}
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="w-full object-cover"
                />
                <figcaption className="mt-3 text-[0.85rem] text-cream/50">
                  Reis und Frisches vom Grill – direkt am Buffet
                </figcaption>
              </figure>
              <figure>
                <Image
                  src={buffetStrecke.src}
                  alt={buffetStrecke.alt}
                  width={buffetStrecke.width}
                  height={buffetStrecke.height}
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="w-full object-cover"
                />
                <figcaption className="mt-3 text-[0.85rem] text-cream/50">
                  Suppe, Salate und warme Gerichte in Chafing-Dishes
                </figcaption>
              </figure>
            </div>
          </div>
        </section>
      )}

      {/* ————— Was auf den Tisch kommt ————— */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="max-w-2xl">
            <Eyebrow>Die Karte</Eyebrow>
            <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
              Was auf den Tisch kommt
            </h2>
            <p className="mt-5 leading-relaxed text-ink-soft">
              Kabuli Palau, Mantu, Chapli Kebab, frisch gegrillte Spieße und
              orientalische Pizzen – die vollständige Karte mit allen Gerichten
              und Preisen findest du auf unserer Speisekarte.
            </p>
          </div>
          <div className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Grill-Spezialitäten", href: "/speisekarte#grill-spezialitaeten", text: "Hähnchen- und Kalbspieße, Chapli Kebab, Lammkotelett" },
              { title: "Afghanische Speisen", href: "/speisekarte#afghanische-speisen", text: "Kabuli Palau, Mantu, Bolani und mehr" },
              { title: "Vegetarisch & Salate", href: "/speisekarte#salate", text: "Frische Salate und viele vegetarische Gerichte" },
              { title: "Orientalische Pizzen", href: "/speisekarte#orientalische-pizzen", text: "Pizza mit frisch gegrilltem Spieß" },
            ].map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group bg-cream p-7 transition-colors duration-fast hover:bg-cream-deep/70"
              >
                <h3 className="text-lg font-semibold">{card.title}</h3>
                <p className="mt-2 text-[0.95rem] text-ink-soft">{card.text}</p>
                <span aria-hidden className="mt-5 block text-saffron-deep transition-transform duration-fast group-hover:translate-x-1">
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ————— Atmosphäre ————— */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
            <figure className="lg:col-span-7">
              <Image
                src={gastraumLandscape.src}
                alt={gastraumLandscape.alt}
                width={gastraumLandscape.width}
                height={gastraumLandscape.height}
                sizes="(min-width: 1024px) 38rem, 100vw"
                className="w-full object-cover"
              />
              <figcaption className="mt-3 text-[0.85rem] text-ink-faint">
                Tische am Fenster – mitten in der Neustadter Altstadt
              </figcaption>
            </figure>
            <div className="lg:col-span-5">
              <Eyebrow>Vor Ort</Eyebrow>
              <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
                Klein, warm und mitten in der Stadt
              </h2>
              <p className="mt-5 leading-relaxed text-ink-soft">
                Helles Holz, bequeme Stühle und der Blick auf die Hauptstraße:
                Unser Gastraum ist unkompliziert und gastfreundlich – zum
                schnellen Mittagessen genauso wie zum entspannten Abend.
                Vorbeikommen, Platz nehmen, genießen.
              </p>
              <p className="mt-6 border-l-2 border-saffron pl-4 text-[0.95rem] leading-relaxed text-ink-soft">
                <a
                  href={restaurant.links.googleReviews}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-ink underline-offset-4 hover:underline"
                >
                  {restaurant.googleRating.value} von 5 Sternen bei Google
                </a>
                <br />
                {restaurant.googleRating.count} Bewertungen · Stand{" "}
                {restaurant.googleRating.asOf}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ————— Besuch planen ————— */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5">
              <Eyebrow>Besuch planen</Eyebrow>
              <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
                Wir sind für dich da
              </h2>
              <address className="mt-6 text-lg not-italic leading-relaxed">
                {restaurant.name}
                <br />
                {restaurant.address.street}
                <br />
                {restaurant.address.zip} {restaurant.address.city}
              </address>
              <p className="mt-4 text-lg">
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

            <div className="lg:col-span-4">
              <h3 className="text-[0.72rem] font-semibold uppercase tracking-eyebrow text-ink-faint">
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
                        {d.opens ? `${d.opens}–${d.closes} Uhr` : "Ruhetag"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:col-span-3">
              <div className="border border-line bg-cream-deep/50 p-7">
                <h3 className="text-lg font-semibold">Lieber zuhause?</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">
                  Unsere Gerichte gibt es auch zum Liefern und Abholen – die
                  Bestellung läuft über Lieferando.
                </p>
                <p className="mt-5">
                  <ArrowLink href={restaurant.links.lieferando} external>
                    Bei Lieferando bestellen
                  </ArrowLink>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

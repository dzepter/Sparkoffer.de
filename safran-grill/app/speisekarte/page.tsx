import type { Metadata } from "next";
import Image from "next/image";
import { ArrowLink, Cta } from "@/components/cta";
import { MenuNav } from "@/components/menu-nav";
import { PageIntro } from "@/components/page-intro";
import { menuCategories } from "@/lib/menu-data";
import { restaurant } from "@/lib/restaurant-config";
import { pageOpenGraph } from "@/lib/og";
import {
  buffetGerichte,
  buffetReisGrill,
  buffetReisgericht,
  type SiteImage,
} from "@/lib/images";

export const metadata: Metadata = {
  title: "Speisekarte",
  description:
    "Die Speisekarte des Safran Grill in Neustadt an der Weinstraße: Vorspeisen, Grill-Spezialitäten, afghanische Speisen, Salate, orientalische Pizzen und mehr.",
  alternates: { canonical: "/speisekarte" },
  openGraph: pageOpenGraph({
    url: "/speisekarte",
    title: "Speisekarte | Safran Grill Neustadt",
    description:
      "Vorspeisen, Grill-Spezialitäten, afghanische Speisen, Salate, orientalische Pizzen und mehr – die Karte des Safran Grill.",
  }),
};

/** Food-Fotos als visuelle Unterbrechung nach ausgewählten Kategorien */
const categoryBreaks: Record<string, { image: SiteImage; caption: string }> = {
  "grill-spezialitaeten": {
    image: buffetReisGrill,
    caption: "Frisch vom Grill – mariniert, gegrillt, serviert mit Naan",
  },
  "afghanische-speisen": {
    image: buffetReisgericht,
    caption: "Aromatischer Reis – die Basis vieler afghanischer Gerichte",
  },
  "orientalische-pizzen": {
    image: buffetGerichte,
    caption: "Warme Gerichte aus unserer Küche",
  },
};

export default function SpeisekartePage() {
  return (
    <>
      <PageIntro
        crumbs={[{ name: "Speisekarte", path: "/speisekarte" }]}
        eyebrow="Safran Grill · Neustadt"
        title="Unsere Speisekarte"
      >
        <p>
          Afghanische Speisen, Frisches vom Grill, Salate, Beilagen und
          orientalische Pizzen. Hier essen, abholen – oder über Lieferando
          liefern lassen.
        </p>
        <div className="mt-7">
          <Cta href={restaurant.links.lieferando}>Bei Lieferando bestellen</Cta>
        </div>
      </PageIntro>

      <MenuNav items={menuCategories.map((c) => ({ id: c.id, title: c.title }))} />

      <div className="mx-auto max-w-[72rem] px-5 py-14 sm:px-8 lg:py-20">
        {menuCategories.map((cat, i) => (
          <div key={cat.id}>
            <section
              id={cat.id}
              className={`scroll-mt-36 py-10 lg:scroll-mt-48 lg:py-14 ${i === 0 ? "pt-0" : ""}`}
            >
              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
                <h2 className="font-display text-4xl font-bold sm:text-[2.8rem]">
                  {cat.title}
                </h2>
                <p className="text-[0.95rem] text-ink-faint">{cat.description}</p>
              </div>
              {cat.items.length > 0 && (
                <ul className="mt-8">
                  {cat.items.map((item) => (
                    <li key={item.name} className="border-b border-line py-4 first:border-t">
                      <div className="flex items-baseline justify-between gap-6">
                        <h3 className="font-display text-xl font-semibold">
                          {item.name}
                          {item.tags?.map((tag) => (
                            <span
                              key={tag}
                              className="ml-2 align-middle text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-olive"
                            >
                              {" "}
                              {tag}
                            </span>
                          ))}
                        </h3>
                        {item.available === false ? (
                          <p className="shrink-0 text-[0.85rem] text-ink-faint">
                            zurzeit nicht verfügbar
                          </p>
                        ) : (
                          item.price && (
                            <p className="shrink-0 font-semibold tabular-nums text-saffron-deep">
                              {item.price}
                            </p>
                          )
                        )}
                      </div>
                      {item.description && (
                        <p className="mt-1.5 max-w-xl text-[0.95rem] leading-relaxed text-ink-soft">
                          {item.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {categoryBreaks[cat.id] && (
              <figure className="-mx-5 py-6 sm:-mx-8 lg:mx-0 lg:py-10">
                <Image
                  src={categoryBreaks[cat.id].image.src}
                  alt={categoryBreaks[cat.id].image.alt}
                  width={categoryBreaks[cat.id].image.width}
                  height={categoryBreaks[cat.id].image.height}
                  sizes="(min-width: 1152px) 68rem, 100vw"
                  className="max-h-[26rem] w-full object-cover"
                />
                <figcaption className="mt-3 px-5 text-[0.8rem] text-ink-faint sm:px-8 lg:px-0">
                  {categoryBreaks[cat.id].caption}
                </figcaption>
              </figure>
            )}
          </div>
        ))}

        <p className="pt-10 text-[0.9rem] leading-relaxed text-ink-faint">
          Preise laut Lieferando-Karte (Stand August 2026) – im Restaurant
          können die Preise abweichen. Änderungen, Verfügbarkeit und saisonale
          Gerichte vorbehalten.
        </p>
      </div>

      {/* Abschluss: Bestellen / Buffet */}
      <section className="bg-coal text-paper">
        <div className="mx-auto max-w-[85rem] px-5 py-16 sm:px-8 lg:py-24">
          <div className="flex flex-wrap items-center justify-between gap-8">
            <div>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                Schon Appetit bekommen?
              </h2>
              <p className="mt-3 max-w-md leading-relaxed text-paper/70">
                Bestell über Lieferando – oder komm vorbei und probier dich
                durchs Buffet
                {restaurant.buffet.enabled &&
                  ` (${restaurant.buffet.price} ${restaurant.buffet.priceSuffix})`}
                .
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Cta href={restaurant.links.lieferando} variant="primaryOnDark">
                Bei Lieferando bestellen
              </Cta>
              <span className="inline-flex items-center">
                <ArrowLink href="/buffet" className="text-saffron-bright hover:text-paper">
                  Buffet entdecken
                </ArrowLink>
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

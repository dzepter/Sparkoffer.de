import type { Metadata } from "next";
import { ArrowLink, Cta } from "@/components/cta";
import { PageIntro } from "@/components/page-intro";
import { menuCategories } from "@/lib/menu-data";
import { restaurant } from "@/lib/restaurant-config";
import { ogImage } from "@/lib/images";

export const metadata: Metadata = {
  title: "Speisekarte",
  description:
    "Die Speisekarte des Safran Grill in Neustadt an der Weinstraße: Vorspeisen, Grill-Spezialitäten, afghanische Speisen, Salate, orientalische Pizzen und mehr.",
  alternates: { canonical: "/speisekarte" },
  openGraph: {
    images: [ogImage],
    url: "/speisekarte",
    title: "Speisekarte | Safran Grill Neustadt",
    description:
      "Vorspeisen, Grill-Spezialitäten, afghanische Speisen, Salate, orientalische Pizzen und mehr – die Karte des Safran Grill.",
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
          orientalische Pizzen. Zum Hieressen, Abholen – oder liefern lassen
          über Lieferando.
        </p>
      </PageIntro>

      {/* Sticky Kategorien-Navigation */}
      <nav
        aria-label="Speisekarten-Kategorien"
        className="sticky top-16 z-30 border-b border-line bg-cream/95 backdrop-blur-sm"
      >
        <div className="mx-auto max-w-6xl overflow-x-auto px-5 sm:px-8">
          <ul className="flex gap-6 whitespace-nowrap py-3 text-[0.9rem] font-medium text-ink-soft">
            {menuCategories.map((cat) => (
              <li key={cat.id}>
                <a
                  href={`#${cat.id}`}
                  className="transition-colors duration-fast hover:text-saffron-deep"
                >
                  {cat.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-8">
            {menuCategories.map((cat) => (
              <section key={cat.id} id={cat.id} className="border-t border-line py-8 first:border-t-0 first:pt-0">
                <h2 className="font-display text-2xl font-semibold sm:text-3xl">
                  {cat.title}
                </h2>
                <p className="mt-2 max-w-xl leading-relaxed text-ink-soft">
                  {cat.description}
                </p>
                {cat.items.length > 0 && (
                  <ul className="mt-6 divide-y divide-line border-t border-line">
                    {cat.items.map((item) => (
                      <li key={item.name} className="flex items-baseline justify-between gap-6 py-3.5">
                        <div>
                          <h3 className="font-semibold">
                            {item.name}
                            {item.tags?.map((tag) => (
                              <span
                                key={tag}
                                className="ml-2 align-middle text-[0.72rem] font-medium uppercase tracking-[0.08em] text-olive"
                              >
                                {tag}
                              </span>
                            ))}
                          </h3>
                          {item.description && (
                            <p className="mt-1 max-w-lg text-[0.95rem] leading-relaxed text-ink-soft">
                              {item.description}
                            </p>
                          )}
                        </div>
                        {item.available === false ? (
                          <p className="shrink-0 text-[0.85rem] text-ink-faint">
                            zurzeit nicht verfügbar
                          </p>
                        ) : (
                          item.price && (
                            <p className="shrink-0 font-medium tabular-nums">{item.price}</p>
                          )
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            <p className="border-t border-line pt-8 text-[0.95rem] leading-relaxed text-ink-faint">
              Preise laut Lieferando-Karte (Stand August 2026) – im Restaurant
              können die Preise abweichen. Änderungen, Verfügbarkeit und
              saisonale Gerichte vorbehalten.
            </p>
          </div>

          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-36 space-y-6">
              <div className="border border-line bg-cream-deep/50 p-7">
                <h2 className="text-lg font-semibold">Online bestellen</h2>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">
                  Liefern lassen oder abholen: Die Online-Bestellung läuft
                  sicher über unseren Partner Lieferando.
                </p>
                <div className="mt-5">
                  <Cta href={restaurant.links.lieferando}>
                    Bei Lieferando bestellen
                  </Cta>
                </div>
              </div>
              {restaurant.buffet.enabled && (
                <div className="border border-line p-7">
                  <h2 className="text-lg font-semibold">
                    Lust, alles zu probieren?
                  </h2>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">
                    Unser All-you-can-eat-Buffet gibt es für{" "}
                    {restaurant.buffet.price} {restaurant.buffet.priceSuffix} –
                    direkt bei uns im Restaurant.
                  </p>
                  <p className="mt-5">
                    <ArrowLink href="/buffet">Buffet entdecken</ArrowLink>
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

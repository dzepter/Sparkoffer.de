import type { Metadata } from "next";
import { ArrowLink, Cta } from "@/components/cta";
import { PageIntro } from "@/components/page-intro";
import { fullAddress, restaurant } from "@/lib/restaurant-config";
import { pageOpenGraph } from "@/lib/og";

export const metadata: Metadata = {
  title: "Kontakt & Öffnungszeiten",
  description:
    "Safran Grill, Hauptstraße 115, 67433 Neustadt an der Weinstraße. Telefon 06321 9547657. Öffnungszeiten und Route – wir freuen uns auf deinen Besuch.",
  alternates: { canonical: "/kontakt" },
  openGraph: pageOpenGraph({
    url: "/kontakt",
    title: "Kontakt & Öffnungszeiten | Safran Grill Neustadt",
    description:
      "Hauptstraße 115, 67433 Neustadt an der Weinstraße · Telefon 06321 9547657 · Mo & Mi–So 11–22 Uhr, Dienstag Ruhetag.",
  }),
};

export default function KontaktPage() {
  return (
    <>
      <PageIntro
        crumbs={[{ name: "Kontakt", path: "/kontakt" }]}
        eyebrow="Kontakt & Anfahrt"
        title="So findest du uns"
      >
        <p>
          Mitten in der Neustadter Altstadt, wenige Gehminuten vom Marktplatz:{" "}
          {fullAddress}.
        </p>
      </PageIntro>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <h2 className="text-[0.72rem] font-semibold uppercase tracking-eyebrow text-ink-faint">
              Adresse
            </h2>
            <address className="mt-4 text-xl not-italic leading-relaxed">
              {restaurant.name}
              <br />
              {restaurant.address.street}
              <br />
              {restaurant.address.zip} {restaurant.address.city}
            </address>

            <h2 className="mt-10 text-[0.72rem] font-semibold uppercase tracking-eyebrow text-ink-faint">
              Telefon
            </h2>
            <p className="mt-3 text-xl">
              <a
                href={`tel:${restaurant.phone.e164}`}
                className="font-semibold text-saffron-deep transition-colors duration-fast hover:text-ink"
              >
                {restaurant.phone.display}
              </a>
            </p>
            <p className="mt-2 text-[0.95rem] text-ink-soft">
              Für Fragen zum Buffet, größere Gruppen oder Abholung – ruf uns
              einfach kurz an.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Cta href={restaurant.links.googleRoute}>Route öffnen</Cta>
              <Cta href={`tel:${restaurant.phone.e164}`} variant="outline">
                Anrufen
              </Cta>
            </div>
          </div>

          <div className="lg:col-span-4">
            <h2 className="text-[0.72rem] font-semibold uppercase tracking-eyebrow text-ink-faint">
              Öffnungszeiten
            </h2>
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
            <p className="mt-3 text-[0.85rem] text-ink-faint">
              An Feiertagen können die Zeiten abweichen.
            </p>
          </div>

          <div className="lg:col-span-3">
            <div className="space-y-6">
              <div className="border border-line p-7">
                <h2 className="text-lg font-semibold">Anfahrt</h2>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">
                  Die Hauptstraße liegt in der Fußgängerzone der Altstadt.
                  Parkmöglichkeiten gibt es in den umliegenden Parkhäusern,
                  der Hauptbahnhof ist zu Fuß erreichbar.
                </p>
                <p className="mt-4">
                  <ArrowLink href={restaurant.links.googleMaps} external>
                    In Google Maps öffnen
                  </ArrowLink>
                </p>
              </div>
              <div className="border border-line bg-cream-deep/50 p-7">
                <h2 className="text-lg font-semibold">Online bestellen</h2>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">
                  Liefern lassen oder abholen – über unseren Partner
                  Lieferando.
                </p>
                <p className="mt-4">
                  <ArrowLink href={restaurant.links.lieferando} external>
                    Bei Lieferando bestellen
                  </ArrowLink>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

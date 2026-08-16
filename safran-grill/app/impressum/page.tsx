import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { fullAddress, restaurant } from "@/lib/restaurant-config";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Impressum des Safran Grill in Neustadt an der Weinstraße.",
  alternates: { canonical: "/impressum" },
};

/*
 * TODO(Recht): Die mit [BITTE ERGÄNZEN] markierten Angaben müssen vor dem
 * Livegang vom Inhaber ergänzt werden (§ 5 DDG). Ohne vollständiges
 * Impressum darf die Seite nicht veröffentlicht werden.
 */
export default function ImpressumPage() {
  return (
    <>
      <PageIntro
        crumbs={[{ name: "Impressum", path: "/impressum" }]}
        eyebrow="Rechtliches"
        title="Impressum"
      />

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="max-w-2xl space-y-8 leading-relaxed">
          <section>
            <h2 className="font-display text-xl font-semibold">
              Angaben gemäß § 5 DDG
            </h2>
            <p className="mt-3">
              {restaurant.name}
              <br />
              Inhaber/in: [BITTE ERGÄNZEN: Vor- und Nachname]
              <br />
              {fullAddress}
              <br />
              {restaurant.address.country}
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">Kontakt</h2>
            <p className="mt-3">
              Telefon: {restaurant.phone.international}
              <br />
              E-Mail: [BITTE ERGÄNZEN]
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">
              Umsatzsteuer-ID
            </h2>
            <p className="mt-3">
              [BITTE ERGÄNZEN: USt-IdNr. gemäß § 27 a UStG, sofern vorhanden]
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">
              Verantwortlich für den Inhalt
            </h2>
            <p className="mt-3">
              [BITTE ERGÄNZEN: Vor- und Nachname], Anschrift wie oben
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">
              Streitschlichtung
            </h2>
            <p className="mt-3 text-ink-soft">
              Die Europäische Kommission stellt eine Plattform zur
              Online-Streitbeilegung (OS) bereit:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-saffron-deep underline underline-offset-4 hover:text-ink"
              >
                https://ec.europa.eu/consumers/odr/
              </a>
              . Wir sind nicht bereit oder verpflichtet, an
              Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}

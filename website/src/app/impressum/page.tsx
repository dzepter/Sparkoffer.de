import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Container } from "@/components/ui";
import { contactData, routes } from "@/content/site";

export const metadata: Metadata = pageMetadata({
  title: "Impressum | Aigner Offensiv",
  description: "Impressum von Aigner Offensiv, München.",
  path: routes.impressum,
});

/**
 * Inhalt unverändert von der bisherigen Website übernommen.
 * VOR LIVEGANG PRÜFEN: Aktualität aller Angaben (siehe CONTENT-TODO.md).
 */
export default function ImpressumPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Impressum", href: routes.impressum }]} />
      <section className="bg-paper py-14 sm:py-20">
        <Container>
          <h1 className="display text-4xl text-ink sm:text-5xl">Impressum</h1>

          <div className="mt-10 max-w-2xl space-y-8 leading-relaxed break-words text-ink">
            <section>
              <h2 className="display text-xl">Anbieter</h2>
              <p className="mt-3">
                {contactData.owner}
                <br />
                {contactData.company}
                <br />
                {contactData.street}
                <br />
                {contactData.zip} {contactData.city}
              </p>
              <p className="mt-3">
                Handelsregister: {contactData.register.number}
                <br />
                Registergericht: {contactData.register.court}
              </p>
            </section>

            <section>
              <h2 className="display text-xl">Kontakt</h2>
              <p className="mt-3">
                Telefon: {contactData.phone}
                <br />
                Telefax: {contactData.fax}
                <br />
                E-Mail:{" "}
                <a
                  href={`mailto:${contactData.email}`}
                  className="underline decoration-rot decoration-2 underline-offset-2 hover:text-rot"
                >
                  {contactData.email}
                </a>
              </p>
            </section>

            <section>
              <h2 className="display text-xl">Umsatzsteuer-ID</h2>
              <p className="mt-3">
                Umsatzsteuer-Identifikationsnummer gemäß § 27 a
                Umsatzsteuergesetz:
                <br />
                {contactData.register.vatId}
              </p>
            </section>

            <section>
              <h2 className="display text-xl">Redaktionell verantwortlich</h2>
              <p className="mt-3">
                Viola Aigner, Rainer Aigner
                <br />
                {contactData.street}
                <br />
                {contactData.zip} {contactData.city}
              </p>
            </section>

            <section>
              <h2 className="display text-xl">EU-Streitschlichtung</h2>
              <p className="mt-3">
                Die Europäische Kommission stellt eine Plattform zur
                Online-Streitbeilegung (OS) bereit:{" "}
                <a
                  href="https://ec.europa.eu/consumers/odr/"
                  rel="noopener noreferrer"
                  target="_blank"
                  className="underline decoration-rot decoration-2 underline-offset-2 hover:text-rot"
                >
                  https://ec.europa.eu/consumers/odr/
                </a>
                . Unsere E-Mail-Adresse finden Sie oben im Impressum.
              </p>
            </section>

            <section>
              <h2 className="display text-xl">
                Verbraucherstreitbeilegung / Universalschlichtungsstelle
              </h2>
              <p className="mt-3">
                Wir sind nicht bereit oder verpflichtet, an
                Streitbeilegungsverfahren vor einer
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </section>

            <section>
              <h2 className="display text-xl">
                Zentrale Kontaktstelle nach dem Digital Services Act – DSA
                (Verordnung (EU) 2022/2065)
              </h2>
              <p className="mt-3">
                Unsere zentrale Kontaktstelle für Nutzer und Behörden nach
                Art. 11, 12 DSA erreichen Sie wie folgt:
              </p>
              <p className="mt-3">
                E-Mail:{" "}
                <a
                  href={`mailto:${contactData.email}`}
                  className="underline decoration-rot decoration-2 underline-offset-2 hover:text-rot"
                >
                  {contactData.email}
                </a>
                <br />
                Telefon: {contactData.phone}
              </p>
              <p className="mt-3">
                Sonstige Kontaktwege: {contactData.street}, {contactData.zip}{" "}
                {contactData.city}
              </p>
              <p className="mt-3">
                Die für den Kontakt zur Verfügung stehenden Sprachen sind:
                Deutsch, Englisch.
              </p>
            </section>

            <section>
              <h2 className="display text-xl">Urheberrecht</h2>
              <p className="mt-3">
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf
                diesen Seiten unterliegen dem deutschen Urheberrecht. Die
                Vervielfältigung, Bearbeitung, Verbreitung und jede Art der
                Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen
                der schriftlichen Zustimmung des jeweiligen Autors bzw.
                Erstellers. Downloads und Kopien dieser Seite sind nur für den
                privaten, nicht kommerziellen Gebrauch gestattet.
              </p>
              <p className="mt-3">
                Soweit die Inhalte auf dieser Seite nicht vom Betreiber
                erstellt wurden, werden die Urheberrechte Dritter beachtet.
                Insbesondere werden Inhalte Dritter als solche gekennzeichnet.
                Sollten Sie trotzdem auf eine Urheberrechtsverletzung
                aufmerksam werden, bitten wir um einen entsprechenden Hinweis.
                Bei Bekanntwerden von Rechtsverletzungen werden wir derartige
                Inhalte umgehend entfernen.
              </p>
            </section>
          </div>
        </Container>
      </section>
    </>
  );
}

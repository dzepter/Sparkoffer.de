import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { fullAddress, restaurant } from "@/lib/restaurant-config";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description:
    "Datenschutzerklärung des Safran Grill in Neustadt an der Weinstraße.",
  alternates: { canonical: "/datenschutz" },
};

/*
 * Diese Website ist bewusst datensparsam aufgebaut: keine Cookies, kein
 * Tracking, keine externen Fonts, keine eingebetteten Karten.
 * TODO(Recht): Verantwortliche Person ergänzen und die Erklärung vor dem
 * Livegang rechtlich prüfen lassen (z. B. Hosting-Anbieter benennen).
 */
export default function DatenschutzPage() {
  return (
    <>
      <PageIntro
        crumbs={[{ name: "Datenschutz", path: "/datenschutz" }]}
        eyebrow="Rechtliches"
        title="Datenschutzerklärung"
      />

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="max-w-2xl space-y-8 leading-relaxed">
          <section>
            <h2 className="font-display text-xl font-semibold">
              1. Verantwortlicher
            </h2>
            <p className="mt-3">
              {restaurant.name}
              <br />
              [BITTE ERGÄNZEN: Vor- und Nachname der Inhaberin/des Inhabers]
              <br />
              {fullAddress}
              <br />
              Telefon: {restaurant.phone.international}
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">
              2. Datenverarbeitung auf dieser Website
            </h2>
            <p className="mt-3 text-ink-soft">
              Diese Website ist bewusst datensparsam gestaltet. Sie verwendet
              keine Cookies, keine Analyse- oder Tracking-Dienste und bindet
              keine Inhalte von Drittanbietern (z.&nbsp;B. Karten, Videos oder
              externe Schriftarten) ein. Alle Schriften und Bilder werden
              direkt von unserem Server geladen.
            </p>
            <p className="mt-3 text-ink-soft">
              Beim Aufruf der Website verarbeitet der Hosting-Anbieter
              technisch notwendige Daten (z.&nbsp;B. IP-Adresse, Datum und
              Uhrzeit des Zugriffs, aufgerufene Seite) in sogenannten
              Server-Logfiles. Diese Verarbeitung ist für den Betrieb und die
              Sicherheit der Website erforderlich (Art.&nbsp;6 Abs.&nbsp;1
              lit.&nbsp;f DSGVO). Hosting-Anbieter: [BITTE ERGÄNZEN].
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">
              3. Links zu externen Diensten
            </h2>
            <p className="mt-3 text-ink-soft">
              Unsere Website verlinkt auf externe Dienste, unter anderem auf
              Lieferando (Online-Bestellung) und Google Maps (Routenplanung
              und Bewertungen). Erst wenn du einen solchen Link anklickst,
              verlässt du unsere Website; ab dann gilt die
              Datenschutzerklärung des jeweiligen Anbieters. Beim bloßen
              Besuch unserer Seiten werden keine Daten an diese Anbieter
              übertragen.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">
              4. Kontaktaufnahme
            </h2>
            <p className="mt-3 text-ink-soft">
              Wenn du uns anrufst, verarbeiten wir deine Angaben nur zur
              Bearbeitung deines Anliegens (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;b
              DSGVO). Eine Weitergabe an Dritte findet nicht statt.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">
              5. Deine Rechte
            </h2>
            <p className="mt-3 text-ink-soft">
              Du hast das Recht auf Auskunft, Berichtigung, Löschung und
              Einschränkung der Verarbeitung deiner personenbezogenen Daten
              sowie das Recht auf Datenübertragbarkeit und Widerspruch
              (Art.&nbsp;15–21 DSGVO). Außerdem kannst du dich bei einer
              Datenschutz-Aufsichtsbehörde beschweren – in Rheinland-Pfalz ist
              das der Landesbeauftragte für den Datenschutz und die
              Informationsfreiheit.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}

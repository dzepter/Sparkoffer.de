import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Reveal } from "@/components/Reveal";
import { Container, Eyebrow } from "@/components/ui";
import { modules } from "@/content/modules";
import { impulsvortraege } from "@/content/impulse";
import { contactData, routes } from "@/content/site";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = pageMetadata({
  title: "Kontakt | Aigner Offensiv",
  description:
    "Sie möchten Ihre Markt-, Filial- oder Abteilungsleiter weiterentwickeln? Beschreiben Sie uns kurz Ihre Ausgangssituation – wir melden uns persönlich bei Ihnen.",
  path: routes.kontakt,
});

/**
 * Die Seite liest die Vorauswahl aus der URL und wird dadurch bewusst
 * serverseitig pro Anfrage gerendert: So ist das Formular inklusive
 * Vorauswahl auch ohne JavaScript vollständig nutzbar.
 */
export default async function KontaktPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const angebot = typeof params.angebot === "string" ? params.angebot : "";

  // Anfragekontext aus Verlinkungen (z. B. konkreter Offensivtag/Vortrag)
  const tag = typeof params.tag === "string" ? params.tag : "";
  const vortrag = typeof params.vortrag === "string" ? params.vortrag : "";
  const tagTitle = modules.find((m) => m.number === tag)?.title;
  const vortragTitle = impulsvortraege.find((v) => v.slug === vortrag)?.title;
  const context = tagTitle
    ? `Offensivtag ${tag}: ${tagTitle}`
    : vortragTitle
      ? `Impulsvortrag: ${vortragTitle}`
      : "";

  return (
    <>
      <Breadcrumbs items={[{ label: "Kontakt", href: routes.kontakt }]} />

      <section className="border-b border-line bg-paper py-14 sm:py-20">
        <Container>
          <Reveal>
            <Eyebrow>Kontakt</Eyebrow>
            <h1 className="display mt-3 text-4xl text-ink sm:text-5xl lg:text-6xl">
              Jetzt sind Sie am Zug.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mute">
              Sie möchten Ihre Markt-, Filial- oder Abteilungsleiter
              weiterentwickeln? Beschreiben Sie uns kurz Ihre
              Ausgangssituation. Wir melden uns persönlich bei Ihnen.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-12 grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-16">
            <Reveal>
              <ContactForm preselected={angebot} context={context} />
            </Reveal>

            <Reveal delay={120}>
              <div className="border border-line bg-paper-2 p-7 sm:p-8">
                <h2 className="display text-xl text-ink">
                  Direkt erreichbar
                </h2>
                <address className="mt-5 space-y-4 text-[1.0625rem] not-italic">
                  <p className="text-ink">
                    {contactData.company}
                    <br />
                    {contactData.street}
                    <br />
                    {contactData.zip} {contactData.city}
                  </p>
                  <p>
                    <span className="eyebrow block text-mute">Telefon</span>
                    <a
                      href={`tel:${contactData.phoneHref}`}
                      className="mt-1 inline-block font-medium text-ink hover:text-rot hover:underline"
                    >
                      {contactData.phone}
                    </a>
                  </p>
                  <p>
                    <span className="eyebrow block text-mute">E-Mail</span>
                    <a
                      href={`mailto:${contactData.email}`}
                      className="mt-1 inline-block font-medium text-ink hover:text-rot hover:underline"
                    >
                      {contactData.email}
                    </a>
                  </p>
                </address>

                <h3 className="eyebrow mt-7 text-mute">Erreichbarkeit</h3>
                <dl className="mt-3 space-y-1.5 text-[0.9375rem] text-ink">
                  {contactData.hours.map((entry) => (
                    <div key={entry.days} className="flex justify-between gap-4">
                      <dt>{entry.days}</dt>
                      <dd className="text-mute">{entry.time}</dd>
                    </div>
                  ))}
                </dl>

                {/* Anfahrt bewusst ohne externen Kartendienst (Datenschutz) */}
                <p className="mt-7 border-t border-line pt-5 text-sm leading-relaxed text-mute">
                  Sie finden uns in der {contactData.street} in{" "}
                  {contactData.city}-Schwabing. Für die Anfahrt nutzen Sie
                  bitte den Kartendienst Ihrer Wahl – wir binden aus
                  Datenschutzgründen keine externe Karte ein.
                </p>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContactCTA } from "@/components/ContactCTA";
import { FootballPrinciple } from "@/components/FootballPrinciple";
import { PresenceSection } from "@/components/PresenceSection";
import { ProgramTimeline } from "@/components/ProgramTimeline";
import { Reveal } from "@/components/Reveal";
import { SitePhoto } from "@/components/SitePhoto";
import {
  ButtonLink,
  Container,
  Eyebrow,
  SectionHeading,
  TacticLines,
} from "@/components/ui";
import { images } from "@/content/images";
import { cta, routes, siteConfig } from "@/content/site";

export const metadata: Metadata = pageMetadata({
  title: "Handel Offensiv – Führungstraining für den Handel",
  description:
    "Handel Offensiv entwickelt Marktleiter, Filialleiter und Abteilungsleiter zu wirksamen Mannschaftsführern – praxisnah und zu 100 Prozent in Präsenz.",
  path: routes.handelOffensiv,
});

const resultAreas = [
  {
    title: "Mitarbeiterbindung",
    text: "Gute Mitarbeiter bleiben, wenn Führung Klarheit, Anerkennung und Entwicklung bietet.",
  },
  {
    title: "Verlässlichkeit",
    text: "Vereinbarungen gelten, Informationen kommen an, Abläufe funktionieren – auch im Tagesgeschäft.",
  },
  {
    title: "Produktivität",
    text: "Mit den vorhandenen Mitarbeitern verlässlicher, produktiver und kundenorientierter arbeiten.",
  },
  {
    title: "Führungssicherheit",
    text: "Entscheidungen, Gespräche und Konflikte werden angegangen statt aufgeschoben.",
  },
  {
    title: "Umsatzaktivierung",
    text: "Kennzahlen und Verkaufsziele werden in tägliches Handeln auf der Fläche übersetzt.",
  },
];

const decisionMakers = [
  "Inhaber und Geschäftsführer von Handelsunternehmen",
  "Personalleiter und Personalentwickler",
  "Vertriebsleiter und Verkaufsleiter",
  "Regionalleiter und Gebietsleiter",
  "Verantwortliche für Weiterbildung und Führungskräfteentwicklung",
  "Betreiber mehrerer Filialen oder Standorte",
  "Verbände, Kooperationen und Handelsorganisationen",
];

const participants = [
  "Marktleiter",
  "Filialleiter",
  "Abteilungsleiter",
  "Teamleiter",
  "Schichtleiter",
  "Nachwuchsführungskräfte",
  "erfahrene Mitarbeiter vor dem nächsten Karriereschritt",
  "Fachkräfte mit erster Personalverantwortung",
];

const branches = [
  "Lebensmitteleinzelhandel",
  "Fachhandel",
  "Baumärkte",
  "Möbelhandel",
  "Modehandel",
  "Elektronikhandel",
  "Sporthandel",
  "Autohäuser und handelsnahe Betriebe",
  "Großhandel",
  "Filial-, Franchise- und Verbundsysteme",
];

export default function HandelOffensivPage() {
  return (
    <>
      <Breadcrumbs
        items={[{ label: "Handel Offensiv", href: routes.handelOffensiv }]}
      />

      {/* Kopfbereich */}
      <section className="on-dark relative overflow-hidden bg-ink py-14 text-white sm:py-20">
        <TacticLines
          variant="halfway"
          className="-left-48 -bottom-48 h-[28rem] w-[28rem] text-white/[0.05]"
        />
        <Container className="relative">
          <div className="grid items-center gap-10 grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
            <Reveal>
              <Eyebrow className="text-rot-hell">
                {siteConfig.productLabel}
              </Eyebrow>
              <h1 className="display mt-3 text-4xl text-white sm:text-5xl lg:text-6xl">
                Was ist Handel Offensiv?
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-mute-dark">
                Handel Offensiv ist das Entwicklungsprogramm von Aigner
                Offensiv für Führungskräfte im stationären Handel. Es macht
                aus vorhandenen Führungskräften wirksame Mannschaftsführer –
                Menschen, die Mitarbeiter binden, Verantwortung übertragen,
                klar kommunizieren, schwierige Situationen lösen und
                wirtschaftliche Ziele auf die Fläche bringen.
              </p>
              <p className="display mt-8 max-w-xl text-xl text-white sm:text-2xl">
                {siteConfig.benefitLine}
              </p>
              <div className="mt-9 flex flex-wrap gap-4">
                <ButtonLink href={cta.primary.href} variant="primary">
                  {cta.primary.label}
                </ButtonLink>
                <ButtonLink href={cta.secondary.href} variant="outline-light">
                  {cta.secondary.label}
                </ButtonLink>
              </div>
            </Reveal>
            <Reveal delay={150}>
              <SitePhoto
                image={images.rainerPresenting}
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="aspect-[16/10] w-full"
              />
              <p className="mt-3 text-sm text-mute-dark">
                Rainer Aigner – Führungserfahrung aus Profifußball und
                Unternehmertum.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Fünf Ergebnisbereiche */}
      <section className="border-b border-line bg-paper py-16 sm:py-24">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Das Nutzenversprechen"
              title="Mitarbeiter halten. Führung stärken. Abläufe verbessern. Umsatz aktivieren."
              intro="Handel Offensiv zielt auf fünf Ergebnisbereiche, die im stationären Handel über Erfolg entscheiden – nicht mit Erfolgsgarantien, sondern mit trainierter Handlungskompetenz und mehr Führungswirkung unter realen personellen Bedingungen."
            />
          </Reveal>
          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {resultAreas.map((area, i) => (
              <Reveal
                as="li"
                key={area.title}
                delay={i * 60}
                className="h-full border-t-4 border-rot bg-paper-2 p-5"
              >
                <span
                  aria-hidden="true"
                  className="tactic-number text-xl text-rot"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="display mt-2 text-lg text-ink">
                  {area.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-mute">
                  {area.text}
                </p>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      {/* Zielgruppen */}
      <section className="border-b border-line bg-paper-2 py-16 sm:py-24">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Für wen"
              title="Wer mit Handel Offensiv arbeitet"
            />
          </Reveal>
          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            <Reveal>
              <div className="h-full border border-line bg-paper p-7">
                <h3 className="display text-xl text-ink">
                  Entscheider im Unternehmen
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-mute">
                  Sie verantworten Führung, Personal oder Vertrieb und wollen
                  Ihre Führungsmannschaft gezielt entwickeln:
                </p>
                <ul className="mt-4 space-y-2 text-[0.9375rem] text-ink">
                  {decisionMakers.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rot"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={80}>
              <div className="h-full border border-line bg-paper p-7">
                <h3 className="display text-xl text-ink">
                  Teilnehmer des Programms
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-mute">
                  Menschen, die auf der Fläche Verantwortung tragen oder sie
                  übernehmen werden:
                </p>
                <ul className="mt-4 space-y-2 text-[0.9375rem] text-ink">
                  {participants.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rot"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={160}>
              <div className="h-full border border-line bg-paper p-7">
                <h3 className="display text-xl text-ink">
                  Branchen im stationären Handel
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-mute">
                  Die Inhalte werden auf die jeweilige Handelsrealität
                  angepasst, zum Beispiel:
                </p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {branches.map((item) => (
                    <li
                      key={item}
                      className="border border-line px-3 py-1.5 text-sm text-ink"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <FootballPrinciple />
      <ProgramTimeline />
      <PresenceSection />

      <ContactCTA
        headline="Bringen Sie Ihre Führungskräfte in die Offensive."
        primary={cta.primary}
        secondary={cta.kontakt}
      />
    </>
  );
}

import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContactCTA } from "@/components/ContactCTA";
import { ModuleDetail } from "@/components/ModuleDetail";
import { ProgramTimeline } from "@/components/ProgramTimeline";
import { Reveal } from "@/components/Reveal";
import { Container, Eyebrow } from "@/components/ui";
import { modules } from "@/content/modules";
import { cta, routes } from "@/content/site";
import Link from "next/link";

export const metadata: Metadata = pageMetadata({
  title: "Die 5 Offensivtage | Handel Offensiv",
  description:
    "Fünf Präsenztage für Führungskräfte im Handel: Führungsrolle, Mannschaft, Personalmanagement, KI im Führungsalltag und Führen unter Druck – mit konkreten Arbeitsergebnissen.",
  path: routes.offensivtage,
});

export default function OffensivtagePage() {
  return (
    <>
      <Breadcrumbs
        items={[{ label: "Die 5 Offensivtage", href: routes.offensivtage }]}
      />

      {/* Seitenkopf mit Sprungnavigation */}
      <section className="border-b border-line bg-paper py-14 sm:py-20">
        <Container>
          <Reveal>
            <Eyebrow>Das Herzstück von Handel Offensiv</Eyebrow>
            <h1 className="display mt-3 max-w-3xl text-4xl text-ink sm:text-5xl lg:text-6xl">
              Die fünf Offensivtage
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mute">
              Jeder Offensivtag widmet sich einer spielentscheidenden
              Führungskompetenz – mit klarer Leitidee, konkreten Inhalten und
              einem Arbeitsergebnis, das die Teilnehmer direkt in ihren
              Arbeitsalltag mitnehmen.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <nav aria-label="Sprungnavigation zu den Offensivtagen">
              <ol className="mt-9 flex flex-wrap gap-2.5">
                {modules.map((mod) => (
                  <li key={mod.slug}>
                    <Link
                      href={`#tag-${mod.number}`}
                      className="inline-flex min-h-11 items-center gap-2.5 border border-line bg-paper-2 px-4 py-2 transition-colors hover:border-rot hover:text-rot"
                    >
                      <span className="tactic-number text-rot">
                        {mod.number}
                      </span>
                      <span className="font-display text-sm font-medium uppercase tracking-wider">
                        {mod.motif}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
          </Reveal>
        </Container>
      </section>

      {modules.map((mod, i) => (
        <ModuleDetail key={mod.slug} module={mod} index={i} />
      ))}

      <ProgramTimeline />

      <ContactCTA
        headline="Der erste Offensivtag ist der Anpfiff."
        text="Starten Sie mit einem einzelnen Schwerpunkttag oder mit dem vollständigen Führungsführerschein – wir besprechen gemeinsam, was zu Ihrer Ausgangssituation passt."
        primary={cta.primary}
        secondary={cta.fuehrerschein}
      />
    </>
  );
}

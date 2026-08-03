import Link from "next/link";
import { modules } from "@/content/modules";
import { cta, routes } from "@/content/site";
import { Reveal } from "./Reveal";
import { ButtonLink, Container, SectionHeading } from "./ui";

/**
 * Kompakte Übersicht der fünf Offensivtage für die Startseite.
 * Die Detaildarstellung liegt auf /offensivtage – gleiche Datenquelle.
 */
export function ModuleOverview() {
  return (
    <section className="on-dark relative bg-ink py-16 text-white sm:py-24">
      <Container>
        <Reveal>
          <SectionHeading
            dark
            eyebrow="Das Programm"
            title="Die fünf Offensivtage"
            intro="Fünf Präsenztage, die aufeinander aufbauen – vom eigenen Rollenverständnis bis zur Führung in der entscheidenden Phase."
          />
        </Reveal>

        <div className="relative mt-12">
          {/* Fortschrittslinie als Taktikelement (dekorativ) */}
          <div
            aria-hidden="true"
            className="absolute bottom-6 left-[1.4rem] top-6 hidden w-px bg-line-dark sm:block"
          />
          <ol>
          {modules.map((mod, i) => (
            <Reveal
              as="li"
              key={mod.slug}
              delay={i * 70}
              className="relative border-b border-line-dark last:border-0"
            >
                <Link
                  href={`${routes.offensivtage}#tag-${mod.number}`}
                  className="group flex flex-col gap-3 py-7 pl-0 transition-colors sm:flex-row sm:items-center sm:gap-8 sm:pl-0"
                >
                  <span className="tactic-number relative z-10 flex h-11 w-11 shrink-0 items-center justify-center border-2 border-rot bg-ink text-lg text-white transition-colors group-hover:bg-rot">
                    {mod.number}
                  </span>
                  <span className="flex-1">
                    <span className="display block text-2xl text-white transition-colors group-hover:text-rot-hell sm:text-[1.625rem]">
                      {mod.title}
                    </span>
                    <span className="mt-1.5 block leading-relaxed text-mute-dark">
                      {mod.shortBenefit}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="hidden shrink-0 text-rot-hell transition-transform group-hover:translate-x-1 sm:block"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <line x1="4" y1="12" x2="20" y2="12" />
                      <polyline points="13 5 20 12 13 19" />
                    </svg>
                  </span>
                </Link>
            </Reveal>
          ))}
          </ol>
        </div>

        <Reveal>
          <div className="mt-10 flex flex-wrap gap-4">
            <ButtonLink href={routes.offensivtage} variant="primary">
              Alle Offensivtage im Detail
            </ButtonLink>
            <ButtonLink href={cta.fuehrerschein.href} variant="outline-light">
              {cta.fuehrerschein.label}
            </ButtonLink>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

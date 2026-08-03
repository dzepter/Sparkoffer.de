import type { OffensivModule } from "@/content/modules";
import { cta } from "@/content/site";
import { Reveal } from "./Reveal";
import { ButtonLink, Container, TacticLines } from "./ui";

/**
 * Ausführliche Kapitel-Darstellung eines Offensivtags.
 * Große vertikale Kapitel auf dem Desktop, gut lesbar untereinander mobil.
 */
export function ModuleDetail({
  module: mod,
  index,
}: {
  module: OffensivModule;
  index: number;
}) {
  const dark = index % 2 === 1;

  return (
    <article
      id={`tag-${mod.number}`}
      aria-labelledby={`tag-${mod.number}-titel`}
      className={`relative scroll-mt-24 overflow-hidden border-b py-16 sm:py-20 ${
        dark
          ? "on-dark border-line-dark bg-ink text-white"
          : "border-line bg-paper"
      }`}
    >
      <TacticLines
        variant={index % 2 === 0 ? "corner" : "halfway"}
        className={`-right-24 -top-24 h-96 w-96 ${
          dark ? "text-white/[0.04]" : "text-gruen/10"
        }`}
      />
      <Container className="relative">
        <div className="grid gap-10 grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          {/* Linke Spalte: Nummer, Titel, Leitidee, Herausforderung */}
          <Reveal>
            <div className="flex items-start gap-5">
              {/*
                Dekoratives Wasserzeichen – die Nummer steht direkt daneben
                nochmals mit vollem Kontrast („Offensivtag 01 · Kapitän“).
              */}
              <span
                aria-hidden="true"
                data-watermark
                className={`tactic-number text-7xl sm:text-8xl ${
                  dark ? "text-white/15" : "text-rot/15"
                }`}
              >
                {mod.number}
              </span>
              <div className="pt-2">
                <p className={`eyebrow ${dark ? "text-rot-hell" : "text-rot"}`}>
                  Offensivtag {mod.number} · {mod.motif}
                </p>
                <h2
                  id={`tag-${mod.number}-titel`}
                  className={`display mt-2 text-3xl sm:text-4xl ${
                    dark ? "text-white" : "text-ink"
                  }`}
                >
                  {mod.title}
                </h2>
                <p
                  className={`mt-3 text-lg font-medium ${
                    dark ? "text-mute-dark" : "text-mute"
                  }`}
                >
                  {mod.subtitle}
                </p>
              </div>
            </div>

            <figure
              className={`mt-8 border-l-4 pl-5 ${
                dark ? "border-rot-hell" : "border-rot"
              }`}
            >
              <blockquote
                className={`display text-xl sm:text-2xl ${
                  dark ? "text-white" : "text-ink"
                }`}
              >
                {mod.footballPrinciple}
              </blockquote>
              <figcaption
                className={`eyebrow mt-3 ${dark ? "text-mute-dark" : "text-mute"}`}
              >
                Die Leitidee
              </figcaption>
            </figure>

            <h3
              className={`eyebrow mt-8 ${dark ? "text-mute-dark" : "text-mute"}`}
            >
              Die Herausforderung
            </h3>
            <p
              className={`mt-3 leading-relaxed ${
                dark ? "text-white/85" : "text-ink"
              }`}
            >
              {mod.challenge}
            </p>
            {mod.note ? (
              <p
                className={`mt-4 border p-4 text-sm leading-relaxed ${
                  dark
                    ? "border-line-dark text-mute-dark"
                    : "border-line text-mute"
                }`}
              >
                {mod.note}
              </p>
            ) : null}
          </Reveal>

          {/* Rechte Spalte: Inhalte, Ergebnis, Nutzen, CTA */}
          <Reveal delay={100}>
            <h3
              className={`eyebrow ${dark ? "text-mute-dark" : "text-mute"}`}
            >
              Daran arbeiten wir
            </h3>
            <ul
              className={`mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2 ${
                dark ? "text-white/85" : "text-ink"
              }`}
            >
              {mod.contents.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rot"
                  />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>

            <div
              className={`mt-8 border p-6 ${
                dark ? "border-line-dark bg-ink-2" : "border-line bg-paper-2"
              }`}
            >
              <h3 className={`eyebrow ${dark ? "text-rot-hell" : "text-rot"}`}>
                Das Arbeitsergebnis
              </h3>
              <p
                className={`mt-3 font-medium leading-relaxed ${
                  dark ? "text-white" : "text-ink"
                }`}
              >
                {mod.workResult}
              </p>
            </div>

            <h3
              className={`eyebrow mt-8 ${dark ? "text-mute-dark" : "text-mute"}`}
            >
              Der Nutzen für Ihr Unternehmen
            </h3>
            <ul className="mt-4 flex flex-wrap gap-2.5">
              {mod.benefits.map((benefit) => (
                <li
                  key={benefit}
                  className={`border px-3.5 py-1.5 text-sm ${
                    dark
                      ? "border-line-dark text-white/85"
                      : "border-line text-ink"
                  }`}
                >
                  {benefit}
                </li>
              ))}
            </ul>

            <div className="mt-9">
              <ButtonLink
                href={`${cta.primary.href}&tag=${mod.number}`}
                variant="primary"
              >
                {mod.ctaLabel}
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </Container>
    </article>
  );
}

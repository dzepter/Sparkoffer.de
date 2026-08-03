import { images } from "@/content/images";
import { presence } from "@/content/program";
import { Reveal } from "./Reveal";
import { SitePhoto } from "./SitePhoto";
import { Container, Eyebrow } from "./ui";

/** Präsenz als klares Differenzierungsmerkmal. */
export function PresenceSection() {
  return (
    <section className="border-b border-line bg-paper py-16 sm:py-24">
      <Container>
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <SitePhoto
              image={images.rainerStage}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="aspect-[16/10] w-full"
            />
            <p className="mt-3 text-sm text-mute">
              Rainer Aigner bei einem Vortrag – Führung entsteht in der
              Begegnung.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <Eyebrow>Unser Format</Eyebrow>
            <h2 className="display mt-3 text-4xl text-ink sm:text-5xl">
              100 Prozent{" "}
              <span className="text-rot">Präsenz</span>
            </h2>
            <p className="mt-6 text-lg font-medium leading-relaxed text-ink">
              {presence.statement}
            </p>
            <p className="mt-4 leading-relaxed text-mute">{presence.reason}</p>
            <h3 className="eyebrow mt-8 text-mute">Mögliche Orte</h3>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {presence.locations.map((location) => (
                <li key={location} className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rot"
                  />
                  <span className="text-[1.0625rem] text-ink">{location}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

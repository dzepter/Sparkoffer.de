import Link from "next/link";
import { ButtonLink, Container, TacticLines } from "@/components/ui";
import { navigation, routes } from "@/content/site";

export default function NotFound() {
  return (
    <section className="relative overflow-hidden bg-paper py-20 sm:py-28">
      <TacticLines
        variant="halfway"
        className="-right-40 -top-40 h-[28rem] w-[28rem] text-gruen/10"
      />
      <Container className="relative">
        <p className="eyebrow text-rot">Fehler 404</p>
        <h1 className="display mt-3 max-w-2xl text-4xl text-ink sm:text-5xl">
          Diese Seite steht nicht in der Aufstellung.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-mute">
          Die aufgerufene Adresse existiert nicht oder wurde verschoben.
          Vielleicht finden Sie hier, was Sie suchen:
        </p>
        <ul className="mt-8 flex flex-wrap gap-3">
          {navigation.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="inline-flex min-h-11 items-center border border-line bg-paper-2 px-4 py-2 font-display text-sm font-medium uppercase tracking-wider text-ink transition-colors hover:border-rot hover:text-rot"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <ButtonLink href={routes.home} variant="primary">
            Zur Startseite
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}

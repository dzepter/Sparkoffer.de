import { Cta } from "@/components/cta";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-start px-5 py-24 sm:px-8 sm:py-32">
      <p className="text-[0.72rem] font-semibold uppercase tracking-eyebrow text-saffron-deep">
        Fehler 404
      </p>
      <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
        Diese Seite gibt es nicht.
      </h1>
      <p className="mt-4 max-w-md text-lg leading-relaxed text-ink-soft">
        Aber es gibt Grillgerichte, Reis und Naan – schau doch auf der
        Speisekarte vorbei.
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Cta href="/">Zur Startseite</Cta>
        <Cta href="/speisekarte" variant="outline">
          Zur Speisekarte
        </Cta>
      </div>
    </div>
  );
}

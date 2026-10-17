import type { Metadata } from "next";

import { APP } from "@handel-offensiv/config";

import { Kicker } from "@/components/ui/kicker";

export const metadata: Metadata = { title: "Bitte nutzen Sie die App" };

/**
 * Landet hier: eingeloggte Person OHNE Cockpit-Rolle (reine Teilnehmer).
 * Freundlich, klar, ohne Vorwurf – der richtige Ort ist die Mobile-App.
 */
export default function HinweisAppPage() {
  return (
    <main className="pitch-lines flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-md rounded border border-line bg-white p-8 text-center">
        <Kicker className="justify-center">{APP.name}</Kicker>
        <h1 className="mt-3 text-2xl font-extrabold uppercase leading-tight tracking-tight text-ink">
          Bitte nutzen Sie die App
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          Dieser Bereich ist das Cockpit für Trainer und Administration. Ihre
          Inhalte, Termine und Aufgaben finden Sie in der {APP.name}-App auf
          Ihrem Smartphone – dort sind Sie richtig.
        </p>
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          Sie haben die App noch nicht? Ihre Einladungs-E-Mail enthält den
          Zugang. Bei Fragen erreichen Sie uns unter{" "}
          <a className="font-bold text-green-deep underline" href={`mailto:${APP.supportEmail}`}>
            {APP.supportEmail}
          </a>
          .
        </p>
        <form action="/logout" method="post" className="mt-6">
          <button
            type="submit"
            className="inline-flex min-h-touch items-center justify-center rounded border border-ink px-5 text-sm font-bold uppercase tracking-kicker text-ink hover:bg-paper"
          >
            Abmelden
          </button>
        </form>
      </div>
    </main>
  );
}

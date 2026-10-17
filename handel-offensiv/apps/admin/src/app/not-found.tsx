import type { Metadata } from "next";
import Link from "next/link";

import { APP } from "@handel-offensiv/config";

import { Kicker } from "@/components/ui/kicker";

export const metadata: Metadata = { title: "Seite nicht gefunden" };

/**
 * Globale 404-Seite des Cockpits. Wird ohne Sitzungsdaten gerendert und –
 * wie alle Seiten unter dem Root-Layout – dynamisch (CSP-Nonce, siehe
 * src/app/layout.tsx).
 */
export default function NotFound() {
  return (
    <main className="pitch-lines flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-md rounded border border-line bg-white p-8 text-center">
        <Kicker className="justify-center">{APP.name} Cockpit</Kicker>
        <h1 className="mt-3 text-2xl font-extrabold uppercase leading-tight tracking-tight text-ink">
          Diese Seite wurde nicht gefunden
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          Der Link ist möglicherweise veraltet oder die Seite wurde verschoben. Bei Fragen erreichen
          Sie uns unter{" "}
          <a className="font-bold text-green-deep underline" href={`mailto:${APP.supportEmail}`}>
            {APP.supportEmail}
          </a>
          .
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex min-h-touch items-center justify-center rounded bg-green-deep px-5 text-sm font-bold uppercase tracking-kicker text-white hover:opacity-90"
          >
            Zum Cockpit
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-touch items-center justify-center rounded border border-ink px-5 text-sm font-bold uppercase tracking-kicker text-ink hover:bg-paper"
          >
            Zur Anmeldung
          </Link>
        </div>
      </div>
    </main>
  );
}

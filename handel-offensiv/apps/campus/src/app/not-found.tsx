import type { Metadata } from "next";
import Link from "next/link";

import { APP } from "@handel-offensiv/config";
import { EmptyState } from "@handel-offensiv/ui";

import { AuthHeading, PublicFrame } from "@/app/(auth)/public-frame";

export const metadata: Metadata = { title: "Seite nicht gefunden" };

/**
 * Globale 404-Seite des Campus. Wird ohne Sitzungsdaten gerendert
 * (auch fuer Teilnehmer ohne Login), daher im oeffentlichen Rahmen.
 */
export default function NotFound() {
  return (
    <PublicFrame width="wide">
      <AuthHeading kicker="Abseits" title="Diese Seite wurde nicht gefunden">
        Der Link ist möglicherweise veraltet oder die Seite wurde verschoben. Kein Problem – zurück ins Spiel.
      </AuthHeading>

      <EmptyState
        title="Hier geht es nicht weiter"
        description={`Über „Heute" kommen Sie zurück zu Ihrer Startseite. Wenn Sie über einen Link aus einer E-Mail hierher gelangt sind, wenden Sie sich bitte an ${APP.supportEmail}.`}
        action={
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/heute"
              className="inline-flex min-h-touch items-center justify-center rounded bg-navy px-5 text-sm font-bold uppercase tracking-kicker text-white hover:bg-navy-soft"
            >
              Zur Startseite
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-touch items-center justify-center rounded border border-ink bg-white px-5 text-sm font-bold uppercase tracking-kicker text-ink hover:bg-paper"
            >
              Zur Anmeldung
            </Link>
          </div>
        }
      />
    </PublicFrame>
  );
}

"use client";

import Link from "next/link";

import { APP } from "@handel-offensiv/config";
import { Button, ErrorState } from "@handel-offensiv/ui";

import { AuthHeading, PublicFrame } from "@/app/(auth)/public-frame";
import { ERROR_MESSAGES } from "@/lib/errors";

/**
 * Globale Error Boundary des Campus (Fallback fuer alle Routen unterhalb
 * des Root-Layouts). Deutsche Meldung, "Erneut versuchen" – technische
 * Details (error.digest) bleiben im Server-Log und werden nie angezeigt.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <PublicFrame width="wide">
      <AuthHeading kicker="Kurze Unterbrechung" title="Da ist etwas schiefgelaufen">
        Das war nicht geplant. Bitte versuchen Sie es erneut – Ihre bisherigen Eingaben sind in der Regel gespeichert.
      </AuthHeading>

      <ErrorState
        title="Die Seite konnte nicht geladen werden"
        message={ERROR_MESSAGES.load}
        action={
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button type="button" variant="primary" onClick={() => reset()}>
              Erneut versuchen
            </Button>
            <Link
              href="/heute"
              className="inline-flex min-h-touch items-center justify-center rounded border border-ink bg-white px-5 text-sm font-bold uppercase tracking-kicker text-ink hover:bg-paper"
            >
              Zur Startseite
            </Link>
          </div>
        }
      />

      <p className="mt-6 text-center text-xs text-ink-soft">
        Tritt der Fehler wiederholt auf, wenden Sie sich bitte an {APP.supportEmail}.
      </p>
    </PublicFrame>
  );
}

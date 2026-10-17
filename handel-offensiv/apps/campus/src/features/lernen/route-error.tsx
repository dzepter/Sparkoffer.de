"use client";

import { Button, ErrorState } from "@handel-offensiv/ui";

import { ERROR_MESSAGES } from "@/lib/errors";

/**
 * Gemeinsame Error Boundary der Lernrouten (heute, programm, lektionen):
 * deutsche Meldung, "Erneut versuchen" – technische Details bleiben im Log.
 */
export function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      message={ERROR_MESSAGES.load}
      action={
        <Button type="button" variant="secondary" onClick={() => reset()}>
          Erneut versuchen
        </Button>
      }
    />
  );
}

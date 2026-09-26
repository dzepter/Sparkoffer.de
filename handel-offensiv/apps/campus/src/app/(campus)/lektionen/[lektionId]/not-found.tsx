import Link from "next/link";

import { EmptyState } from "@handel-offensiv/ui";

/** Lektion nicht gefunden oder (noch) nicht freigeschaltet – bewusst dieselbe Meldung. */
export default function LektionNotFound() {
  return (
    <div className="mx-auto max-w-3xl">
      <EmptyState
        title="Diese Lektion ist noch nicht freigeschaltet oder wurde nicht gefunden"
        description="Im Programm sehen Sie, welche Lektionen bereits frei sind und wann die nächsten folgen."
        action={
          <Link
            href="/programm"
            className="inline-flex min-h-touch items-center justify-center rounded bg-navy px-5 text-sm font-bold uppercase tracking-kicker text-white hover:bg-navy-soft"
          >
            Zum Programm
          </Link>
        }
      />
    </div>
  );
}

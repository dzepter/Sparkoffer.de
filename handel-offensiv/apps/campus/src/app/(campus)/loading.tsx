import { LoadingState } from "@handel-offensiv/ui";

/**
 * Lade-Skelett fuer alle Campus-Seiten (Heute, Programm, Termine, …):
 * Platzhalter fuer Kicker + Titel, danach drei Kartenflaechen.
 * Wird innerhalb des Campus-Rahmens (Layout) angezeigt, bis die Seite
 * serverseitig geladen ist.
 */
export default function CampusLoading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-6 sm:space-y-8">
      <span className="sr-only">Seite wird geladen …</span>

      {/* PageHeader-Platzhalter */}
      <div aria-hidden="true" className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="h-0.5 w-5 bg-gold" />
          <div className="h-3 w-20 animate-pulse rounded bg-line/70" />
        </div>
        <div className="h-8 w-2/3 max-w-md animate-pulse rounded bg-line/70" />
        <div className="h-4 w-1/2 max-w-sm animate-pulse rounded bg-line/50" />
      </div>

      {/* Kartenflaechen */}
      <div aria-hidden="true" className="grid gap-4 md:grid-cols-2">
        <LoadingState rows={4} className="md:col-span-2" />
        <LoadingState rows={3} />
        <LoadingState rows={3} />
      </div>
    </div>
  );
}

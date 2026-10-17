/**
 * Hinweisbanner fuer per Redirect transportierte Meldungen
 * (?fehler=… / ?erfolg=…) – Fehler- und Erfolgszustand je Screen.
 */
export function Notice({ fehler, erfolg }: { fehler?: string | undefined; erfolg?: string | undefined }) {
  if (fehler !== undefined && fehler !== "") {
    return (
      <div
        role="alert"
        className="mb-6 rounded border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
      >
        {fehler}
      </div>
    );
  }
  if (erfolg !== undefined && erfolg !== "") {
    return (
      <div
        role="status"
        className="mb-6 rounded border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
      >
        {erfolg}
      </div>
    );
  }
  return null;
}

/** Erste Stringform eines searchParams-Werts. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

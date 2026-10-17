/**
 * Einheitliche JSON-Fehlerbehandlung.
 *
 * Grundsaetze (§ Briefing):
 * - Fehlermeldungen sind DEUTSCH, verstaendlich und ohne technische Codes.
 * - Niemals Stacktraces oder interne Details an den Client geben.
 *   Interne Details landen ausschliesslich in console.error (Function-Logs).
 */

/** Kontrollierter Fehler mit HTTP-Status, deutscher Nutzer-Meldung und optionalem Fehlercode. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /** Maschinenlesbarer Code fuer Clients (z. B. "expired"), nie technisch/intern. */
    public readonly code?: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** JSON-Response-Helfer. */
export function json(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}

/** Wirft einen HttpError (Kurzform fuer Guard-Klauseln). */
export function fail(status: number, message: string, code?: string): never {
  throw new HttpError(status, message, code);
}

/**
 * Wandelt einen beliebigen Fehler in eine sichere JSON-Antwort.
 * - HttpError: Status + Meldung durchreichen (bewusst formuliert).
 * - ZodError-artige Fehler (issues-Array): 400 mit erster Meldung.
 * - Alles andere: generische 500-Meldung, Details nur ins Log.
 */
export function toErrorResponse(
  err: unknown,
  headers: Record<string, string> = {},
): Response {
  if (err instanceof HttpError) {
    return json(
      err.status,
      { ok: false, error: err.message, ...(err.code ? { code: err.code } : {}) },
      headers,
    );
  }

  // Zod-Validierungsfehler: erste Issue-Meldung ist bereits deutsch formuliert.
  if (
    typeof err === "object" &&
    err !== null &&
    "issues" in err &&
    Array.isArray((err as { issues: unknown }).issues)
  ) {
    const issues = (err as { issues: Array<{ message?: string }> }).issues;
    const message = issues[0]?.message ?? "Die Eingaben sind ungültig.";
    return json(
      400,
      { ok: false, error: `Bitte prüfen Sie Ihre Eingaben: ${message}`, code: "invalid_input" },
      headers,
    );
  }

  console.error("Unerwarteter Fehler:", err);
  return json(
    500,
    { ok: false, error: "Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut." },
    headers,
  );
}

/** Liest den Request-Body als JSON; wirft bei kaputtem JSON eine deutsche 400. */
export async function readJsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    fail(400, "Die Anfrage konnte nicht gelesen werden. Bitte versuchen Sie es erneut.");
  }
}

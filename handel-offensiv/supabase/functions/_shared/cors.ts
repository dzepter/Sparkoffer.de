/**
 * Restriktive CORS-Konfiguration fuer alle Edge Functions.
 *
 * Nur Origins aus der Env-Variable ALLOWED_ORIGINS (kommasepariert, z. B.
 * "https://app.example.de,https://admin.example.de") erhalten CORS-Header.
 * Fehlt die Env oder passt der Origin nicht, werden KEINE CORS-Header gesetzt
 * (fail-closed) – der Browser blockiert die Antwort dann selbst.
 * Native Apps (Expo/React Native) senden keinen Origin-Header und sind von
 * CORS nicht betroffen.
 */

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  if (!origin) return {};

  const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!allowed.includes(origin)) return {};

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, apikey, content-type, x-client-info, x-cron-secret",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/** Antwort auf OPTIONS-Preflight (204, ggf. mit CORS-Headern). */
export function preflightResponse(req: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

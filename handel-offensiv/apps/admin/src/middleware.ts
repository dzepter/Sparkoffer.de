/**
 * Auth-Gate und Content-Security-Policy des Cockpits:
 *  - ohne Session -> /login (mit Ruecksprungziel)
 *  - mit Session auf /login -> Cockpit
 *  - Session-Refresh (Cookies) via @supabase/ssr
 *  - CSP mit Nonce je Request (Next.js-Empfehlung fuer den App Router):
 *    keine 'unsafe-inline'-Skripte; der Nonce wird per Request-Header x-nonce
 *    an Server-Komponenten weitergereicht und von Next fuer die eigenen
 *    Inline-Skripte aus dem CSP-Request-Header uebernommen.
 *
 * Die Rollenpruefung "reiner Teilnehmer -> /hinweis-app" erfolgt bewusst im
 * Cockpit-Layout (src/app/(cockpit)/layout.tsx): sie braucht DB-Abfragen
 * (Mitgliedschaften), die nicht bei jedem Request in der Edge-Middleware
 * laufen sollen.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = new Set(["/login", "/login/passwort-vergessen", "/auth/callback", "/hinweis-app"]);

/** Supabase-Origin (https + wss fuer Realtime) aus NEXT_PUBLIC_SUPABASE_URL. */
function supabaseOrigins(): string[] {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  try {
    const url = new URL(raw);
    const ws = url.protocol === "https:" ? "wss:" : "ws:";
    return [url.origin, `${ws}//${url.host}`];
  } catch {
    return [];
  }
}

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  const [supabaseHttp = "", supabaseWs = ""] = supabaseOrigins();
  const directives = [
    "default-src 'self'",
    // 'strict-dynamic': nur per Nonce freigegebene Skripte (und was diese laden)
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' blob: data: ${supabaseHttp}`.trim(),
    `media-src 'self' blob: ${supabaseHttp}`.trim(),
    `connect-src 'self' ${supabaseHttp} ${supabaseWs}`.trim(),
    // Das Cockpit bettet keine fremden Inhalte ein
    "frame-src 'none'",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // Lokal laeuft das Cockpit ueber http (localhost) – dort nicht erzwingen
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ];
  return directives.map((d) => d.replace(/\s+/g, " ")).join("; ");
}

export async function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);

  /**
   * Antwort mit weitergereichten Request-Headern (x-nonce + CSP, damit Next
   * den Nonce fuer seine Inline-Skripte kennt). Wird nach Cookie-Aenderungen
   * erneut aufgerufen, damit die aktualisierten Cookies mitlaufen.
   */
  const nextWithNonce = () => {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", csp);
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    res.headers.set("Content-Security-Policy", csp);
    return res;
  };

  let response = nextWithNonce();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        // Explizite Typannotation: Die Overloads von createServerClient liefern
        // hier keine Kontexttypisierung, daher wird der Parameter sonst "any".
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = nextWithNonce();
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // WICHTIG: getUser() validiert das JWT gegen Supabase (kein blindes
  // Vertrauen in Cookie-Inhalte) und refresht abgelaufene Sessions.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.has(pathname);

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname === "/" ? "" : `?weiter=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Alles ausser statischen Assets:
     * _next/static, _next/image, favicon, Fonts und Bilddateien.
     */
    "/((?!_next/static|_next/image|favicon.ico|fonts/|.*\\.(?:svg|png|jpg|jpeg|webp|ico|woff2?)$).*)",
  ],
};

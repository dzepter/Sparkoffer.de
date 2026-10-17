/**
 * Auth-Gate und Content-Security-Policy des Campus:
 *  - ohne Session -> /login (mit Ruecksprungziel)
 *  - mit Session auf /login -> /heute
 *  - Session-Refresh (Cookies) via @supabase/ssr
 *  - CSP mit Nonce je Request (Next.js-Empfehlung fuer den App Router):
 *    keine 'unsafe-inline'-Skripte; der Nonce wird per Request-Header x-nonce
 *    an Server-Komponenten weitergereicht und von Next fuer die eigenen
 *    Inline-Skripte aus dem CSP-Request-Header uebernommen.
 *
 * Bewusst minimal (laeuft am Vercel-Edge, global): KEINE Datenbankzugriffe,
 * keine Protokollierung personenbezogener Inhalte (REGIONS_AND_DATA_FLOWS.md).
 * Rollen-/Gruppenpruefung erfolgt serverseitig in src/lib/session.ts (fra1).
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { AUTH_COOKIE_OPTIONS } from "@/lib/supabase/cookie";

/**
 * Oeffentliche Pfade (ohne Session erreichbar). Pfade OHNE basePath:
 * request.nextUrl.pathname liefert den Pfad bereits ohne "/akademie".
 */
const PUBLIC_PATHS = new Set([
  "/login",
  "/login/passwort-vergessen",
  "/einladung",
  "/auth/callback",
  "/datenschutz",
  "/impressum",
]);

/** Erlaubte Video-Einbettungen (Blocktyp video, provider external/embed). */
const VIDEO_EMBED_HOSTS = ["https://player.vimeo.com", "https://www.youtube-nocookie.com"];

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
    `frame-src ${VIDEO_EMBED_HOSTS.join(" ")}`,
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // Lokal laeuft der Campus ueber http (localhost) – dort nicht erzwingen
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
      cookieOptions: AUTH_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
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

  // getUser() validiert das JWT gegen Supabase und refresht abgelaufene Sessions.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.has(pathname);

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname === "/" || pathname === "/heute" ? "" : `?weiter=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/heute";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Alles ausser statischen Assets
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|fonts/|.*\\.(?:svg|png|jpg|jpeg|webp|ico|woff2?)$).*)",
  ],
};

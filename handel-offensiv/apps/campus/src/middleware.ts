/**
 * Auth-Gate des Campus:
 *  - ohne Session -> /login (mit Ruecksprungziel)
 *  - mit Session auf /login -> /heute
 *  - Session-Refresh (Cookies) via @supabase/ssr
 *
 * Bewusst minimal (laeuft am Vercel-Edge, global): KEINE Datenbankzugriffe,
 * keine Protokollierung personenbezogener Inhalte (REGIONS_AND_DATA_FLOWS.md).
 * Rollen-/Gruppenpruefung erfolgt serverseitig in src/lib/session.ts (fra1).
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Oeffentliche Pfade (ohne Session erreichbar). */
const PUBLIC_PATHS = new Set([
  "/login",
  "/login/passwort-vergessen",
  "/einladung",
  "/auth/callback",
  "/datenschutz",
  "/impressum",
]);

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
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

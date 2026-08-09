/**
 * Auth-Gate:
 *  - ohne Session -> /login (mit Ruecksprungziel)
 *  - mit Session auf /login -> Cockpit
 *  - Session-Refresh (Cookies) via @supabase/ssr
 *
 * Die Rollenpruefung "reiner Teilnehmer -> /hinweis-app" erfolgt bewusst im
 * Cockpit-Layout (src/app/(cockpit)/layout.tsx): sie braucht DB-Abfragen
 * (Mitgliedschaften), die nicht bei jedem Request in der Edge-Middleware
 * laufen sollen.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = new Set(["/login", "/hinweis-app"]);

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
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
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

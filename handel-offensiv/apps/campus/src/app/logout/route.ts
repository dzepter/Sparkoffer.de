import { NextResponse, type NextRequest } from "next/server";

import { LOGIN_HINWEISE } from "@/lib/auth/hinweise";
import { COHORT_COOKIE } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Abmelden – bewusst nur als POST (kein Logout per Link-Prefetch).
 * Optionales Formularfeld `hinweis`: nur bekannte Schluessel aus
 * LOGIN_HINWEISE (z. B. "konto-gesperrt" von der Sperrseite), sonst "abgemeldet".
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  let hinweis = "abgemeldet";
  try {
    const wanted = (await request.formData()).get("hinweis");
    if (typeof wanted === "string" && wanted in LOGIN_HINWEISE) hinweis = wanted;
  } catch {
    // kein Formular-Body (z. B. leerer POST) – Standardhinweis
  }

  // request.nextUrl.clone() statt new URL("/login", …): behaelt den basePath (/akademie)
  const target = request.nextUrl.clone();
  target.pathname = "/login";
  target.search = `?hinweis=${hinweis}`;
  const response = NextResponse.redirect(target, { status: 303 });
  // Gruppenauswahl gehoert zur Person, nicht zum Geraet
  response.cookies.set(COHORT_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}

/** GET (z. B. Prefetch, Lesezeichen) meldet NICHT ab, sondern fuehrt zurueck in den Campus. */
export async function GET(request: NextRequest) {
  const target = request.nextUrl.clone();
  target.pathname = "/heute";
  target.search = "";
  return NextResponse.redirect(target, { status: 303 });
}

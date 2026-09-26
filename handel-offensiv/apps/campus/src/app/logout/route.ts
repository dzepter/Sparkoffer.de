import { NextResponse } from "next/server";

import { LOGIN_HINWEISE } from "@/lib/auth/hinweise";
import { COHORT_COOKIE } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Abmelden – bewusst nur als POST (kein Logout per Link-Prefetch).
 * Optionales Formularfeld `hinweis`: nur bekannte Schluessel aus
 * LOGIN_HINWEISE (z. B. "konto-gesperrt" von der Sperrseite), sonst "abgemeldet".
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  let hinweis = "abgemeldet";
  try {
    const wanted = (await request.formData()).get("hinweis");
    if (typeof wanted === "string" && wanted in LOGIN_HINWEISE) hinweis = wanted;
  } catch {
    // kein Formular-Body (z. B. leerer POST) – Standardhinweis
  }

  const response = NextResponse.redirect(new URL(`/login?hinweis=${hinweis}`, request.url), { status: 303 });
  // Gruppenauswahl gehoert zur Person, nicht zum Geraet
  response.cookies.set(COHORT_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}

/** GET (z. B. Prefetch, Lesezeichen) meldet NICHT ab, sondern fuehrt zurueck in den Campus. */
export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/heute", request.url), { status: 303 });
}

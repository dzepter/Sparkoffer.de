/**
 * Auth-Callback (PKCE): tauscht den Code aus Supabase-Auth-Mails
 * (Passwort-Reset, spaeter ggf. E-Mail-Aenderung) gegen eine Session und
 * leitet auf das Ziel weiter (Default: /passwort-neu).
 *
 * SICHERHEIT: "weiter" darf nur ein relativer Pfad sein (kein Open Redirect).
 * Ungueltige/abgelaufene Codes fuehren zur Login-Seite mit neutralem Hinweis.
 */

import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_TARGETS = new Set(["/passwort-neu", "/"]);

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const weiter = url.searchParams.get("weiter") ?? "/passwort-neu";
  const target = ALLOWED_TARGETS.has(weiter) ? weiter : "/passwort-neu";

  const fallback = url.clone();
  fallback.pathname = "/login";
  fallback.search = "?hinweis=link-ungueltig";

  if (!code) return NextResponse.redirect(fallback);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(fallback);

  const next = url.clone();
  next.pathname = target;
  next.search = "";
  return NextResponse.redirect(next);
}

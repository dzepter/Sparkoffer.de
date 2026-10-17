import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Abmelden – bewusst nur als POST (kein Logout per Link-Prefetch). */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  // request.nextUrl.clone() statt new URL("/login", …): behaelt den basePath (/admin)
  const target = request.nextUrl.clone();
  target.pathname = "/login";
  target.search = "";
  return NextResponse.redirect(target, { status: 303 });
}

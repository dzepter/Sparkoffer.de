/**
 * ICS-Download eines Praesenztermins: GET /termine/[sessionId]/kalender.ics
 *
 * Laeuft im NUTZER-Kontext (anon key + Session-Cookie) – RLS entscheidet,
 * ob der Termin sichtbar ist. Kein Service-Role-Zugriff. Antworten sind
 * deutsch und ohne technische Codes.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { buildSessionIcs, icsFileName, type SessionIcsInput } from "@/features/termine/ics";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type IcsRow = Omit<SessionIcsInput, "cohortName"> & { cohorts: { name: string } | null };

function plain(message: string, status: number): NextResponse {
  return new NextResponse(message, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}

export async function GET(request: Request, context: { params: Promise<{ sessionId: string }> }): Promise<Response> {
  const { sessionId } = await context.params;
  if (!z.string().uuid().safeParse(sessionId).success) {
    return plain("Der angeforderte Termin wurde nicht gefunden.", 404);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const { data, error } = await supabase
    .from("cohort_sessions")
    .select("id, title, starts_at, ends_at, venue, address, room, notes, directions, updated_at, cohorts(name)")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) return plain("Der Termin konnte gerade nicht geladen werden. Bitte versuchen Sie es erneut.", 500);
  // RLS-verborgene Termine landen ebenfalls hier – bewusst dieselbe Meldung
  if (!data) return plain("Der angeforderte Termin wurde nicht gefunden.", 404);

  const row = data as unknown as IcsRow;
  const ics = buildSessionIcs({ ...row, cohortName: row.cohorts?.name ?? null });

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${icsFileName(row.title)}"`,
      "Cache-Control": "no-store",
    },
  });
}

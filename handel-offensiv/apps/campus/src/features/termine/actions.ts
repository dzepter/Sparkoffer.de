"use server";

/**
 * Server Actions TERMINE: persoenliche Notiz zum Praesenztag.
 *
 * Regeln: Sitzung pruefen, Eingaben mit zod validieren, Schreiben NUR ueber
 * den Client der Nutzersitzung (RLS session_notes_own: nur eigene Zeile,
 * Termin muss fuer die Person sichtbar sein). Fehlermeldungen deutsch.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { fieldErrorsFromZod, formString, type FormState } from "@/lib/auth/form-state";
import { ERROR_MESSAGES, mapSupabaseError } from "@/lib/errors";
import { requireCampusSession } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Gleicher Wert wie maxLength im Formular (session-note-form.tsx). */
const SESSION_NOTE_MAX_LENGTH = 5000;

const sessionNoteSchema = z.object({
  sessionId: z.string().uuid(),
  note: z.string().max(SESSION_NOTE_MAX_LENGTH, `Maximal ${SESSION_NOTE_MAX_LENGTH} Zeichen.`),
});

/** Notiz speichern (Upsert auf profile_id/session_id). Leere Notiz = Zeile entfernen. */
export async function saveSessionNoteAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireCampusSession();
  const parsed = sessionNoteSchema.safeParse({
    sessionId: formString(formData, "sessionId"),
    note: formString(formData, "note"),
  });
  if (!parsed.success) {
    return { error: ERROR_MESSAGES.invalidInput, fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const supabase = await createSupabaseServerClient();
  const note = parsed.data.note.replace(/\r\n/g, "\n").trimEnd();

  if (note.trim().length === 0) {
    const { error } = await supabase
      .from("session_notes")
      .delete()
      .eq("profile_id", session.userId)
      .eq("session_id", parsed.data.sessionId);
    if (error) return { error: mapSupabaseError(error, ERROR_MESSAGES.save) };
    revalidatePath(`/termine/${parsed.data.sessionId}`);
    return { error: null, success: "Ihre Notiz wurde entfernt." };
  }

  const { error } = await supabase
    .from("session_notes")
    .upsert({ profile_id: session.userId, session_id: parsed.data.sessionId, note_md: note }, { onConflict: "profile_id,session_id" });
  if (error) {
    // with check schlaegt fehl, wenn der Termin fuer die Person nicht sichtbar ist
    if (error.code === "42501") return { error: ERROR_MESSAGES.notFound };
    return { error: mapSupabaseError(error, ERROR_MESSAGES.save) };
  }

  revalidatePath(`/termine/${parsed.data.sessionId}`);
  return { error: null, success: "Ihre Notiz wurde gespeichert." };
}

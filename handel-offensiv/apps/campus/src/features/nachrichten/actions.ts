"use server";

/**
 * Server Actions NACHRICHTEN: Benachrichtigungen als gelesen markieren.
 * Schreiben NUR ueber den Client der Nutzersitzung (RLS
 * notifications_update_own: ausschliesslich eigene Zeilen).
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { formString, type FormState } from "@/lib/auth/form-state";
import { ERROR_MESSAGES, mapSupabaseError } from "@/lib/errors";
import { requireCampusSession } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const markReadSchema = z.object({ notificationId: z.string().uuid() });

function revalidate(): void {
  revalidatePath("/nachrichten");
  revalidatePath("/heute");
}

/** Eine Benachrichtigung als gelesen markieren (idempotent). */
export async function markNotificationReadAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireCampusSession();
  const parsed = markReadSchema.safeParse({ notificationId: formString(formData, "notificationId") });
  if (!parsed.success) return { error: ERROR_MESSAGES.invalidInput };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", parsed.data.notificationId)
    .eq("profile_id", session.userId)
    .is("read_at", null);
  if (error) return { error: mapSupabaseError(error, ERROR_MESSAGES.save) };

  revalidate();
  return { error: null, success: null };
}

/** Alle eigenen ungelesenen Benachrichtigungen als gelesen markieren. */
export async function markAllNotificationsReadAction(_prev: FormState, _formData: FormData): Promise<FormState> {
  const session = await requireCampusSession();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("profile_id", session.userId)
    .is("read_at", null);
  if (error) return { error: mapSupabaseError(error, ERROR_MESSAGES.save) };

  revalidate();
  return { error: null, success: "Alle Nachrichten sind als gelesen markiert." };
}

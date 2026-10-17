"use server";

/**
 * Server Actions – Bereich NACHRICHTEN (Ankuendigungen, §19).
 *
 * Regel wie ueberall: 1. Akteur aufloesen, 2. can(actor, 'notifications.send')
 * im Cohort-/Organisations-Scope pruefen, 3. Operation ueber Service Role,
 * 4. Audit-Log. Push ist OPTIONAL und wird nach dem Speichern ueber die
 * Edge Function send-push (Ziel: cohort) ausgeloest – ein Fehlschlag des
 * Push macht die gespeicherte Ankuendigung NICHT kaputt.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { can } from "@handel-offensiv/domain";

import { writeAuditLog } from "@/lib/audit";
import { getActorContext, type SessionActor } from "@/lib/auth";
import { callEdgeFunctionAsUser } from "@/lib/edge-functions";
import { ERROR_MESSAGES, mapSupabaseError } from "@/lib/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface AnnouncementFormState {
  error: string | null;
  fieldErrors?: Record<string, string>;
}

/**
 * Ankuendigung (announcements): Titel + Text + Zielgruppe.
 * (Kein Schema im validation-Paket vorhanden – daher lokal definiert.)
 */
const announcementSchema = z.object({
  cohortId: z.string().uuid(),
  title: z.string().trim().min(1, "Titel erforderlich").max(160, "Maximal 160 Zeichen"),
  body: z.string().trim().min(1, "Text erforderlich").max(4000, "Maximal 4000 Zeichen"),
  sendPush: z.boolean(),
});

/**
 * Darf der Akteur an diese Cohort senden? Trainer: nur eigene Gruppen
 * (Cohort-Scope); Org-Admins mit permissions-Override: ueber den
 * Organisations-Scope der Cohort; Super Admin: immer.
 */
function canSendToCohort(
  session: SessionActor,
  cohortId: string,
  organizationId: string,
): boolean {
  return (
    can(session.actor, "notifications.send", { cohortId }) ||
    can(session.actor, "notifications.send", { organizationId })
  );
}

/**
 * Push-Versand ueber die Edge Function send-push – mit dem JWT der
 * angemeldeten Person (die Function prueft notifications.send selbst).
 * Vertrag: { cohortId, title, body, deepLink?, kind }.
 * Rueckgabe: Fehlertext oder null.
 */
async function callSendPush(payload: {
  cohortId: string;
  title: string;
  body: string;
  kind: "announcement";
  deepLink: string;
}): Promise<string | null> {
  const result = await callEdgeFunctionAsUser("send-push", payload);
  if (result.ok) return null;
  return "Die Ankündigung wurde gespeichert, die Push-Benachrichtigung konnte aber nicht versendet werden.";
}

export async function createAnnouncementAction(
  _prev: AnnouncementFormState,
  formData: FormData,
): Promise<AnnouncementFormState> {
  const session = await getActorContext();
  if (!session) redirect("/login");

  const parsed = announcementSchema.safeParse({
    cohortId: formData.get("cohortId"),
    title: formData.get("title"),
    body: formData.get("body"),
    sendPush: formData.get("sendPush") === "on",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
    }
    return { error: ERROR_MESSAGES.invalidInput, fieldErrors };
  }
  const input = parsed.data;

  const admin = createSupabaseAdminClient();

  // Organisation der Cohort fuer die Scope-Pruefung aufloesen
  const { data: cohort, error: cohortError } = await admin
    .from("cohorts")
    .select("id, name, organization_id")
    .eq("id", input.cohortId)
    .maybeSingle();
  if (cohortError) return { error: mapSupabaseError(cohortError, ERROR_MESSAGES.save) };
  if (!cohort) return { error: ERROR_MESSAGES.notFound };

  const cohortRow = cohort as { id: string; name: string; organization_id: string };
  if (!canSendToCohort(session, cohortRow.id, cohortRow.organization_id)) {
    return { error: ERROR_MESSAGES.forbidden };
  }

  const { data: created, error } = await admin
    .from("announcements")
    .insert({
      cohort_id: input.cohortId,
      author_profile_id: session.actor.profileId,
      title: input.title,
      body: input.body,
    })
    .select("id")
    .single();
  if (error) return { error: mapSupabaseError(error, ERROR_MESSAGES.save) };
  const announcementId = (created as { id: string }).id;

  await writeAuditLog({
    actorProfileId: session.actor.profileId,
    action: "announcements.create",
    targetType: "announcement",
    targetId: announcementId,
    metadata: { cohort_id: input.cohortId, title: input.title, push: input.sendPush },
  });

  let pushWarning: string | null = null;
  if (input.sendPush) {
    pushWarning = await callSendPush({
      cohortId: input.cohortId,
      title: input.title,
      body: input.body,
      kind: "announcement",
      deepLink: `/nachrichten/${announcementId}`,
    });
    if (pushWarning === null) {
      await writeAuditLog({
        actorProfileId: session.actor.profileId,
        action: "announcements.push",
        targetType: "announcement",
        targetId: announcementId,
        metadata: { cohort_id: input.cohortId },
      });
    }
  }

  revalidatePath("/nachrichten");
  redirect(
    `/nachrichten?gruppe=${input.cohortId}&erfolg=1${pushWarning !== null ? "&push=fehler" : ""}`,
  );
}

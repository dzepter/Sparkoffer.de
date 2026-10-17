"use server";

/**
 * Server Actions – Bereich AUSWERTUNG (§26): Trainer-Feedback zu Abgaben.
 *
 * Sichtbarkeit ist hier Vertrauenssache: Es werden AUSSCHLIESSLICH Abgaben
 * mit visibility='trainer' angefasst – private Abgaben bleiben privat, auch
 * fuer Super Admins. Jede Operation: Akteur -> can('submissions.feedback',
 * {cohortId}) -> Service Role -> Audit-Log.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { can } from "@handel-offensiv/domain";

import { writeAuditLog } from "@/lib/audit";
import { getActorContext, type SessionActor } from "@/lib/auth";
import { ERROR_MESSAGES, mapSupabaseError } from "@/lib/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface FeedbackFormState {
  error: string | null;
  done: boolean;
}

const uuid = z.string().uuid();

async function requireFeedbackRight(cohortId: string): Promise<SessionActor | null> {
  const session = await getActorContext();
  if (!session) redirect("/login");
  return can(session.actor, "submissions.feedback", { cohortId }) ? session : null;
}

/* ------------------------- Status gesehen/erledigt ---------------------- */

const statusSchema = z.object({
  submissionId: uuid,
  cohortId: uuid,
  status: z.enum(["seen", "done"]),
});

export async function markSubmissionAction(formData: FormData): Promise<void> {
  const parsed = statusSchema.safeParse({
    submissionId: formData.get("submissionId"),
    cohortId: formData.get("cohortId"),
    status: formData.get("status"),
  });
  if (!parsed.success) redirect("/auswertung");
  const back = `/auswertung/${parsed.data.cohortId}?tab=abgaben`;

  const session = await requireFeedbackRight(parsed.data.cohortId);
  if (!session) redirect(`${back}&fehler=recht`);

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("assignment_submissions")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.submissionId)
    .eq("cohort_id", parsed.data.cohortId)
    .eq("visibility", "trainer");
  if (error) redirect(`${back}&fehler=1`);

  await writeAuditLog({
    actorProfileId: session.actor.profileId,
    action: "submissions.status",
    targetType: "assignment_submission",
    targetId: parsed.data.submissionId,
    metadata: { cohort_id: parsed.data.cohortId, status: parsed.data.status },
  });

  revalidatePath(`/auswertung/${parsed.data.cohortId}`);
  redirect(back);
}

/* ------------------------------ Feedback -------------------------------- */

const feedbackSchema = z.object({
  submissionId: uuid,
  cohortId: uuid,
  body: z
    .string()
    .trim()
    .min(1, "Feedback-Text erforderlich")
    .max(4000, "Maximal 4000 Zeichen"),
});

export async function giveFeedbackAction(
  _prev: FeedbackFormState,
  formData: FormData,
): Promise<FeedbackFormState> {
  const parsed = feedbackSchema.safeParse({
    submissionId: formData.get("submissionId"),
    cohortId: formData.get("cohortId"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: ERROR_MESSAGES.invalidInput, done: false };

  const session = await requireFeedbackRight(parsed.data.cohortId);
  if (!session) return { error: ERROR_MESSAGES.forbidden, done: false };

  const admin = createSupabaseAdminClient();

  // Ziel-Abgabe pruefen: gehoert zur Cohort und ist fuer Trainer sichtbar
  const { data: submission, error: subError } = await admin
    .from("assignment_submissions")
    .select("id, profile_id, cohort_id, visibility")
    .eq("id", parsed.data.submissionId)
    .eq("cohort_id", parsed.data.cohortId)
    .eq("visibility", "trainer")
    .maybeSingle();
  if (subError) return { error: mapSupabaseError(subError, ERROR_MESSAGES.save), done: false };
  if (!submission) return { error: ERROR_MESSAGES.notFound, done: false };

  const sub = submission as { id: string; profile_id: string };

  const { data: created, error } = await admin
    .from("trainer_feedback")
    .insert({
      submission_id: sub.id,
      author_profile_id: session.actor.profileId,
      recipient_profile_id: sub.profile_id,
      body: parsed.data.body,
    })
    .select("id")
    .single();
  if (error) return { error: mapSupabaseError(error, ERROR_MESSAGES.save), done: false };

  // Status nachziehen (Fehler hier ist nicht kritisch – Feedback ist gespeichert)
  await admin
    .from("assignment_submissions")
    .update({ status: "feedback_given" })
    .eq("id", sub.id)
    .eq("cohort_id", parsed.data.cohortId);

  await writeAuditLog({
    actorProfileId: session.actor.profileId,
    action: "submissions.feedback",
    targetType: "trainer_feedback",
    targetId: (created as { id: string }).id,
    metadata: { cohort_id: parsed.data.cohortId, submission_id: sub.id },
  });

  revalidatePath(`/auswertung/${parsed.data.cohortId}`);
  return { error: null, done: true };
}

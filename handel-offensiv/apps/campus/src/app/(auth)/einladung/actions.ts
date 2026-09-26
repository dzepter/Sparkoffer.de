"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { PRIVACY_POLICY_VERSION } from "@handel-offensiv/config";
import { invitationAcceptSchema } from "@handel-offensiv/validation";

import { fieldErrorsFromZod, formChecked, formString } from "@/lib/auth/form-state";
import {
  completeInvitation,
  invitationRateLimitOk,
  validateInvitation,
  type InvitationInfo,
} from "@/lib/auth/invitation";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/* ------------------------- Schritt 1: Token pruefen ------------------------ */

export interface ValidateInvitationState {
  error: string | null;
  /** Gueltiger Token (fuer Schritt 2 als verstecktes Feld) */
  token: string | null;
  invitation: InvitationInfo | null;
}

const tokenSchema = z.object({
  token: z.string().trim().min(1, "Bitte geben Sie Ihren Einladungscode ein.").max(512, "Dieser Einladungscode ist nicht gültig."),
});

/** Einladungscode gegen die Edge Function pruefen (action "validate"). */
export async function validateInvitationAction(
  _prev: ValidateInvitationState,
  formData: FormData,
): Promise<ValidateInvitationState> {
  const parsed = tokenSchema.safeParse({ token: formData.get("token") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Bitte geben Sie Ihren Einladungscode ein.", token: null, invitation: null };
  }

  if (!(await invitationRateLimitOk())) {
    return { error: ERROR_MESSAGES.rateLimited, token: null, invitation: null };
  }

  const result = await validateInvitation(parsed.data.token);
  if (!result.ok) return { error: result.error, token: null, invitation: null };
  return { error: null, token: parsed.data.token, invitation: result.invitation };
}

/* ---------------------- Schritt 2: Zugang einrichten ----------------------- */

export interface CompleteInvitationState {
  error: string | null;
  fieldErrors?: Record<string, string>;
}

/**
 * Konto anlegen (Edge Function, action "complete"), danach automatische
 * Anmeldung und Weiterleitung nach /heute?willkommen=1.
 *
 * - accountExisted: Einladung wurde mit bestehendem Konto verknuepft, das
 *   Passwort bleibt unveraendert -> Hinweis auf der Login-Seite.
 * - Scheitert nur die automatische Anmeldung, ist das Konto trotzdem
 *   angelegt -> neutraler Hinweis auf der Login-Seite.
 */
export async function completeInvitationAction(
  _prev: CompleteInvitationState,
  formData: FormData,
): Promise<CompleteInvitationState> {
  const parsed = invitationAcceptSchema.safeParse({
    token: formString(formData, "token"),
    firstName: formString(formData, "firstName"),
    lastName: formString(formData, "lastName"),
    password: formString(formData, "password"),
    passwordConfirm: formString(formData, "passwordConfirm"),
    consentPrivacy: formChecked(formData, "consentPrivacy"),
  });
  if (!parsed.success) {
    return { error: "Bitte prüfen Sie Ihre Eingaben.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  if (!(await invitationRateLimitOk())) {
    return { error: ERROR_MESSAGES.rateLimited };
  }

  const result = await completeInvitation({
    token: parsed.data.token,
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    password: parsed.data.password,
    // user_consents schreibt der Server (DSGVO-Nachweis inkl. Version)
    consentPrivacyVersion: PRIVACY_POLICY_VERSION,
  });
  if (!result.ok) return { error: result.error };

  if (result.accountExisted) {
    redirect("/login?hinweis=konto-vorhanden");
  }
  if (!result.email) {
    redirect("/login?hinweis=zugang-angelegt");
  }

  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: result.email,
    password: parsed.data.password,
  });
  if (signInError) {
    redirect("/login?hinweis=zugang-angelegt");
  }

  redirect("/heute?willkommen=1");
}

"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { passwordChangeSchema } from "@handel-offensiv/validation";

import { fieldErrorsFromZod, formChecked, formString, type FormState } from "@/lib/auth/form-state";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_KINDS,
  accountDeletionSchema,
  cohortSwitchSchema,
  preferenceFieldName,
  profileNameSchema,
} from "@/lib/auth/profile";
import { ERROR_MESSAGES, mapSupabaseError } from "@/lib/errors";
import { COHORT_COOKIE, requireCampusSession } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Alle Aktionen laufen im NUTZER-Kontext (RLS): profiles_update_self,
 * notification_preferences_own, account_deletion_requests_insert_own.
 * Kritische Profilspalten (is_super_admin, status) friert die Datenbank ein.
 */

/* ------------------------------- Stammdaten ------------------------------- */

export async function updateProfileNameAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireCampusSession();
  const parsed = profileNameSchema.safeParse({
    firstName: formString(formData, "firstName"),
    lastName: formString(formData, "lastName"),
  });
  if (!parsed.success) {
    return { error: ERROR_MESSAGES.invalidInput, fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ first_name: parsed.data.firstName, last_name: parsed.data.lastName })
    .eq("id", session.userId);
  if (error) return { error: mapSupabaseError(error, ERROR_MESSAGES.save) };

  revalidatePath("/", "layout");
  return { error: null, success: "Ihr Name wurde gespeichert." };
}

/* ----------------------------- Aktive Gruppe ------------------------------ */

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function switchCohortAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireCampusSession();
  const parsed = cohortSwitchSchema.safeParse({ cohortId: formString(formData, "cohortId") });
  if (!parsed.success) return { error: "Bitte wählen Sie eine Gruppe." };

  // Nur Gruppen, denen die Person tatsaechlich zugeordnet ist
  const cohort = session.cohorts.find((c) => c.id === parsed.data.cohortId);
  if (!cohort) return { error: "Diese Gruppe steht Ihnen nicht zur Verfügung." };

  const cookieStore = await cookies();
  cookieStore.set(COHORT_COOKIE, cohort.id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
  });

  revalidatePath("/", "layout");
  return { error: null, success: `Aktive Gruppe: ${cohort.name}` };
}

/* -------------------------------- Passwort -------------------------------- */

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireCampusSession();
  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formString(formData, "currentPassword"),
    newPassword: formString(formData, "newPassword"),
    newPasswordConfirm: formString(formData, "newPasswordConfirm"),
  });
  if (!parsed.success) {
    return { error: ERROR_MESSAGES.invalidInput, fieldErrors: fieldErrorsFromZod(parsed.error) };
  }
  if (!session.email) return { error: ERROR_MESSAGES.generic };

  const supabase = await createSupabaseServerClient();

  // Aktuelles Passwort verifizieren (Re-Authentifizierung)
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: session.email,
    password: parsed.data.currentPassword,
  });
  if (reauthError) {
    return { error: ERROR_MESSAGES.invalidInput, fieldErrors: { currentPassword: "Das aktuelle Passwort ist nicht korrekt." } };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("same password") || msg.includes("different from the old")) {
      return { error: ERROR_MESSAGES.invalidInput, fieldErrors: { newPassword: "Das neue Passwort muss sich vom aktuellen unterscheiden." } };
    }
    if (msg.includes("weak") || msg.includes("pwned") || msg.includes("easy to guess")) {
      return { error: ERROR_MESSAGES.invalidInput, fieldErrors: { newPassword: "Dieses Passwort ist zu leicht zu erraten. Bitte wählen Sie ein anderes." } };
    }
    return { error: ERROR_MESSAGES.save };
  }

  return { error: null, success: "Ihr Passwort wurde geändert." };
}

/* --------------------------- Benachrichtigungen --------------------------- */

export async function updateNotificationPreferencesAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireCampusSession();

  const rows = NOTIFICATION_KINDS.flatMap((kind) =>
    NOTIFICATION_CHANNELS.map((channel) => ({
      profile_id: session.userId,
      kind,
      channel,
      enabled: formChecked(formData, preferenceFieldName(kind, channel)),
    })),
  );

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("notification_preferences").upsert(rows, { onConflict: "profile_id,kind,channel" });
  if (error) return { error: mapSupabaseError(error, ERROR_MESSAGES.save) };

  revalidatePath("/profil");
  return { error: null, success: "Ihre Benachrichtigungseinstellungen wurden gespeichert." };
}

/* ------------------------------ Kontolöschung ----------------------------- */

export async function requestAccountDeletionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireCampusSession();
  const parsed = accountDeletionSchema.safeParse({
    reason: formString(formData, "reason"),
    confirm: formChecked(formData, "confirm"),
  });
  if (!parsed.success) {
    return { error: ERROR_MESSAGES.invalidInput, fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const supabase = await createSupabaseServerClient();

  // Kein zweiter offener Antrag
  const { data: existing } = await supabase
    .from("account_deletion_requests")
    .select("id, status")
    .eq("profile_id", session.userId)
    .not("status", "in", "(done,rejected)")
    .limit(1)
    .maybeSingle();
  if (existing) {
    revalidatePath("/profil");
    return { error: null, success: "Ihr Löschantrag liegt bereits vor." };
  }

  const reason = parsed.data.reason && parsed.data.reason.length > 0 ? parsed.data.reason : null;
  const { error } = await supabase
    .from("account_deletion_requests")
    .insert({ profile_id: session.userId, status: "requested", reason });
  if (error) return { error: mapSupabaseError(error, ERROR_MESSAGES.save) };

  revalidatePath("/profil");
  return { error: null, success: "Ihr Löschantrag ist eingegangen. Wir melden uns per E-Mail bei Ihnen." };
}

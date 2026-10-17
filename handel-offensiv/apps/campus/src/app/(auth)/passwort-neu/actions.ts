"use server";

import { redirect } from "next/navigation";

import { passwordResetSchema } from "@handel-offensiv/validation";

import { fieldErrorsFromZod, formString } from "@/lib/auth/form-state";
import { hasRecentRecoverySession } from "@/lib/auth/recovery";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface PasswordResetState {
  error: string | null;
  fieldErrors?: Record<string, string>;
}

/**
 * Neues Passwort setzen (nach Recovery-Link; Session besteht durch
 * /auth/callback). Danach werden ALLE Sitzungen der Person beendet – ein
 * eventuell kompromittiertes Geraet verliert den Zugang.
 *
 * SICHERHEIT: Nur eine Sitzung, die innerhalb der letzten 15 Minuten ueber
 * den Recovery-Link entstanden ist, darf das Passwort ohne aktuelles Passwort
 * setzen. Jede andere Sitzung (auch ein gestohlenes Cookie) wird zu /profil
 * geleitet, wo das aktuelle Passwort verlangt wird.
 */
export async function setNewPasswordAction(_prev: PasswordResetState, formData: FormData): Promise<PasswordResetState> {
  const parsed = passwordResetSchema.safeParse({
    password: formString(formData, "password"),
    passwordConfirm: formString(formData, "passwordConfirm"),
  });
  if (!parsed.success) {
    return { error: ERROR_MESSAGES.invalidInput, fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?hinweis=link-ungueltig");
  if (!(await hasRecentRecoverySession(supabase))) redirect("/profil");

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("same password") || msg.includes("different from the old")) {
      return { error: "Das neue Passwort muss sich vom bisherigen unterscheiden." };
    }
    if (msg.includes("weak") || msg.includes("pwned") || msg.includes("easy to guess")) {
      return { error: "Dieses Passwort ist zu leicht zu erraten. Bitte wählen Sie ein anderes." };
    }
    return { error: ERROR_MESSAGES.save };
  }

  // Alle anderen Sitzungen beenden, dann sauber neu anmelden lassen
  await supabase.auth.signOut({ scope: "global" });
  redirect("/login?hinweis=passwort-gesetzt");
}

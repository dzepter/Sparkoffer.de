"use server";

import { redirect } from "next/navigation";

import { loginSchema } from "@handel-offensiv/validation";

import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface LoginFormState {
  error: string | null;
}

/**
 * Anmeldung per E-Mail + Passwort.
 * SICHERHEIT: Bei Fehlversuchen bewusst EINE generische Meldung – kein
 * Hinweis darauf, ob die E-Mail-Adresse existiert (Account-Enumeration).
 */
export async function loginAction(
  _prev: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: ERROR_MESSAGES.loginFailed };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Keine Unterscheidung nach Fehlerursache nach aussen
    return { error: ERROR_MESSAGES.loginFailed };
  }

  const weiter = formData.get("weiter");
  const target =
    typeof weiter === "string" && weiter.startsWith("/") && !weiter.startsWith("//")
      ? weiter
      : "/";
  redirect(target);
}

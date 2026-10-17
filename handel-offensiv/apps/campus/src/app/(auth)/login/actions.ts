"use server";

import { redirect } from "next/navigation";

import { loginSchema, passwordResetRequestSchema } from "@handel-offensiv/validation";

import { safeRelativePath } from "@/lib/auth/redirect";
import { appBaseUrl } from "@/lib/env";
import { ERROR_MESSAGES } from "@/lib/errors";
import { RATE_LIMITS, clientIp, clientKey, takeRateLimitRule } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface LoginFormState {
  error: string | null;
}

/**
 * Anmeldung per E-Mail + Passwort (Nutzersitzung via @supabase/ssr).
 * SICHERHEIT: Bei Fehlversuchen bewusst EINE generische Meldung – kein
 * Hinweis darauf, ob die E-Mail-Adresse existiert (Account-Enumeration).
 * Weiterleitung nur auf relative Pfade (kein Open Redirect).
 */
export async function loginAction(_prev: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: ERROR_MESSAGES.loginFailed };
  }

  // Rate Limit (0008): je E-Mail-Hash 10/10 min UND je IP-Hash 30/10 min –
  // bremst Brute-Force auf ein Konto wie auch Streuversuche von einer Adresse.
  const [emailOk, ipOk] = await Promise.all([
    takeRateLimitRule(clientKey("campus:login:email", parsed.data.email), RATE_LIMITS.loginEmail),
    takeRateLimitRule(clientKey("campus:login:ip", await clientIp()), RATE_LIMITS.loginIp),
  ]);
  if (!emailOk || !ipOk) {
    return { error: ERROR_MESSAGES.rateLimited };
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

  redirect(safeRelativePath(formData.get("weiter"), "/heute"));
}

export interface PasswordResetRequestState {
  /** true = neutrale Bestaetigung anzeigen (unabhaengig davon, ob das Konto existiert) */
  done: boolean;
  error: string | null;
}

/**
 * Passwort vergessen: loest die Supabase-Recovery-Mail aus. Der Link fuehrt
 * auf /auth/callback (Code-Tausch) und weiter zu /passwort-neu.
 * SICHERHEIT: Antwort ist IMMER dieselbe – keine Aussage, ob die Adresse existiert.
 */
export async function requestPasswordResetAction(
  _prev: PasswordResetRequestState,
  formData: FormData,
): Promise<PasswordResetRequestState> {
  const parsed = passwordResetRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { done: false, error: "Bitte geben Sie eine gültige E-Mail-Adresse ein." };
  }

  // Rate Limit (0008): 5 Reset-Anfragen je E-Mail-Hash in 15 Minuten.
  const allowed = await takeRateLimitRule(
    clientKey("campus:reset:email", parsed.data.email),
    RATE_LIMITS.passwordReset,
  );
  if (!allowed) {
    return { done: false, error: ERROR_MESSAGES.rateLimited };
  }

  const supabase = await createSupabaseServerClient();
  try {
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${appBaseUrl()}/auth/callback?weiter=/passwort-neu`,
    });
  } catch {
    // Netzfehler nicht als Erfolg tarnen – hier gibt es nichts zu enumerieren.
    return { done: false, error: ERROR_MESSAGES.network };
  }
  return { done: true, error: null };
}

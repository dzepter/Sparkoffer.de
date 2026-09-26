"use server";

import { redirect } from "next/navigation";

import { loginSchema, passwordResetRequestSchema } from "@handel-offensiv/validation";

import { appBaseUrl } from "@/lib/env";
import { ERROR_MESSAGES } from "@/lib/errors";
import { RATE_LIMITS, RATE_LIMIT_MESSAGE, clientIp, clientKey, takeRateLimitRule } from "@/lib/rate-limit";
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

  // Rate Limit (0008): je E-Mail-Hash 10/10 min UND je IP-Hash 30/10 min.
  const [emailOk, ipOk] = await Promise.all([
    takeRateLimitRule(clientKey("admin:login:email", parsed.data.email), RATE_LIMITS.loginEmail),
    takeRateLimitRule(clientKey("admin:login:ip", await clientIp()), RATE_LIMITS.loginIp),
  ]);
  if (!emailOk || !ipOk) {
    return { error: RATE_LIMIT_MESSAGE };
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

export interface PasswordResetRequestState {
  /** true = neutrale Bestaetigung anzeigen (unabhaengig davon, ob das Konto existiert) */
  done: boolean;
  error: string | null;
}

/**
 * Passwort vergessen (Befund I-3): loest die Supabase-Recovery-Mail aus.
 * Der Link fuehrt auf /auth/callback (Code-Tausch) und weiter zu /passwort-neu.
 * SICHERHEIT: Antwort ist IMMER dieselbe – keine Aussage, ob die Adresse
 * existiert (Account-Enumeration). Supabase begrenzt die Versandrate.
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
    clientKey("admin:reset:email", parsed.data.email),
    RATE_LIMITS.passwordReset,
  );
  if (!allowed) {
    return { done: false, error: RATE_LIMIT_MESSAGE };
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

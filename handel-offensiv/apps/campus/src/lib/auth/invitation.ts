/**
 * Einladung annehmen – serverseitige Helfer rund um die Edge Function
 * `accept-invitation` (Token-basiert, kein Nutzer-JWT).
 *
 * Verbindlicher Contract (supabase/functions/accept-invitation/index.ts):
 *   { action: "validate", token } ->
 *     200 { ok: true, invitation: { email, organizationName, cohortName, role } }
 *   { action: "complete", token, firstName, lastName, password, consentPrivacyVersion } ->
 *     200 { ok: true, email, accountExisted, hinweis }
 *   Fehler: 4xx { ok: false, error, code?: "invalid" | "expired" | "revoked" | "accepted" }
 *
 * SICHERHEIT: Es wird nie preisgegeben, ob zu einer E-Mail-Adresse bereits ein
 * Konto besteht – ausser die Function meldet accountExisted fuer den GUELTIGEN
 * Token (die eingeladene Person kennt ihre Adresse ohnehin).
 */

import "server-only";

import { callPublicEdgeFunction } from "@/lib/edge-functions";
import { ERROR_MESSAGES } from "@/lib/errors";
import { RATE_LIMITS, clientIp, clientKey, takeRateLimitRule } from "@/lib/rate-limit";

/**
 * Campus-seitiges Rate Limit (0008): 10 Einladungs-Pruefungen/-Abschluesse je
 * IP-Hash in 15 Minuten – gilt fuer Server Actions UND den Seitenaufruf
 * /einladung?token=… (GET), damit anonyme Aufrufe die Function nicht fluten.
 */
export async function invitationRateLimitOk(): Promise<boolean> {
  return takeRateLimitRule(clientKey("campus:einladung:ip", await clientIp()), RATE_LIMITS.invitation);
}

export interface InvitationInfo {
  email: string;
  organizationName: string;
  cohortName: string | null;
  firstName: string | null;
  lastName: string | null;
}

/** Fehlercode der Edge Function -> verstaendlicher deutscher Text. */
export function invitationErrorText(code: string | null | undefined, fallback?: string | null): string {
  switch (code) {
    case "expired":
      return "Diese Einladung ist abgelaufen. Bitte wenden Sie sich an Ihre Ansprechperson, um eine neue Einladung zu erhalten.";
    case "revoked":
      return "Diese Einladung wurde zurückgezogen. Bitte wenden Sie sich an Ihre Ansprechperson.";
    case "accepted":
      return "Diese Einladung wurde bereits verwendet. Bitte melden Sie sich mit Ihren Zugangsdaten an.";
    case "invalid":
      return "Dieser Einladungscode ist nicht gültig. Bitte prüfen Sie Ihre Eingabe.";
    case "network":
      return "Die Einladung konnte gerade nicht geprüft werden. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.";
    case "rate_limited":
      return ERROR_MESSAGES.rateLimited;
    default:
      if (fallback && fallback.length > 0) return fallback;
      return "Dieser Einladungscode ist nicht gültig. Bitte prüfen Sie Ihre Eingabe.";
  }
}

function asStringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

interface ValidateResponse {
  ok: boolean;
  invitation?: Record<string, unknown>;
}

export type ValidateInvitationResult =
  | { ok: true; invitation: InvitationInfo }
  | { ok: false; error: string };

/** Token pruefen; liefert Anzeigedaten der Einladung oder eine deutsche Fehlermeldung. */
export async function validateInvitation(rawToken: string): Promise<ValidateInvitationResult> {
  const token = rawToken.trim();
  if (token.length === 0 || token.length > 512) {
    return { ok: false, error: "Bitte geben Sie Ihren Einladungscode ein." };
  }

  const res = await callPublicEdgeFunction<ValidateResponse>("accept-invitation", { action: "validate", token });
  if (res.status === 429) return { ok: false, error: ERROR_MESSAGES.rateLimited };
  if (!res.ok || !res.data?.invitation) {
    return { ok: false, error: invitationErrorText(res.code, res.error) };
  }

  const inv = res.data.invitation;
  const email = asStringOrNull(inv.email);
  const organizationName = asStringOrNull(inv.organizationName);
  if (!email || !organizationName) {
    return { ok: false, error: invitationErrorText("invalid") };
  }

  return {
    ok: true,
    invitation: {
      email,
      organizationName,
      cohortName: asStringOrNull(inv.cohortName),
      firstName: asStringOrNull(inv.firstName),
      lastName: asStringOrNull(inv.lastName),
    },
  };
}

interface CompleteResponse {
  ok: boolean;
  email?: string;
  accountExisted?: boolean;
  hinweis?: string;
}

export type CompleteInvitationResult =
  | { ok: true; email: string | null; accountExisted: boolean }
  | { ok: false; error: string };

/** Konto ueber die Edge Function anlegen (Profil, Mitgliedschaft, Einwilligung serverseitig). */
export async function completeInvitation(input: {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
  consentPrivacyVersion: string;
}): Promise<CompleteInvitationResult> {
  const res = await callPublicEdgeFunction<CompleteResponse>("accept-invitation", { action: "complete", ...input });
  if (res.status === 429) return { ok: false, error: ERROR_MESSAGES.rateLimited };
  if (!res.ok || !res.data) {
    return {
      ok: false,
      error: invitationErrorText(
        res.code,
        res.error ?? "Die Einladung konnte gerade nicht angenommen werden. Bitte versuchen Sie es erneut.",
      ),
    };
  }
  return {
    ok: true,
    email: asStringOrNull(res.data.email),
    accountExisted: res.data.accountExisted === true,
  };
}

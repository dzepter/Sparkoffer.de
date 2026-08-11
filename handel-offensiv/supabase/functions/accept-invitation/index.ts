/**
 * Edge Function: accept-invitation (oeffentlich, OHNE JWT – Deploy mit
 * --no-verify-jwt bzw. verify_jwt = false, siehe README).
 *
 * Aktionen (POST, JSON):
 *   { token, action: "validate" }
 *       -> prueft Hash + Ablauf + Status, liefert { email, organizationName, role }
 *   { token, action: "complete", password, firstName, lastName, consentPrivacyVersion }
 *       -> legt auth-User an (email_confirmed), profile, organization_membership,
 *          ggf. cohort_member/cohort_trainer + enrollment, user_consents(privacy),
 *          markiert die Einladung als accepted.
 *
 * Idempotenz/Transaktionssicherheit: Edge Functions haben keine DB-Transaktion
 * ueber PostgREST. Daher: (1) Reihenfolge so, dass jeder Schritt einzeln
 * wiederholbar ist (Upserts/ignoreDuplicates), (2) die Einladung wird erst am
 * ENDE auf accepted gesetzt – ein abgebrochener Lauf kann mit demselben Token
 * wiederholt werden, (3) wurde der auth-User in DIESEM Lauf angelegt und ein
 * Folgeschritt scheitert, wird er wieder geloescht (Aufraeumen).
 *
 * Rate-Limit streng: Der Endpunkt ist unauthentifiziert und nimmt Tokens
 * entgegen (Brute-Force-Ziel).
 */

import { z } from "npm:zod@3.23.8";
import { supabaseAdmin, type AdminClient } from "../_shared/supabaseAdmin.ts";
import { writeAudit } from "../_shared/audit.ts";
import { corsHeaders, preflightResponse } from "../_shared/cors.ts";
import { fail, json, readJsonBody, toErrorResponse } from "../_shared/errors.ts";
import { rateLimit } from "../_shared/ratelimit.ts";
import { sha256Hex } from "../_shared/tokens.ts";

const tokenSchema = z.string().trim().min(20, "Ungültiger Einladungslink.").max(200);

/** Spiegel von invitationAcceptSchema (@handel-offensiv/validation):
 *  Passwort-Mindestlaenge 10; passwordConfirm prueft der Client. */
const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("validate"), token: tokenSchema }),
  z.object({
    action: z.literal("complete"),
    token: tokenSchema,
    password: z
      .string()
      .min(10, "Das Passwort muss mindestens 10 Zeichen lang sein.")
      .max(72, "Das Passwort ist zu lang."),
    firstName: z.string().trim().min(1, "Vorname erforderlich.").max(100),
    lastName: z.string().trim().min(1, "Nachname erforderlich.").max(100),
    consentPrivacyVersion: z
      .string()
      .trim()
      .min(1, "Die Datenschutzerklärung muss akzeptiert werden.")
      .max(50),
  }),
]);

interface InvitationRow {
  id: string;
  email: string;
  organization_id: string;
  cohort_id: string | null;
  role: "org_admin" | "trainer" | "participant";
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  organizations: { name: string } | null;
}

/**
 * Laedt die Einladung ueber den Token-Hash und prueft Status + Ablauf.
 * Abgelaufene pending-Einladungen werden dabei auf expired gesetzt.
 */
async function loadValidInvitation(admin: AdminClient, token: string): Promise<InvitationRow> {
  const tokenHash = await sha256Hex(token);

  const { data, error } = await admin
    .from("invitations")
    .select(
      "id, email, organization_id, cohort_id, role, status, expires_at, organizations ( name )",
    )
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    console.error("Einladung konnte nicht geladen werden:", error);
    fail(500, "Die Einladung konnte gerade nicht geprüft werden. Bitte versuchen Sie es erneut.");
  }
  // Bewusst dieselbe Meldung fuer "nicht gefunden" – kein Orakel fuer
  // Token-Raten.
  if (!data) fail(404, "Dieser Einladungslink ist ungültig.");

  const invitation = data as unknown as InvitationRow;

  if (invitation.status === "accepted") {
    fail(409, "Diese Einladung wurde bereits angenommen. Bitte melden Sie sich an.");
  }
  if (invitation.status === "revoked") {
    fail(410, "Diese Einladung wurde zurückgezogen. Bitte wenden Sie sich an Ihre Ansprechperson.");
  }
  const expired =
    invitation.status === "expired" || new Date(invitation.expires_at).getTime() < Date.now();
  if (expired) {
    if (invitation.status === "pending") {
      await admin.from("invitations").update({ status: "expired" }).eq("id", invitation.id);
    }
    fail(410, "Diese Einladung ist abgelaufen. Bitte wenden Sie sich an Ihre Ansprechperson.");
  }

  return invitation;
}

/**
 * Sucht einen bestehenden auth-User per E-Mail ueber die GoTrue-Admin-API.
 * (supabase-js bietet kein getUserByEmail; der REST-filter-Parameter matcht
 * E-Mail/Telefon, das exakte Matching erfolgt hier zusaetzlich lokal.)
 */
async function findAuthUserByEmail(email: string): Promise<string | null> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;

  const res = await fetch(
    `${url}/auth/v1/admin/users?page=1&per_page=100&filter=${encodeURIComponent(email)}`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  if (!res.ok) {
    console.error("GoTrue-Admin-Suche fehlgeschlagen, Status", res.status);
    return null;
  }
  const parsed = (await res.json()) as { users?: Array<{ id: string; email?: string }> };
  return parsed.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req);
  if (req.method === "OPTIONS") return preflightResponse(req);

  try {
    if (req.method !== "POST") fail(405, "Diese Aktion wird nicht unterstützt.");

    const admin = supabaseAdmin();
    const body = bodySchema.parse(await readJsonBody(req));

    // ----------------------------------------------------------------------
    // validate: Vorschau fuer den Annahme-Screen
    // ----------------------------------------------------------------------
    if (body.action === "validate") {
      rateLimit(req, "accept-invitation:validate", { capacity: 10, refillPerMinute: 3 });
      const invitation = await loadValidInvitation(admin, body.token);
      return json(
        200,
        {
          email: invitation.email,
          organizationName: invitation.organizations?.name ?? "",
          role: invitation.role,
        },
        cors,
      );
    }

    // ----------------------------------------------------------------------
    // complete: Konto anlegen und Einladung abschliessen
    // ----------------------------------------------------------------------
    rateLimit(req, "accept-invitation:complete", { capacity: 5, refillPerMinute: 1 });
    const invitation = await loadValidInvitation(admin, body.token);
    const email = invitation.email.toLowerCase();

    // 1) auth-User: neu anlegen ODER Wiederaufnahme eines abgebrochenen Laufs.
    let userId = await findAuthUserByEmail(email);
    const userExistedBefore = userId !== null;
    let createdInThisRun = false;
    let accountExisted = false;

    if (!userId) {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password: body.password,
        email_confirm: true,
      });
      if (createError || !created?.user) {
        console.error("auth-User konnte nicht angelegt werden:", createError);
        fail(500, "Ihr Konto konnte nicht angelegt werden. Bitte versuchen Sie es erneut.");
      }
      userId = created.user.id;
      createdInThisRun = true;
    }

    try {
      // 2) Profil: nur anlegen, wenn es fehlt (bestehende Namen nicht
      //    ueberschreiben – z. B. bei Einladung in eine zweite Organisation).
      const { data: existingProfile, error: profileReadError } = await admin
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();
      if (profileReadError) throw profileReadError;

      if (!existingProfile) {
        const { error } = await admin.from("profiles").insert({
          id: userId,
          first_name: body.firstName,
          last_name: body.lastName,
        });
        if (error) throw error;
      } else if (userExistedBefore) {
        // Vollstaendig eingerichtetes Konto: Einladung verknuepft nur noch
        // Mitgliedschaften; das bestehende Passwort bleibt unangetastet.
        accountExisted = true;
      }

      // 3) Organisations-Mitgliedschaft (bestehende Rolle nicht veraendern).
      {
        const { error } = await admin.from("organization_memberships").upsert(
          {
            organization_id: invitation.organization_id,
            profile_id: userId,
            role: invitation.role,
          },
          { onConflict: "organization_id,profile_id", ignoreDuplicates: true },
        );
        if (error) throw error;
      }

      // 4) Cohort-Zuordnung + Einschreibung (falls die Einladung eine Gruppe traegt).
      if (invitation.cohort_id) {
        if (invitation.role === "trainer") {
          const { error } = await admin.from("cohort_trainers").upsert(
            { cohort_id: invitation.cohort_id, profile_id: userId },
            { onConflict: "cohort_id,profile_id", ignoreDuplicates: true },
          );
          if (error) throw error;
        } else {
          const { error: memberError } = await admin.from("cohort_members").upsert(
            { cohort_id: invitation.cohort_id, profile_id: userId },
            { onConflict: "cohort_id,profile_id", ignoreDuplicates: true },
          );
          if (memberError) throw memberError;

          const { error: enrollError } = await admin.from("course_enrollments").upsert(
            { profile_id: userId, cohort_id: invitation.cohort_id },
            { onConflict: "profile_id,cohort_id", ignoreDuplicates: true },
          );
          if (enrollError) throw enrollError;
        }
      }

      // 5) Datenschutz-Einwilligung (versioniert, doppelte Annahme idempotent).
      {
        const { error } = await admin.from("user_consents").upsert(
          {
            profile_id: userId,
            consent_type: "privacy",
            version: body.consentPrivacyVersion,
          },
          { onConflict: "profile_id,consent_type,version", ignoreDuplicates: true },
        );
        if (error) throw error;
      }

      // 6) Einladung abschliessen (letzter Schritt -> Wiederholbarkeit davor).
      {
        const { error } = await admin
          .from("invitations")
          .update({ status: "accepted", accepted_at: new Date().toISOString() })
          .eq("id", invitation.id)
          .eq("status", "pending");
        if (error) throw error;
      }

      await writeAudit(admin, {
        actorProfileId: userId,
        action: "invitation.accepted",
        targetType: "invitation",
        targetId: invitation.id,
        metadata: {
          organization_id: invitation.organization_id,
          cohort_id: invitation.cohort_id,
          role: invitation.role,
          account_existed: accountExisted,
        },
      });

      return json(
        200,
        {
          ok: true,
          accountExisted,
          hinweis: accountExisted
            ? "Sie besitzen bereits ein Konto. Bitte melden Sie sich mit Ihrem bestehenden Passwort an."
            : "Ihr Konto wurde angelegt. Sie können sich jetzt anmelden.",
        },
        cors,
      );
    } catch (stepError) {
      // Aufraeumen: nur einen in DIESEM Lauf erzeugten auth-User entfernen,
      // damit ein erneuter Versuch mit demselben Token sauber startet.
      console.error("accept-invitation: Schritt fehlgeschlagen:", stepError);
      if (createdInThisRun && userId) {
        const { error: cleanupError } = await admin.auth.admin.deleteUser(userId);
        if (cleanupError) {
          console.error("Aufräumen des auth-Users fehlgeschlagen:", cleanupError);
        }
      }
      fail(
        500,
        "Ihr Konto konnte nicht vollständig eingerichtet werden. Bitte versuchen Sie es erneut.",
      );
    }
  } catch (err) {
    return toErrorResponse(err, cors);
  }
});

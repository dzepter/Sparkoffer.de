/**
 * Edge Function: invite-user
 *
 * Aktionen (POST, JSON):
 *   { email, organizationId, cohortId?, role }              -> neue Einladung
 *   { action: "resend", invitationId }                      -> neues Token, alter Eintrag revoked
 *   { action: "revoke", invitationId }                      -> Einladung zurueckziehen
 *
 * Berechtigung: users.invite fuer die Ziel-Organisation (Super Admin immer).
 * Es wird KEIN auth-User angelegt – das passiert erst bei der Annahme
 * (accept-invitation). In der DB liegt nur der SHA-256-Hash des Tokens;
 * expires_at = LIMITS.invitationTtlHours (@handel-offensiv/config).
 */

import { z } from "npm:zod@3.23.8";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { requireActor, requireCan, type ActorContext } from "../_shared/auth.ts";
import { writeAudit } from "../_shared/audit.ts";
import { corsHeaders, preflightResponse } from "../_shared/cors.ts";
import { fail, json, readJsonBody, toErrorResponse } from "../_shared/errors.ts";
import { rateLimit } from "../_shared/ratelimit.ts";
import { invitationEmail, sendEmail } from "../_shared/emails.ts";
import { generateInvitationToken, sha256Hex } from "../_shared/tokens.ts";
import type { AdminClient } from "../_shared/supabaseAdmin.ts";

/** = LIMITS.invitationTtlHours aus @handel-offensiv/config (14 Tage). */
const INVITATION_TTL_HOURS = 14 * 24;

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    email: z.string().trim().toLowerCase().email("Bitte eine gültige E-Mail-Adresse angeben."),
    organizationId: z.string().uuid("Ungültige Organisations-ID."),
    cohortId: z.string().uuid("Ungültige Gruppen-ID.").optional(),
    role: z.enum(["org_admin", "trainer", "participant"], {
      errorMap: () => ({ message: "Ungültige Rolle." }),
    }),
  }),
  z.object({
    action: z.literal("resend"),
    invitationId: z.string().uuid("Ungültige Einladungs-ID."),
  }),
  z.object({
    action: z.literal("revoke"),
    invitationId: z.string().uuid("Ungültige Einladungs-ID."),
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
}

function inviteUrl(token: string): string {
  const base = (Deno.env.get("APP_BASE_URL") ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}/einladung?token=${token}`;
}

function expiresAtLabel(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "long",
    timeZone: "Europe/Berlin",
  }).format(new Date(iso));
}

async function loadOrganizationName(admin: AdminClient, organizationId: string): Promise<string> {
  const { data, error } = await admin
    .from("organizations")
    .select("id, name")
    .eq("id", organizationId)
    .maybeSingle();
  if (error) {
    console.error("Organisation konnte nicht geladen werden:", error);
    fail(500, "Die Organisation konnte nicht geladen werden. Bitte versuchen Sie es erneut.");
  }
  if (!data) fail(404, "Die angegebene Organisation wurde nicht gefunden.");
  return data.name as string;
}

/** Legt eine Einladung an, versendet die E-Mail und schreibt das Audit-Log. */
async function createInvitation(
  admin: AdminClient,
  actor: ActorContext,
  params: {
    email: string;
    organizationId: string;
    cohortId: string | null;
    role: "org_admin" | "trainer" | "participant";
    auditAction: "invitation.created" | "invitation.resent";
    resentFromId?: string;
  },
) {
  const organizationName = await loadOrganizationName(admin, params.organizationId);

  // Cohort muss zur Organisation gehoeren (verhindert Cross-Org-Zuordnung).
  if (params.cohortId) {
    const { data: cohort, error } = await admin
      .from("cohorts")
      .select("id, organization_id")
      .eq("id", params.cohortId)
      .maybeSingle();
    if (error) {
      console.error("Cohort-Pruefung fehlgeschlagen:", error);
      fail(500, "Die Gruppe konnte nicht geprüft werden. Bitte versuchen Sie es erneut.");
    }
    if (!cohort || cohort.organization_id !== params.organizationId) {
      fail(400, "Die gewählte Gruppe gehört nicht zu dieser Organisation.");
    }
  }

  // Vorherige offene Einladungen derselben Adresse in dieser Organisation
  // zurueckziehen – es gilt immer nur der neueste Link.
  const { error: revokeOldError } = await admin
    .from("invitations")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("email", params.email)
    .eq("organization_id", params.organizationId)
    .eq("status", "pending");
  if (revokeOldError) {
    console.error("Alte Einladungen konnten nicht zurückgezogen werden:", revokeOldError);
    fail(500, "Die Einladung konnte nicht erstellt werden. Bitte versuchen Sie es erneut.");
  }

  const token = generateInvitationToken();
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + INVITATION_TTL_HOURS * 3600_000).toISOString();

  const { data: created, error: insertError } = await admin
    .from("invitations")
    .insert({
      email: params.email,
      organization_id: params.organizationId,
      cohort_id: params.cohortId,
      role: params.role,
      token_hash: tokenHash,
      status: "pending",
      expires_at: expiresAt,
      invited_by: actor.profileId,
    })
    .select("id")
    .single();
  if (insertError || !created) {
    console.error("Einladung konnte nicht gespeichert werden:", insertError);
    fail(500, "Die Einladung konnte nicht erstellt werden. Bitte versuchen Sie es erneut.");
  }

  const url = inviteUrl(token);
  const template = invitationEmail({
    organizationName,
    inviteUrl: url,
    expiresAtLabel: expiresAtLabel(expiresAt),
  });
  const emailResult = await sendEmail({ to: params.email, ...template });

  await writeAudit(admin, {
    actorProfileId: actor.profileId,
    action: params.auditAction,
    targetType: "invitation",
    targetId: created.id as string,
    metadata: {
      email: params.email,
      organization_id: params.organizationId,
      cohort_id: params.cohortId,
      role: params.role,
      email_sent: emailResult.sent,
      ...(params.resentFromId ? { resent_from: params.resentFromId } : {}),
    },
  });

  // inviteUrl nur zurueckgeben, wenn kein Versand moeglich war – der
  // berechtigte Admin uebernimmt den Versand dann manuell.
  return {
    invitationId: created.id as string,
    email: params.email,
    expiresAt,
    emailSent: emailResult.sent,
    ...(emailResult.sent ? {} : { inviteUrl: url, hinweis: emailResult.reason }),
  };
}

async function loadInvitation(admin: AdminClient, invitationId: string): Promise<InvitationRow> {
  const { data, error } = await admin
    .from("invitations")
    .select("id, email, organization_id, cohort_id, role, status, expires_at")
    .eq("id", invitationId)
    .maybeSingle();
  if (error) {
    console.error("Einladung konnte nicht geladen werden:", error);
    fail(500, "Die Einladung konnte nicht geladen werden. Bitte versuchen Sie es erneut.");
  }
  if (!data) fail(404, "Die Einladung wurde nicht gefunden.");
  return data as InvitationRow;
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req);
  if (req.method === "OPTIONS") return preflightResponse(req);

  try {
    if (req.method !== "POST") fail(405, "Diese Aktion wird nicht unterstützt.");
    rateLimit(req, "invite-user", { capacity: 30, refillPerMinute: 10 });

    const admin = supabaseAdmin();
    const actor = await requireActor(req, admin);

    const raw = await readJsonBody(req);
    // Ohne explizite action ist "create" gemeint (Haupt-Endpunkt laut API).
    const withDefault =
      typeof raw === "object" && raw !== null ? { action: "create", ...raw } : raw;
    const body = bodySchema.parse(withDefault);

    if (body.action === "create") {
      requireCan(actor, "users.invite", { organizationId: body.organizationId });
      // Schutzregel: Organisations-Admins duerfen nur Trainer/Teilnehmer
      // einladen; org_admin-Einladungen bleiben Super Admins vorbehalten.
      if (body.role === "org_admin" && !actor.isSuperAdmin) {
        fail(403, "Nur Super-Admins können Organisations-Administratoren einladen.");
      }
      const result = await createInvitation(admin, actor, {
        email: body.email,
        organizationId: body.organizationId,
        cohortId: body.cohortId ?? null,
        role: body.role,
        auditAction: "invitation.created",
      });
      return json(200, result, cors);
    }

    // resend / revoke: bestehende Einladung laden, Scope aus dem Datensatz.
    const invitation = await loadInvitation(admin, body.invitationId);
    requireCan(actor, "users.invite", { organizationId: invitation.organization_id });

    if (body.action === "revoke") {
      if (invitation.status !== "pending") {
        fail(409, "Nur offene Einladungen können zurückgezogen werden.");
      }
      const { error } = await admin
        .from("invitations")
        .update({ status: "revoked", revoked_at: new Date().toISOString() })
        .eq("id", invitation.id)
        .eq("status", "pending");
      if (error) {
        console.error("Einladung konnte nicht zurückgezogen werden:", error);
        fail(500, "Die Einladung konnte nicht zurückgezogen werden. Bitte versuchen Sie es erneut.");
      }
      await writeAudit(admin, {
        actorProfileId: actor.profileId,
        action: "invitation.revoked",
        targetType: "invitation",
        targetId: invitation.id,
        metadata: { email: invitation.email, organization_id: invitation.organization_id },
      });
      return json(200, { invitationId: invitation.id, status: "revoked" }, cors);
    }

    // resend
    if (invitation.status === "accepted") {
      fail(409, "Diese Einladung wurde bereits angenommen.");
    }
    if (invitation.status === "pending") {
      const { error } = await admin
        .from("invitations")
        .update({ status: "revoked", revoked_at: new Date().toISOString() })
        .eq("id", invitation.id);
      if (error) {
        console.error("Alte Einladung konnte nicht ersetzt werden:", error);
        fail(500, "Die Einladung konnte nicht erneut versendet werden. Bitte versuchen Sie es erneut.");
      }
    }
    const result = await createInvitation(admin, actor, {
      email: invitation.email,
      organizationId: invitation.organization_id,
      cohortId: invitation.cohort_id,
      role: invitation.role,
      auditAction: "invitation.resent",
      resentFromId: invitation.id,
    });
    return json(200, result, cors);
  } catch (err) {
    return toErrorResponse(err, cors);
  }
});

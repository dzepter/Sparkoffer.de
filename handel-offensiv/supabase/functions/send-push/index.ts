/**
 * Edge Function: send-push
 *
 * POST { cohortId?, profileIds?, title, body, deepLink?, kind }
 *
 * Berechtigung: notifications.send.
 * - Super Admin: alle Zielgruppen.
 * - Trainer: ausschliesslich Mitglieder der EIGENEN Cohorts.
 * - Org-Admin (nur mit permissions-Override "notifications.send"): Mitglieder
 *   von Cohorts der eigenen Organisation(en).
 *
 * Ablauf: Zielprofile aufloesen -> notifications-Zeilen als In-App-Spiegel
 * schreiben -> aktive push_tokens laden und in Batches à 100 an Expo senden
 * (DeviceNotRegistered -> Token deaktivieren, §19) -> Audit-Log.
 */

import { z } from "npm:zod@3.23.8";
import { supabaseAdmin, type AdminClient } from "../_shared/supabaseAdmin.ts";
import { requireActor, can, type ActorContext } from "../_shared/auth.ts";
import { writeAudit } from "../_shared/audit.ts";
import { corsHeaders, preflightResponse } from "../_shared/cors.ts";
import { fail, json, readJsonBody, toErrorResponse } from "../_shared/errors.ts";
import { rateLimit } from "../_shared/ratelimit.ts";
import { sendPushToProfiles } from "../_shared/push.ts";

const bodySchema = z
  .object({
    cohortId: z.string().uuid("Ungültige Gruppen-ID.").optional(),
    profileIds: z.array(z.string().uuid()).min(1).max(500).optional(),
    title: z.string().trim().min(1, "Titel erforderlich.").max(120),
    body: z.string().trim().min(1, "Nachrichtentext erforderlich.").max(500),
    deepLink: z.string().trim().max(500).optional(),
    kind: z.enum(["release", "session_reminder", "task_due", "announcement", "feedback"], {
      errorMap: () => ({ message: "Ungültige Benachrichtigungsart." }),
    }),
  })
  .refine((v) => v.cohortId || v.profileIds, {
    message: "Bitte eine Gruppe oder mindestens einen Empfänger angeben.",
  });

/** Cohorts, an die der Akteur senden darf (null = alle, Super Admin). */
async function allowedCohortIds(admin: AdminClient, actor: ActorContext): Promise<Set<string> | null> {
  if (actor.isSuperAdmin) return null;

  const allowed = new Set<string>();

  // Trainer: eigene Cohorts (Basis-Capability der Rolle).
  for (const m of actor.memberships) {
    if (m.role === "trainer" && can(actor, "notifications.send", { organizationId: m.organizationId })) {
      for (const id of actor.trainerCohortIds) allowed.add(id);
    }
  }

  // Org-Admins mit Override: alle Cohorts ihrer Organisation(en).
  const adminOrgIds = actor.memberships
    .filter((m) => m.role === "org_admin" && can(actor, "notifications.send", { organizationId: m.organizationId }))
    .map((m) => m.organizationId);
  if (adminOrgIds.length > 0) {
    const { data, error } = await admin
      .from("cohorts")
      .select("id, organization_id")
      .in("organization_id", adminOrgIds);
    if (error) {
      console.error("Cohorts der Organisation konnten nicht geladen werden:", error);
      fail(500, "Die Empfänger konnten nicht geprüft werden. Bitte versuchen Sie es erneut.");
    }
    for (const row of data ?? []) allowed.add(row.id as string);
  }

  return allowed;
}

/** Aktive Mitglieder einer Cohort. */
async function cohortMemberIds(admin: AdminClient, cohortId: string): Promise<string[]> {
  const { data, error } = await admin
    .from("cohort_members")
    .select("profile_id")
    .eq("cohort_id", cohortId)
    .eq("status", "active");
  if (error) {
    console.error("cohort_members konnten nicht geladen werden:", error);
    fail(500, "Die Empfänger konnten nicht geladen werden. Bitte versuchen Sie es erneut.");
  }
  return (data ?? []).map((r) => r.profile_id as string);
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req);
  if (req.method === "OPTIONS") return preflightResponse(req);

  try {
    if (req.method !== "POST") fail(405, "Diese Aktion wird nicht unterstützt.");
    rateLimit(req, "send-push", { capacity: 20, refillPerMinute: 5 });

    const admin = supabaseAdmin();
    const actor = await requireActor(req, admin);
    const body = bodySchema.parse(await readJsonBody(req));

    if (!can(actor, "notifications.send")) {
      fail(403, "Sie haben keine Berechtigung, Benachrichtigungen zu versenden.");
    }

    const allowed = await allowedCohortIds(admin, actor);

    // ------------------------------------------------------------------
    // Zielprofile aufloesen + Berechtigung je Zielgruppe pruefen
    // ------------------------------------------------------------------
    const targetIds = new Set<string>();

    if (body.cohortId) {
      if (allowed !== null && !allowed.has(body.cohortId)) {
        fail(403, "Sie können nur an Ihre eigenen Gruppen senden.");
      }
      for (const id of await cohortMemberIds(admin, body.cohortId)) targetIds.add(id);
    }

    if (body.profileIds) {
      if (allowed === null) {
        for (const id of body.profileIds) targetIds.add(id);
      } else {
        // Jedes Zielprofil muss aktives Mitglied einer erlaubten Cohort sein.
        const { data, error } = await admin
          .from("cohort_members")
          .select("profile_id, cohort_id")
          .in("profile_id", body.profileIds)
          .eq("status", "active");
        if (error) {
          console.error("Empfänger-Prüfung fehlgeschlagen:", error);
          fail(500, "Die Empfänger konnten nicht geprüft werden. Bitte versuchen Sie es erneut.");
        }
        const coveredIds = new Set(
          (data ?? [])
            .filter((r) => allowed.has(r.cohort_id as string))
            .map((r) => r.profile_id as string),
        );
        const uncovered = body.profileIds.filter((id) => !coveredIds.has(id));
        if (uncovered.length > 0) {
          fail(403, "Mindestens ein Empfänger gehört nicht zu Ihren Gruppen.");
        }
        for (const id of coveredIds) targetIds.add(id);
      }
    }

    const targets = [...targetIds];
    if (targets.length === 0) {
      return json(200, { targets: 0, hinweis: "Keine aktiven Empfänger gefunden." }, cors);
    }

    // ------------------------------------------------------------------
    // In-App-Spiegel: notifications-Zeilen fuer alle Zielprofile
    // ------------------------------------------------------------------
    const { error: notifyError } = await admin.from("notifications").insert(
      targets.map((profileId) => ({
        profile_id: profileId,
        kind: body.kind,
        title: body.title,
        body: body.body,
        deep_link: body.deepLink ?? null,
      })),
    );
    if (notifyError) {
      console.error("notifications konnten nicht geschrieben werden:", notifyError);
      fail(500, "Die Benachrichtigung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.");
    }

    // ------------------------------------------------------------------
    // Push-Versand (Batches, DeviceNotRegistered-Behandlung in push.ts)
    // ------------------------------------------------------------------
    const push = await sendPushToProfiles(admin, targets, {
      title: body.title,
      body: body.body,
      deepLink: body.deepLink,
    });

    await writeAudit(admin, {
      actorProfileId: actor.profileId,
      action: "notification.sent",
      targetType: body.cohortId ? "cohort" : "profiles",
      targetId: body.cohortId,
      metadata: {
        kind: body.kind,
        title: body.title,
        targets: targets.length,
        push_tokens: push.tokens,
        push_ok: push.ok,
        push_errors: push.errors,
        tokens_disabled: push.disabled,
      },
    });

    return json(
      200,
      {
        targets: targets.length,
        pushTokens: push.tokens,
        pushOk: push.ok,
        pushErrors: push.errors,
        tokensDisabled: push.disabled,
      },
      cors,
    );
  } catch (err) {
    return toErrorResponse(err, cors);
  }
});

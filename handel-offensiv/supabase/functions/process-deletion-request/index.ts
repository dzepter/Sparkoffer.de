/**
 * Edge Function: process-deletion-request (DSGVO Art. 17)
 *
 * POST { requestId, action: "confirm" | "reject", notes? } – NUR Super Admin.
 *
 * DOKUMENTIERTER LOESCH-ABLAUF (bei action = "confirm"):
 *   0) Status requested -> processing (Beleg, dass die Verarbeitung laeuft).
 *   1) Storage: Avatar + Abgabedateien entfernen (Best Effort, Buckets
 *      konfigurierbar via STORAGE_BUCKET_AVATARS / STORAGE_BUCKET_UPLOADS).
 *   2) reflection_entries LOESCHEN (private Reflexionen = sensibelste Daten).
 *   3) assignment_submissions LOESCHEN (Texte/Dateien; trainer_feedback auf
 *      Submissions faellt per ON DELETE CASCADE mit).
 *   4) action_plans LOESCHEN (persoenliche Vorhaben; Items + Feedback per CASCADE).
 *   5) quiz_attempts ANONYMISIEREN, aber BEHALTEN: answers werden geleert
 *      (Freitexte!), Score/Bestanden bleibt fuer die aggregierte Statistik.
 *      Der Bezug laeuft ueber das anonymisierte Profil (Schritt 7).
 *   6) push_tokens + notifications LOESCHEN, invitations mit dieser E-Mail
 *      LOESCHEN (personenbezogene Adresse). user_consents BLEIBEN als
 *      Nachweis der frueheren Einwilligung (Rechenschaftspflicht Art. 5 II).
 *   7) profiles ANONYMISIEREN: Name -> "Gelöschter Benutzer", Avatar-Pfad
 *      entfernen, Status inactive. Die Profilzeile bleibt bestehen, damit
 *      anonymisierte quiz_attempts referenzierbar bleiben.
 *   8) auth-User: E-Mail/Metadaten verschleiern, Zufallspasswort, Bann,
 *      danach SOFT-Delete. KEIN harter Delete: profiles.id referenziert
 *      auth.users ON DELETE CASCADE – ein harter Delete wuerde das Profil und
 *      damit auch die anonymisierten quiz_attempts kaskadiert loeschen.
 *   9) Status -> done, processed_at; Audit-Log.
 *  10) Bestaetigungs-E-Mail an die urspruengliche Adresse (falls Provider
 *      konfiguriert; die Adresse wird dafuer VOR dem Verschleiern gemerkt).
 *
 * Der Ablauf ist idempotent: Wiederholte confirm-Aufrufe (Status processing)
 * fuehren die Schritte erneut aus, ohne Schaden anzurichten.
 */

import { z } from "npm:zod@3.23.8";
import { supabaseAdmin, type AdminClient } from "../_shared/supabaseAdmin.ts";
import { requireActor } from "../_shared/auth.ts";
import { writeAudit } from "../_shared/audit.ts";
import { corsHeaders, preflightResponse } from "../_shared/cors.ts";
import { fail, json, readJsonBody, toErrorResponse } from "../_shared/errors.ts";
import { rateLimit } from "../_shared/ratelimit.ts";
import { deletionConfirmedEmail, sendEmail } from "../_shared/emails.ts";

const bodySchema = z.object({
  requestId: z.string().uuid("Ungültige Antrags-ID."),
  action: z.enum(["confirm", "reject"], {
    errorMap: () => ({ message: "Ungültige Aktion." }),
  }),
  notes: z.string().trim().max(2000).optional(),
});

/** Best-Effort-Entfernen von Storage-Objekten (Fehler nur loggen). */
async function removeStorageObjects(
  admin: AdminClient,
  bucket: string,
  paths: string[],
): Promise<void> {
  const clean = paths.filter(Boolean);
  if (clean.length === 0) return;
  const { error } = await admin.storage.from(bucket).remove(clean);
  if (error) {
    console.error(`Storage-Objekte in "${bucket}" konnten nicht entfernt werden:`, error);
  }
}

function throwStep(step: string, error: unknown): never {
  console.error(`Löschablauf, Schritt "${step}" fehlgeschlagen:`, error);
  fail(500, "Die Löschung konnte nicht vollständig durchgeführt werden. Bitte versuchen Sie es erneut.");
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req);
  if (req.method === "OPTIONS") return preflightResponse(req);

  try {
    if (req.method !== "POST") fail(405, "Diese Aktion wird nicht unterstützt.");
    rateLimit(req, "process-deletion-request", { capacity: 10, refillPerMinute: 5 });

    const admin = supabaseAdmin();
    const actor = await requireActor(req, admin);
    if (!actor.isSuperAdmin) {
      fail(403, "Nur Super-Admins können Löschanträge bearbeiten.");
    }

    const body = bodySchema.parse(await readJsonBody(req));

    const { data: request, error: loadError } = await admin
      .from("account_deletion_requests")
      .select("id, profile_id, status")
      .eq("id", body.requestId)
      .maybeSingle();
    if (loadError) {
      console.error("Löschantrag konnte nicht geladen werden:", loadError);
      fail(500, "Der Löschantrag konnte nicht geladen werden. Bitte versuchen Sie es erneut.");
    }
    if (!request) fail(404, "Der Löschantrag wurde nicht gefunden.");

    const profileId = request.profile_id as string;

    // ------------------------------------------------------------------
    // reject
    // ------------------------------------------------------------------
    if (body.action === "reject") {
      if (request.status !== "requested") {
        fail(409, "Nur offene Löschanträge können abgelehnt werden.");
      }
      const { error } = await admin
        .from("account_deletion_requests")
        .update({
          status: "rejected",
          processed_at: new Date().toISOString(),
          notes: body.notes ?? null,
        })
        .eq("id", request.id);
      if (error) throwStep("reject", error);

      await writeAudit(admin, {
        actorProfileId: actor.profileId,
        action: "account_deletion.rejected",
        targetType: "account_deletion_request",
        targetId: request.id,
        metadata: { profile_id: profileId },
      });
      return json(200, { requestId: request.id, status: "rejected" }, cors);
    }

    // ------------------------------------------------------------------
    // confirm
    // ------------------------------------------------------------------
    if (!["requested", "confirmed", "processing"].includes(request.status as string)) {
      fail(409, "Dieser Löschantrag wurde bereits abschließend bearbeitet.");
    }

    // 0) Status -> processing
    {
      const { error } = await admin
        .from("account_deletion_requests")
        .update({ status: "processing", notes: body.notes ?? null })
        .eq("id", request.id);
      if (error) throwStep("status processing", error);
    }

    // Urspruengliche E-Mail + Avatar-Pfad VOR dem Anonymisieren sichern.
    const { data: authUser } = await admin.auth.admin.getUserById(profileId);
    const originalEmail = authUser?.user?.email ?? null;

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, avatar_path")
      .eq("id", profileId)
      .maybeSingle();
    if (profileError) throwStep("Profil laden", profileError);
    if (!profile) fail(404, "Das zugehörige Profil wurde nicht gefunden.");

    // 1) Storage: Avatar + Abgabedateien
    if (profile.avatar_path) {
      await removeStorageObjects(
        admin,
        Deno.env.get("STORAGE_BUCKET_AVATARS") ?? "avatars",
        [profile.avatar_path as string],
      );
    }
    {
      const { data: submissions, error } = await admin
        .from("assignment_submissions")
        .select("file_path")
        .eq("profile_id", profileId)
        .not("file_path", "is", null);
      if (error) throwStep("Abgabedateien ermitteln", error);
      await removeStorageObjects(
        admin,
        Deno.env.get("STORAGE_BUCKET_UPLOADS") ?? "uploads",
        (submissions ?? []).map((s) => s.file_path as string),
      );
    }

    // 2) reflection_entries loeschen
    {
      const { error } = await admin.from("reflection_entries").delete().eq("profile_id", profileId);
      if (error) throwStep("reflection_entries löschen", error);
    }

    // 3) assignment_submissions loeschen (Feedback kaskadiert)
    {
      const { error } = await admin
        .from("assignment_submissions")
        .delete()
        .eq("profile_id", profileId);
      if (error) throwStep("assignment_submissions löschen", error);
    }

    // 4) action_plans loeschen (Items + Feedback kaskadieren)
    {
      const { error } = await admin.from("action_plans").delete().eq("profile_id", profileId);
      if (error) throwStep("action_plans löschen", error);
    }

    // 5) quiz_attempts anonymisieren, behalten (answers enthalten Freitexte)
    {
      const { error } = await admin
        .from("quiz_attempts")
        .update({ answers: {} })
        .eq("profile_id", profileId);
      if (error) throwStep("quiz_attempts anonymisieren", error);
    }

    // 6) push_tokens, notifications, invitations (E-Mail-Bezug)
    {
      const { error } = await admin.from("push_tokens").delete().eq("profile_id", profileId);
      if (error) throwStep("push_tokens löschen", error);
    }
    {
      const { error } = await admin.from("notifications").delete().eq("profile_id", profileId);
      if (error) throwStep("notifications löschen", error);
    }
    if (originalEmail) {
      const { error } = await admin.from("invitations").delete().eq("email", originalEmail);
      if (error) throwStep("invitations löschen", error);
    }

    // 7) Profil anonymisieren (Zeile bleibt fuer anonymisierte quiz_attempts)
    {
      const { error } = await admin
        .from("profiles")
        .update({
          first_name: "Gelöschter",
          last_name: "Benutzer",
          avatar_path: null,
          status: "inactive",
        })
        .eq("id", profileId);
      if (error) throwStep("Profil anonymisieren", error);
    }

    // 8) auth-User verschleiern + Soft-Delete (Begruendung siehe Kopfkommentar)
    if (authUser?.user) {
      const scrambledPassword = crypto.randomUUID() + crypto.randomUUID();
      const { error: updateError } = await admin.auth.admin.updateUserById(profileId, {
        email: `geloescht-${profileId}@anonymisiert.invalid`,
        password: scrambledPassword,
        user_metadata: {},
        ban_duration: "876000h", // ~100 Jahre
      });
      if (updateError) throwStep("auth-User verschleiern", updateError);

      const { error: deleteError } = await admin.auth.admin.deleteUser(profileId, true /* soft */);
      if (deleteError) throwStep("auth-User soft-löschen", deleteError);
    }

    // 9) Antrag abschliessen
    {
      const { error } = await admin
        .from("account_deletion_requests")
        .update({ status: "done", processed_at: new Date().toISOString() })
        .eq("id", request.id);
      if (error) throwStep("status done", error);
    }

    await writeAudit(admin, {
      actorProfileId: actor.profileId,
      action: "account_deletion.completed",
      targetType: "account_deletion_request",
      targetId: request.id,
      // Bewusst OHNE E-Mail/Namen – das Audit-Log soll keine personenbezogenen
      // Daten der geloeschten Person konservieren.
      metadata: { profile_id: profileId },
    });

    // 10) Bestaetigung an die urspruengliche Adresse (Best Effort)
    let confirmationEmailSent = false;
    if (originalEmail) {
      const template = deletionConfirmedEmail();
      confirmationEmailSent = (await sendEmail({ to: originalEmail, ...template })).sent;
    }

    return json(
      200,
      { requestId: request.id, status: "done", confirmationEmailSent },
      cors,
    );
  } catch (err) {
    return toErrorResponse(err, cors);
  }
});

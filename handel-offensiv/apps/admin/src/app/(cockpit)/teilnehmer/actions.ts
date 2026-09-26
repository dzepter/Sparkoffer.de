"use server";

/**
 * Server Actions – Bereich TEILNEHMER (§22/§23).
 *
 * Regeln:
 *  - KEIN Hard-Delete: deaktivieren/reaktivieren statt loeschen (§23).
 *  - Einladungen laufen ueber die Edge Function POST /functions/v1/invite-user
 *    (legt die Einladung an, hasht das Token und versendet die E-Mail). Der
 *    Aufruf erfolgt serverseitig MIT DEM JWT DER ANGEMELDETEN PERSON
 *    (lib/edge-functions.ts) – die Function prueft die Berechtigung selbst.
 *    Der Service-Role-Key wird dafuer NICHT verwendet (Befund I-1/S-14).
 *  - Jede Aenderung an Mitgliedschaften ist an die Organisation gebunden, fuer
 *    die die Berechtigung geprueft wurde (Befund S-2: keine IDOR ueber IDs).
 *  - Jede Operation: getActorContext() -> can() -> Ausfuehrung -> Audit-Log.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { can } from "@handel-offensiv/domain";
import { csvParticipantRowSchema, invitationCreateSchema } from "@handel-offensiv/validation";

import { writeAuditLog } from "@/lib/audit";
import { getActorContext } from "@/lib/auth";
import { callEdgeFunctionAsUser } from "@/lib/edge-functions";
import { ERROR_MESSAGES, mapSupabaseError } from "@/lib/errors";
import { RATE_LIMITS, RATE_LIMIT_MESSAGE, clientKey, takeRateLimitRule } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { loadAuthUserMap } from "./auth-users";
import { parseParticipantCsv } from "./csv";

const uuid = z.string().uuid();

function optional(fd: FormData, name: string): string | undefined {
  const v = fd.get(name);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

function firstFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

/* ------------------------- Edge Function Aufruf ------------------------- */

/**
 * Vertrag der Edge Function invite-user (supabase/functions/invite-user):
 *   { action: "create", email, organizationId, cohortId?, role }
 *   { action: "resend", invitationId }
 *   { action: "revoke", invitationId }
 */
type InvitePayload =
  | {
      action: "create";
      email: string;
      organizationId: string;
      cohortId?: string;
      role: "org_admin" | "trainer" | "participant";
    }
  | { action: "resend"; invitationId: string }
  | { action: "revoke"; invitationId: string };

/**
 * Ruft die Edge Function invite-user mit dem JWT der angemeldeten Person auf.
 * Rueckgabe: null bei Erfolg, sonst deutsche Fehlermeldung.
 */
async function callInviteFunction(payload: InvitePayload): Promise<string | null> {
  const result = await callEdgeFunctionAsUser("invite-user", payload);
  if (result.ok) return null;
  if (result.status === 0) return ERROR_MESSAGES.network;
  if (result.status === 401) return ERROR_MESSAGES.sessionExpired;
  if (result.status === 403) return ERROR_MESSAGES.forbidden;
  if (result.status === 409) {
    return result.error ?? "Für diese E-Mail-Adresse besteht bereits eine Einladung oder ein Konto.";
  }
  return result.error ?? "Die Einladung konnte nicht versendet werden. Bitte versuchen Sie es erneut.";
}

/**
 * Rate Limit (0008): 60 Einladungs-Aktionen je Akteur pro Stunde – Schluessel
 * ist ein Hash der Profil-ID (kein Klartext in der Datenbank).
 */
function inviteRateLimitOk(profileId: string): Promise<boolean> {
  return takeRateLimitRule(clientKey("admin:invite:actor", profileId), RATE_LIMITS.invite);
}

/* ------------------------------ Einladen ------------------------------- */

export interface InviteFormState {
  error: string | null;
  fieldErrors?: Record<string, string>;
}

export async function inviteAction(
  _prev: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  const session = await getActorContext();
  if (!session) redirect("/login");

  const parsed = invitationCreateSchema.safeParse({
    email: formData.get("email"),
    organizationId: formData.get("organizationId"),
    cohortId: optional(formData, "cohortId"),
    role: formData.get("role") ?? "participant",
  });
  if (!parsed.success) {
    return { error: ERROR_MESSAGES.invalidInput, fieldErrors: firstFieldErrors(parsed.error) };
  }

  const input = parsed.data;
  if (!can(session.actor, "users.invite", { organizationId: input.organizationId })) {
    return { error: ERROR_MESSAGES.forbidden };
  }
  // Rollen oberhalb participant darf nur der Super Admin vergeben
  if (input.role !== "participant" && !session.actor.isSuperAdmin) {
    return { error: ERROR_MESSAGES.forbidden };
  }
  if (!(await inviteRateLimitOk(session.actor.profileId))) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  const failure = await callInviteFunction({
    action: "create",
    email: input.email,
    organizationId: input.organizationId,
    ...(input.cohortId !== undefined ? { cohortId: input.cohortId } : {}),
    role: input.role,
  });
  if (failure !== null) return { error: failure };

  await writeAuditLog({
    actorProfileId: session.actor.profileId,
    action: "invitations.create",
    targetType: "invitation",
    metadata: { email: input.email, organization_id: input.organizationId, role: input.role },
  });

  revalidatePath("/teilnehmer");
  redirect("/teilnehmer?ok=eingeladen");
}

/* ------------------- Einladung erneut senden/zurueckziehen -------------- */

const invitationIdSchema = z.object({ invitationId: uuid });

export async function resendInvitationAction(formData: FormData): Promise<void> {
  const session = await getActorContext();
  if (!session) redirect("/login");

  const parsed = invitationIdSchema.safeParse({ invitationId: formData.get("invitationId") });
  if (!parsed.success) redirect("/teilnehmer?fehler=1");

  const admin = createSupabaseAdminClient();
  const { data: invitation } = await admin
    .from("invitations")
    .select("id, email, organization_id, status")
    .eq("id", parsed.data.invitationId)
    .maybeSingle();
  const inv = invitation as { id: string; email: string; organization_id: string; status: string } | null;
  if (!inv) redirect("/teilnehmer?fehler=1");

  if (!can(session.actor, "users.invite", { organizationId: inv.organization_id })) {
    redirect("/teilnehmer?fehler=recht");
  }
  if (!(await inviteRateLimitOk(session.actor.profileId))) {
    redirect("/teilnehmer?fehler=limit");
  }

  const failure = await callInviteFunction({ action: "resend", invitationId: inv.id });
  if (failure !== null) redirect("/teilnehmer?fehler=einladung");

  await writeAuditLog({
    actorProfileId: session.actor.profileId,
    action: "invitations.resend",
    targetType: "invitation",
    targetId: inv.id,
    metadata: { email: inv.email },
  });

  revalidatePath("/teilnehmer");
  redirect("/teilnehmer?ok=gesendet");
}

export async function revokeInvitationAction(formData: FormData): Promise<void> {
  const session = await getActorContext();
  if (!session) redirect("/login");

  const parsed = invitationIdSchema.safeParse({ invitationId: formData.get("invitationId") });
  if (!parsed.success) redirect("/teilnehmer?fehler=1");

  const admin = createSupabaseAdminClient();
  const { data: invitation } = await admin
    .from("invitations")
    .select("id, email, organization_id, status")
    .eq("id", parsed.data.invitationId)
    .maybeSingle();
  const inv = invitation as { id: string; email: string; organization_id: string; status: string } | null;
  if (!inv || inv.status !== "pending") redirect("/teilnehmer?fehler=1");

  if (!can(session.actor, "users.invite", { organizationId: inv.organization_id })) {
    redirect("/teilnehmer?fehler=recht");
  }

  const { error } = await admin
    .from("invitations")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("id", inv.id)
    .eq("status", "pending");
  if (error) redirect("/teilnehmer?fehler=1");

  await writeAuditLog({
    actorProfileId: session.actor.profileId,
    action: "invitations.revoke",
    targetType: "invitation",
    targetId: inv.id,
    metadata: { email: inv.email },
  });

  revalidatePath("/teilnehmer");
  redirect("/teilnehmer?ok=zurueckgezogen");
}

/* ----------------------------- Gruppe aendern --------------------------- */

export interface RowActionState {
  error: string | null;
  done: boolean;
}

const changeCohortSchema = z.object({
  profileId: uuid,
  organizationId: uuid,
  /** leer = aus allen Gruppen der Organisation entfernen */
  cohortId: uuid.optional(),
});

export async function changeCohortAction(
  _prev: RowActionState,
  formData: FormData,
): Promise<RowActionState> {
  const session = await getActorContext();
  if (!session) redirect("/login");

  const parsed = changeCohortSchema.safeParse({
    profileId: formData.get("profileId"),
    organizationId: formData.get("organizationId"),
    cohortId: optional(formData, "cohortId"),
  });
  if (!parsed.success) return { error: ERROR_MESSAGES.invalidInput, done: false };
  const v = parsed.data;

  if (!can(session.actor, "users.manage", { organizationId: v.organizationId })) {
    return { error: ERROR_MESSAGES.forbidden, done: false };
  }

  const admin = createSupabaseAdminClient();

  // Mandantenbindung (S-2): Die Person MUSS Mitglied der Organisation sein,
  // fuer die die Berechtigung geprueft wurde – sonst koennte ein Org-Admin
  // beliebige Profil-IDs in seine Gruppen ziehen.
  const { data: membership, error: membershipError } = await admin
    .from("organization_memberships")
    .select("id")
    .eq("organization_id", v.organizationId)
    .eq("profile_id", v.profileId)
    .maybeSingle();
  if (membershipError) return { error: mapSupabaseError(membershipError, ERROR_MESSAGES.save), done: false };
  if (!membership) return { error: ERROR_MESSAGES.notFound, done: false };

  // Alle Gruppen DIESER Organisation; die Zielgruppe muss dazugehoeren.
  const { data: orgCohorts, error: cohortsError } = await admin
    .from("cohorts")
    .select("id")
    .eq("organization_id", v.organizationId);
  if (cohortsError) return { error: mapSupabaseError(cohortsError, ERROR_MESSAGES.save), done: false };

  const cohortIds = ((orgCohorts ?? []) as Array<{ id: string }>).map((c) => c.id);
  if (v.cohortId !== undefined && !cohortIds.includes(v.cohortId)) {
    return { error: ERROR_MESSAGES.notFound, done: false };
  }

  // Bisherige Gruppen-Zugehoerigkeiten und Einschreibungen innerhalb DIESER
  // Organisation abloesen
  if (cohortIds.length > 0) {
    const { error: membersError } = await admin
      .from("cohort_members")
      .delete()
      .eq("profile_id", v.profileId)
      .in("cohort_id", cohortIds);
    if (membersError) return { error: mapSupabaseError(membersError, ERROR_MESSAGES.save), done: false };

    const { error: enrollmentsError } = await admin
      .from("course_enrollments")
      .delete()
      .eq("profile_id", v.profileId)
      .in("cohort_id", cohortIds);
    if (enrollmentsError) return { error: mapSupabaseError(enrollmentsError, ERROR_MESSAGES.save), done: false };
  }

  if (v.cohortId !== undefined) {
    // Zuordnung UND Einschreibung – beides ist fuer die Freischaltung noetig
    // (app.lesson_is_released prueft cohort_members + course_enrollments).
    const { error: memberError } = await admin
      .from("cohort_members")
      .upsert(
        { cohort_id: v.cohortId, profile_id: v.profileId, status: "active" },
        { onConflict: "cohort_id,profile_id" },
      );
    if (memberError) return { error: mapSupabaseError(memberError, ERROR_MESSAGES.save), done: false };

    const { error: enrollError } = await admin
      .from("course_enrollments")
      .upsert(
        { cohort_id: v.cohortId, profile_id: v.profileId },
        { onConflict: "profile_id,cohort_id", ignoreDuplicates: true },
      );
    if (enrollError) return { error: mapSupabaseError(enrollError, ERROR_MESSAGES.save), done: false };
  }

  await writeAuditLog({
    actorProfileId: session.actor.profileId,
    organizationId: v.organizationId,
    action: "members.change_cohort",
    targetType: "profile",
    targetId: v.profileId,
    metadata: { organization_id: v.organizationId, cohort_id: v.cohortId ?? null },
  });

  revalidatePath("/teilnehmer");
  return { error: null, done: true };
}

/* ----------------------------- Rolle aendern ---------------------------- */

const changeRoleSchema = z.object({
  membershipId: uuid,
  role: z.enum(["org_admin", "trainer", "participant"]),
});

export async function changeRoleAction(
  _prev: RowActionState,
  formData: FormData,
): Promise<RowActionState> {
  const session = await getActorContext();
  if (!session) redirect("/login");

  // Rollenwechsel ist ausschliesslich dem Super Admin vorbehalten (§23)
  if (!session.actor.isSuperAdmin) return { error: ERROR_MESSAGES.forbidden, done: false };

  const parsed = changeRoleSchema.safeParse({
    membershipId: formData.get("membershipId"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: ERROR_MESSAGES.invalidInput, done: false };

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("organization_memberships")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.membershipId);
  if (error) return { error: mapSupabaseError(error, ERROR_MESSAGES.save), done: false };

  await writeAuditLog({
    actorProfileId: session.actor.profileId,
    action: "members.change_role",
    targetType: "organization_membership",
    targetId: parsed.data.membershipId,
    metadata: { role: parsed.data.role },
  });

  revalidatePath("/teilnehmer");
  return { error: null, done: true };
}

/* ----------------------- Deaktivieren/Reaktivieren ---------------------- */

const statusSchema = z.object({
  membershipId: uuid,
  organizationId: uuid,
  status: z.enum(["active", "inactive"]),
});

export async function setMembershipStatusAction(formData: FormData): Promise<void> {
  const session = await getActorContext();
  if (!session) redirect("/login");

  const parsed = statusSchema.safeParse({
    membershipId: formData.get("membershipId"),
    organizationId: formData.get("organizationId"),
    status: formData.get("status"),
  });
  if (!parsed.success) redirect("/teilnehmer?fehler=1");
  const v = parsed.data;

  if (!can(session.actor, "users.manage", { organizationId: v.organizationId })) {
    redirect("/teilnehmer?fehler=recht");
  }

  const admin = createSupabaseAdminClient();

  // Mandantenbindung (S-2): Update NUR innerhalb der geprueften Organisation.
  // Eine fremde membershipId trifft damit keine Zeile.
  const { data: updated, error } = await admin
    .from("organization_memberships")
    .update({ status: v.status })
    .eq("id", v.membershipId)
    .eq("organization_id", v.organizationId)
    .select("id, profile_id");
  if (error) redirect("/teilnehmer?fehler=1");
  const rows = (updated ?? []) as Array<{ id: string; profile_id: string }>;
  if (rows.length !== 1) redirect("/teilnehmer?fehler=1");
  const profileId = rows[0]!.profile_id;

  // Deaktivierungskaskade (S-5): Hat die Person keine aktive Mitgliedschaft
  // mehr (und ist kein Super Admin), wird das KONTO deaktiviert – RLS
  // (app.current_profile_id) sperrt dann sofort jeden Datenzugriff, GoTrue
  // sperrt neue Anmeldungen/Token-Refresh. Reaktivierung hebt beides auf.
  const cascade = await applyAccountStatusCascade(admin, profileId);

  await writeAuditLog({
    actorProfileId: session.actor.profileId,
    organizationId: v.organizationId,
    action: v.status === "inactive" ? "members.deactivate" : "members.reactivate",
    targetType: "organization_membership",
    targetId: v.membershipId,
    metadata: { status: v.status, profile_id: profileId, account_status: cascade },
  });

  revalidatePath("/teilnehmer");
  redirect("/teilnehmer");
}

/**
 * Setzt profiles.status und die GoTrue-Sperre passend zum Mitgliedschafts-
 * bestand: keine aktive Mitgliedschaft und kein Super Admin -> Konto inaktiv
 * + gesperrt; sonst Konto aktiv + entsperrt. Liefert den resultierenden Status.
 */
async function applyAccountStatusCascade(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  profileId: string,
): Promise<"active" | "inactive"> {
  const [{ data: profile }, { count }] = await Promise.all([
    admin.from("profiles").select("id, is_super_admin").eq("id", profileId).maybeSingle(),
    admin
      .from("organization_memberships")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("status", "active"),
  ]);
  const isSuperAdmin = Boolean((profile as { is_super_admin?: boolean } | null)?.is_super_admin);
  const nextStatus: "active" | "inactive" = isSuperAdmin || (count ?? 0) > 0 ? "active" : "inactive";

  await admin.from("profiles").update({ status: nextStatus }).eq("id", profileId);
  // GoTrue: gesperrte Konten koennen sich nicht anmelden und keine Tokens erneuern.
  await admin.auth.admin.updateUserById(profileId, {
    ban_duration: nextStatus === "inactive" ? "876600h" : "none",
  });
  return nextStatus;
}

/* ------------------------------ CSV-Import ------------------------------ */

export interface CsvPreviewRow {
  line: number;
  firstName: string;
  lastName: string;
  email: string;
  /** Deutsche Fehlermeldungen; leer = importierbar */
  errors: string[];
}

export interface CsvImportState {
  step: "start" | "preview" | "done";
  error: string | null;
  rows?: CsvPreviewRow[];
  organizationId?: string;
  cohortId?: string;
  imported?: number;
  failed?: string[];
}

const MAX_CSV_BYTES = 1024 * 1024; // 1 MB
const MAX_CSV_ROWS = 500;

const csvContextSchema = z.object({ organizationId: uuid, cohortId: uuid.optional() });

/** Bereits vergebene E-Mails: bestehende Konten + offene Einladungen. */
async function loadExistingEmails(): Promise<Set<string>> {
  const existing = new Set<string>();
  const authUsers = await loadAuthUserMap();
  for (const info of authUsers.values()) {
    if (info.email) existing.add(info.email.toLowerCase());
  }
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("invitations").select("email").eq("status", "pending");
  for (const row of (data ?? []) as Array<{ email: string }>) {
    existing.add(row.email.toLowerCase());
  }
  return existing;
}

/** Schritt 1: Datei parsen und Vorschau mit Fehlermarkierung erzeugen. */
export async function csvPreviewAction(
  _prev: CsvImportState,
  formData: FormData,
): Promise<CsvImportState> {
  const session = await getActorContext();
  if (!session) redirect("/login");

  const ctx = csvContextSchema.safeParse({
    organizationId: formData.get("organizationId"),
    cohortId: optional(formData, "cohortId"),
  });
  if (!ctx.success) return { step: "start", error: "Bitte wählen Sie eine Organisation." };

  if (!can(session.actor, "users.invite", { organizationId: ctx.data.organizationId })) {
    return { step: "start", error: ERROR_MESSAGES.forbidden };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { step: "start", error: "Bitte wählen Sie eine CSV-Datei aus." };
  }
  if (file.size > MAX_CSV_BYTES) {
    return { step: "start", error: "Die Datei ist zu groß (maximal 1 MB)." };
  }

  const text = await file.text();
  const parsedCsv = parseParticipantCsv(text);
  if (parsedCsv.error) return { step: "start", error: parsedCsv.error };
  if (parsedCsv.rows.length > MAX_CSV_ROWS) {
    return { step: "start", error: `Zu viele Zeilen (maximal ${MAX_CSV_ROWS} pro Import).` };
  }

  const existingEmails = await loadExistingEmails();
  const seenInFile = new Set<string>();

  const rows: CsvPreviewRow[] = parsedCsv.rows.map((r) => {
    const errors: string[] = [];
    const validated = csvParticipantRowSchema.safeParse({
      first_name: r.firstName,
      last_name: r.lastName,
      email: r.email,
    });
    if (!validated.success) {
      for (const issue of validated.error.issues) errors.push(issue.message);
    }
    const email = r.email.toLowerCase();
    if (email !== "" && seenInFile.has(email)) errors.push("Doppelt in der Datei");
    if (email !== "" && existingEmails.has(email)) {
      errors.push("E-Mail existiert bereits (Konto oder offene Einladung)");
    }
    if (email !== "") seenInFile.add(email);
    return { line: r.line, firstName: r.firstName, lastName: r.lastName, email: r.email, errors };
  });

  return {
    step: "preview",
    error: null,
    rows,
    organizationId: ctx.data.organizationId,
    cohortId: ctx.data.cohortId,
  };
}

const importRowsSchema = z
  .array(
    z.object({
      firstName: z.string().trim().min(1),
      lastName: z.string().trim().min(1),
      email: z.string().trim().toLowerCase().email(),
    }),
  )
  .min(1)
  .max(MAX_CSV_ROWS);

/** Schritt 2: Import erst nach Bestätigung – lädt jede gültige Zeile ein. */
export async function csvImportAction(
  _prev: CsvImportState,
  formData: FormData,
): Promise<CsvImportState> {
  const session = await getActorContext();
  if (!session) redirect("/login");

  const ctx = csvContextSchema.safeParse({
    organizationId: formData.get("organizationId"),
    cohortId: optional(formData, "cohortId"),
  });
  if (!ctx.success) return { step: "start", error: ERROR_MESSAGES.invalidInput };

  if (!can(session.actor, "users.invite", { organizationId: ctx.data.organizationId })) {
    return { step: "start", error: ERROR_MESSAGES.forbidden };
  }

  let rawRows: unknown;
  try {
    rawRows = JSON.parse(String(formData.get("rowsJson") ?? "[]"));
  } catch {
    return { step: "start", error: ERROR_MESSAGES.invalidInput };
  }
  const rowsParsed = importRowsSchema.safeParse(rawRows);
  if (!rowsParsed.success) {
    return { step: "start", error: "Keine gültigen Zeilen zum Import gefunden." };
  }
  // Ein Import zaehlt als EINE Einladungs-Aktion (die Function begrenzt
  // zusaetzlich die Einzelaufrufe je Akteur).
  if (!(await inviteRateLimitOk(session.actor.profileId))) {
    return { step: "start", error: RATE_LIMIT_MESSAGE };
  }

  let imported = 0;
  const failed: string[] = [];
  for (const row of rowsParsed.data) {
    // Vor-/Nachname werden bei der Annahme der Einladung von der Person
    // selbst gesetzt (accept-invitation); die Einladung traegt nur die E-Mail.
    const failure = await callInviteFunction({
      action: "create",
      email: row.email,
      organizationId: ctx.data.organizationId,
      ...(ctx.data.cohortId !== undefined ? { cohortId: ctx.data.cohortId } : {}),
      role: "participant",
    });
    if (failure === null) imported += 1;
    else failed.push(row.email);
  }

  await writeAuditLog({
    actorProfileId: session.actor.profileId,
    action: "participants.import",
    targetType: "organization",
    targetId: ctx.data.organizationId,
    metadata: {
      imported,
      failed: failed.length,
      cohort_id: ctx.data.cohortId ?? null,
    },
  });

  revalidatePath("/teilnehmer");
  return { step: "done", error: null, imported, failed };
}

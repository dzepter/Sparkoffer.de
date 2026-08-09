"use server";

/**
 * Server Actions – Bereich TEILNEHMER (§22/§23).
 *
 * Regeln:
 *  - KEIN Hard-Delete: deaktivieren/reaktivieren statt loeschen (§23).
 *  - Einladungen laufen ueber die Edge Function POST /functions/v1/invite-user
 *    (legt die Einladung an, hasht das Token und versendet die E-Mail). Der
 *    Aufruf erfolgt HIER serverseitig mit Service-Kontext; die URL kommt aus
 *    NEXT_PUBLIC_SUPABASE_URL, der Key aus SUPABASE_SERVICE_ROLE_KEY (env).
 *  - Jede Operation: getActorContext() -> can() -> Ausfuehrung -> Audit-Log.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { can } from "@handel-offensiv/domain";
import { csvParticipantRowSchema, invitationCreateSchema } from "@handel-offensiv/validation";

import { writeAuditLog } from "@/lib/audit";
import { getActorContext } from "@/lib/auth";
import { supabaseServiceRoleKey, supabaseUrl } from "@/lib/env";
import { ERROR_MESSAGES, mapSupabaseError } from "@/lib/errors";
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

interface InvitePayload {
  email?: string;
  organizationId?: string;
  cohortId?: string | null;
  role?: string;
  firstName?: string;
  lastName?: string;
  invitedBy?: string;
  /** Erneut senden einer bestehenden Einladung */
  invitationId?: string;
  resend?: boolean;
}

/**
 * Ruft die Edge Function invite-user im Service-Kontext auf.
 * Rueckgabe: null bei Erfolg, sonst deutsche Fehlermeldung.
 */
async function callInviteFunction(payload: InvitePayload): Promise<string | null> {
  try {
    const res = await fetch(`${supabaseUrl()}/functions/v1/invite-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Service-Role-Key: nur hier serverseitig – niemals im Client
        Authorization: `Bearer ${supabaseServiceRoleKey()}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (res.ok) return null;
    if (res.status === 409) return "Für diese E-Mail-Adresse besteht bereits eine Einladung oder ein Konto.";
    return "Die Einladung konnte nicht versendet werden. Bitte versuchen Sie es erneut.";
  } catch {
    return ERROR_MESSAGES.network;
  }
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

  const failure = await callInviteFunction({
    email: input.email,
    organizationId: input.organizationId,
    cohortId: input.cohortId ?? null,
    role: input.role,
    invitedBy: session.actor.profileId,
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

  const failure = await callInviteFunction({ invitationId: inv.id, resend: true });
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

  // Bisherige Gruppen-Zugehoerigkeiten innerhalb DIESER Organisation abloesen
  const { data: orgCohorts, error: cohortsError } = await admin
    .from("cohorts")
    .select("id")
    .eq("organization_id", v.organizationId);
  if (cohortsError) return { error: mapSupabaseError(cohortsError, ERROR_MESSAGES.save), done: false };

  const cohortIds = ((orgCohorts ?? []) as Array<{ id: string }>).map((c) => c.id);
  if (cohortIds.length > 0) {
    const { error } = await admin
      .from("cohort_members")
      .delete()
      .eq("profile_id", v.profileId)
      .in("cohort_id", cohortIds);
    if (error) return { error: mapSupabaseError(error, ERROR_MESSAGES.save), done: false };
  }

  if (v.cohortId !== undefined) {
    const { error } = await admin
      .from("cohort_members")
      .upsert(
        { cohort_id: v.cohortId, profile_id: v.profileId, status: "active" },
        { onConflict: "cohort_id,profile_id" },
      );
    if (error) return { error: mapSupabaseError(error, ERROR_MESSAGES.save), done: false };
  }

  await writeAuditLog({
    actorProfileId: session.actor.profileId,
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
  const { error } = await admin
    .from("organization_memberships")
    .update({ status: v.status })
    .eq("id", v.membershipId);
  if (error) redirect("/teilnehmer?fehler=1");

  await writeAuditLog({
    actorProfileId: session.actor.profileId,
    action: v.status === "inactive" ? "members.deactivate" : "members.reactivate",
    targetType: "organization_membership",
    targetId: v.membershipId,
    metadata: { status: v.status },
  });

  revalidatePath("/teilnehmer");
  redirect("/teilnehmer");
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

  let imported = 0;
  const failed: string[] = [];
  for (const row of rowsParsed.data) {
    const failure = await callInviteFunction({
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      organizationId: ctx.data.organizationId,
      cohortId: ctx.data.cohortId ?? null,
      role: "participant",
      invitedBy: session.actor.profileId,
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

"use server";

/**
 * Server Actions – Bereich UNTERNEHMEN (§21).
 *
 * Ablauf jeder privilegierten Operation (Regel aus src/lib/supabase/admin.ts):
 *  1. Akteur via getActorContext() aufloesen,
 *  2. Berechtigung mit can(actor, 'organizations.manage') pruefen (UX-Gate –
 *     verbindlich bleibt RLS bzw. der Service-Kontext dieser Action),
 *  3. Operation mit dem Service-Role-Client ausfuehren,
 *  4. audit_logs-Eintrag schreiben.
 *
 * Archivieren statt Loeschen: Organisationen werden nie hart geloescht,
 * sondern auf status = 'archived' gesetzt.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { can } from "@handel-offensiv/domain";
import { organizationSchema } from "@handel-offensiv/validation";

import { writeAuditLog } from "@/lib/audit";
import { getActorContext } from "@/lib/auth";
import { ERROR_MESSAGES, mapSupabaseError } from "@/lib/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface OrganizationFormState {
  error: string | null;
  fieldErrors?: Record<string, string>;
}

/**
 * organizationSchema (Paket validation) + Logo als optionaler Storage-Pfad
 * (§21: Logo optional, als Pfad – kein Upload an dieser Stelle).
 */
const organizationFormSchema = organizationSchema.extend({
  id: z.string().uuid().optional(),
  logoPath: z.string().trim().max(300).optional(),
});

const statusChangeSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["active", "inactive", "archived"]),
});

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

/** Neu anlegen bzw. bearbeiten (id gesetzt = Update). */
export async function saveOrganizationAction(
  _prev: OrganizationFormState,
  formData: FormData,
): Promise<OrganizationFormState> {
  const session = await getActorContext();
  if (!session) redirect("/login");
  if (!can(session.actor, "organizations.manage")) {
    return { error: ERROR_MESSAGES.forbidden };
  }

  const parsed = organizationFormSchema.safeParse({
    id: optional(formData, "id"),
    name: formData.get("name"),
    shortName: optional(formData, "shortName"),
    logoPath: optional(formData, "logoPath"),
    contactName: optional(formData, "contactName"),
    contactEmail: optional(formData, "contactEmail"),
    contactPhone: optional(formData, "contactPhone"),
    address: optional(formData, "address"),
    status: formData.get("status") ?? "active",
    internalNotes: optional(formData, "internalNotes"),
  });

  if (!parsed.success) {
    return { error: ERROR_MESSAGES.invalidInput, fieldErrors: firstFieldErrors(parsed.error) };
  }

  const input = parsed.data;
  const row = {
    name: input.name,
    short_name: input.shortName ?? null,
    logo_path: input.logoPath ?? null,
    contact_name: input.contactName ?? null,
    contact_email: input.contactEmail ?? null,
    contact_phone: input.contactPhone ?? null,
    address: input.address ?? null,
    status: input.status,
    internal_notes: input.internalNotes ?? null,
  };

  const admin = createSupabaseAdminClient();
  let targetId = input.id;

  if (input.id !== undefined) {
    const { error } = await admin.from("organizations").update(row).eq("id", input.id);
    if (error) return { error: mapSupabaseError(error, ERROR_MESSAGES.save) };
  } else {
    const { data, error } = await admin
      .from("organizations")
      .insert(row)
      .select("id")
      .single();
    if (error) return { error: mapSupabaseError(error, ERROR_MESSAGES.save) };
    targetId = (data as { id: string }).id;
  }

  await writeAuditLog({
    actorProfileId: session.actor.profileId,
    action: input.id !== undefined ? "organizations.update" : "organizations.create",
    targetType: "organization",
    targetId,
    metadata: { name: input.name, status: input.status },
  });

  revalidatePath("/unternehmen");
  redirect("/unternehmen");
}

/**
 * Statuswechsel (Archivieren / Reaktivieren) direkt aus der Liste.
 * Fehler werden ueber den Query-Parameter ?fehler=1 als Banner gemeldet.
 */
export async function setOrganizationStatusAction(formData: FormData): Promise<void> {
  const session = await getActorContext();
  if (!session) redirect("/login");
  if (!can(session.actor, "organizations.manage")) redirect("/unternehmen?fehler=recht");

  const parsed = statusChangeSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) redirect("/unternehmen?fehler=1");

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("organizations")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);
  if (error) redirect("/unternehmen?fehler=1");

  await writeAuditLog({
    actorProfileId: session.actor.profileId,
    action: parsed.data.status === "archived" ? "organizations.archive" : "organizations.status",
    targetType: "organization",
    targetId: parsed.data.id,
    metadata: { status: parsed.data.status },
  });

  revalidatePath("/unternehmen");
  redirect("/unternehmen");
}

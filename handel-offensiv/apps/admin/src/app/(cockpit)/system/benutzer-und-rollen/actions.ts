"use server";

/**
 * Server Actions – SYSTEM / Benutzer & Rollen.
 *
 * Rollenwechsel ist ausschliesslich Super Admins vorbehalten (§23/§47).
 * Das Super-Admin-Flag selbst wird hier bewusst NUR angezeigt und ist per
 * Cockpit NICHT veraenderbar – wer es setzen will, tut das kontrolliert
 * per Migration/SQL (dokumentiert unter /system/einstellungen).
 *
 * Ablauf wie ueberall: Akteur -> can()/isSuperAdmin -> Service Role -> Audit.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { MEMBER_ROLES } from "@handel-offensiv/types";

import { writeAuditLog } from "@/lib/audit";
import { getActorContext } from "@/lib/auth";
import { ERROR_MESSAGES, mapSupabaseError } from "@/lib/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface RoleChangeState {
  error: string | null;
  done: boolean;
}

const changeRoleSchema = z.object({
  membershipId: z.string().uuid(),
  role: z.enum(MEMBER_ROLES),
});

export async function changeMembershipRoleAction(
  _prev: RoleChangeState,
  formData: FormData,
): Promise<RoleChangeState> {
  const session = await getActorContext();
  if (!session) redirect("/login");

  // Nur Super Admins duerfen Rollen systemweit aendern
  if (!session.actor.isSuperAdmin) return { error: ERROR_MESSAGES.forbidden, done: false };

  const parsed = changeRoleSchema.safeParse({
    membershipId: formData.get("membershipId"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: ERROR_MESSAGES.invalidInput, done: false };

  const admin = createSupabaseAdminClient();

  const { data: before, error: loadError } = await admin
    .from("organization_memberships")
    .select("id, role, profile_id, organization_id")
    .eq("id", parsed.data.membershipId)
    .maybeSingle();
  if (loadError) return { error: mapSupabaseError(loadError, ERROR_MESSAGES.save), done: false };
  if (!before) return { error: ERROR_MESSAGES.notFound, done: false };

  const beforeRow = before as {
    id: string;
    role: string;
    profile_id: string;
    organization_id: string;
  };
  if (beforeRow.role === parsed.data.role) return { error: null, done: true };

  const { error } = await admin
    .from("organization_memberships")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.membershipId);
  if (error) return { error: mapSupabaseError(error, ERROR_MESSAGES.save), done: false };

  await writeAuditLog({
    actorProfileId: session.actor.profileId,
    action: "members.change_role",
    targetType: "organization_membership",
    targetId: beforeRow.id,
    metadata: {
      profile_id: beforeRow.profile_id,
      organization_id: beforeRow.organization_id,
      role_before: beforeRow.role,
      role_after: parsed.data.role,
    },
  });

  revalidatePath("/system/benutzer-und-rollen");
  revalidatePath("/teilnehmer");
  return { error: null, done: true };
}

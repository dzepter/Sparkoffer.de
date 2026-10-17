/**
 * Aufrufer-Authentifizierung + Berechtigungspruefung fuer Edge Functions.
 *
 * - requireActor(): validiert das Bearer-JWT des Aufrufers gegen GoTrue und
 *   laedt den ActorContext (Profil, Memberships, Trainer-/Teilnehmer-Cohorts).
 * - can()/requireCan(): Spiegel der Rechte-Matrix aus
 *   @handel-offensiv/domain/src/capabilities.ts (§47). Edge Functions laufen
 *   in Deno ohne Workspace-Aufloesung, daher ist die Matrix hier dupliziert –
 *   BEI AENDERUNGEN BEIDE STELLEN SYNCHRON HALTEN (Quelle: packages/domain).
 *
 * Verbindlich bleibt immer RLS; diese Pruefungen sichern die mit Service Role
 * ausgefuehrten, RLS-umgehenden Operationen der Functions ab.
 */

import type { AdminClient } from "./supabaseAdmin.ts";
import { fail } from "./errors.ts";

// --------------------------------------------------------------------------
// Typen (Spiegel von @handel-offensiv/types ActorContext)
// --------------------------------------------------------------------------

export type MemberRole = "org_admin" | "trainer" | "participant";

export interface ActorMembership {
  organizationId: string;
  role: MemberRole;
  permissions?: Record<string, boolean>;
}

export interface ActorContext {
  profileId: string;
  isSuperAdmin: boolean;
  memberships: ActorMembership[];
  trainerCohortIds: string[];
  memberCohortIds: string[];
}

export type Capability =
  | "organizations.read"
  | "organizations.manage"
  | "users.read"
  | "users.invite"
  | "users.manage"
  | "cohorts.read"
  | "cohorts.manage"
  | "content.read"
  | "content.edit"
  | "content.publish"
  | "submissions.read"
  | "submissions.feedback"
  | "analytics.read"
  | "notifications.send"
  | "audit.read"
  | "settings.manage";

export interface CapabilityScope {
  organizationId?: string;
  cohortId?: string;
}

// --------------------------------------------------------------------------
// Rechte-Matrix (Kopie aus packages/domain/src/capabilities.ts – synchron halten!)
// --------------------------------------------------------------------------

const ROLE_CAPABILITIES: Record<MemberRole, readonly Capability[]> = {
  org_admin: ["organizations.read", "users.read", "users.invite", "cohorts.read", "analytics.read"],
  trainer: [
    "cohorts.read",
    "users.read",
    "content.read",
    "submissions.read",
    "submissions.feedback",
    "notifications.send",
    "analytics.read",
  ],
  participant: [],
};

const ROLE_OPTIONAL_CAPABILITIES: Record<MemberRole, readonly Capability[]> = {
  org_admin: ["users.manage", "notifications.send"],
  trainer: [],
  participant: [],
};

function membershipGrants(membership: ActorMembership, capability: Capability): boolean {
  const override = membership.permissions?.[capability];
  if (override === false) return false;
  if (ROLE_CAPABILITIES[membership.role].includes(capability)) return true;
  return override === true && ROLE_OPTIONAL_CAPABILITIES[membership.role].includes(capability);
}

function membershipMatchesScope(
  actor: ActorContext,
  membership: ActorMembership,
  scope?: CapabilityScope,
): boolean {
  if (!scope) return true;
  if (scope.organizationId !== undefined && membership.organizationId !== scope.organizationId) {
    return false;
  }
  if (scope.cohortId !== undefined) {
    if (membership.role === "trainer") return actor.trainerCohortIds.includes(scope.cohortId);
    if (membership.role === "participant") return actor.memberCohortIds.includes(scope.cohortId);
    // org_admin: Cohort->Organisation hier nicht aufloesbar -> fail-closed
    // (Aufrufer muss organizationId mitgeben).
    return false;
  }
  return true;
}

export function can(actor: ActorContext, capability: Capability, scope?: CapabilityScope): boolean {
  if (actor.isSuperAdmin) return true;
  return actor.memberships.some(
    (m) => membershipGrants(m, capability) && membershipMatchesScope(actor, m, scope),
  );
}

/** Wie can(), wirft aber eine deutsche 403-Meldung. */
export function requireCan(
  actor: ActorContext,
  capability: Capability,
  scope?: CapabilityScope,
): void {
  if (!can(actor, capability, scope)) {
    fail(403, "Sie haben keine Berechtigung für diese Aktion.");
  }
}

// --------------------------------------------------------------------------
// JWT validieren + ActorContext laden
// --------------------------------------------------------------------------

/**
 * Validiert das Bearer-JWT des Aufrufers und laedt den ActorContext.
 * Wirft 401 bei fehlendem/ungueltigem Token, 403 bei inaktivem Konto.
 */
export async function requireActor(req: Request, admin: AdminClient): Promise<ActorContext> {
  const authHeader = req.headers.get("authorization") ?? "";
  const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
  if (!jwt) fail(401, "Bitte melden Sie sich an, um fortzufahren.");

  const { data: userData, error: userError } = await admin.auth.getUser(jwt);
  if (userError || !userData?.user) {
    fail(401, "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.");
  }
  const userId = userData.user.id;

  const [profileRes, membershipRes, trainerRes, memberRes] = await Promise.all([
    admin.from("profiles").select("id, is_super_admin, status").eq("id", userId).maybeSingle(),
    admin
      .from("organization_memberships")
      .select("organization_id, role, permissions, status")
      .eq("profile_id", userId)
      .eq("status", "active"),
    admin.from("cohort_trainers").select("cohort_id").eq("profile_id", userId),
    admin
      .from("cohort_members")
      .select("cohort_id, status")
      .eq("profile_id", userId)
      .eq("status", "active"),
  ]);

  if (profileRes.error || membershipRes.error || trainerRes.error || memberRes.error) {
    console.error("ActorContext konnte nicht geladen werden:", {
      profile: profileRes.error,
      memberships: membershipRes.error,
      trainers: trainerRes.error,
      members: memberRes.error,
    });
    fail(500, "Ihr Benutzerkontext konnte nicht geladen werden. Bitte versuchen Sie es erneut.");
  }

  const profile = profileRes.data;
  if (!profile) fail(403, "Zu Ihrem Konto wurde kein Profil gefunden. Bitte wenden Sie sich an den Support.");
  if (profile.status !== "active") fail(403, "Ihr Konto ist derzeit deaktiviert.");

  return {
    profileId: profile.id as string,
    isSuperAdmin: Boolean(profile.is_super_admin),
    memberships: (membershipRes.data ?? []).map((m) => ({
      organizationId: m.organization_id as string,
      role: m.role as MemberRole,
      permissions: (m.permissions ?? undefined) as Record<string, boolean> | undefined,
    })),
    trainerCohortIds: (trainerRes.data ?? []).map((r) => r.cohort_id as string),
    memberCohortIds: (memberRes.data ?? []).map((r) => r.cohort_id as string),
  };
}

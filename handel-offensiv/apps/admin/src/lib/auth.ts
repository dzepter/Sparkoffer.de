/**
 * Aufloesung des angemeldeten Nutzers zu einem ActorContext fuer can().
 * Laeuft im NUTZER-Kontext (RLS aktiv) – die eigenen Zeilen in profiles,
 * organization_memberships, cohort_trainers und cohort_members sind per
 * RLS immer lesbar.
 *
 * WICHTIG: can() ist nur ein UI-/UX-Gate. Verbindlich bleibt RLS bzw. die
 * Berechtigungspruefung in den Server Actions.
 */

import type { ActorContext, ActorMembership, MemberRole, ProfileRow } from "@handel-offensiv/types";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SessionActor {
  actor: ActorContext;
  profile: Pick<ProfileRow, "id" | "first_name" | "last_name" | "is_super_admin" | "status">;
  email: string | null;
}

/** Nur boolesche Werte aus dem jsonb-Feld permissions uebernehmen (fail-closed). */
function toBooleanOverrides(raw: unknown): Record<string, boolean> | undefined {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const entries = Object.entries(raw as Record<string, unknown>).filter(
    (entry): entry is [string, boolean] => typeof entry[1] === "boolean",
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

/**
 * Laedt Profil + Mitgliedschaften + Trainer-/Teilnehmer-Cohorts des
 * eingeloggten Nutzers. `null`, wenn keine gueltige Session besteht.
 */
export async function getActorContext(): Promise<SessionActor | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileRes, membershipsRes, trainerRes, memberRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name, is_super_admin, status")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("organization_memberships")
      .select("organization_id, role, permissions")
      .eq("profile_id", user.id)
      .eq("status", "active"),
    supabase.from("cohort_trainers").select("cohort_id").eq("profile_id", user.id),
    supabase
      .from("cohort_members")
      .select("cohort_id")
      .eq("profile_id", user.id)
      .eq("status", "active"),
  ]);

  const profile = profileRes.data as SessionActor["profile"] | null;
  if (!profile || profile.status !== "active") return null;

  const memberships: ActorMembership[] = (
    (membershipsRes.data ?? []) as Array<{
      organization_id: string;
      role: MemberRole;
      permissions: unknown;
    }>
  ).map((row) => ({
    organizationId: row.organization_id,
    role: row.role,
    permissions: toBooleanOverrides(row.permissions),
  }));

  const actor: ActorContext = {
    profileId: profile.id,
    isSuperAdmin: profile.is_super_admin,
    memberships,
    trainerCohortIds: ((trainerRes.data ?? []) as Array<{ cohort_id: string }>).map(
      (row) => row.cohort_id,
    ),
    memberCohortIds: ((memberRes.data ?? []) as Array<{ cohort_id: string }>).map(
      (row) => row.cohort_id,
    ),
  };

  return { actor, profile, email: user.email ?? null };
}

/**
 * Hat der Akteur ueberhaupt Zugang zum Cockpit?
 * Reine Teilnehmer werden auf die Hinweisseite geleitet.
 */
export function isCockpitActor(actor: ActorContext): boolean {
  if (actor.isSuperAdmin) return true;
  if (actor.trainerCohortIds.length > 0) return true;
  return actor.memberships.some((m) => m.role !== "participant");
}

/** Anzeigename fuer die Kopfzeile. */
export function displayName(profile: SessionActor["profile"], email: string | null): string {
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  return name.length > 0 ? name : (email ?? "Angemeldet");
}

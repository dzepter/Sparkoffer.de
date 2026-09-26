/**
 * Sitzung und Gruppenkontext des angemeldeten Teilnehmers.
 *
 * Laeuft im NUTZER-Kontext (RLS): Profil, eigene Gruppenzuordnungen und
 * Gruppen sind per Policy immer lesbar. Ist das Profil inaktiv, liefert die
 * Datenbank keine Zeilen mehr (app.current_profile_id) – der Campus zeigt dann
 * die neutrale Sperrseite.
 *
 * Aktive Gruppe: Cookie `ho_cohort` (vom Nutzer gewaehlt), sonst die Gruppe
 * mit dem juengsten Startdatum. Teilnehmer in mehreren Gruppen koennen unter
 * /profil wechseln.
 */

import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { CohortRow, ProfileRow } from "@handel-offensiv/types";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const COHORT_COOKIE = "ho_cohort";

export type CampusCohort = Pick<CohortRow, "id" | "name" | "organization_id" | "program_id" | "start_date" | "end_date" | "status">;

export interface CampusSession {
  userId: string;
  email: string | null;
  profile: Pick<ProfileRow, "id" | "first_name" | "last_name" | "avatar_path" | "locale" | "is_super_admin">;
  /** Aktive Gruppe (null: keiner Gruppe zugeordnet) */
  cohort: CampusCohort | null;
  /** Alle aktiven Gruppen des Teilnehmers */
  cohorts: CampusCohort[];
  /** Organisation der aktiven Gruppe */
  organization: { id: string; name: string } | null;
  /** Ist der Nutzer Trainer/Org-Admin/Super-Admin (Hinweis auf das Cockpit) */
  hasCockpitAccess: boolean;
}

/** Sitzung laden; null, wenn nicht angemeldet oder Profil gesperrt. */
export async function getCampusSession(): Promise<CampusSession | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileRes, membersRes, membershipsRes, trainersRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_path, locale, is_super_admin")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("cohort_members")
      .select("cohort_id, status, cohorts ( id, name, organization_id, program_id, start_date, end_date, status )")
      .eq("profile_id", user.id)
      .eq("status", "active"),
    supabase.from("organization_memberships").select("organization_id, role").eq("profile_id", user.id).eq("status", "active"),
    supabase.from("cohort_trainers").select("cohort_id").eq("profile_id", user.id),
  ]);

  const profile = profileRes.data as CampusSession["profile"] | null;
  if (!profile) return null; // inaktives Profil: RLS liefert nichts

  const cohorts = ((membersRes.data ?? []) as unknown as Array<{ cohorts: CampusCohort | null }>)
    .map((row) => row.cohorts)
    .filter((c): c is CampusCohort => c !== null && c.status === "active")
    .sort((a, b) => (b.start_date ?? "").localeCompare(a.start_date ?? ""));

  const cookieStore = await cookies();
  const wanted = cookieStore.get(COHORT_COOKIE)?.value;
  const cohort = cohorts.find((c) => c.id === wanted) ?? cohorts[0] ?? null;

  let organization: CampusSession["organization"] = null;
  if (cohort) {
    const { data: org } = await supabase.from("organizations").select("id, name").eq("id", cohort.organization_id).maybeSingle();
    organization = (org as { id: string; name: string } | null) ?? null;
  }

  const memberships = (membershipsRes.data ?? []) as Array<{ organization_id: string; role: string }>;
  const hasCockpitAccess =
    profile.is_super_admin ||
    memberships.some((m) => m.role !== "participant") ||
    ((trainersRes.data ?? []) as unknown[]).length > 0;

  return {
    userId: user.id,
    email: user.email ?? null,
    profile,
    cohort,
    cohorts,
    organization,
    hasCockpitAccess,
  };
}

/** Wie getCampusSession, leitet ohne Sitzung zum Login um. */
export async function requireCampusSession(): Promise<CampusSession> {
  const session = await getCampusSession();
  if (!session) redirect("/login");
  return session;
}

/** Anzeigename fuer Kopfzeile/Begruessung. */
export function displayName(profile: CampusSession["profile"], email: string | null): string {
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  return name.length > 0 ? name : (email ?? "Teilnehmer");
}

/** Vorname fuer die persoenliche Ansprache ("Guten Tag, Max"). */
export function firstName(profile: CampusSession["profile"]): string | null {
  const v = profile.first_name?.trim();
  return v && v.length > 0 ? v : null;
}

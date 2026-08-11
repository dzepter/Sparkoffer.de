import { can } from "@handel-offensiv/domain";

import { ErrorState, PageHeader } from "@/components/ui";
import { getActorContext } from "@/lib/auth";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AnnouncementForm, type AnnouncementCohortOption } from "./announcement-form";

export const dynamic = "force-dynamic";

/**
 * Neue Ankuendigung (§19). Die Zielgruppen-Auswahl enthaelt NUR Gruppen,
 * an die der Akteur laut can() senden darf (Trainer: eigene Gruppen).
 * Verbindlich bleibt die Pruefung in der Server Action.
 */
export default async function NeueAnkuendigungPage() {
  const session = await getActorContext();
  if (!session) return <ErrorState message={ERROR_MESSAGES.sessionExpired} />;
  const { actor } = session;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("cohorts")
    .select("id, name, organization_id, organizations(name)")
    .eq("status", "active")
    .order("name");

  if (error) {
    return (
      <>
        <PageHeader kicker="Kommunikation" title="Neue Ankündigung" />
        <ErrorState message={ERROR_MESSAGES.load} />
      </>
    );
  }

  const cohorts = (data ?? []) as unknown as Array<{
    id: string;
    name: string;
    organization_id: string;
    organizations: { name: string } | null;
  }>;

  const allowed: AnnouncementCohortOption[] = cohorts
    .filter(
      (c) =>
        can(actor, "notifications.send", { cohortId: c.id }) ||
        can(actor, "notifications.send", { organizationId: c.organization_id }),
    )
    .map((c) => ({
      id: c.id,
      name: c.organizations ? `${c.name} (${c.organizations.name})` : c.name,
    }));

  if (allowed.length === 0) {
    return (
      <>
        <PageHeader kicker="Kommunikation" title="Neue Ankündigung" />
        <ErrorState title="Kein Zugriff" message={ERROR_MESSAGES.forbidden} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        kicker="Kommunikation"
        title="Neue Ankündigung"
        description="Die Ankündigung erscheint im Mannschaftsraum der gewählten Gruppe. Optional erhalten alle Teilnehmer zusätzlich eine Push-Benachrichtigung."
      />
      <AnnouncementForm cohorts={allowed} />
    </>
  );
}

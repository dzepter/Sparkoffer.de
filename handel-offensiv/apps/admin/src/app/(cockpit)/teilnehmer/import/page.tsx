import { can } from "@handel-offensiv/domain";

import { ErrorState, PageHeader } from "@/components/ui";
import { getActorContext } from "@/lib/auth";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ImportForm, type ImportCohortOption, type ImportOrgOption } from "./import-form";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const session = await getActorContext();
  if (!session) return <ErrorState message={ERROR_MESSAGES.sessionExpired} />;
  if (!can(session.actor, "users.invite")) {
    return <ErrorState title="Kein Zugriff" message={ERROR_MESSAGES.forbidden} />;
  }

  const supabase = await createSupabaseServerClient();
  const [orgsRes, cohortsRes] = await Promise.all([
    supabase.from("organizations").select("id, name").eq("status", "active").order("name"),
    supabase.from("cohorts").select("id, name, organization_id").eq("status", "active").order("name"),
  ]);

  if (orgsRes.error || cohortsRes.error) return <ErrorState message={ERROR_MESSAGES.load} />;

  const organizations: ImportOrgOption[] = (orgsRes.data ?? []) as ImportOrgOption[];
  const cohorts: ImportCohortOption[] = (
    (cohortsRes.data ?? []) as Array<{ id: string; name: string; organization_id: string }>
  ).map((c) => ({ id: c.id, name: c.name, organizationId: c.organization_id }));

  return (
    <>
      <PageHeader
        kicker="Teilnehmer"
        title="CSV-Import"
        description="Teilnehmerliste hochladen, Vorschau prüfen und erst danach einladen. Doppelte oder fehlerhafte Zeilen werden markiert und übersprungen."
      />
      <ImportForm organizations={organizations} cohorts={cohorts} />
    </>
  );
}

import { can } from "@handel-offensiv/domain";
import type { OrganizationRow } from "@handel-offensiv/types";

import { ErrorState, PageHeader } from "@/components/ui";
import { getActorContext } from "@/lib/auth";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OrganizationForm } from "../../organization-form";

export const dynamic = "force-dynamic";

export default async function UnternehmenBearbeitenPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const session = await getActorContext();
  if (!session) return <ErrorState message={ERROR_MESSAGES.sessionExpired} />;
  if (!can(session.actor, "organizations.manage")) {
    return <ErrorState title="Kein Zugriff" message={ERROR_MESSAGES.forbidden} />;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return <ErrorState message={ERROR_MESSAGES.load} />;
  if (!data) return <ErrorState title="Nicht gefunden" message={ERROR_MESSAGES.notFound} />;

  const organization = data as OrganizationRow;

  return (
    <>
      <PageHeader
        kicker="Unternehmen"
        title={organization.name}
        description="Stammdaten bearbeiten. Zum Entfernen bitte archivieren – Daten bleiben erhalten."
      />
      <OrganizationForm organization={organization} />
    </>
  );
}

import { can } from "@handel-offensiv/domain";

import { ErrorState, PageHeader } from "@/components/ui";
import { getActorContext } from "@/lib/auth";
import { ERROR_MESSAGES } from "@/lib/errors";
import { OrganizationForm } from "../organization-form";

export const dynamic = "force-dynamic";

export default async function UnternehmenNeuPage() {
  const session = await getActorContext();
  if (!session) return <ErrorState message={ERROR_MESSAGES.sessionExpired} />;
  if (!can(session.actor, "organizations.manage")) {
    return <ErrorState title="Kein Zugriff" message={ERROR_MESSAGES.forbidden} />;
  }

  return (
    <>
      <PageHeader
        kicker="Unternehmen"
        title="Unternehmen anlegen"
        description="Stammdaten des Kundenunternehmens. Pflichtfeld ist nur der Name."
      />
      <OrganizationForm />
    </>
  );
}

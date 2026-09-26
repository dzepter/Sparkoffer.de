import { can } from "@handel-offensiv/domain";

import { ErrorState, PageHeader } from "@/components/ui";
import { getActorContext } from "@/lib/auth";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CohortForm, type OptionItem } from "../cohort-form";

export const dynamic = "force-dynamic";

export default async function GruppeNeuPage() {
  const session = await getActorContext();
  if (!session) return <ErrorState message={ERROR_MESSAGES.sessionExpired} />;
  if (!can(session.actor, "cohorts.manage")) {
    return <ErrorState title="Kein Zugriff" message={ERROR_MESSAGES.forbidden} />;
  }

  const supabase = await createSupabaseServerClient();
  const [orgsRes, programsRes] = await Promise.all([
    supabase.from("organizations").select("id, name").eq("status", "active").order("name"),
    supabase.from("programs").select("id, title").order("title"),
  ]);

  if (orgsRes.error || programsRes.error) return <ErrorState message={ERROR_MESSAGES.load} />;

  const organizations: OptionItem[] = ((orgsRes.data ?? []) as Array<{ id: string; name: string }>).map(
    (o) => ({ id: o.id, label: o.name }),
  );
  const programs: OptionItem[] = ((programsRes.data ?? []) as Array<{ id: string; title: string }>).map(
    (p) => ({ id: p.id, label: p.title }),
  );

  return (
    <>
      <PageHeader
        kicker="Gruppen"
        title="Gruppe anlegen"
        description="Eine Gruppe verbindet ein Unternehmen mit einem Programm und einem Zeitraum."
      />
      <CohortForm organizations={organizations} programs={programs} />
    </>
  );
}

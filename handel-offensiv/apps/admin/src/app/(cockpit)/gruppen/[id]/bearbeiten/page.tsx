import { can } from "@handel-offensiv/domain";
import type { CohortRow } from "@handel-offensiv/types";

import { ErrorState, PageHeader } from "@/components/ui";
import { getActorContext } from "@/lib/auth";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CohortForm, type OptionItem } from "../../cohort-form";

export const dynamic = "force-dynamic";

export default async function GruppeBearbeitenPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await getActorContext();
  if (!session) return <ErrorState message={ERROR_MESSAGES.sessionExpired} />;
  if (!can(session.actor, "cohorts.manage")) {
    return <ErrorState title="Kein Zugriff" message={ERROR_MESSAGES.forbidden} />;
  }

  const supabase = await createSupabaseServerClient();
  const [cohortRes, orgsRes, programsRes] = await Promise.all([
    supabase.from("cohorts").select("*").eq("id", id).maybeSingle(),
    supabase.from("organizations").select("id, name").order("name"),
    supabase.from("programs").select("id, title").order("title"),
  ]);

  if (cohortRes.error || orgsRes.error || programsRes.error) {
    return <ErrorState message={ERROR_MESSAGES.load} />;
  }
  if (!cohortRes.data) return <ErrorState title="Nicht gefunden" message={ERROR_MESSAGES.notFound} />;

  const cohort = cohortRes.data as CohortRow;
  const organizations: OptionItem[] = ((orgsRes.data ?? []) as Array<{ id: string; name: string }>).map(
    (o) => ({ id: o.id, label: o.name }),
  );
  const programs: OptionItem[] = ((programsRes.data ?? []) as Array<{ id: string; title: string }>).map(
    (p) => ({ id: p.id, label: p.title }),
  );

  return (
    <>
      <PageHeader kicker="Gruppen" title={cohort.name} description="Stammdaten der Gruppe bearbeiten." />
      <CohortForm cohort={cohort} organizations={organizations} programs={programs} />
    </>
  );
}

import Link from "next/link";

import { can } from "@handel-offensiv/domain";

import { EmptyState, ErrorState, Kicker, PageHeader } from "@/components/ui";
import { getActorContext } from "@/lib/auth";
import { formatDate } from "@/lib/datetime";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * AUSWERTUNG (§26): Gruppen-Auswahl.
 * Bewusst KEINE Rankings, KEIN Leaderboard – es geht um Unterstuetzung,
 * nicht um Vergleich. Die Detailansicht liegt unter /auswertung/[gruppeId].
 */

interface CohortRow {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  organization_id: string;
  organizations: { name: string } | null;
  programs: { title: string } | null;
  cohort_members: Array<{ count: number }>;
}

export default async function AuswertungPage() {
  const session = await getActorContext();
  if (!session) return <ErrorState message={ERROR_MESSAGES.sessionExpired} />;
  const { actor } = session;

  if (!can(actor, "analytics.read")) {
    return (
      <>
        <PageHeader kicker="Auswertung" title="Auswertung" />
        <ErrorState title="Kein Zugriff" message={ERROR_MESSAGES.forbidden} />
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("cohorts")
    .select(
      "id, name, start_date, end_date, organization_id, organizations(name), programs(title), cohort_members(count)",
    )
    .order("name");

  if (error) {
    return (
      <>
        <PageHeader kicker="Auswertung" title="Auswertung" />
        <ErrorState message={ERROR_MESSAGES.load} />
      </>
    );
  }

  const cohorts = ((data ?? []) as unknown as CohortRow[]).filter(
    (c) =>
      can(actor, "analytics.read", { cohortId: c.id }) ||
      can(actor, "analytics.read", { organizationId: c.organization_id }),
  );

  return (
    <>
      <PageHeader
        kicker="Auswertung"
        title="Auswertung"
        description="Wählen Sie eine Gruppe, um Fortschritt, offene Aufgaben und eingereichte Traineraufgaben zu sehen. Ohne Rankings – der Blick gilt der Unterstützung, nicht dem Vergleich."
      />

      {cohorts.length === 0 ? (
        <EmptyState
          title="Keine Gruppe verfügbar"
          description="Sobald Ihnen eine Gruppe zugeordnet ist, erscheint hier deren Auswertung."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cohorts.map((c) => (
            <li key={c.id}>
              <Link
                href={`/auswertung/${c.id}`}
                className="block h-full rounded border border-line bg-white p-5 transition-colors hover:border-green-deep"
              >
                <Kicker>{c.organizations?.name ?? "Ohne Organisation"}</Kicker>
                <h2 className="mt-2 text-lg font-extrabold uppercase leading-tight tracking-tight text-ink">
                  {c.name}
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  {c.programs?.title ?? "–"}
                  {c.start_date && c.end_date
                    ? ` · ${formatDate(c.start_date)} – ${formatDate(c.end_date)}`
                    : ""}
                </p>
                <p className="mt-3 text-sm text-ink">
                  <span className="font-bold tabular-nums">
                    {c.cohort_members[0]?.count ?? 0}
                  </span>{" "}
                  Teilnehmer
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

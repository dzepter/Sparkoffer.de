import Link from "next/link";

import { can } from "@handel-offensiv/domain";
import type { OrgStatus } from "@handel-offensiv/types";

import { Badge, DataTable, EmptyState, ErrorState, PageHeader } from "@/components/ui";
import type { BadgeTone, DataTableColumn } from "@/components/ui";
import { getActorContext } from "@/lib/auth";
import { formatDate } from "@/lib/datetime";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** GRUPPEN: Durchfuehrungen (Cohorts) je Unternehmen und Programm. */

const STATUS_META: Record<OrgStatus, { label: string; tone: BadgeTone }> = {
  active: { label: "Aktiv", tone: "success" },
  inactive: { label: "Inaktiv", tone: "warning" },
  archived: { label: "Archiviert", tone: "neutral" },
};

interface CohortListRow {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status: OrgStatus;
  organizations: { name: string } | null;
  programs: { title: string } | null;
  cohort_trainers: Array<{ profiles: { first_name: string | null; last_name: string | null } | null }>;
  cohort_members: Array<{ count: number }>;
}

function trainerNames(row: CohortListRow): string {
  const names = row.cohort_trainers
    .map((t) => [t.profiles?.first_name, t.profiles?.last_name].filter(Boolean).join(" ").trim())
    .filter((n) => n.length > 0);
  return names.length > 0 ? names.join(", ") : "–";
}

export default async function GruppenPage() {
  const session = await getActorContext();
  if (!session) return <ErrorState message={ERROR_MESSAGES.sessionExpired} />;
  const { actor } = session;

  if (!can(actor, "cohorts.read")) {
    return <ErrorState title="Kein Zugriff" message={ERROR_MESSAGES.forbidden} />;
  }
  const manage = can(actor, "cohorts.manage");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("cohorts")
    .select(
      "id, name, start_date, end_date, status, organizations(name), programs(title), cohort_trainers(profiles(first_name, last_name)), cohort_members(count)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <>
        <PageHeader kicker="Verwaltung" title="Gruppen" />
        <ErrorState message={ERROR_MESSAGES.load} />
      </>
    );
  }

  const rows = (data ?? []) as unknown as CohortListRow[];

  const columns: Array<DataTableColumn<CohortListRow>> = [
    {
      key: "name",
      header: "Name",
      render: (r) => (
        <Link href={`/gruppen/${r.id}`} className="font-bold text-ink hover:text-green-deep">
          {r.name}
        </Link>
      ),
    },
    {
      key: "org",
      header: "Organisation",
      render: (r) => r.organizations?.name ?? <span className="text-ink-soft">–</span>,
    },
    {
      key: "program",
      header: "Programm",
      render: (r) => r.programs?.title ?? <span className="text-ink-soft">–</span>,
    },
    {
      key: "range",
      header: "Zeitraum",
      render: (r) =>
        r.start_date && r.end_date ? (
          <span className="whitespace-nowrap tabular-nums">
            {formatDate(r.start_date)} – {formatDate(r.end_date)}
          </span>
        ) : (
          <span className="text-ink-soft">Noch offen</span>
        ),
    },
    { key: "trainer", header: "Trainer", render: (r) => trainerNames(r) },
    {
      key: "members",
      header: "Teilnehmer",
      className: "w-28 text-right",
      render: (r) => <span className="tabular-nums">{r.cohort_members[0]?.count ?? 0}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge tone={STATUS_META[r.status].tone}>{STATUS_META[r.status].label}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader
        kicker="Verwaltung"
        title="Gruppen"
        description="Jede Gruppe ist die Durchführung eines Programms für ein Unternehmen – mit Terminen, Trainern und Freischaltungen."
        actions={
          manage ? (
            <Link
              href="/gruppen/neu"
              className="inline-flex min-h-touch items-center justify-center rounded bg-green px-5 text-sm font-bold uppercase tracking-kicker text-dark hover:bg-green-bright"
            >
              Gruppe anlegen
            </Link>
          ) : undefined
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        caption="Liste aller Gruppen"
        empty={
          <EmptyState
            title="Noch keine Gruppe angelegt"
            description="Legen Sie eine Gruppe an, um Teilnehmer, Termine und Freischaltungen zu verwalten."
          />
        }
      />
    </>
  );
}

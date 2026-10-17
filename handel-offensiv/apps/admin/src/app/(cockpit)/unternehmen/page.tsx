import Link from "next/link";

import { can } from "@handel-offensiv/domain";
import type { OrganizationRow } from "@handel-offensiv/types";

import { Badge, Button, DataTable, EmptyState, ErrorState, PageHeader } from "@/components/ui";
import type { BadgeTone, DataTableColumn } from "@/components/ui";
import { getActorContext } from "@/lib/auth";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { setOrganizationStatusAction } from "./actions";

export const dynamic = "force-dynamic";

/** UNTERNEHMEN (§21): Liste aller Kundenunternehmen. Archivieren statt Löschen. */

const STATUS_META: Record<OrganizationRow["status"], { label: string; tone: BadgeTone }> = {
  active: { label: "Aktiv", tone: "success" },
  inactive: { label: "Inaktiv", tone: "warning" },
  archived: { label: "Archiviert", tone: "neutral" },
};

interface OrgListRow extends OrganizationRow {
  cohortCount: number;
}

export default async function UnternehmenPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await props.searchParams;
  const session = await getActorContext();
  if (!session) return <ErrorState message={ERROR_MESSAGES.sessionExpired} />;
  const { actor } = session;

  if (!can(actor, "organizations.read")) {
    return <ErrorState title="Kein Zugriff" message={ERROR_MESSAGES.forbidden} />;
  }
  const manage = can(actor, "organizations.manage");

  const supabase = await createSupabaseServerClient();
  const [orgsRes, cohortsRes] = await Promise.all([
    supabase.from("organizations").select("*").order("name", { ascending: true }),
    supabase.from("cohorts").select("id, organization_id"),
  ]);

  if (orgsRes.error) {
    return (
      <>
        <PageHeader kicker="Verwaltung" title="Unternehmen" />
        <ErrorState message={ERROR_MESSAGES.load} />
      </>
    );
  }

  const countByOrg = new Map<string, number>();
  for (const c of (cohortsRes.data ?? []) as Array<{ id: string; organization_id: string }>) {
    countByOrg.set(c.organization_id, (countByOrg.get(c.organization_id) ?? 0) + 1);
  }

  const rows: OrgListRow[] = ((orgsRes.data ?? []) as OrganizationRow[]).map((o) => ({
    ...o,
    cohortCount: countByOrg.get(o.id) ?? 0,
  }));

  const columns: Array<DataTableColumn<OrgListRow>> = [
    {
      key: "name",
      header: "Name",
      render: (r) => <span className="font-bold text-ink">{r.name}</span>,
    },
    {
      key: "short",
      header: "Kurzname",
      render: (r) => r.short_name ?? <span className="text-ink-soft">–</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge tone={STATUS_META[r.status].tone}>{STATUS_META[r.status].label}</Badge>,
    },
    {
      key: "cohorts",
      header: "Gruppen",
      className: "w-24 text-right",
      render: (r) => <span className="tabular-nums">{r.cohortCount}</span>,
    },
    {
      key: "actions",
      header: "Aktionen",
      className: "w-64",
      render: (r) => (
        <div className="flex items-center gap-2">
          {manage ? (
            <>
              <Link
                href={`/unternehmen/${r.id}/bearbeiten`}
                className="inline-flex min-h-[36px] items-center rounded px-2 text-xs font-bold uppercase tracking-kicker text-green-deep hover:bg-paper"
              >
                Bearbeiten
              </Link>
              {r.status !== "archived" ? (
                <form action={setOrganizationStatusAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value="archived" />
                  <Button type="submit" variant="ghost" size="sm">
                    Archivieren
                  </Button>
                </form>
              ) : (
                <form action={setOrganizationStatusAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value="active" />
                  <Button type="submit" variant="ghost" size="sm">
                    Reaktivieren
                  </Button>
                </form>
              )}
            </>
          ) : (
            <span className="text-xs text-ink-soft">–</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        kicker="Verwaltung"
        title="Unternehmen"
        description="Kundenunternehmen anlegen, pflegen und archivieren. Archivierte Unternehmen bleiben mit allen Daten erhalten."
        actions={
          manage ? (
            <Link
              href="/unternehmen/neu"
              className="inline-flex min-h-touch items-center justify-center rounded bg-green px-5 text-sm font-bold uppercase tracking-kicker text-dark hover:bg-green-bright"
            >
              Unternehmen anlegen
            </Link>
          ) : undefined
        }
      />

      {sp.fehler ? (
        <p role="alert" className="mb-4 rounded border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
          {sp.fehler === "recht" ? ERROR_MESSAGES.forbidden : ERROR_MESSAGES.save}
        </p>
      ) : null}

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        caption="Liste aller Unternehmen"
        empty={
          <EmptyState
            title="Noch kein Unternehmen angelegt"
            description="Legen Sie das erste Kundenunternehmen an, um Gruppen und Teilnehmer zu verwalten."
            action={
              manage ? (
                <Link
                  href="/unternehmen/neu"
                  className="inline-flex min-h-touch items-center justify-center rounded bg-green px-5 text-sm font-bold uppercase tracking-kicker text-dark hover:bg-green-bright"
                >
                  Unternehmen anlegen
                </Link>
              ) : undefined
            }
          />
        }
      />
    </>
  );
}

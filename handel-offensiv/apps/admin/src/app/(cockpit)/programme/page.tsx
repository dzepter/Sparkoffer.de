import Link from "next/link";
import { redirect } from "next/navigation";

import { can } from "@handel-offensiv/domain";
import type { ContentStatus } from "@handel-offensiv/types";

import { LinkButton } from "@/app/(cockpit)/inhalte/_components/link-button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { getActorContext } from "@/lib/auth";
import { CONTENT_STATUS_LABELS, CONTENT_STATUS_TONES } from "@/lib/content-meta";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * PROGRAMME (§55): Liste aller Lernprogramme mit Titel, Slug, Status und
 * Modulzahl. Lesezugriff im Nutzerkontext (RLS), Redaktion nur mit
 * content.edit (UX-Gate – verbindlich bleibt RLS/Service-Role-Pfad).
 */

export const dynamic = "force-dynamic";

interface ProgramListRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  status: ContentStatus;
  modules: Array<{ count: number }>;
}

export default async function ProgrammePage() {
  const session = await getActorContext();
  if (!session) redirect("/login");

  if (!can(session.actor, "content.edit")) {
    return (
      <>
        <PageHeader kicker="Redaktion" title="Programme" />
        <ErrorState title="Kein Zugriff" message={ERROR_MESSAGES.forbidden} />
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("programs")
    .select("id, slug, title, subtitle, status, modules(count)")
    .order("title", { ascending: true });

  const rows = (data ?? []) as ProgramListRow[];

  const columns: Array<DataTableColumn<ProgramListRow>> = [
    {
      key: "titel",
      header: "Programm",
      render: (row) => (
        <Link href={`/programme/${row.id}`} className="font-bold text-ink hover:text-green-deep">
          {row.title}
          {row.subtitle ? (
            <span className="block text-xs font-normal text-ink-soft">{row.subtitle}</span>
          ) : null}
        </Link>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      render: (row) => <code className="text-xs text-ink-soft">{row.slug}</code>,
    },
    {
      key: "status",
      header: "Status",
      className: "w-40",
      render: (row) => (
        <Badge tone={CONTENT_STATUS_TONES[row.status]}>{CONTENT_STATUS_LABELS[row.status]}</Badge>
      ),
    },
    {
      key: "module",
      header: "Module",
      className: "w-28 text-right",
      render: (row) => (
        <span className="font-bold tabular-nums">{row.modules[0]?.count ?? 0}</span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        kicker="Redaktion"
        title="Programme"
        description="Lernprogramme mit ihren Modulen 01–05, Lernphasen und Lektionen."
        actions={<LinkButton href="/programme/neu" variant="primary">Neues Programm</LinkButton>}
      />

      {error ? (
        <ErrorState message={ERROR_MESSAGES.load} />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          caption="Liste aller Lernprogramme"
          empty={
            <EmptyState
              title="Noch kein Programm angelegt"
              description="Legen Sie das erste Lernprogramm an – Module, Lernphasen und Lektionen folgen darin."
              action={<LinkButton href="/programme/neu" variant="primary">Neues Programm</LinkButton>}
            />
          }
        />
      )}
    </>
  );
}

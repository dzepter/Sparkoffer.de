import Link from "next/link";
import { redirect } from "next/navigation";

import { can } from "@handel-offensiv/domain";
import type { ContentStatus } from "@handel-offensiv/types";

import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { getActorContext } from "@/lib/auth";
import { CONTENT_STATUS_LABELS, CONTENT_STATUS_TONES } from "@/lib/content-meta";
import { formatDate } from "@/lib/datetime";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { LinkButton } from "./_components/link-button";

/**
 * INHALTE (§55): Einstieg in den Lektions-Editor – alle Lektionen mit
 * Programm-/Modul-Kontext, Blockzahl und Status. Plus Quiz-Verwaltung.
 */

export const dynamic = "force-dynamic";

interface LessonOverviewRow {
  id: string;
  title: string;
  status: ContentStatus;
  estimated_minutes: number | null;
  updated_at: string;
  learning_phase: {
    id: string;
    title: string;
    module: {
      id: string;
      number_label: string;
      title: string;
      program: { id: string; title: string } | null;
    } | null;
  } | null;
  content_blocks: Array<{ count: number }>;
}

export default async function InhaltePage() {
  const session = await getActorContext();
  if (!session) redirect("/login");

  if (!can(session.actor, "content.edit")) {
    return (
      <>
        <PageHeader kicker="Redaktion" title="Inhalte" />
        <ErrorState title="Kein Zugriff" message={ERROR_MESSAGES.forbidden} />
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("lessons")
    .select(
      "id, title, status, estimated_minutes, updated_at, " +
        "learning_phase:learning_phases(id, title, module:modules(id, number_label, title, program:programs(id, title))), " +
        "content_blocks(count)",
    )
    .order("updated_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as LessonOverviewRow[];

  const columns: Array<DataTableColumn<LessonOverviewRow>> = [
    {
      key: "lektion",
      header: "Lektion",
      render: (row) => (
        <Link href={`/inhalte/${row.id}`} className="font-bold text-ink hover:text-green-deep">
          {row.title}
        </Link>
      ),
    },
    {
      key: "kontext",
      header: "Programm / Modul / Phase",
      render: (row) => {
        const module = row.learning_phase?.module ?? null;
        return (
          <span className="text-xs text-ink-soft">
            {[
              module?.program?.title,
              module ? `${module.number_label} ${module.title}` : null,
              row.learning_phase?.title,
            ]
              .filter(Boolean)
              .join(" · ") || "Ohne Zuordnung"}
          </span>
        );
      },
    },
    {
      key: "bloecke",
      header: "Blöcke",
      className: "w-24 text-right",
      render: (row) => (
        <span className="font-bold tabular-nums">{row.content_blocks[0]?.count ?? 0}</span>
      ),
    },
    {
      key: "minuten",
      header: "Minuten",
      className: "w-24 text-right",
      render: (row) => (
        <span className="tabular-nums text-ink-soft">{row.estimated_minutes ?? "–"}</span>
      ),
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
      key: "aktualisiert",
      header: "Aktualisiert",
      className: "w-32",
      render: (row) => <span className="text-xs text-ink-soft">{formatDate(row.updated_at)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        kicker="Redaktion"
        title="Inhalte"
        description="Lektions-Editor: Content-Blöcke, Veröffentlichung und Quiz-Verwaltung. Neue Lektionen legen Sie im Bereich Programme an."
        actions={<LinkButton href="/inhalte/quizze">Quiz-Verwaltung</LinkButton>}
      />

      {error ? (
        <ErrorState message={ERROR_MESSAGES.load} />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          caption="Liste aller Lektionen"
          empty={
            <EmptyState
              title="Noch keine Lektionen"
              description="Legen Sie zunächst im Bereich Programme Module, Lernphasen und Lektionen an."
              action={<LinkButton href="/programme" variant="primary">Zu den Programmen</LinkButton>}
            />
          }
        />
      )}
    </>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";

import { can } from "@handel-offensiv/domain";

import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { getActorContext } from "@/lib/auth";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { ConfirmSubmit } from "../_components/confirm-submit";
import { firstParam, Notice } from "../_components/notice";
import { deleteQuizAction } from "./actions";
import { QuizDialog } from "./quiz-dialog";

/** Quiz-Verwaltung: Liste aller Quizze mit Kennzahlen. */

export const dynamic = "force-dynamic";

interface QuizListRow {
  id: string;
  title: string;
  pass_score: number | null;
  max_attempts: number | null;
  shuffle: boolean;
  quiz_questions: Array<{ count: number }>;
}

export default async function QuizzePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const session = await getActorContext();
  if (!session) redirect("/login");

  if (!can(session.actor, "content.edit")) {
    return (
      <>
        <PageHeader kicker="Inhalte" title="Quiz-Verwaltung" />
        <ErrorState title="Kein Zugriff" message={ERROR_MESSAGES.forbidden} />
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("quizzes")
    .select("id, title, pass_score, max_attempts, shuffle, quiz_questions(count)")
    .order("title", { ascending: true });

  const rows = (data ?? []) as QuizListRow[];

  const columns: Array<DataTableColumn<QuizListRow>> = [
    {
      key: "titel",
      header: "Quiz",
      render: (row) => (
        <Link href={`/inhalte/quizze/${row.id}`} className="font-bold text-ink hover:text-green-deep">
          {row.title}
        </Link>
      ),
    },
    {
      key: "fragen",
      header: "Fragen",
      className: "w-24 text-right",
      render: (row) => (
        <span className="font-bold tabular-nums">{row.quiz_questions[0]?.count ?? 0}</span>
      ),
    },
    {
      key: "grenze",
      header: "Bestehensgrenze",
      className: "w-40 text-right",
      render: (row) => (
        <span className="tabular-nums text-ink-soft">
          {row.pass_score !== null ? `${row.pass_score} Punkte` : "–"}
        </span>
      ),
    },
    {
      key: "versuche",
      header: "Versuche",
      className: "w-28 text-right",
      render: (row) => (
        <span className="tabular-nums text-ink-soft">{row.max_attempts ?? "Unbegrenzt"}</span>
      ),
    },
    {
      key: "zufall",
      header: "Zufallsreihenfolge",
      className: "w-40",
      render: (row) =>
        row.shuffle ? <Badge tone="brand">Aktiv</Badge> : <Badge tone="neutral">Aus</Badge>,
    },
    {
      key: "aktionen",
      header: "Aktionen",
      className: "w-32 text-right",
      render: (row) => (
        <form action={deleteQuizAction} className="inline-flex justify-end">
          <input type="hidden" name="quizId" value={row.id} />
          <ConfirmSubmit
            message={`Quiz "${row.title}" wirklich löschen? Das ist nur möglich, solange es in keiner Lektion verwendet wird.`}
            ariaLabel={`Quiz ${row.title} löschen`}
          >
            Löschen
          </ConfirmSubmit>
        </form>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4">
        <Link
          href="/inhalte"
          className="text-xs font-bold uppercase tracking-kicker text-ink-soft hover:text-ink"
        >
          ← Alle Inhalte
        </Link>
      </div>

      <PageHeader
        kicker="Inhalte"
        title="Quiz-Verwaltung"
        description="Quizze mit Fragen, Optionen und Erklärungen – in Lektionen über den Blocktyp Quiz eingebunden."
        actions={<QuizDialog triggerLabel="Quiz anlegen" triggerVariant="primary" triggerSize="md" />}
      />

      <Notice fehler={firstParam(sp.fehler)} erfolg={firstParam(sp.erfolg)} />

      {error ? (
        <ErrorState message={ERROR_MESSAGES.load} />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          caption="Liste aller Quizze"
          empty={
            <EmptyState
              title="Noch kein Quiz angelegt"
              description="Legen Sie ein Quiz mit Bestehensgrenze und Versuchen an und pflegen Sie anschließend die Fragen."
              action={<QuizDialog triggerLabel="Quiz anlegen" triggerVariant="primary" triggerSize="md" />}
            />
          }
        />
      )}
    </>
  );
}

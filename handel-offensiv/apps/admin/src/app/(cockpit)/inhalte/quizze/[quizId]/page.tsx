import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { can } from "@handel-offensiv/domain";
import type { QuizOptionRow, QuizQuestionRow, QuizRow } from "@handel-offensiv/types";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { getActorContext } from "@/lib/auth";
import { QUESTION_KIND_LABELS } from "@/lib/content-meta";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { ConfirmSubmit } from "../../_components/confirm-submit";
import { firstParam, Notice } from "../../_components/notice";
import { deleteQuestionAction, moveQuestionAction } from "../actions";
import { QuestionDialog } from "./question-dialog";
import { QuizDialog } from "../quiz-dialog";

/** Quiz-Detail: Einstellungen + Fragen mit Optionen und Erklärungen pflegen. */

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ARROW_BTN =
  "inline-flex min-h-touch min-w-touch items-center justify-center rounded border border-line bg-white text-lg text-ink-soft hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-35";

export default async function QuizDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ quizId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { quizId } = await params;
  const sp = await searchParams;
  if (!UUID_RE.test(quizId)) notFound();

  const session = await getActorContext();
  if (!session) redirect("/login");
  if (!can(session.actor, "content.edit")) {
    return (
      <>
        <PageHeader kicker="Inhalte" title="Quiz" />
        <ErrorState title="Kein Zugriff" message={ERROR_MESSAGES.forbidden} />
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const [quizRes, questionsRes] = await Promise.all([
    supabase.from("quizzes").select("*").eq("id", quizId).maybeSingle(),
    supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", quizId)
      .order("position", { ascending: true }),
  ]);

  if (quizRes.error || questionsRes.error) {
    return (
      <>
        <PageHeader kicker="Inhalte" title="Quiz" />
        <ErrorState message={ERROR_MESSAGES.load} />
      </>
    );
  }

  const quiz = quizRes.data as QuizRow | null;
  if (quiz === null) notFound();
  const questions = (questionsRes.data ?? []) as QuizQuestionRow[];

  let optionsByQuestion = new Map<string, QuizOptionRow[]>();
  let optionsError = false;
  if (questions.length > 0) {
    const optionsRes = await supabase
      .from("quiz_options")
      .select("*")
      .in(
        "question_id",
        questions.map((q) => q.id),
      )
      .order("position", { ascending: true });
    if (optionsRes.error) {
      optionsError = true;
    } else {
      optionsByQuestion = new Map();
      for (const option of (optionsRes.data ?? []) as QuizOptionRow[]) {
        const list = optionsByQuestion.get(option.question_id) ?? [];
        list.push(option);
        optionsByQuestion.set(option.question_id, list);
      }
    }
  }

  return (
    <>
      <div className="mb-4">
        <Link
          href="/inhalte/quizze"
          className="text-xs font-bold uppercase tracking-kicker text-ink-soft hover:text-ink"
        >
          ← Quiz-Verwaltung
        </Link>
      </div>

      <PageHeader
        kicker="Quiz-Verwaltung"
        title={quiz.title}
        description={quiz.description ?? undefined}
        actions={
          <>
            <QuizDialog
              quiz={{
                id: quiz.id,
                title: quiz.title,
                description: quiz.description,
                pass_score: quiz.pass_score,
                max_attempts: quiz.max_attempts,
                shuffle: quiz.shuffle,
              }}
              triggerLabel="Einstellungen"
            />
            <QuestionDialog
              quizId={quiz.id}
              triggerLabel="Frage anlegen"
              triggerVariant="primary"
              triggerSize="md"
            />
          </>
        }
      />

      <Notice fehler={firstParam(sp.fehler)} erfolg={firstParam(sp.erfolg)} />

      <div className="mb-6 flex flex-wrap gap-3 text-sm text-ink-soft">
        <span className="rounded border border-line bg-white px-3 py-1.5">
          Bestehensgrenze:{" "}
          <strong className="text-ink">
            {quiz.pass_score !== null ? `${quiz.pass_score} Punkte` : "Keine"}
          </strong>
        </span>
        <span className="rounded border border-line bg-white px-3 py-1.5">
          Versuche:{" "}
          <strong className="text-ink">{quiz.max_attempts ?? "Unbegrenzt"}</strong>
        </span>
        <span className="rounded border border-line bg-white px-3 py-1.5">
          Zufallsreihenfolge: <strong className="text-ink">{quiz.shuffle ? "Aktiv" : "Aus"}</strong>
        </span>
      </div>

      {optionsError ? <ErrorState message={ERROR_MESSAGES.load} className="mb-6" /> : null}

      {questions.length === 0 ? (
        <EmptyState
          title="Noch keine Fragen"
          description="Legen Sie die erste Frage an – Single Choice, Multiple Choice, Richtig/Falsch oder Freitext."
          action={
            <QuestionDialog
              quizId={quiz.id}
              triggerLabel="Frage anlegen"
              triggerVariant="primary"
              triggerSize="md"
            />
          }
        />
      ) : (
        <ol className="space-y-4">
          {questions.map((question, index) => {
            const options = optionsByQuestion.get(question.id) ?? [];
            return (
              <li key={question.id}>
                <Card
                  title={
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="text-2xl font-extrabold tabular-nums tracking-tight text-green-deep"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-kicker text-ink-soft">
                          {QUESTION_KIND_LABELS[question.kind]} ·{" "}
                          {question.points === 1 ? "1 Punkt" : `${question.points} Punkte`}
                        </p>
                        <h2 className="text-base font-bold text-ink">{question.body}</h2>
                      </div>
                    </div>
                  }
                  action={
                    <div className="flex items-center gap-2">
                      <form action={moveQuestionAction}>
                        <input type="hidden" name="quizId" value={quiz.id} />
                        <input type="hidden" name="frageId" value={question.id} />
                        <input type="hidden" name="richtung" value="hoch" />
                        <button
                          type="submit"
                          className={ARROW_BTN}
                          disabled={index === 0}
                          aria-label={`Frage ${index + 1} nach oben verschieben`}
                        >
                          ↑
                        </button>
                      </form>
                      <form action={moveQuestionAction}>
                        <input type="hidden" name="quizId" value={quiz.id} />
                        <input type="hidden" name="frageId" value={question.id} />
                        <input type="hidden" name="richtung" value="runter" />
                        <button
                          type="submit"
                          className={ARROW_BTN}
                          disabled={index === questions.length - 1}
                          aria-label={`Frage ${index + 1} nach unten verschieben`}
                        >
                          ↓
                        </button>
                      </form>
                      <QuestionDialog
                        quizId={quiz.id}
                        question={{
                          id: question.id,
                          kind: question.kind,
                          body: question.body,
                          explanation: question.explanation,
                          points: question.points,
                          options: options.map((option) => ({
                            body: option.body,
                            is_correct: option.is_correct,
                          })),
                        }}
                        triggerLabel="Bearbeiten"
                      />
                      <form action={deleteQuestionAction}>
                        <input type="hidden" name="quizId" value={quiz.id} />
                        <input type="hidden" name="frageId" value={question.id} />
                        <ConfirmSubmit
                          message="Diese Frage wirklich löschen?"
                          ariaLabel={`Frage ${index + 1} löschen`}
                        >
                          Löschen
                        </ConfirmSubmit>
                      </form>
                    </div>
                  }
                >
                  {question.kind === "freetext" ? (
                    <p className="text-sm text-ink-soft">
                      Freitext-Antwort – wird nicht automatisch bewertet.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {options.map((option) => (
                        <li key={option.id} className="flex items-center gap-2 text-sm">
                          {option.is_correct ? (
                            <Badge tone="success">Richtig</Badge>
                          ) : (
                            <Badge tone="neutral">Option</Badge>
                          )}
                          <span className="text-ink">{option.body}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {question.explanation ? (
                    <p className="mt-3 border-t border-line/60 pt-3 text-sm text-ink-soft">
                      <span className="font-bold text-ink">Erklärung: </span>
                      {question.explanation}
                    </p>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}

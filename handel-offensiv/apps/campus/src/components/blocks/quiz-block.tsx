"use client";

import { useActionState, useState } from "react";

import { Badge, Button, cn, Textarea } from "@handel-offensiv/ui";

import { submitQuizAction, type QuizActionState, type QuizSubmitResult } from "@/features/lernen/actions";
import type { QuizBundle } from "@/features/lernen/data";
import { formatDateTime } from "@/features/lernen/format";

import { BlockFrame, FormError } from "./block-frame";

const INITIAL: QuizActionState = { ok: false, error: null };

export interface QuizBlockProps {
  blockId: string;
  lessonId: string;
  cohortId: string;
  required: boolean;
  done: boolean;
  bundle: QuizBundle;
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * Quiz (§16): Fragen + Optionen OHNE Loesung (View quiz_options_public);
 * Bewertung ausschliesslich serverseitig ueber submit_quiz_attempt.
 */
export function QuizBlock({ blockId, lessonId, cohortId, required, done, bundle }: QuizBlockProps) {
  const [state, formAction, pending] = useActionState(submitQuizAction, INITIAL);
  const [showForm, setShowForm] = useState(bundle.attempts.length === 0);
  // useActionState behaelt das letzte Ergebnis; fuer einen weiteren Versuch
  // wird es lokal "weggeklickt" (je Versuchs-ID, damit ein neues Ergebnis
  // wieder erscheint).
  const [dismissedAttemptId, setDismissedAttemptId] = useState<string | null>(null);

  const { quiz, questions } = bundle;
  const result = state.result !== undefined && state.result.attempt_id !== dismissedAttemptId ? state.result : undefined;
  // Nach einem neuen Versuch zaehlt dieser bereits (Seite revalidiert, Props folgen)
  const attemptsUsed = Math.max(bundle.attempts.length, state.result?.attempt_no ?? 0);
  const attemptsLeft = quiz.max_attempts !== null ? Math.max(0, quiz.max_attempts - attemptsUsed) : null;
  const canStart = attemptsLeft === null || attemptsLeft > 0;
  const last = bundle.attempts[0];

  const restart = () => {
    if (state.result !== undefined) setDismissedAttemptId(state.result.attempt_id);
    setShowForm(true);
  };

  return (
    <BlockFrame id={blockId} label="Quiz" required={required} done={done}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-ink">{quiz.title}</h3>
          {quiz.description ? <p className="mt-1 text-sm text-ink-soft">{quiz.description}</p> : null}
        </div>
        {last?.passed === true || result?.passed === true ? <Badge tone="success">Bestanden</Badge> : null}
      </div>

      <p className="mt-2 text-xs text-ink-soft">
        {plural(questions.length, "Frage", "Fragen")}
        {quiz.pass_score !== null ? ` · Bestehensgrenze ${quiz.pass_score} Punkte` : ""}
        {quiz.max_attempts !== null
          ? ` · ${attemptsUsed} von ${quiz.max_attempts} ${quiz.max_attempts === 1 ? "Versuch" : "Versuchen"} genutzt`
          : ` · ${plural(attemptsUsed, "Versuch", "Versuche")} bisher`}
      </p>

      {result !== undefined ? (
        <QuizResult result={result} questions={questions} />
      ) : last !== undefined && !showForm ? (
        <div className="mt-3 rounded border border-line bg-paper px-3 py-2 text-sm text-ink">
          Letztes Ergebnis: <span className="font-bold">{last.score ?? 0} Punkte</span>
          {last.passed === false ? " – nicht bestanden" : ""}
          {last.completed_at ? ` (${formatDateTime(last.completed_at)})` : ""}.
        </div>
      ) : null}

      {result === undefined && showForm && canStart ? (
        <form action={formAction} className="mt-4 space-y-5" noValidate>
          <input type="hidden" name="blockId" value={blockId} />
          <input type="hidden" name="lessonId" value={lessonId} />
          <input type="hidden" name="cohortId" value={cohortId} />
          <input type="hidden" name="quizId" value={quiz.id} />
          <FormError message={state.error} />
          <ol className="space-y-5">
            {questions.map((q, index) => (
              <li key={q.id}>
                <fieldset>
                  <legend className="text-sm font-bold text-ink">
                    <span className="mr-1 tabular-nums text-ink-soft">{index + 1}.</span>
                    {q.body}
                    {q.kind === "multiple" ? <span className="ml-1 text-xs font-normal text-ink-soft">(Mehrfachauswahl)</span> : null}
                  </legend>
                  {q.kind === "freetext" ? (
                    <div className="mt-2">
                      <label htmlFor={`q-${q.id}`} className="sr-only">
                        Ihre Antwort
                      </label>
                      <Textarea id={`q-${q.id}`} name={`q_${q.id}`} rows={3} maxLength={4000} />
                      <p className="mt-1 text-xs text-ink-soft">Freitext wird nicht automatisch bewertet.</p>
                    </div>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {q.options.map((o) => (
                        <li key={o.id}>
                          <label className="flex min-h-touch cursor-pointer items-start gap-3 rounded border border-line bg-white px-3 py-2.5 hover:border-navy has-[:checked]:border-navy">
                            <input
                              type={q.kind === "multiple" ? "checkbox" : "radio"}
                              name={q.kind === "multiple" ? `qm_${q.id}` : `q_${q.id}`}
                              value={o.id}
                              className="mt-0.5 h-5 w-5 shrink-0 accent-navy"
                            />
                            <span className="text-sm leading-5 text-ink">{o.body}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </fieldset>
              </li>
            ))}
          </ol>
          <Button type="submit" disabled={pending}>
            {pending ? "Wird ausgewertet …" : "Antworten abgeben"}
          </Button>
        </form>
      ) : null}

      {(result !== undefined || !showForm) && canStart ? (
        <Button type="button" size="sm" className="mt-3" onClick={restart}>
          Quiz erneut starten
        </Button>
      ) : null}

      {!canStart ? (
        <p className="mt-3 text-sm text-ink-soft">Sie haben die maximale Anzahl an Versuchen erreicht.</p>
      ) : null}
    </BlockFrame>
  );
}

function QuizResult({ result, questions }: { result: QuizSubmitResult; questions: QuizBundle["questions"] }) {
  const byId = new Map(result.results.map((r) => [r.question_id, r]));
  return (
    <div className="mt-4 space-y-4" role="status">
      <div
        className={cn(
          "rounded border px-4 py-3",
          result.passed === false ? "border-warning/40 bg-warning/5" : "border-success/40 bg-success/5",
        )}
      >
        <p className="text-base font-bold text-ink">
          {result.score} von {result.max_score} Punkten
          {result.passed === true ? " – bestanden." : result.passed === false ? " – noch nicht bestanden." : "."}
        </p>
        <p className="text-xs text-ink-soft">Versuch {result.attempt_no}</p>
      </div>
      <ol className="space-y-4">
        {questions.map((q, index) => {
          const r = byId.get(q.id);
          const selected = new Set(r?.selected_option_ids ?? []);
          const correctIds = new Set(r?.correct_option_ids ?? []);
          return (
            <li key={q.id} className="rounded border border-line bg-white p-3">
              <p className="text-sm font-bold text-ink">
                <span className="mr-1 tabular-nums text-ink-soft">{index + 1}.</span>
                {q.body}
              </p>
              {r !== undefined && r.correct !== null ? (
                <p className={cn("mt-1 text-xs font-bold", r.correct ? "text-success" : "text-danger")}>{r.correct ? "Richtig" : "Nicht richtig"}</p>
              ) : (
                <p className="mt-1 text-xs text-ink-soft">Wird nicht automatisch bewertet.</p>
              )}
              {q.kind !== "freetext" ? (
                <ul className="mt-2 space-y-1">
                  {q.options.map((o) => {
                    const isCorrect = correctIds.has(o.id);
                    const chosen = selected.has(o.id);
                    return (
                      <li
                        key={o.id}
                        className={cn(
                          "rounded border px-3 py-1.5 text-sm",
                          isCorrect ? "border-success bg-success/5" : chosen ? "border-danger bg-danger/5" : "border-line",
                        )}
                      >
                        {o.body}
                        {chosen ? <span className="ml-1 text-xs text-ink-soft">(Ihre Auswahl)</span> : null}
                        {isCorrect ? <span className="sr-only"> (richtig)</span> : null}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              {r?.explanation ? <p className="mt-2 text-sm text-ink-soft">{r.explanation}</p> : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

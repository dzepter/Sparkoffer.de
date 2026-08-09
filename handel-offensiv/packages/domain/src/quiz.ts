/**
 * Quiz-Bewertung: reine Auswertung eines Versuchs gegen Fragen + Optionen.
 * Freitext wird NICHT automatisch bewertet (correct: null) und zaehlt weder
 * in score noch in maxScore.
 */

import type { QuizOptionRow, QuizQuestionRow, Uuid } from '@handel-offensiv/types';

// --------------------------------------------------------------------------
// Typen
// --------------------------------------------------------------------------

/** Frage inkl. Antwortoptionen (verschachteltes Select) */
export interface QuizQuestionWithOptions extends QuizQuestionRow {
  options: QuizOptionRow[];
}

/**
 * Antwort je Frage (Form von quiz_attempts.answers):
 * single/multiple/truefalse -> gewaehlte Option-IDs (string oder string[]),
 * freetext -> Freitext (string).
 */
export type QuizAnswerValue = string | string[] | null | undefined;
export type QuizAnswers = Record<Uuid, QuizAnswerValue>;

export interface QuizQuestionResult {
  questionId: Uuid;
  /** null = nicht automatisch bewertbar (freetext) */
  correct: boolean | null;
  explanation: string | null;
}

export interface QuizGradeResult {
  score: number;
  maxScore: number;
  /** null, wenn kein pass_score definiert ist */
  passed: boolean | null;
  perQuestion: QuizQuestionResult[];
}

// --------------------------------------------------------------------------
// Bewertung
// --------------------------------------------------------------------------

/**
 * Bewertet einen Quiz-Versuch.
 * - single/truefalse: exakt die richtige Option gewaehlt
 * - multiple: gewaehlte Menge == Menge aller korrekten Optionen
 *   (teilweise richtig = falsch, keine Teilpunkte)
 * - freetext: correct null, ohne Punktewirkung
 * - passed: score >= passScore (Grenze zaehlt als bestanden)
 */
export function gradeQuizAttempt(
  questions: readonly QuizQuestionWithOptions[],
  answers: QuizAnswers,
  passScore?: number | null,
): QuizGradeResult {
  let score = 0;
  let maxScore = 0;

  const perQuestion: QuizQuestionResult[] = questions.map((question) => {
    if (question.kind === 'freetext') {
      return { questionId: question.id, correct: null, explanation: question.explanation };
    }

    const points = question.points;
    maxScore += points;

    const selected = normalizeSelection(answers[question.id]);
    const correctIds = new Set(
      question.options.filter((o) => o.is_correct).map((o) => o.id),
    );
    const correct =
      selected.size === correctIds.size && [...selected].every((id) => correctIds.has(id));

    if (correct) score += points;
    return { questionId: question.id, correct, explanation: question.explanation };
  });

  const passed = passScore === null || passScore === undefined ? null : score >= passScore;
  return { score, maxScore, passed, perQuestion };
}

// --------------------------------------------------------------------------
// intern
// --------------------------------------------------------------------------

/** Antwortwert -> Menge gewaehlter Option-IDs (dedupliziert) */
function normalizeSelection(value: QuizAnswerValue): Set<string> {
  if (value === null || value === undefined) return new Set();
  return new Set(Array.isArray(value) ? value : [value]);
}

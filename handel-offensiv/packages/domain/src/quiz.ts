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
// Serverseitige Bewertung (RPC public.submit_quiz_attempt, Migration 0007)
// --------------------------------------------------------------------------

/** Antwortoption ohne Loesung (View public.quiz_options_public) */
export type QuizOptionPublic = Omit<QuizOptionRow, 'is_correct'>;

/** Frage inkl. Optionen ohne Loesung – Form fuer Teilnehmer-Clients */
export interface QuizQuestionWithPublicOptions extends QuizQuestionRow {
  options: QuizOptionPublic[];
}

/** Ergebnis je Frage aus submit_quiz_attempt */
export interface QuizSubmitQuestionResult {
  question_id: Uuid;
  kind: QuizQuestionRow['kind'];
  /** null = nicht automatisch bewertbar (freetext) */
  correct: boolean | null;
  selected_option_ids: Uuid[];
  correct_option_ids: Uuid[];
  explanation: string | null;
}

/** Rueckgabe von supabase.rpc('submit_quiz_attempt', …) */
export interface QuizSubmitResult {
  attempt_id: Uuid;
  attempt_no: number;
  score: number;
  max_score: number;
  /** null, wenn kein pass_score definiert ist */
  passed: boolean | null;
  results: QuizSubmitQuestionResult[];
}

/**
 * Prueft die RPC-Antwort strukturell (jsonb ist untypisiert) und liefert sie
 * typisiert zurueck – oder null, wenn die Form nicht stimmt.
 */
export function parseQuizSubmitResult(value: unknown): QuizSubmitResult | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (
    typeof v['attempt_id'] !== 'string' ||
    typeof v['attempt_no'] !== 'number' ||
    typeof v['score'] !== 'number' ||
    typeof v['max_score'] !== 'number' ||
    !(typeof v['passed'] === 'boolean' || v['passed'] === null) ||
    !Array.isArray(v['results'])
  ) {
    return null;
  }
  const results: QuizSubmitQuestionResult[] = [];
  for (const item of v['results'] as unknown[]) {
    if (typeof item !== 'object' || item === null) return null;
    const r = item as Record<string, unknown>;
    if (
      typeof r['question_id'] !== 'string' ||
      typeof r['kind'] !== 'string' ||
      !(typeof r['correct'] === 'boolean' || r['correct'] === null) ||
      !isStringArray(r['selected_option_ids']) ||
      !isStringArray(r['correct_option_ids']) ||
      !(typeof r['explanation'] === 'string' || r['explanation'] === null)
    ) {
      return null;
    }
    results.push({
      question_id: r['question_id'],
      kind: r['kind'] as QuizQuestionRow['kind'],
      correct: r['correct'],
      selected_option_ids: r['selected_option_ids'],
      correct_option_ids: r['correct_option_ids'],
      explanation: r['explanation'],
    });
  }
  return {
    attempt_id: v['attempt_id'],
    attempt_no: v['attempt_no'],
    score: v['score'],
    max_score: v['max_score'],
    passed: v['passed'],
    results,
  };
}

// --------------------------------------------------------------------------
// intern
// --------------------------------------------------------------------------

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((x) => typeof x === 'string');
}

/** Antwortwert -> Menge gewaehlter Option-IDs (dedupliziert) */
function normalizeSelection(value: QuizAnswerValue): Set<string> {
  if (value === null || value === undefined) return new Set();
  return new Set(Array.isArray(value) ? value : [value]);
}

import { describe, expect, it } from 'vitest';
import { gradeQuizAttempt, type QuizQuestionWithOptions } from '../quiz';
import type { QuizOptionRow, QuizQuestionRow } from '@handel-offensiv/types';

let seq = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`;

function option(questionId: string, isCorrect: boolean, position: number): QuizOptionRow {
  return {
    id: uuid(),
    question_id: questionId,
    position,
    body: `Option ${position}`,
    is_correct: isCorrect,
  } as QuizOptionRow;
}

function question(
  kind: QuizQuestionRow['kind'],
  correctCount: number,
  wrongCount: number,
  points = 1,
): QuizQuestionWithOptions {
  const id = uuid();
  const options: QuizOptionRow[] = [];
  let pos = 0;
  for (let i = 0; i < correctCount; i++) options.push(option(id, true, ++pos));
  for (let i = 0; i < wrongCount; i++) options.push(option(id, false, ++pos));
  return {
    id,
    quiz_id: uuid(),
    position: 1,
    kind,
    body: 'Frage',
    explanation: 'Erklärung',
    points,
    options,
  } as QuizQuestionWithOptions;
}

const correctIds = (q: QuizQuestionWithOptions) =>
  q.options.filter((o) => o.is_correct).map((o) => o.id);
const wrongId = (q: QuizQuestionWithOptions) =>
  q.options.find((o) => !o.is_correct)!.id;

describe('gradeQuizAttempt', () => {
  it('bewertet Single Choice: richtige Option = Punkt', () => {
    const q = question('single', 1, 2);
    const result = gradeQuizAttempt([q], { [q.id]: correctIds(q)[0] });
    expect(result.score).toBe(1);
    expect(result.maxScore).toBe(1);
    expect(result.perQuestion[0]?.correct).toBe(true);
  });

  it('bewertet Single Choice: falsche Option = kein Punkt, Erklärung vorhanden', () => {
    const q = question('single', 1, 2);
    const result = gradeQuizAttempt([q], { [q.id]: wrongId(q) });
    expect(result.score).toBe(0);
    expect(result.perQuestion[0]?.correct).toBe(false);
    expect(result.perQuestion[0]?.explanation).toBe('Erklärung');
  });

  it('bewertet Multiple Choice: alle richtigen = Punkt', () => {
    const q = question('multiple', 2, 2);
    const result = gradeQuizAttempt([q], { [q.id]: correctIds(q) });
    expect(result.score).toBe(1);
  });

  it('bewertet Multiple Choice: teilweise richtig = falsch (keine Teilpunkte)', () => {
    const q = question('multiple', 2, 2);
    const result = gradeQuizAttempt([q], { [q.id]: [correctIds(q)[0]!] });
    expect(result.score).toBe(0);
    expect(result.perQuestion[0]?.correct).toBe(false);
  });

  it('bewertet Multiple Choice: richtige + falsche gewählt = falsch', () => {
    const q = question('multiple', 2, 2);
    const result = gradeQuizAttempt([q], { [q.id]: [...correctIds(q), wrongId(q)] });
    expect(result.perQuestion[0]?.correct).toBe(false);
  });

  it('bewertet Richtig/Falsch', () => {
    const q = question('truefalse', 1, 1);
    expect(gradeQuizAttempt([q], { [q.id]: correctIds(q)[0] }).score).toBe(1);
    expect(gradeQuizAttempt([q], { [q.id]: wrongId(q) }).score).toBe(0);
  });

  it('Freitext wird nicht automatisch bewertet und zählt nicht in maxScore', () => {
    const q = question('freetext', 0, 0);
    const result = gradeQuizAttempt([q], { [q.id]: 'Meine Antwort' });
    expect(result.maxScore).toBe(0);
    expect(result.perQuestion[0]?.correct).toBeNull();
  });

  it('fehlende Antwort = falsch', () => {
    const q = question('single', 1, 2);
    const result = gradeQuizAttempt([q], {});
    expect(result.perQuestion[0]?.correct).toBe(false);
  });

  it('passed: Bestehensgrenze exakt erreicht gilt als bestanden', () => {
    const q1 = question('single', 1, 1, 2);
    const q2 = question('single', 1, 1, 2);
    const answers = { [q1.id]: correctIds(q1)[0], [q2.id]: wrongId(q2) };
    expect(gradeQuizAttempt([q1, q2], answers, 2).passed).toBe(true);
    expect(gradeQuizAttempt([q1, q2], answers, 3).passed).toBe(false);
  });

  it('passed ist null ohne pass_score', () => {
    const q = question('single', 1, 1);
    expect(gradeQuizAttempt([q], { [q.id]: correctIds(q)[0] }).passed).toBeNull();
  });

  it('gewichtet Punkte je Frage', () => {
    const q1 = question('single', 1, 1, 3);
    const q2 = question('truefalse', 1, 1, 1);
    const result = gradeQuizAttempt([q1, q2], {
      [q1.id]: correctIds(q1)[0],
      [q2.id]: correctIds(q2)[0],
    });
    expect(result.score).toBe(4);
    expect(result.maxScore).toBe(4);
  });
});

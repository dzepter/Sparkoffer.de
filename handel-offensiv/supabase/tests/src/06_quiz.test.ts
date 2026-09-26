/**
 * Quiz serverseitig bewerten (Migration 0007, Sicherheitsbefund S-3):
 * - quiz_options.is_correct ist fuer Teilnehmer nicht lesbar
 * - quiz_options_public liefert nur erreichbare Optionen, ohne Loesung
 * - submit_quiz_attempt bewertet exakt wie packages/domain (Paritaetstest),
 *   erzwingt Freischaltung, Mitgliedschaft und max_attempts
 * - quiz_attempts sind fuer Clients nur noch lesbar (eigene / Trainer)
 */
import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  gradeQuizAttempt,
  type QuizAnswers,
  type QuizQuestionWithOptions,
} from "../../../packages/domain/src/quiz.ts";
import { connect, withTx, type Tx } from "./harness";
import { A, B, QUIZ } from "./ids";

let client: Client;
beforeAll(async () => {
  client = await connect();
});
afterAll(async () => {
  await client.end();
});

/** Quiz ff..0003 an L01 (frei): single 1P, multiple 2P, truefalse 1P, freetext (ohne Wertung); pass_score 3, max_attempts 2 */
const GRADED_QUIZ = "ff000000-0000-4000-a000-000000000003";
const Q = {
  single: "ff000000-0000-4000-a000-000000000031",
  multiple: "ff000000-0000-4000-a000-000000000032",
  truefalse: "ff000000-0000-4000-a000-000000000033",
  freetext: "ff000000-0000-4000-a000-000000000034",
} as const;
const O = {
  singleCorrect: "ff000000-0000-4000-a000-000000000311",
  singleWrong: "ff000000-0000-4000-a000-000000000312",
  multiA: "ff000000-0000-4000-a000-000000000321",
  multiB: "ff000000-0000-4000-a000-000000000322",
  multiWrong: "ff000000-0000-4000-a000-000000000323",
  tfTrue: "ff000000-0000-4000-a000-000000000331",
  tfFalse: "ff000000-0000-4000-a000-000000000332",
} as const;
/** Quiz ff..0001 (L01 frei): Frage ff..0011, Option ff..0111 richtig */
const FREE_Q1 = "ff000000-0000-4000-a000-000000000011";
const FREE_Q1_CORRECT = "ff000000-0000-4000-a000-000000000111";
const FREE_Q1_WRONG = "ff000000-0000-4000-a000-000000000112";
/** Quiz ff..0002 (L03 gesperrt) */
const LOCKED_Q = "ff000000-0000-4000-a000-000000000021";
const LOCKED_OPTION = "ff000000-0000-4000-a000-000000000211";

const ALL_CORRECT: QuizAnswers = {
  [Q.single]: O.singleCorrect,
  [Q.multiple]: [O.multiA, O.multiB],
  [Q.truefalse]: O.tfTrue,
  [Q.freetext]: "Meine Antwort",
};

interface RpcQuestionResult {
  question_id: string;
  kind: string;
  correct: boolean | null;
  selected_option_ids: string[];
  correct_option_ids: string[];
  explanation: string | null;
}
interface RpcResult {
  attempt_id: string;
  attempt_no: number;
  score: number;
  max_score: number;
  passed: boolean | null;
  results: RpcQuestionResult[];
}

async function submit(tx: Tx, quizId: string, cohortId: string, answers: QuizAnswers): Promise<RpcResult> {
  const [row] = await tx.rows<{ result: RpcResult }>(
    "select public.submit_quiz_attempt($1, $2, $3::jsonb) as result",
    [quizId, cohortId, JSON.stringify(answers)],
  );
  return row!.result;
}

async function submitError(tx: Tx, quizId: string, cohortId: string, answers: QuizAnswers): Promise<string | null> {
  return tx.attempt("select public.submit_quiz_attempt($1, $2, $3::jsonb)", [quizId, cohortId, JSON.stringify(answers)]);
}

const NOT_AVAILABLE = /nicht verfügbar/;
const MAX_ATTEMPTS = /maximale Anzahl an Versuchen/;
const RLS_VIOLATION = /row-level security/i;
const PERMISSION_DENIED = /permission denied/i;

describe("quiz_options.is_correct ist fuer Teilnehmer gesperrt", () => {
  it("Spalte is_correct ist nicht lesbar, die uebrigen Spalten schon", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      expect(await tx.attempt("select is_correct from public.quiz_options")).toMatch(PERMISSION_DENIED);
      expect(await tx.attempt("select * from public.quiz_options")).toMatch(PERMISSION_DENIED);
      expect(await tx.attempt("select id, question_id, position, body from public.quiz_options")).toBeNull();
      // Auch Trainer/Org-Admin lesen is_correct nicht ueber die Nutzersession (Cockpit: Service-Rolle)
      await tx.actAs(A.trainer);
      expect(await tx.attempt("select is_correct from public.quiz_options")).toMatch(PERMISSION_DENIED);
    });
  });

  it("Cockpit-Editor: die Service-Rolle liest is_correct weiterhin (Positivkontrolle fuer inhalte/quizze/[quizId])", async () => {
    await withTx(client, async (tx) => {
      // Spiegel von apps/admin/src/app/(cockpit)/inhalte/quizze/[quizId]/page.tsx:
      // Quiz + Fragen ueber die Nutzersession (RLS) ...
      await tx.actAs(A.trainer);
      const questions = await tx.rows<{ id: string }>("select id from public.quiz_questions where quiz_id = $1 order by position", [GRADED_QUIZ]);
      expect(questions.length).toBe(4);
      // ... die Optionen inkl. Loesung ueber die Service-Rolle, begrenzt auf diese Fragen.
      await tx.actAsService();
      const options = await tx.rows<{ question_id: string; is_correct: boolean }>(
        "select question_id, is_correct from public.quiz_options where question_id = any($1::uuid[]) order by question_id, position",
        [questions.map((q) => q.id)],
      );
      expect(options.length).toBe(8);
      expect(options.filter((o) => o.is_correct).map((o) => o.question_id)).toEqual([Q.single, Q.multiple, Q.multiple, Q.truefalse]);
    });
  });

  it("is_correct laesst sich nicht ueber Filter erraten (WHERE auf gesperrter Spalte)", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      expect(await tx.attempt("select id from public.quiz_options where is_correct")).toMatch(PERMISSION_DENIED);
      expect(await tx.attempt("select id from public.quiz_options order by is_correct")).toMatch(PERMISSION_DENIED);
    });
  });
});

describe("quiz_options_public", () => {
  it("hat keine Spalte is_correct", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      expect(await tx.attempt("select is_correct from public.quiz_options_public")).toMatch(/does not exist/i);
      const cols = await tx.rows<{ column_name: string }>(
        "select column_name from information_schema.columns where table_schema = 'public' and table_name = 'quiz_options_public' order by column_name",
      );
      expect(cols.map((c) => c.column_name)).toEqual(["body", "id", "position", "question_id"]);
    });
  });

  it("zeigt P1 nur Optionen erreichbarer Quizze (L01 frei, L03 gesperrt)", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      const rows = await tx.rows<{ question_id: string }>("select distinct question_id from public.quiz_options_public order by question_id");
      expect(rows.map((r) => r.question_id)).toEqual([FREE_Q1, Q.single, Q.multiple, Q.truefalse]);
      expect(await tx.count("select 1 from public.quiz_options_public where question_id = $1", [LOCKED_Q])).toBe(0);
      expect(await tx.count("select 1 from public.quiz_options_public where id = $1", [LOCKED_OPTION])).toBe(0);
    });
  });

  it("ist fuer Personen ohne Einschreibung, in archivierter Gruppe und fuer anon leer", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p5NoEnrollment);
      expect(await tx.count("select 1 from public.quiz_options_public")).toBe(0);
      await tx.actAs(A.p6ArchivedCohort);
      expect(await tx.count("select 1 from public.quiz_options_public")).toBe(0);
      await tx.actAsAnon();
      expect(await tx.attempt("select 1 from public.quiz_options_public")).toMatch(PERMISSION_DENIED);
    });
  });
});

describe("submit_quiz_attempt – Bewertung", () => {
  it("alles richtig: volle Punkte, bestanden, Ergebnis je Frage inkl. Loesung und Erklaerung", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      const r = await submit(tx, GRADED_QUIZ, A.cohort, ALL_CORRECT);
      expect(r.attempt_no).toBe(1);
      expect(r.score).toBe(4);
      expect(r.max_score).toBe(4);
      expect(r.passed).toBe(true);
      expect(r.results.map((q) => q.question_id)).toEqual([Q.single, Q.multiple, Q.truefalse, Q.freetext]);
      expect(r.results.map((q) => q.correct)).toEqual([true, true, true, null]);
      expect(r.results[0]).toMatchObject({
        kind: "single",
        selected_option_ids: [O.singleCorrect],
        correct_option_ids: [O.singleCorrect],
        explanation: "Erklaerung Q31",
      });
      expect(r.results[1]).toMatchObject({
        kind: "multiple",
        selected_option_ids: [O.multiA, O.multiB],
        correct_option_ids: [O.multiA, O.multiB],
        explanation: null,
      });
      expect(r.results[3]).toMatchObject({
        kind: "freetext",
        selected_option_ids: [],
        correct_option_ids: [],
        explanation: "Erklaerung Q34",
      });

      // Versuch ist gespeichert und fuer die Person lesbar (score/passed serverseitig)
      const [row] = await tx.rows<{ attempt_no: number; score: number; passed: boolean; completed_at: Date | null; answers: QuizAnswers }>(
        "select attempt_no, score, passed, completed_at, answers from public.quiz_attempts where id = $1",
        [r.attempt_id],
      );
      expect(row).toMatchObject({ attempt_no: 1, score: 4, passed: true });
      expect(row!.completed_at).not.toBeNull();
      expect(row!.answers).toEqual(ALL_CORRECT);
    });
  });

  it("single falsch: Punkt fehlt; Grenze pass_score zaehlt als bestanden (3 von 4)", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      const r = await submit(tx, GRADED_QUIZ, A.cohort, { ...ALL_CORRECT, [Q.single]: O.singleWrong });
      expect(r.score).toBe(3);
      expect(r.passed).toBe(true);
      expect(r.results[0]).toMatchObject({ correct: false, selected_option_ids: [O.singleWrong], correct_option_ids: [O.singleCorrect] });
    });
  });

  it("multiple: nur die exakte Menge zaehlt (teilweise und zu viel = falsch, 2 von 4 = nicht bestanden)", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      const partial = await submit(tx, GRADED_QUIZ, A.cohort, { ...ALL_CORRECT, [Q.multiple]: [O.multiA] });
      expect(partial.results[1]?.correct).toBe(false);
      expect(partial.score).toBe(2);
      expect(partial.passed).toBe(false);

      const superset = await submit(tx, GRADED_QUIZ, A.cohort, {
        ...ALL_CORRECT,
        [Q.multiple]: [O.multiA, O.multiB, O.multiWrong],
      });
      expect(superset.results[1]?.correct).toBe(false);
      expect(superset.score).toBe(2);
      expect(superset.attempt_no).toBe(2);
    });
  });

  it("Duplikate und Reihenfolge sind unerheblich; String statt Array bei multiple wird als Einzelwahl gewertet", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      const dup = await submit(tx, GRADED_QUIZ, A.cohort, { ...ALL_CORRECT, [Q.multiple]: [O.multiB, O.multiA, O.multiB] });
      expect(dup.results[1]?.correct).toBe(true);
      expect(dup.score).toBe(4);
      const asString = await submit(tx, GRADED_QUIZ, A.cohort, { ...ALL_CORRECT, [Q.multiple]: O.multiA });
      expect(asString.results[1]?.correct).toBe(false);
    });
  });

  it("fehlende, leere und ungueltige Antworten sind falsch, aber kein Fehler", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      const r = await submit(tx, GRADED_QUIZ, A.cohort, {
        [Q.single]: "kein-uuid",
        [Q.multiple]: [],
        [Q.truefalse]: null,
      });
      expect(r.score).toBe(0);
      expect(r.max_score).toBe(4);
      expect(r.passed).toBe(false);
      expect(r.results.map((q) => q.correct)).toEqual([false, false, false, null]);
      expect(r.results[0]?.selected_option_ids).toEqual([]);
    });
  });

  it("Freitext zaehlt weder zu score noch zu max_score", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      const withText = await submit(tx, GRADED_QUIZ, A.cohort, ALL_CORRECT);
      const { [Q.freetext]: _omit, ...withoutText } = ALL_CORRECT;
      const without = await submit(tx, GRADED_QUIZ, A.cohort, withoutText);
      expect(withText.max_score).toBe(4);
      expect(without.max_score).toBe(4);
      expect(without.score).toBe(4);
      expect(without.results[3]?.correct).toBeNull();
    });
  });

  it("ohne pass_score ist passed null", async () => {
    await withTx(client, async (tx) => {
      await tx.actAsService();
      await tx.affected("update public.quizzes set pass_score = null where id = $1", [GRADED_QUIZ]);
      await tx.actAs(A.p1);
      const r = await submit(tx, GRADED_QUIZ, A.cohort, ALL_CORRECT);
      expect(r.passed).toBeNull();
      const [row] = await tx.rows<{ passed: boolean | null }>("select passed from public.quiz_attempts where id = $1", [r.attempt_id]);
      expect(row?.passed).toBeNull();
    });
  });

  it("attempt_no zaehlt je Quiz/Person/Gruppe hoch (P1 hat in Quiz L01 bereits Versuch 1)", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      const r = await submit(tx, QUIZ.free, A.cohort, { [FREE_Q1]: FREE_Q1_WRONG });
      expect(r.attempt_no).toBe(2);
      expect(r.score).toBe(0);
      expect(r.passed).toBe(false);
      const again = await submit(tx, QUIZ.free, A.cohort, { [FREE_Q1]: FREE_Q1_CORRECT });
      expect(again.attempt_no).toBe(3);
      expect(again.passed).toBe(true);
    });
  });

  it("max_attempts wird erzwungen (deutsche Meldung, kein weiterer Versuch gespeichert)", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      await submit(tx, GRADED_QUIZ, A.cohort, ALL_CORRECT);
      await submit(tx, GRADED_QUIZ, A.cohort, ALL_CORRECT);
      expect(await submitError(tx, GRADED_QUIZ, A.cohort, ALL_CORRECT)).toMatch(MAX_ATTEMPTS);
      expect(await tx.count("select 1 from public.quiz_attempts where quiz_id = $1 and profile_id = $2", [GRADED_QUIZ, A.p1])).toBe(2);
      // Quiz L01: max 3, P1 hat 1 -> zwei weitere, dann Schluss
      await submit(tx, QUIZ.free, A.cohort, { [FREE_Q1]: FREE_Q1_CORRECT });
      await submit(tx, QUIZ.free, A.cohort, { [FREE_Q1]: FREE_Q1_CORRECT });
      expect(await submitError(tx, QUIZ.free, A.cohort, { [FREE_Q1]: FREE_Q1_CORRECT })).toMatch(MAX_ATTEMPTS);
    });
  });

  it("ungueltige Antwortstruktur wird abgewiesen", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      expect(await tx.attempt("select public.submit_quiz_attempt($1, $2, '[]'::jsonb)", [GRADED_QUIZ, A.cohort])).toMatch(
        /Antworten konnten nicht verarbeitet/,
      );
      expect(await tx.attempt("select public.submit_quiz_attempt($1, $2, null)", [GRADED_QUIZ, A.cohort])).toMatch(
        /Antworten konnten nicht verarbeitet/,
      );
    });
  });
});

describe("submit_quiz_attempt – Zugriff", () => {
  it("verweigert ein Quiz einer gesperrten Lektion (L03)", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      expect(await submitError(tx, QUIZ.locked, A.cohort, { [LOCKED_Q]: LOCKED_OPTION })).toMatch(NOT_AVAILABLE);
      expect(await tx.count("select 1 from public.quiz_attempts where quiz_id = $1", [QUIZ.locked])).toBe(0);
    });
  });

  it("Freischaltung wirkt sofort: Trainer gibt L10 manuell frei -> Quiz dort abgebbar", async () => {
    await withTx(client, async (tx) => {
      // Quiz ff..0002 zusaetzlich an L10 (manual, nicht freigegeben) haengen
      await tx.actAsService();
      await tx.affected(
        "insert into public.content_blocks (lesson_id, position, block_type, config) values ($1, 1, 'quiz', $2::jsonb)",
        ["dd000000-0000-4000-a000-000000000010", JSON.stringify({ quizId: QUIZ.locked })],
      );
      await tx.actAs(A.p1);
      expect(await submitError(tx, QUIZ.locked, A.cohort, { [LOCKED_Q]: LOCKED_OPTION })).toMatch(NOT_AVAILABLE);
      await tx.actAs(A.trainer);
      await tx.affected("update public.lesson_releases set released_at = now() where lesson_id = $1 and cohort_id = $2", [
        "dd000000-0000-4000-a000-000000000010",
        A.cohort,
      ]);
      await tx.actAs(A.p1);
      const r = await submit(tx, QUIZ.locked, A.cohort, { [LOCKED_Q]: LOCKED_OPTION });
      expect(r.passed).toBe(true);
    });
  });

  it("verweigert eine fremde Gruppe (Cohort-ID der Organisation B) und ein Quiz ausserhalb des Gruppenprogramms", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      expect(await submitError(tx, GRADED_QUIZ, B.cohort, ALL_CORRECT)).toMatch(NOT_AVAILABLE);
      // Gruppe A2 (archiviert) – P1 ist dort nicht Mitglied
      expect(await submitError(tx, GRADED_QUIZ, A.cohortArchived, ALL_CORRECT)).toMatch(NOT_AVAILABLE);
      // Unbekannte IDs: gleiche Meldung, kein Orakel
      expect(await submitError(tx, "ff000000-0000-4000-a000-0000000000ff", A.cohort, ALL_CORRECT)).toMatch(NOT_AVAILABLE);
      expect(await tx.count("select 1 from public.quiz_attempts where profile_id = $1 and quiz_id = $2", [A.p1, GRADED_QUIZ])).toBe(0);
    });
  });

  it("verweigert Nicht-Mitglieder: ohne Einschreibung, inaktive Mitgliedschaft, inaktives Profil, fremder Mandant", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p5NoEnrollment);
      expect(await submitError(tx, GRADED_QUIZ, A.cohort, ALL_CORRECT)).toMatch(NOT_AVAILABLE);
      await tx.actAs(A.p4InactiveMembership);
      expect(await submitError(tx, GRADED_QUIZ, A.cohort, ALL_CORRECT)).toMatch(NOT_AVAILABLE);
      await tx.actAs(A.p3InactiveProfile);
      expect(await submitError(tx, GRADED_QUIZ, A.cohort, ALL_CORRECT)).toMatch(/melden Sie sich an|nicht verfügbar/);
      await tx.actAs(B.p1);
      expect(await submitError(tx, GRADED_QUIZ, A.cohort, ALL_CORRECT)).toMatch(NOT_AVAILABLE);
      // Trainer ist kein Teilnehmer der Gruppe
      await tx.actAs(A.trainer);
      expect(await submitError(tx, GRADED_QUIZ, A.cohort, ALL_CORRECT)).toMatch(NOT_AVAILABLE);
      await tx.actAsService();
      expect(await tx.count("select 1 from public.quiz_attempts where quiz_id = $1", [GRADED_QUIZ])).toBe(0);
    });
  });

  it("verweigert ohne sub-Claim und fuer anon", async () => {
    await withTx(client, async (tx) => {
      await tx.actAsAuthenticatedWithoutSub();
      expect(await submitError(tx, GRADED_QUIZ, A.cohort, ALL_CORRECT)).toMatch(/melden Sie sich an/);
      await tx.actAsAnon();
      expect(await submitError(tx, GRADED_QUIZ, A.cohort, ALL_CORRECT)).toMatch(PERMISSION_DENIED);
    });
  });

  it("B1 (eigene Gruppe, L01 frei) kann abgeben – Positivkontrolle Mandant B", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(B.p1);
      const r = await submit(tx, GRADED_QUIZ, B.cohort, ALL_CORRECT);
      expect(r.passed).toBe(true);
      expect(r.attempt_no).toBe(1);
    });
  });
});

describe("quiz_attempts – nur lesen", () => {
  it("direktes Einfuegen/Aendern ist fuer Teilnehmer nicht moeglich", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      expect(
        await tx.attempt(
          "insert into public.quiz_attempts (quiz_id, profile_id, cohort_id, attempt_no, score, passed) values ($1, $2, $3, 2, 99, true)",
          [QUIZ.free, A.p1, A.cohort],
        ),
      ).toMatch(RLS_VIOLATION);
      expect(await tx.affected("update public.quiz_attempts set score = 99, passed = true where id = $1", [A.quizAttemptP1])).toBe(0);
      expect(await tx.affected("delete from public.quiz_attempts where id = $1", [A.quizAttemptP1])).toBe(0);
      await tx.actAsService();
      const [row] = await tx.rows<{ score: number }>("select score from public.quiz_attempts where id = $1", [A.quizAttemptP1]);
      expect(row?.score).toBe(1);
    });
  });

  it("Trainer der Gruppe liest den Versuch, Teilnehmer B nicht, Org-Admin nicht, fremder Trainer nicht", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      const r = await submit(tx, GRADED_QUIZ, A.cohort, ALL_CORRECT);
      expect(await tx.count("select 1 from public.quiz_attempts where id = $1", [r.attempt_id])).toBe(1);
      await tx.actAs(A.trainer);
      expect(await tx.count("select 1 from public.quiz_attempts where id = $1", [r.attempt_id])).toBe(1);
      await tx.actAs(A.p2);
      expect(await tx.count("select 1 from public.quiz_attempts where id = $1", [r.attempt_id])).toBe(0);
      await tx.actAs(A.admin);
      expect(await tx.count("select 1 from public.quiz_attempts where id = $1", [r.attempt_id])).toBe(0);
      await tx.actAs(B.trainer);
      expect(await tx.count("select 1 from public.quiz_attempts where id = $1", [r.attempt_id])).toBe(0);
    });
  });
});

describe("Paritaet mit packages/domain gradeQuizAttempt", () => {
  const CASES: { name: string; answers: QuizAnswers }[] = [
    { name: "alles richtig", answers: ALL_CORRECT },
    { name: "single falsch", answers: { ...ALL_CORRECT, [Q.single]: O.singleWrong } },
    { name: "multiple teilweise", answers: { ...ALL_CORRECT, [Q.multiple]: [O.multiA] } },
    { name: "multiple zu viel", answers: { ...ALL_CORRECT, [Q.multiple]: [O.multiA, O.multiB, O.multiWrong] } },
    { name: "truefalse falsch", answers: { ...ALL_CORRECT, [Q.truefalse]: O.tfFalse } },
    { name: "nichts beantwortet", answers: {} },
    { name: "leere und ungueltige Werte", answers: { [Q.single]: "", [Q.multiple]: [], [Q.truefalse]: "x" } },
    { name: "Duplikate", answers: { ...ALL_CORRECT, [Q.multiple]: [O.multiB, O.multiA, O.multiA] } },
  ];

  async function loadQuestions(tx: Tx, quizId: string): Promise<QuizQuestionWithOptions[]> {
    await tx.actAsService();
    const questions = await tx.rows<QuizQuestionWithOptions & Record<string, unknown>>(
      `select q.id, q.quiz_id, q.position, q.kind, q.body, q.explanation, q.points,
              coalesce((select jsonb_agg(jsonb_build_object('id', o.id, 'question_id', o.question_id, 'position', o.position, 'body', o.body, 'is_correct', o.is_correct) order by o.position)
                        from public.quiz_options o where o.question_id = q.id), '[]'::jsonb) as options
         from public.quiz_questions q where q.quiz_id = $1 order by q.position`,
      [quizId],
    );
    return questions;
  }

  it.each(CASES)("$name: score/max/passed/je Frage identisch", async ({ answers }) => {
    await withTx(client, async (tx) => {
      const questions = await loadQuestions(tx, GRADED_QUIZ);
      const [quiz] = await tx.rows<{ pass_score: number | null }>("select pass_score from public.quizzes where id = $1", [GRADED_QUIZ]);
      const domain = gradeQuizAttempt(questions, answers, quiz!.pass_score);

      await tx.actAs(A.p1);
      const rpc = await submit(tx, GRADED_QUIZ, A.cohort, answers);
      expect(rpc.score).toBe(domain.score);
      expect(rpc.max_score).toBe(domain.maxScore);
      expect(rpc.passed).toBe(domain.passed);
      expect(rpc.results.map((r) => [r.question_id, r.correct, r.explanation])).toEqual(
        domain.perQuestion.map((r) => [r.questionId, r.correct, r.explanation]),
      );
    });
  });

  it("Paritaet auch ohne pass_score (passed null)", async () => {
    await withTx(client, async (tx) => {
      const questions = await loadQuestions(tx, GRADED_QUIZ);
      const domain = gradeQuizAttempt(questions, ALL_CORRECT, null);
      await tx.actAsService();
      await tx.affected("update public.quizzes set pass_score = null where id = $1", [GRADED_QUIZ]);
      await tx.actAs(A.p1);
      const rpc = await submit(tx, GRADED_QUIZ, A.cohort, ALL_CORRECT);
      expect(rpc.passed).toBe(domain.passed);
      expect(rpc.passed).toBeNull();
    });
  });
});

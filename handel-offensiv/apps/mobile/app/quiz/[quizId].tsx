/**
 * Quiz-Screen (§16): Fragen gescrollt (ruhig, kein Frage-Karussell),
 * Antworten sammeln, Abgeben -> gradeQuizAttempt (@handel-offensiv/domain)
 * für sofortiges Feedback mit Erklärungen + quiz_attempts-Insert
 * (attempt_no fortlaufend, max_attempts respektiert, deutsche Meldungen).
 * Ergebnis dezent mit Punkten/Bestanden – kein Arcade.
 */
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { colors, radius, spacing, touch } from "@handel-offensiv/config";
import type {
  QuizAttemptRow,
  QuizOptionRow,
  QuizQuestionRow,
  QuizRow,
} from "@handel-offensiv/types";
import {
  gradeQuizAttempt,
  type QuizAnswers,
  type QuizGradeResult,
  type QuizQuestionWithOptions,
} from "@handel-offensiv/domain";
import {
  Banner,
  Button,
  Card,
  Skeleton,
  TagPill,
  Text,
  archivoFamily,
} from "../../src/ui";
import { supabase } from "../../src/lib/supabase";
import { useSession } from "../../src/lib/auth-context";
import { DetailHeader } from "../../src/features/lesson/DetailHeader";

interface QuizBundle {
  quiz: QuizRow;
  questions: QuizQuestionWithOptions[];
  attempts: QuizAttemptRow[];
}

function shuffled<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = arr[i] as T;
    arr[i] = arr[j] as T;
    arr[j] = a;
  }
  return arr;
}

export default function QuizScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { quizId } = useLocalSearchParams<{ quizId: string }>();
  const { session, activeCohortId } = useSession();
  const profileId = session?.user.id ?? null;

  const bundleQuery = useQuery({
    queryKey: ["quiz", quizId, profileId],
    enabled: typeof quizId === "string" && profileId !== null,
    queryFn: async (): Promise<QuizBundle> => {
      const [quizRes, questionsRes, attemptsRes] = await Promise.all([
        supabase.from("quizzes").select("*").eq("id", quizId as string).maybeSingle(),
        supabase
          .from("quiz_questions")
          .select("*, options:quiz_options(*)")
          .eq("quiz_id", quizId as string)
          .order("position"),
        supabase
          .from("quiz_attempts")
          .select("*")
          .eq("quiz_id", quizId as string)
          .eq("profile_id", profileId as string)
          .order("attempt_no", { ascending: false }),
      ]);
      if (quizRes.error || quizRes.data === null || questionsRes.error || attemptsRes.error) {
        throw new Error(
          "Das Quiz konnte gerade nicht geladen werden. Bitte versuchen Sie es erneut.",
        );
      }
      const questions = (
        (questionsRes.data ?? []) as unknown as (QuizQuestionRow & {
          options: QuizOptionRow[];
        })[]
      ).map((q) => ({
        ...q,
        options: [...q.options].sort((a, b) => a.position - b.position),
      }));
      return {
        quiz: quizRes.data as QuizRow,
        questions,
        attempts: (attemptsRes.data ?? []) as QuizAttemptRow[],
      };
    },
  });

  const bundle = bundleQuery.data;
  const offline = bundleQuery.fetchStatus === "paused";

  // Reihenfolge einmalig mischen, falls konfiguriert (shuffle)
  const orderedQuestions = useMemo(() => {
    if (bundle === undefined) return [];
    return bundle.quiz.shuffle ? shuffled(bundle.questions) : bundle.questions;
  }, [bundle]);

  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [validationHint, setValidationHint] = useState<string | null>(null);
  const [result, setResult] = useState<QuizGradeResult | null>(null);

  const attemptsUsed = bundle?.attempts.filter((a) => a.completed_at !== null).length ?? 0;
  const maxAttempts = bundle?.quiz.max_attempts ?? null;
  const attemptsLeft =
    maxAttempts !== null ? Math.max(0, maxAttempts - attemptsUsed) : null;
  const attemptsExhausted = attemptsLeft !== null && attemptsLeft <= 0 && result === null;

  const selectSingle = (questionId: string, optionId: string): void => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setValidationHint(null);
  };
  const toggleMultiple = (questionId: string, optionId: string): void => {
    setAnswers((prev) => {
      const current = prev[questionId];
      const set = new Set(Array.isArray(current) ? current : []);
      if (set.has(optionId)) set.delete(optionId);
      else set.add(optionId);
      return { ...prev, [questionId]: [...set] };
    });
    setValidationHint(null);
  };
  const setFreetext = (questionId: string, text: string): void => {
    setAnswers((prev) => ({ ...prev, [questionId]: text }));
  };

  const submitMutation = useMutation({
    mutationFn: async (): Promise<QuizGradeResult> => {
      if (
        bundle === undefined ||
        profileId === null ||
        activeCohortId === null ||
        typeof quizId !== "string"
      ) {
        throw new Error(
          "Ihre Antworten konnten gerade nicht gespeichert werden. Bitte versuchen Sie es erneut.",
        );
      }
      const nextAttemptNo = (bundle.attempts[0]?.attempt_no ?? 0) + 1;
      const grade = gradeQuizAttempt(bundle.questions, answers, bundle.quiz.pass_score);
      const { error } = await supabase.from("quiz_attempts").insert({
        quiz_id: quizId,
        profile_id: profileId,
        cohort_id: activeCohortId,
        attempt_no: nextAttemptNo,
        answers: answers as never,
        score: grade.score,
        passed: grade.passed,
        completed_at: new Date().toISOString(),
      });
      if (error !== null) {
        throw new Error(
          "Ihre Antworten konnten gerade nicht gespeichert werden. Bitte versuchen Sie es erneut.",
        );
      }
      return grade;
    },
    onSuccess: (grade) => {
      setResult(grade);
      void queryClient.invalidateQueries({ queryKey: ["quiz", quizId] });
      void queryClient.invalidateQueries({ queryKey: ["quiz-status"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const submit = (): void => {
    if (bundle === undefined) return;
    if (attemptsLeft !== null && attemptsLeft <= 0) {
      setValidationHint("Sie haben die maximale Anzahl an Versuchen erreicht.");
      return;
    }
    const unanswered = bundle.questions.filter((q) => {
      if (q.kind === "freetext") return false;
      const value = answers[q.id];
      if (value === undefined || value === null) return true;
      return Array.isArray(value) ? value.length === 0 : value.length === 0;
    });
    if (unanswered.length > 0) {
      setValidationHint(
        unanswered.length === 1
          ? "Bitte beantworten Sie noch eine Frage."
          : `Bitte beantworten Sie noch ${unanswered.length} Fragen.`,
      );
      return;
    }
    setValidationHint(null);
    submitMutation.mutate();
  };

  const retry = (): void => {
    setAnswers({});
    setResult(null);
    setValidationHint(null);
    submitMutation.reset();
  };

  const resultByQuestion = new Map(
    (result?.perQuestion ?? []).map((r) => [r.questionId, r]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <DetailHeader kicker="Quiz" />

          {offline ? <Banner kind="offline" /> : null}

          {bundleQuery.isLoading ? (
            <View style={styles.stack}>
              <Skeleton height={32} width="70%" />
              <Skeleton height={120} />
              <Skeleton height={120} />
            </View>
          ) : bundle === undefined ? (
            <Banner kind="error" onRetry={() => void bundleQuery.refetch()} />
          ) : (
            <View style={styles.stack}>
              <Text variant="h1" accessibilityRole="header">
                {bundle.quiz.title}
              </Text>
              {bundle.quiz.description !== null ? (
                <Text variant="body" muted>
                  {bundle.quiz.description}
                </Text>
              ) : null}
              {maxAttempts !== null && result === null ? (
                <Text variant="small" muted>
                  {attemptsExhausted
                    ? "Sie haben die maximale Anzahl an Versuchen erreicht."
                    : `Versuch ${attemptsUsed + 1} von ${maxAttempts}.`}
                </Text>
              ) : null}

              {/* Ergebnis (nach Abgabe) */}
              {result !== null ? (
                <Card tone="dark">
                  <View style={styles.stackSm}>
                    <View style={styles.rowBetween}>
                      <Text variant="small" color={colors.paper}>
                        Ihr Ergebnis
                      </Text>
                      {result.passed !== null ? (
                        <TagPill
                          label={result.passed ? "Bestanden" : "Nicht bestanden"}
                          tone={result.passed ? "green" : "neutral"}
                        />
                      ) : null}
                    </View>
                    <Text variant="h2" color={colors.greenBright}>
                      {result.score} von {result.maxScore} Punkten
                    </Text>
                    {result.passed === false && attemptsLeft !== null ? (
                      <Text variant="small" color={colors.paper}>
                        {attemptsLeft > 0
                          ? `Noch ${attemptsLeft} ${attemptsLeft === 1 ? "Versuch" : "Versuche"} übrig.`
                          : "Sie haben die maximale Anzahl an Versuchen erreicht."}
                      </Text>
                    ) : null}
                  </View>
                </Card>
              ) : null}

              {attemptsExhausted ? (
                <Banner
                  kind="info"
                  message="Sie haben die maximale Anzahl an Versuchen erreicht. Ihr letztes Ergebnis bleibt gespeichert."
                />
              ) : (
                orderedQuestions.map((question, index) => {
                  const qResult = resultByQuestion.get(question.id);
                  const value = answers[question.id];
                  const selectedSet = new Set(
                    Array.isArray(value) ? value : typeof value === "string" ? [value] : [],
                  );
                  const isMultiple = question.kind === "multiple";
                  const isFreetext = question.kind === "freetext";
                  return (
                    <Card key={question.id}>
                      <View style={styles.stackSm}>
                        <Text variant="small" muted>
                          Frage {index + 1} von {orderedQuestions.length}
                          {question.points > 1 ? ` · ${question.points} Punkte` : ""}
                        </Text>
                        <Text variant="h3">{question.body}</Text>

                        {isFreetext ? (
                          <>
                            <TextInput
                              multiline
                              editable={result === null}
                              value={typeof value === "string" ? value : ""}
                              onChangeText={(t) => setFreetext(question.id, t)}
                              placeholder="Ihre Antwort …"
                              placeholderTextColor={colors.inkSoft}
                              accessibilityLabel={`Antwort auf Frage ${index + 1}`}
                              style={styles.input}
                              textAlignVertical="top"
                            />
                            {result !== null ? (
                              <Text variant="small" muted>
                                Freitextantworten werden nicht automatisch bewertet.
                              </Text>
                            ) : null}
                          </>
                        ) : (
                          <View>
                            {isMultiple ? (
                              <Text variant="small" muted>
                                Mehrere Antworten möglich.
                              </Text>
                            ) : null}
                            {question.options.map((option) => {
                              const isSelected = selectedSet.has(option.id);
                              const reveal = result !== null;
                              const showCorrect = reveal && option.is_correct;
                              const showWrong = reveal && isSelected && !option.is_correct;
                              return (
                                <Pressable
                                  key={option.id}
                                  accessibilityRole={isMultiple ? "checkbox" : "radio"}
                                  accessibilityState={{
                                    checked: isSelected,
                                    disabled: reveal,
                                  }}
                                  accessibilityLabel={
                                    reveal
                                      ? `${option.body}. ${showCorrect ? "Richtige Antwort." : showWrong ? "Nicht richtig." : ""}`
                                      : option.body
                                  }
                                  disabled={reveal}
                                  onPress={() =>
                                    isMultiple
                                      ? toggleMultiple(question.id, option.id)
                                      : selectSingle(question.id, option.id)
                                  }
                                  style={({ pressed }) => [
                                    styles.option,
                                    { opacity: pressed ? 0.7 : 1 },
                                  ]}
                                >
                                  <Feather
                                    name={
                                      showCorrect
                                        ? "check-circle"
                                        : showWrong
                                          ? "x-circle"
                                          : isMultiple
                                            ? isSelected
                                              ? "check-square"
                                              : "square"
                                            : isSelected
                                              ? "disc"
                                              : "circle"
                                    }
                                    size={22}
                                    color={
                                      showCorrect
                                        ? colors.success
                                        : showWrong
                                          ? colors.danger
                                          : isSelected
                                            ? colors.greenDeep
                                            : colors.inkSoft
                                    }
                                  />
                                  <Text variant="body" style={styles.optionText}>
                                    {option.body}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        )}

                        {/* Auflösung nach Abgabe */}
                        {qResult !== undefined && qResult.correct !== null ? (
                          <Text
                            variant="small"
                            color={qResult.correct ? colors.success : colors.danger}
                          >
                            {qResult.correct ? "Richtig beantwortet." : "Nicht richtig."}
                          </Text>
                        ) : null}
                        {result !== null &&
                        qResult?.explanation !== null &&
                        qResult?.explanation !== undefined ? (
                          <Text variant="small" muted>
                            {qResult.explanation}
                          </Text>
                        ) : null}
                      </View>
                    </Card>
                  );
                })
              )}

              {/* Aktionen */}
              <View style={styles.actionStack}>
                {validationHint !== null ? (
                  <Banner kind="info" message={validationHint} />
                ) : null}
                {submitMutation.isError ? (
                  <Banner
                    kind="error"
                    message={
                      submitMutation.error instanceof Error
                        ? submitMutation.error.message
                        : undefined
                    }
                    onRetry={submit}
                  />
                ) : null}

                {result === null && !attemptsExhausted ? (
                  <Button
                    label="Antworten abgeben"
                    loading={submitMutation.isPending}
                    onPress={submit}
                  />
                ) : null}
                {result !== null &&
                result.passed === false &&
                (attemptsLeft === null || attemptsLeft > 0) ? (
                  <Button label="Erneut versuchen" variant="secondary" onPress={retry} />
                ) : null}
                <Button
                  label="Zurück zur Lektion"
                  variant={result === null && !attemptsExhausted ? "ghost" : "primary"}
                  onPress={() => {
                    if (router.canGoBack()) router.back();
                    else router.replace("/(tabs)/programm" as never);
                  }}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  stack: { gap: spacing.md },
  stackSm: { gap: spacing.sm },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  option: {
    minHeight: touch.minTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  optionText: { flex: 1 },
  input: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.base,
    backgroundColor: colors.white,
    padding: spacing.md,
    fontSize: 16,
    fontFamily: archivoFamily("400"),
    color: colors.ink,
  },
  actionStack: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});

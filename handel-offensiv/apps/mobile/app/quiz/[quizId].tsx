/**
 * Quiz-Screen (§16): Fragen gescrollt (ruhig, kein Frage-Karussell),
 * Antworten sammeln, Abgeben -> RPC submit_quiz_attempt (Migration 0007).
 * Die Bewertung passiert ausschliesslich in der Datenbank: der Client kennt
 * die Loesung nicht (View quiz_options_public ohne is_correct) und zeigt
 * nach der Abgabe das Ergebnis aus der RPC (richtig/falsch je Frage,
 * richtige Optionen, Erklaerungen). Deutsche Meldungen, max_attempts wird
 * serverseitig erzwungen. Ergebnis dezent mit Punkten/Bestanden – kein Arcade.
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
import type { QuizAttemptRow, QuizQuestionRow, QuizRow } from "@handel-offensiv/types";
import {
  parseQuizSubmitResult,
  type QuizAnswers,
  type QuizOptionPublic,
  type QuizQuestionWithPublicOptions,
  type QuizSubmitResult,
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
  questions: QuizQuestionWithPublicOptions[];
  attempts: QuizAttemptRow[];
}

const LOAD_ERROR =
  "Das Quiz konnte gerade nicht geladen werden. Bitte versuchen Sie es erneut.";
const SUBMIT_ERROR =
  "Ihre Antworten konnten gerade nicht gespeichert werden. Bitte versuchen Sie es erneut.";
const MAX_ATTEMPTS_TEXT = "Sie haben die maximale Anzahl an Versuchen erreicht.";

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
          .select("*")
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
        throw new Error(LOAD_ERROR);
      }
      const questionRows = (questionsRes.data ?? []) as QuizQuestionRow[];

      // Optionen OHNE Loesung ueber die View quiz_options_public
      let options: QuizOptionPublic[] = [];
      if (questionRows.length > 0) {
        const optionsRes = await supabase
          .from("quiz_options_public")
          .select("*")
          .in(
            "question_id",
            questionRows.map((q) => q.id),
          )
          .order("position");
        if (optionsRes.error) throw new Error(LOAD_ERROR);
        options = (optionsRes.data ?? []) as QuizOptionPublic[];
      }
      const optionsByQuestion = new Map<string, QuizOptionPublic[]>();
      for (const option of options) {
        const list = optionsByQuestion.get(option.question_id) ?? [];
        list.push(option);
        optionsByQuestion.set(option.question_id, list);
      }
      const questions: QuizQuestionWithPublicOptions[] = questionRows.map((q) => ({
        ...q,
        options: [...(optionsByQuestion.get(q.id) ?? [])].sort(
          (a, b) => a.position - b.position,
        ),
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
  const [result, setResult] = useState<QuizSubmitResult | null>(null);

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
    mutationFn: async (): Promise<QuizSubmitResult> => {
      if (
        bundle === undefined ||
        profileId === null ||
        activeCohortId === null ||
        typeof quizId !== "string"
      ) {
        throw new Error(SUBMIT_ERROR);
      }
      // Bewertung + Speichern in der Datenbank (Freischaltung, Mitgliedschaft
      // und max_attempts werden dort geprueft)
      const { data, error } = await supabase.rpc("submit_quiz_attempt", {
        p_quiz_id: quizId,
        p_cohort_id: activeCohortId,
        p_answers: answers,
      });
      if (error !== null) {
        throw new Error(
          error.message.includes("maximale Anzahl an Versuchen")
            ? MAX_ATTEMPTS_TEXT
            : SUBMIT_ERROR,
        );
      }
      const parsed = parseQuizSubmitResult(data);
      if (parsed === null) throw new Error(SUBMIT_ERROR);
      return parsed;
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
      setValidationHint(MAX_ATTEMPTS_TEXT);
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

  // Ergebnis je Frage aus der RPC (Loesung erst nach der Abgabe bekannt)
  const resultByQuestion = new Map((result?.results ?? []).map((r) => [r.question_id, r]));
  // Nach der Abgabe: verbleibende Versuche aus der RPC-Nummerierung ableiten
  const attemptsLeftAfter =
    result !== null && maxAttempts !== null
      ? Math.max(0, maxAttempts - result.attempt_no)
      : attemptsLeft;

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
                    ? MAX_ATTEMPTS_TEXT
                    : `Versuch ${attemptsUsed + 1} von ${maxAttempts}.`}
                </Text>
              ) : null}

              {/* Ergebnis (nach Abgabe, aus der Datenbank) */}
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
                      {result.score} von {result.max_score} Punkten
                    </Text>
                    {result.passed === false && attemptsLeftAfter !== null ? (
                      <Text variant="small" color={colors.paper}>
                        {attemptsLeftAfter > 0
                          ? `Noch ${attemptsLeftAfter} ${attemptsLeftAfter === 1 ? "Versuch" : "Versuche"} übrig.`
                          : MAX_ATTEMPTS_TEXT}
                      </Text>
                    ) : null}
                  </View>
                </Card>
              ) : null}

              {attemptsExhausted ? (
                <Banner
                  kind="info"
                  message={`${MAX_ATTEMPTS_TEXT} Ihr letztes Ergebnis bleibt gespeichert.`}
                />
              ) : (
                orderedQuestions.map((question, index) => {
                  const qResult = resultByQuestion.get(question.id);
                  const value = answers[question.id];
                  const selectedSet = new Set(
                    Array.isArray(value) ? value : typeof value === "string" ? [value] : [],
                  );
                  const correctSet = new Set(qResult?.correct_option_ids ?? []);
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
                              const reveal = qResult !== undefined;
                              const showCorrect = reveal && correctSet.has(option.id);
                              const showWrong = reveal && isSelected && !correctSet.has(option.id);
                              return (
                                <Pressable
                                  key={option.id}
                                  accessibilityRole={isMultiple ? "checkbox" : "radio"}
                                  accessibilityState={{
                                    checked: isSelected,
                                    disabled: result !== null,
                                  }}
                                  accessibilityLabel={
                                    reveal
                                      ? `${option.body}. ${showCorrect ? "Richtige Antwort." : showWrong ? "Nicht richtig." : ""}`
                                      : option.body
                                  }
                                  disabled={result !== null}
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
                        {qResult !== undefined && qResult.explanation !== null ? (
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
                (attemptsLeftAfter === null || attemptsLeftAfter > 0) ? (
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

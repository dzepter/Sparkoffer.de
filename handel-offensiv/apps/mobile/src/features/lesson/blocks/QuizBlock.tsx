/**
 * quiz-Block (§13/§16): ruhige Karte mit Stand der Versuche; das Quiz
 * selbst läuft im eigenen Screen app/quiz/[quizId]. Gilt als bearbeitet,
 * sobald ein abgeschlossener Versuch existiert.
 */
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { spacing } from "@handel-offensiv/config";
import type { QuizAttemptRow, QuizRow } from "@handel-offensiv/types";
import type { BlockConfigMap } from "@handel-offensiv/validation";
import { Banner, Button, Card, Skeleton, TagPill, Text } from "../../../ui";
import { supabase } from "../../../lib/supabase";

export interface QuizBlockProps {
  blockId: string;
  profileId: string;
  config: BlockConfigMap["quiz"];
  onDoneChange: (blockId: string, done: boolean) => void;
}

interface QuizStatus {
  quiz: QuizRow;
  attempts: QuizAttemptRow[];
}

export function QuizBlock({ blockId, profileId, config, onDoneChange }: QuizBlockProps) {
  const router = useRouter();

  const statusQuery = useQuery({
    queryKey: ["quiz-status", config.quizId, profileId],
    queryFn: async (): Promise<QuizStatus> => {
      const [quizRes, attemptsRes] = await Promise.all([
        supabase.from("quizzes").select("*").eq("id", config.quizId).maybeSingle(),
        supabase
          .from("quiz_attempts")
          .select("*")
          .eq("quiz_id", config.quizId)
          .eq("profile_id", profileId)
          .order("attempt_no", { ascending: false }),
      ]);
      if (quizRes.error || quizRes.data === null || attemptsRes.error) {
        throw new Error(
          "Der Inhalt konnte gerade nicht geladen werden. Bitte versuchen Sie es erneut.",
        );
      }
      return {
        quiz: quizRes.data as QuizRow,
        attempts: (attemptsRes.data ?? []) as QuizAttemptRow[],
      };
    },
  });

  const completedAttempts =
    statusQuery.data?.attempts.filter((a) => a.completed_at !== null) ?? [];
  const lastAttempt = completedAttempts[0];
  const done = completedAttempts.length > 0;

  useEffect(() => {
    if (statusQuery.isSuccess) onDoneChange(blockId, done);
  }, [statusQuery.isSuccess, done, blockId, onDoneChange]);

  if (statusQuery.isLoading) {
    return (
      <Card>
        <Skeleton height={96} />
      </Card>
    );
  }
  if (statusQuery.data === undefined) {
    return (
      <Card>
        <Banner kind="error" onRetry={() => void statusQuery.refetch()} />
      </Card>
    );
  }

  const { quiz } = statusQuery.data;
  const maxAttempts = quiz.max_attempts;
  const attemptsUsed = completedAttempts.length;
  const attemptsLeft = maxAttempts !== null ? Math.max(0, maxAttempts - attemptsUsed) : null;
  const canStart = attemptsLeft === null || attemptsLeft > 0;

  return (
    <Card>
      <View style={styles.stack}>
        <View style={styles.metaRow}>
          <TagPill label="Quiz" tone="dark" />
          {lastAttempt !== undefined && lastAttempt.passed === true ? (
            <TagPill label="Bestanden" tone="green" />
          ) : null}
        </View>
        <Text variant="h3">{quiz.title}</Text>
        {quiz.description !== null && quiz.description.length > 0 ? (
          <Text variant="small" muted>
            {quiz.description}
          </Text>
        ) : null}
        <Text variant="small" muted>
          {attemptsUsed === 0
            ? maxAttempts !== null
              ? `Noch kein Versuch. ${maxAttempts} ${maxAttempts === 1 ? "Versuch" : "Versuche"} möglich.`
              : "Noch kein Versuch."
            : `Letztes Ergebnis: ${lastAttempt?.score ?? 0} Punkte.${
                attemptsLeft !== null
                  ? ` Noch ${attemptsLeft} ${attemptsLeft === 1 ? "Versuch" : "Versuche"} übrig.`
                  : ""
              }`}
        </Text>
        {canStart ? (
          <Button
            label={attemptsUsed === 0 ? "Quiz starten" : "Quiz erneut starten"}
            onPress={() => router.push(`/quiz/${config.quizId}` as never)}
          />
        ) : (
          <Text variant="small" muted>
            Sie haben die maximale Anzahl an Versuchen erreicht.
          </Text>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

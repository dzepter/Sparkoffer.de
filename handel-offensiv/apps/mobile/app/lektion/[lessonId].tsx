/**
 * Lektions-Renderer (§13): lädt Lektion + Blöcke, rendert alle 14 Blocktypen
 * über den BlockRenderer und bietet unten LEKTION ABSCHLIESSEN – nur wenn
 * alle required-Blöcke bearbeitet sind, sonst verständlicher Hinweis,
 * was fehlt. Zustände: Loading / Error / Offline / Gesperrt (§34).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "@handel-offensiv/config";
import type { LessonWithBlocks, Uuid } from "@handel-offensiv/types";
import { Banner, Button, Skeleton, TagPill, Text } from "../../src/ui";
import { supabase } from "../../src/lib/supabase";
import { useSession } from "../../src/lib/auth-context";
import { useCurriculum } from "../../src/features/programm/data";
import { BlockRenderer } from "../../src/features/lesson/blocks";
import {
  completeLesson,
  findMissingRequiredBlocks,
  markLessonInProgress,
  missingBlocksMessage,
} from "../../src/features/lesson/complete";
import { DetailHeader } from "../../src/features/lesson/DetailHeader";
import { formatDue, formatMinutes } from "../../src/features/lesson/format";

export default function LessonScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const { session, activeCohortId } = useSession();
  const profileId = session?.user.id ?? null;

  const curriculum = useCurriculum();
  const offline = curriculum.fetchStatus === "paused";

  const lessonQuery = useQuery({
    queryKey: ["lesson", lessonId],
    enabled: typeof lessonId === "string" && lessonId.length > 0,
    queryFn: async (): Promise<LessonWithBlocks> => {
      const res = await supabase
        .from("lessons")
        .select("*, content_blocks(*)")
        .eq("id", lessonId as string)
        .maybeSingle();
      if (res.error || res.data === null) {
        throw new Error(
          "Der Inhalt konnte gerade nicht geladen werden. Bitte versuchen Sie es erneut.",
        );
      }
      const lesson = res.data as unknown as LessonWithBlocks;
      lesson.content_blocks = [...lesson.content_blocks].sort(
        (a, b) => a.position - b.position,
      );
      return lesson;
    },
  });

  const lesson = lessonQuery.data;
  const access =
    typeof lessonId === "string"
      ? curriculum.data?.accessByLessonId[lessonId]
      : undefined;
  const isLocked = access !== undefined && !access.released;
  const isCompleted =
    typeof lessonId === "string" &&
    (curriculum.data?.completedLessonIds.includes(lessonId) ?? false);

  // Bearbeitungsstand der interaktiven Blöcke (blockId -> done)
  const [blockDone, setBlockDone] = useState<Record<string, boolean>>({});
  const [missingHint, setMissingHint] = useState<string | null>(null);
  const handleDoneChange = useCallback((blockId: string, done: boolean) => {
    setBlockDone((prev) => (prev[blockId] === done ? prev : { ...prev, [blockId]: done }));
    setMissingHint(null);
  }, []);

  // Beim Öffnen als begonnen markieren (einmalig, unkritisch bei Fehler)
  const startedRef = useRef(false);
  useEffect(() => {
    if (
      startedRef.current ||
      profileId === null ||
      activeCohortId === null ||
      typeof lessonId !== "string" ||
      isLocked ||
      curriculum.data === undefined
    ) {
      return;
    }
    startedRef.current = true;
    void markLessonInProgress({
      lessonId,
      profileId,
      cohortId: activeCohortId,
    });
  }, [profileId, activeCohortId, lessonId, isLocked, curriculum.data]);

  const completeMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (profileId === null || activeCohortId === null || typeof lessonId !== "string") {
        throw new Error(
          "Der Abschluss konnte gerade nicht gespeichert werden. Bitte versuchen Sie es erneut.",
        );
      }
      await completeLesson({ lessonId, profileId, cohortId: activeCohortId });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["curriculum"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const onComplete = (): void => {
    if (lesson === undefined) return;
    const missing = findMissingRequiredBlocks(lesson.content_blocks, blockDone);
    if (missing.length > 0) {
      setMissingHint(missingBlocksMessage(missing));
      return;
    }
    setMissingHint(null);
    completeMutation.mutate();
  };

  const loading = lessonQuery.isLoading || curriculum.isLoading;
  const loadError =
    (lessonQuery.isError && lesson === undefined) ||
    (curriculum.isError && curriculum.data === undefined);

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
          <DetailHeader kicker="Lektion" />

          {offline ? <Banner kind="offline" /> : null}

          {loading ? (
            <View style={styles.stack}>
              <Skeleton height={32} width="80%" />
              <Skeleton height={120} />
              <Skeleton height={120} />
              <Skeleton height={56} />
            </View>
          ) : loadError ? (
            <Banner
              kind="error"
              onRetry={() => {
                void lessonQuery.refetch();
                void curriculum.refetch();
              }}
            />
          ) : lesson === undefined ? (
            <Banner
              kind="info"
              message="Diese Lektion wurde nicht gefunden. Bitte kehren Sie zum Programm zurück."
            />
          ) : isLocked ? (
            <View style={styles.stack}>
              <Text variant="h1" accessibilityRole="header">
                {lesson.title}
              </Text>
              <View style={styles.lockedRow}>
                <Feather name="lock" size={20} color={colors.inkSoft} />
                <Text variant="body" muted style={styles.lockedText}>
                  {access?.lockedLabel ?? "Diese Lektion ist noch nicht freigeschaltet."}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.stack}>
              {/* Kopf */}
              <Text variant="h1" accessibilityRole="header">
                {lesson.title}
              </Text>
              <View style={styles.metaRow}>
                {isCompleted ? <TagPill label="Erledigt" tone="green" /> : null}
                {lesson.estimated_minutes !== null ? (
                  <Text variant="small" muted>
                    {formatMinutes(lesson.estimated_minutes)}
                  </Text>
                ) : null}
                {access?.dueAt !== undefined ? (
                  <Text variant="small" color={colors.warning}>
                    {formatDue(access.dueAt)}
                  </Text>
                ) : null}
              </View>
              {lesson.summary !== null ? (
                <Text variant="body" muted>
                  {lesson.summary}
                </Text>
              ) : null}

              {/* Inhaltsbausteine */}
              {lesson.content_blocks.length === 0 ? (
                <Banner
                  kind="info"
                  message="Für diese Lektion sind noch keine Inhalte veröffentlicht."
                />
              ) : (
                profileId !== null &&
                activeCohortId !== null &&
                lesson.content_blocks.map((block) => (
                  <BlockRenderer
                    key={block.id}
                    block={block}
                    profileId={profileId as Uuid}
                    cohortId={activeCohortId}
                    onDoneChange={handleDoneChange}
                  />
                ))
              )}

              {/* Abschluss */}
              <View style={styles.completeStack}>
                {missingHint !== null ? (
                  <Banner kind="info" message={missingHint} />
                ) : null}
                {completeMutation.isError ? (
                  <Banner
                    kind="error"
                    message={
                      completeMutation.error instanceof Error
                        ? completeMutation.error.message
                        : undefined
                    }
                    onRetry={onComplete}
                  />
                ) : null}
                {completeMutation.isSuccess ? (
                  <Banner
                    kind="success"
                    message="Lektion abgeschlossen. Weiter so!"
                  />
                ) : null}
                {isCompleted && !completeMutation.isSuccess ? (
                  <Text variant="small" muted>
                    Sie haben diese Lektion bereits abgeschlossen.
                  </Text>
                ) : null}
                {completeMutation.isSuccess ? (
                  <Button
                    label="Zurück zur Übersicht"
                    variant="secondary"
                    onPress={() => {
                      if (router.canGoBack()) router.back();
                      else router.replace("/(tabs)/programm" as never);
                    }}
                  />
                ) : (
                  <Button
                    label="Lektion abschliessen"
                    loading={completeMutation.isPending}
                    disabled={isCompleted}
                    onPress={onComplete}
                  />
                )}
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
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  lockedRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  lockedText: { flex: 1 },
  completeStack: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});

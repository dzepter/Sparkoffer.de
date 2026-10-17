/**
 * Modul-Detail (§12): Lernphasen des Moduls (VOR DEM OFFENSIVTAG /
 * OFFENSIVTAG / NACH DEM OFFENSIVTAG / VORBEREITUNG …) mit Lektionsliste.
 * Status je Lektion: offen / erledigt / gesperrt inkl. "Wird nach …
 * freigeschaltet"-Vorschau aus der Release-Engine (§9).
 */
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "@handel-offensiv/config";
import type { LearningPhaseRow, LessonRow, PhaseType } from "@handel-offensiv/types";
import {
  Banner,
  Card,
  Kicker,
  ListRow,
  ModuleNumber,
  ProgressLine,
  Skeleton,
  Text,
} from "../../src/ui";
import { useCurriculum, type Curriculum } from "../../src/features/programm/data";
import { DetailHeader } from "../../src/features/lesson/DetailHeader";
import { formatMinutes } from "../../src/features/lesson/format";

/** Phasen-Label (§12); custom nutzt den redaktionellen Titel */
function phaseLabel(phase: LearningPhaseRow): string {
  const byType: Record<Exclude<PhaseType, "custom">, string> = {
    before_day: "Vor dem Offensivtag",
    day: "Offensivtag",
    after_day: "Nach dem Offensivtag",
    prep_next: "Vorbereitung auf den nächsten Offensivtag",
  };
  return phase.phase_type === "custom" ? phase.title : byType[phase.phase_type];
}

function lessonSubtitle(
  lesson: LessonRow,
  curriculum: Curriculum,
  completed: boolean,
): string {
  const access = curriculum.accessByLessonId[lesson.id];
  if (access !== undefined && !access.released) {
    return access.lockedLabel ?? "Diese Lektion ist noch nicht freigeschaltet.";
  }
  const parts: string[] = [];
  if (completed) parts.push("Erledigt");
  else parts.push("Offen");
  if (lesson.estimated_minutes !== null) {
    parts.push(formatMinutes(lesson.estimated_minutes));
  }
  return parts.join(" · ");
}

export default function ModuleDetailScreen() {
  const router = useRouter();
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const curriculum = useCurriculum();
  const offline = curriculum.fetchStatus === "paused";

  const data = curriculum.data;
  const module = data?.modules.find((m) => m.id === moduleId);
  const phases = data?.phases.filter((p) => p.module_id === moduleId) ?? [];
  const completedSet = new Set(data?.completedLessonIds ?? []);

  const moduleLessons =
    data?.lessons.filter((l) => phases.some((p) => p.id === l.learning_phase_id)) ?? [];
  const completedCount = moduleLessons.filter((l) => completedSet.has(l.id)).length;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <DetailHeader
          kicker={module !== undefined ? `Modul ${module.number_label}` : undefined}
        />

        {offline ? <Banner kind="offline" /> : null}

        {curriculum.isLoading ? (
          <View style={styles.stack}>
            <Skeleton height={80} />
            <Skeleton height={56} />
            <Skeleton height={56} />
            <Skeleton height={56} />
          </View>
        ) : curriculum.isError && data === undefined ? (
          <Banner kind="error" onRetry={() => void curriculum.refetch()} />
        ) : module === undefined ? (
          <Banner
            kind="info"
            message="Dieses Modul wurde nicht gefunden. Bitte kehren Sie zum Programm zurück."
          />
        ) : (
          <View style={styles.stack}>
            {/* Modulkopf */}
            <View style={styles.headerRow}>
              <ModuleNumber number={module.number_label} tone="green" size={72} />
              <View style={styles.headerText}>
                <Text variant="h1" accessibilityRole="header">
                  {module.title}
                </Text>
                {module.claim !== null ? (
                  <Text variant="small" muted>
                    {module.claim}
                  </Text>
                ) : null}
              </View>
            </View>
            {module.description !== null ? (
              <Text variant="body" muted>
                {module.description}
              </Text>
            ) : null}

            {/* Modul-Fortschritt */}
            {moduleLessons.length > 0 ? (
              <Card>
                <View style={styles.progressStack}>
                  <View style={styles.rowBetween}>
                    <Text variant="small" muted>
                      Fortschritt
                    </Text>
                    <Text variant="small" muted>
                      {completedCount} von {moduleLessons.length} Lektionen
                    </Text>
                  </View>
                  <ProgressLine
                    value={
                      moduleLessons.length === 0
                        ? 0
                        : completedCount / moduleLessons.length
                    }
                    accessibilityLabel={`${completedCount} von ${moduleLessons.length} Lektionen abgeschlossen`}
                  />
                </View>
              </Card>
            ) : null}

            {/* Lernphasen */}
            {phases.length === 0 ? (
              <Banner
                kind="info"
                message="Für dieses Modul sind noch keine Inhalte veröffentlicht."
              />
            ) : (
              phases.map((phase) => {
                const phaseLessons =
                  data?.lessons.filter((l) => l.learning_phase_id === phase.id) ?? [];
                if (phaseLessons.length === 0) return null;
                return (
                  <View key={phase.id} style={styles.phaseStack}>
                    <Kicker>{phaseLabel(phase)}</Kicker>
                    <Card padded={false}>
                      <View style={styles.listPad}>
                        {phaseLessons.map((lesson) => {
                          const access = data?.accessByLessonId[lesson.id];
                          const released = access?.released === true;
                          const completed = completedSet.has(lesson.id);
                          return (
                            <ListRow
                              key={lesson.id}
                              title={lesson.title}
                              subtitle={lessonSubtitle(lesson, data as Curriculum, completed)}
                              disabled={!released}
                              leading={
                                completed ? (
                                  <Feather
                                    name="check"
                                    size={18}
                                    color={colors.success}
                                  />
                                ) : !released ? (
                                  <Feather
                                    name="lock"
                                    size={18}
                                    color={colors.inkSoft}
                                  />
                                ) : (
                                  <Feather
                                    name="circle"
                                    size={18}
                                    color={colors.greenDeep}
                                  />
                                )
                              }
                              onPress={
                                released
                                  ? () =>
                                      router.push(`/lektion/${lesson.id}` as never)
                                  : undefined
                              }
                              chevron={released}
                            />
                          );
                        })}
                      </View>
                    </Card>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  stack: { gap: spacing.md },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  headerText: { flex: 1, gap: spacing.xs },
  progressStack: { gap: spacing.sm },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  phaseStack: { gap: spacing.sm },
  listPad: { paddingHorizontal: spacing.md },
});

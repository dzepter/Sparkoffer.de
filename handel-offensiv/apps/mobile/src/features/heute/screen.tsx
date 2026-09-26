/**
 * HEUTE (§10): ruhiger Tagesüberblick – kein Feed.
 * Begrüßung nach Tageszeit, AKTUELLE PHASE, NÄCHSTER OFFENSIVTAG,
 * JETZT WEITERMACHEN, OFFENE AUFGABEN (max. 3), MEIN FORTSCHRITT,
 * NEUE NACHRICHT. Zustände: Loading / Error / Offline / Empty (§34).
 */
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "@handel-offensiv/config";
import type { DashboardOpenTask } from "@handel-offensiv/types";
import {
  Banner,
  Button,
  Card,
  Kicker,
  ListRow,
  ModuleNumber,
  ProgressLine,
  Skeleton,
  TagPill,
  Text,
} from "../../ui";
import { useSession } from "../../lib/auth-context";
import { useDashboard } from "./data";
import {
  formatDateLong,
  formatDue,
  formatInDays,
  formatMinutes,
  formatTime,
} from "../lesson/format";
import { blockTypeLabel } from "../lesson/complete";

function greeting(now: Date): string {
  const hour = Number(
    new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      hour: "numeric",
      hour12: false,
    }).format(now),
  );
  if (hour < 11) return "Guten Morgen";
  if (hour < 18) return "Guten Tag";
  return "Guten Abend";
}

function taskSubtitle(task: DashboardOpenTask): string {
  const label = blockTypeLabel(task.blockType);
  return task.dueAt !== null ? `${label} · ${formatDue(task.dueAt)}` : label;
}

export default function HeuteScreen() {
  const router = useRouter();
  const { profile } = useSession();
  const dashboard = useDashboard();

  const firstName = profile?.first_name ?? null;
  const hello = `${greeting(new Date())}${firstName !== null ? `, ${firstName}.` : "."}`;

  const data = dashboard.data;
  const offline = dashboard.fetchStatus === "paused";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={dashboard.isRefetching}
            onRefresh={() => void dashboard.refetch()}
            tintColor={colors.inkSoft}
          />
        }
      >
        <View style={styles.stack}>
          <Kicker>Heute</Kicker>
          <Text variant="h1" accessibilityRole="header">
            {hello}
          </Text>

          {offline ? <Banner kind="offline" /> : null}

          {dashboard.isLoading ? (
            <View style={styles.stack}>
              <Skeleton height={140} />
              <Skeleton height={96} />
              <Skeleton height={96} />
              <Skeleton height={56} />
            </View>
          ) : dashboard.isError && data === undefined ? (
            <Banner kind="error" onRetry={() => void dashboard.refetch()} />
          ) : data === undefined ? null : (
            <>
              {/* AKTUELLE PHASE */}
              {data.currentPhase !== null ? (
                <Card tone="dark">
                  <View style={styles.stackSm}>
                    <Kicker onDark>Aktuelle Phase</Kicker>
                    <View style={styles.phaseRow}>
                      <ModuleNumber
                        number={data.currentPhase.moduleNumberLabel}
                        tone="green"
                        onDark
                        size={64}
                      />
                      <View style={styles.phaseText}>
                        <Text variant="h2" color={colors.paper}>
                          {data.currentPhase.moduleTitle}
                        </Text>
                        <Text variant="small" color={colors.greenBright}>
                          {data.currentPhase.phaseTitle}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card>
              ) : (
                <Card>
                  <View style={styles.stackSm}>
                    <Kicker>Aktuelle Phase</Kicker>
                    <Text variant="body" muted>
                      Aktuell ist keine Lektion für Sie freigeschaltet. Sie werden
                      benachrichtigt, sobald es weitergeht.
                    </Text>
                  </View>
                </Card>
              )}

              {/* NÄCHSTER OFFENSIVTAG */}
              {data.nextSession !== null ? (
                <Card>
                  <View style={styles.stackSm}>
                    <View style={styles.rowBetween}>
                      <Kicker>Nächster Offensivtag</Kicker>
                      <TagPill
                        label={formatInDays(data.nextSession.starts_at)}
                        tone="green"
                      />
                    </View>
                    <Text variant="h3">{data.nextSession.title}</Text>
                    <View style={styles.metaRow}>
                      <Feather name="calendar" size={16} color={colors.inkSoft} />
                      <Text variant="small" muted>
                        {formatDateLong(data.nextSession.starts_at)},{" "}
                        {formatTime(data.nextSession.starts_at)}
                      </Text>
                    </View>
                    {data.nextSession.venue !== null ? (
                      <View style={styles.metaRow}>
                        <Feather name="map-pin" size={16} color={colors.inkSoft} />
                        <Text variant="small" muted>
                          {data.nextSession.venue}
                          {data.nextSession.room !== null
                            ? `, ${data.nextSession.room}`
                            : ""}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </Card>
              ) : null}

              {/* JETZT WEITERMACHEN */}
              {data.featuredLesson !== null ? (
                <Card>
                  <View style={styles.stackSm}>
                    <Kicker>Jetzt weitermachen</Kicker>
                    <Text variant="h3">{data.featuredLesson.title}</Text>
                    {data.featuredLesson.summary !== null ? (
                      <Text variant="small" muted>
                        {data.featuredLesson.summary}
                      </Text>
                    ) : null}
                    <View style={styles.metaRow}>
                      {data.featuredLesson.estimatedMinutes !== null ? (
                        <Text variant="small" muted>
                          {formatMinutes(data.featuredLesson.estimatedMinutes)}
                        </Text>
                      ) : null}
                      {data.featuredLesson.dueAt !== null ? (
                        <Text variant="small" color={colors.warning}>
                          {formatDue(data.featuredLesson.dueAt)}
                        </Text>
                      ) : null}
                    </View>
                    <Button
                      label={
                        data.featuredLesson.dueAt !== null
                          ? "Aufgabe starten"
                          : "Lektion öffnen"
                      }
                      onPress={() =>
                        router.push(`/lektion/${data.featuredLesson?.lessonId}` as never)
                      }
                    />
                  </View>
                </Card>
              ) : null}

              {/* OFFENE AUFGABEN (max. 3) */}
              {data.openTasks.length > 0 ? (
                <View style={styles.stackSm}>
                  <Kicker>Offene Aufgaben</Kicker>
                  <Card padded={false}>
                    <View style={styles.listPad}>
                      {data.openTasks.map((task) => (
                        <ListRow
                          key={task.contentBlockId}
                          title={task.lessonTitle}
                          subtitle={taskSubtitle(task)}
                          onPress={() =>
                            router.push(`/lektion/${task.lessonId}` as never)
                          }
                        />
                      ))}
                    </View>
                  </Card>
                </View>
              ) : null}

              {/* MEIN FORTSCHRITT */}
              <View style={styles.stackSm}>
                <Kicker>Mein Fortschritt</Kicker>
                <Card>
                  <View style={styles.stackSm}>
                    <View style={styles.rowBetween}>
                      <Text variant="small" muted>
                        Gesamt
                      </Text>
                      <Text variant="small" muted>
                        {data.progress.overallPercent} %
                      </Text>
                    </View>
                    <ProgressLine
                      value={data.progress.overallPercent / 100}
                      accessibilityLabel={`Gesamtfortschritt ${data.progress.overallPercent} Prozent`}
                    />
                    {data.currentPhase !== null
                      ? (() => {
                          const current = data.progress.modules.find(
                            (m) => m.module_id === data.currentPhase?.moduleId,
                          );
                          if (current === undefined) return null;
                          return (
                            <>
                              <View style={[styles.rowBetween, styles.progressGap]}>
                                <Text variant="small" muted>
                                  Modul {data.currentPhase.moduleNumberLabel}
                                </Text>
                                <Text variant="small" muted>
                                  {current.completed_lessons} von {current.total_lessons}{" "}
                                  Lektionen
                                </Text>
                              </View>
                              <ProgressLine
                                value={current.percent / 100}
                                accessibilityLabel={`Modul ${data.currentPhase.moduleNumberLabel}: ${current.percent} Prozent abgeschlossen`}
                              />
                            </>
                          );
                        })()
                      : null}
                  </View>
                </Card>
              </View>

              {/* NEUE NACHRICHT */}
              {data.announcement !== null ? (
                <View style={styles.stackSm}>
                  <Kicker>Neue Nachricht</Kicker>
                  <Card>
                    <View style={styles.stackSm}>
                      <Text variant="h3">{data.announcement.title}</Text>
                      <Text variant="body" muted>
                        {data.announcement.body}
                      </Text>
                      <Text variant="small" muted>
                        {formatDateLong(data.announcement.published_at)}
                      </Text>
                    </View>
                  </Card>
                </View>
              ) : null}
            </>
          )}
        </View>
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
  stackSm: { gap: spacing.sm },
  phaseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  phaseText: { flex: 1, gap: spacing.xs },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  listPad: { paddingHorizontal: spacing.md },
  progressGap: { marginTop: spacing.sm },
});

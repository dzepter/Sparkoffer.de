/**
 * PROGRAMM (§12): Entwicklungsreise der fünf Module als vertikale
 * Taktiklinie – große Modulnummern 01–05, Status je Modul:
 * abgeschlossen (dezentes ✓) / aktuell (grün) / gesperrt (Sperrtext
 * aus der Release-Engine). Tap -> Modul-Detail.
 */
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "@handel-offensiv/config";
import { Banner, Kicker, ModuleNumber, Skeleton, Text } from "../../ui";
import { deriveModuleJourney, useCurriculum, type ModuleJourneyItem } from "./data";

function statusLine(item: ModuleJourneyItem): string {
  if (item.status === "completed") return "Abgeschlossen";
  if (item.status === "current") {
    return `${item.completed} von ${item.total} Lektionen abgeschlossen`;
  }
  return item.lockedLabel ?? "Wird später freigeschaltet.";
}

function JourneyRow({
  item,
  isLast,
  onPress,
}: {
  item: ModuleJourneyItem;
  isLast: boolean;
  onPress: () => void;
}) {
  const numberTone =
    item.status === "current" ? "green" : item.status === "completed" ? "solid" : "faint";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Modul ${item.module.number_label}, ${item.module.title}. ${statusLine(item)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
    >
      {/* Taktiklinie mit Stationspunkt */}
      <View style={styles.lineColumn}>
        <View
          style={[
            styles.node,
            item.status === "current" && styles.nodeCurrent,
            item.status === "completed" && styles.nodeCompleted,
          ]}
        >
          {item.status === "completed" ? (
            <Feather name="check" size={12} color={colors.inkSoft} />
          ) : null}
        </View>
        {!isLast ? <View style={styles.line} /> : null}
      </View>

      {/* Modul-Inhalt */}
      <View style={styles.moduleContent}>
        <ModuleNumber
          number={item.module.number_label}
          tone={numberTone}
          size={48}
        />
        <View style={styles.moduleText}>
          <Text variant="h3" muted={item.status === "locked"}>
            {item.module.title}
          </Text>
          <View style={styles.statusRow}>
            {item.status === "locked" ? (
              <Feather name="lock" size={13} color={colors.inkSoft} />
            ) : null}
            <Text
              variant="small"
              color={item.status === "current" ? colors.greenDeep : colors.inkSoft}
              style={styles.statusText}
            >
              {statusLine(item)}
            </Text>
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={colors.inkSoft} />
      </View>
    </Pressable>
  );
}

export default function ProgrammScreen() {
  const router = useRouter();
  const curriculum = useCurriculum();
  const offline = curriculum.fetchStatus === "paused";

  const journey =
    curriculum.data !== undefined ? deriveModuleJourney(curriculum.data) : [];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={curriculum.isRefetching}
            onRefresh={() => void curriculum.refetch()}
            tintColor={colors.inkSoft}
          />
        }
      >
        <View style={styles.stack}>
          <Kicker>Ihre Entwicklungsreise</Kicker>
          <Text variant="h1" accessibilityRole="header">
            Programm
          </Text>

          {offline ? <Banner kind="offline" /> : null}

          {curriculum.isLoading ? (
            <View style={styles.stack}>
              <Skeleton height={96} />
              <Skeleton height={96} />
              <Skeleton height={96} />
              <Skeleton height={96} />
              <Skeleton height={96} />
            </View>
          ) : curriculum.isError && curriculum.data === undefined ? (
            <Banner kind="error" onRetry={() => void curriculum.refetch()} />
          ) : journey.length === 0 ? (
            <Banner
              kind="info"
              message="Ihr Programm ist noch nicht freigeschaltet. Schauen Sie bald wieder vorbei."
            />
          ) : (
            <View>
              {journey.map((item, index) => (
                <JourneyRow
                  key={item.module.id}
                  item={item}
                  isLast={index === journey.length - 1}
                  onPress={() => router.push(`/programm/${item.module.id}` as never)}
                />
              ))}
            </View>
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
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  lineColumn: {
    alignItems: "center",
    width: 20,
  },
  node: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    marginTop: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeCurrent: {
    borderColor: colors.green,
    backgroundColor: colors.green,
  },
  nodeCompleted: {
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.line,
    marginTop: 2,
  },
  moduleContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  moduleText: { flex: 1, gap: spacing.xs },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  statusText: { flex: 1 },
});

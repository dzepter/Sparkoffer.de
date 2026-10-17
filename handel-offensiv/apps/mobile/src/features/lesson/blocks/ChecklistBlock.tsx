/**
 * checklist-Block (§13): abhakbar, Persistenz LOKAL in AsyncStorage je Block
 * (bewusst keine Server-Persistenz) – zählt für den Lektionsabschluss,
 * sobald alle Punkte abgehakt sind.
 */
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, spacing, touch } from "@handel-offensiv/config";
import type { BlockConfigMap } from "@handel-offensiv/validation";
import { Card, Text } from "../../../ui";
import { usePersistedBlockState } from "../local-state";

export interface ChecklistBlockProps {
  blockId: string;
  profileId: string;
  config: BlockConfigMap["checklist"];
  onDoneChange: (blockId: string, done: boolean) => void;
}

export function ChecklistBlock({
  blockId,
  profileId,
  config,
  onDoneChange,
}: ChecklistBlockProps) {
  const [checkedIds, setCheckedIds, hydrated] = usePersistedBlockState<string[]>(
    profileId,
    blockId,
    [],
  );
  const checked = new Set(checkedIds);
  const allDone = config.items.every((item) => checked.has(item.id));

  useEffect(() => {
    if (hydrated) onDoneChange(blockId, allDone);
  }, [hydrated, allDone, blockId, onDoneChange]);

  const toggle = (itemId: string): void => {
    const next = new Set(checked);
    if (next.has(itemId)) {
      next.delete(itemId);
    } else {
      next.add(itemId);
    }
    setCheckedIds([...next]);
  };

  return (
    <Card>
      <View style={styles.stack}>
        <Text variant="h3">Checkliste</Text>
        <View>
          {config.items.map((item) => {
            const isChecked = checked.has(item.id);
            return (
              <Pressable
                key={item.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isChecked }}
                accessibilityLabel={item.label}
                onPress={() => toggle(item.id)}
                style={({ pressed }) => [styles.item, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Feather
                  name={isChecked ? "check-square" : "square"}
                  size={22}
                  color={isChecked ? colors.greenDeep : colors.inkSoft}
                />
                <Text
                  variant="body"
                  style={styles.label}
                  muted={isChecked}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text variant="small" muted accessibilityLiveRegion="polite">
          {checked.size} von {config.items.length} erledigt
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
  item: {
    minHeight: touch.minTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  label: { flex: 1 },
});

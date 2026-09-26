/**
 * scale-Block (§13): Selbsteinschätzung 1–10 als Buttonreihe (min. 44 px
 * Touch-Targets, §36) – kein fummeliger Slider. Auswahl lokal persistiert.
 */
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { colors, radius, spacing, touch } from "@handel-offensiv/config";
import type { BlockConfigMap } from "@handel-offensiv/validation";
import { Card, Text, archivoFamily } from "../../../ui";
import { usePersistedBlockState } from "../local-state";

export interface ScaleBlockProps {
  blockId: string;
  profileId: string;
  config: BlockConfigMap["scale"];
  onDoneChange: (blockId: string, done: boolean) => void;
}

export function ScaleBlock({ blockId, profileId, config, onDoneChange }: ScaleBlockProps) {
  const [value, setValue, hydrated] = usePersistedBlockState<number | null>(
    profileId,
    blockId,
    null,
  );

  useEffect(() => {
    if (hydrated) onDoneChange(blockId, value !== null);
  }, [hydrated, value, blockId, onDoneChange]);

  const numbers: number[] = [];
  for (let n = config.min; n <= config.max; n += 1) numbers.push(n);

  return (
    <Card>
      <View style={styles.stack}>
        <Text variant="h3">{config.question}</Text>
        <View style={styles.rowWrap}>
          {numbers.map((n) => {
            const selected = value === n;
            return (
              <Pressable
                key={n}
                accessibilityRole="button"
                accessibilityLabel={`${n} von ${config.max} wählen`}
                accessibilityState={{ selected }}
                onPress={() => setValue(n)}
                style={({ pressed }) => [
                  styles.numButton,
                  selected && styles.numButtonSelected,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text
                  variant="body"
                  color={selected ? colors.dark : colors.ink}
                  style={styles.numLabel}
                >
                  {n}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {(config.minLabel !== undefined || config.maxLabel !== undefined) ? (
          <View style={styles.labelRow}>
            <Text variant="small" muted>
              {config.minLabel ?? ""}
            </Text>
            <Text variant="small" muted>
              {config.maxLabel ?? ""}
            </Text>
          </View>
        ) : null}
        {value !== null ? (
          <Text variant="small" muted accessibilityLiveRegion="polite">
            Ihre Einschätzung: {value} von {config.max}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  numButton: {
    minWidth: touch.minTarget,
    minHeight: touch.minTarget,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  numButtonSelected: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  numLabel: { fontFamily: archivoFamily("700") },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

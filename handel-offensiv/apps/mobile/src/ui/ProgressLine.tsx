/**
 * Dünne Fortschrittslinie (Spielfeldlinien-Ästhetik) mit grünem Füllstand.
 * Kein reiner Farbcode: Screens kombinieren sie mit Text ("2 von 5").
 */
import { View, StyleSheet } from "react-native";
import { colors } from "@handel-offensiv/config";

export interface ProgressLineProps {
  /** Fortschritt 0..1 */
  value: number;
  /** Linienstärke in px */
  height?: number;
  /** Zugängliche Beschreibung, z. B. "Modul 2 von 5 abgeschlossen" */
  accessibilityLabel?: string;
  onDark?: boolean;
}

export function ProgressLine({
  value,
  height = 3,
  accessibilityLabel,
  onDark = false,
}: ProgressLineProps) {
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[
        styles.track,
        { height, backgroundColor: onDark ? colors.lineDark : colors.line },
      ]}
    >
      <View
        style={{
          width: `${clamped * 100}%`,
          height,
          backgroundColor: onDark ? colors.greenBright : colors.green,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    overflow: "hidden",
  },
});

/** Eyebrow-Label mit grünem Slash – Markenelement der Aigner-Website. */
import { View, StyleSheet } from "react-native";
import { colors, spacing } from "@handel-offensiv/config";
import { Text } from "./Text";

export interface KickerProps {
  children: string;
  /** Farbvariante für dunkle Flächen */
  onDark?: boolean;
}

export function Kicker({ children, onDark = false }: KickerProps) {
  return (
    <View style={styles.row}>
      <Text
        variant="kicker"
        color={onDark ? colors.greenBright : colors.greenDeep}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        /
      </Text>
      <Text variant="kicker" color={onDark ? colors.paper : colors.inkSoft}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
});

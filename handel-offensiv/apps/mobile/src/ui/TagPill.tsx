/** Kleines Versal-Label, kantig – sachlich statt kindlicher Badges (§35). */
import { StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "@handel-offensiv/config";
import { Text, archivoFamily } from "./Text";

export type TagTone = "neutral" | "green" | "dark" | "warning";

export interface TagPillProps {
  label: string;
  tone?: TagTone;
}

const tones: Record<TagTone, { bg: string; text: string; border: string }> = {
  neutral: { bg: colors.paper, text: colors.inkSoft, border: colors.line },
  green: { bg: colors.green, text: colors.dark, border: colors.green },
  dark: { bg: colors.dark, text: colors.greenBright, border: colors.dark },
  warning: { bg: "#F5EBD6", text: colors.warning, border: "#E8D9B4" },
};

export function TagPill({ label, tone = "neutral" }: TagPillProps) {
  const palette = tones[tone];
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}
    >
      <Text
        color={palette.text}
        style={styles.label}
        accessibilityLabel={label}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radius.base,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: archivoFamily("700"),
  },
});

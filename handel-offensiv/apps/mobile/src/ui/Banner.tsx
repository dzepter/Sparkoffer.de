/**
 * Statusbanner für Offline / Fehler / Erfolg / Hinweis (Briefing §34).
 * Immer Icon + Text (keine reine Farbcodierung), verständliches Deutsch –
 * niemals technische Codes wie "PGRST116".
 */
import { StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, radius, spacing } from "@handel-offensiv/config";
import { Text } from "./Text";
import { Button } from "./Button";

export type BannerKind = "offline" | "error" | "success" | "info";

export interface BannerProps {
  kind: BannerKind;
  /** Eigener Text; sonst sinnvoller Standardtext je Art */
  message?: string;
  /** Optionaler Retry (z. B. Query-refetch) – zeigt "ERNEUT VERSUCHEN" */
  onRetry?: () => void;
}

const presets: Record<
  BannerKind,
  { icon: keyof typeof Feather.glyphMap; color: string; bg: string; text: string }
> = {
  offline: {
    icon: "wifi-off",
    color: colors.inkSoft,
    bg: colors.line,
    text: "Sie sind offline. Bereits geladene Inhalte bleiben verfügbar.",
  },
  error: {
    icon: "alert-circle",
    color: colors.danger,
    bg: "#F7E6E4",
    text: "Der Inhalt konnte gerade nicht geladen werden. Bitte versuchen Sie es erneut.",
  },
  success: {
    icon: "check-circle",
    color: colors.success,
    bg: "#E8F0E6",
    text: "Gespeichert.",
  },
  info: {
    icon: "info",
    color: colors.inkSoft,
    bg: colors.white,
    text: "",
  },
};

export function Banner({ kind, message, onRetry }: BannerProps) {
  const preset = presets[kind];
  return (
    <View
      accessibilityRole="alert"
      style={[styles.base, { backgroundColor: preset.bg }]}
    >
      <View style={styles.row}>
        <Feather name={preset.icon} size={18} color={preset.color} />
        <Text variant="small" style={styles.text}>
          {message ?? preset.text}
        </Text>
      </View>
      {onRetry ? (
        <Button
          label="Erneut versuchen"
          variant="secondary"
          onPress={onRetry}
          style={styles.retry}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  text: {
    flex: 1,
  },
  retry: {
    alignSelf: "flex-start",
    minHeight: 44,
  },
});

/**
 * Kopfzeile für Detail-Screens (Modul, Lektion, Quiz): Zurück-Pfeil mit
 * großem Touch-Target (§36) + optionaler Kicker. Ruhig, keine Navbar-Optik.
 */
import { Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, spacing, touch } from "@handel-offensiv/config";
import { Kicker, Text } from "../../ui";

export interface DetailHeaderProps {
  /** Eyebrow-Label, z. B. "Modul 02" */
  kicker?: string;
  /** Fallback-Route, falls kein Verlauf existiert (Deep Link, Kaltstart) */
  fallbackHref?: string;
}

export function DetailHeader({ kicker, fallbackHref = "/(tabs)/programm" }: DetailHeaderProps) {
  const router = useRouter();
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Zurück"
        onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace(fallbackHref as never);
          }
        }}
        style={({ pressed }) => [styles.back, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Feather name="arrow-left" size={22} color={colors.ink} />
        <Text variant="small" muted>
          Zurück
        </Text>
      </Pressable>
      {kicker !== undefined ? <Kicker>{kicker}</Kicker> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  back: {
    minHeight: touch.minTarget,
    minWidth: touch.minTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
});

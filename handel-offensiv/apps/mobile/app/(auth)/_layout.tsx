/**
 * Auth-/Onboarding-Gruppe (§38): dunkler Auftakt-Look.
 *
 * Gemeinsamer Rahmen für Login, Passwort vergessen, Einladung, Willkommen
 * und Push-Erklärung: dunkle Markenfläche, Wortmarke "HANDEL OFFENSIV",
 * Kicker "Der Führungsführerschein für den Handel" sowie subtile
 * Spielfeld-/Taktiklinien (§35) – ruhig, präzise, kein Dekor-Overkill.
 */
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { colors, spacing, typography } from "@handel-offensiv/config";
import { Text, archivoFamily, Kicker } from "../../src/ui";

/** Subtile Spielfeldlinien: Mittellinie + Anstoßkreis, kaum sichtbar. */
function PitchLines() {
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* Mittellinie (vertikal, hauchdünn) */}
      <View style={styles.pitchCenterLine} />
      {/* Anstoßkreis, angeschnitten am oberen Rand */}
      <View style={styles.pitchCircle} />
    </View>
  );
}

export default function AuthLayout() {
  return (
    <View style={styles.root}>
      {/* Dunkler Auftakt: helle Status-Icons */}
      <StatusBar style="light" backgroundColor={colors.dark} />
      <PitchLines />
      <SafeAreaView edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <Text
            variant="h2"
            color={colors.paper}
            style={styles.wordmark}
            accessibilityRole="header"
          >
            HANDEL{" "}
            <Text variant="h2" color={colors.greenBright} style={styles.wordmark}>
              OFFENSIV
            </Text>
          </Text>
          <Kicker onDark>Der Führungsführerschein für den Handel</Kicker>
        </View>
      </SafeAreaView>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          // Screens liegen auf der dunklen Fläche des Layouts
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  wordmark: {
    fontFamily: archivoFamily("800"),
    letterSpacing: typography.kicker.letterSpacing,
  },
  pitchCenterLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.lineDark,
  },
  pitchCircle: {
    position: "absolute",
    top: -140,
    alignSelf: "center",
    left: "50%",
    marginLeft: -140,
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineDark,
  },
});

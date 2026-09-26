/**
 * Willkommen (§38): genau EIN Screen nach der ersten Anmeldung.
 *
 * Kurze Erklärung des Programms (Vorbereiten. Vertiefen. Umsetzen.
 * Reflektieren.) und die Modul-Reise 01–05 als vertikale Linie –
 * dunkler Auftakt, große Nummern, ruhig (§35). Button "Los geht's".
 */
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PROGRAM_DEFAULTS, colors, spacing } from "@handel-offensiv/config";
import { Button, ModuleNumber, Text } from "../../src/ui";

/**
 * Persistierte Push-Entscheidung (identischer Key in push-erlaubnis.tsx und
 * src/features/profil/screen.tsx): "granted" | "later" | "denied".
 * Nur unkritische Präferenz -> AsyncStorage ist hier in Ordnung.
 */
const PUSH_DECISION_KEY = "handel-offensiv.push-decision";

export default function WillkommenScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleContinue() {
    setBusy(true);
    try {
      // Push-Erklärung nur zeigen, wenn noch keine Entscheidung getroffen
      // wurde (§37: Ablehnung respektieren, nicht erneut aufdrängen).
      const decision = await AsyncStorage.getItem(PUSH_DECISION_KEY);
      if (decision) {
        router.replace("/(tabs)/heute");
      } else {
        router.replace("/(auth)/push-erlaubnis");
      }
    } catch {
      router.replace("/(auth)/push-erlaubnis");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text variant="h1" color={colors.paper} accessibilityRole="header">
        Willkommen im Mannschaftsraum.
      </Text>
      <Text variant="body" color={colors.paper} style={styles.lead}>
        Handel Offensiv begleitet Sie durch fünf Präsenztage – und durch alles
        dazwischen: <Text variant="body" color={colors.greenBright}>Vorbereiten.
        Vertiefen. Umsetzen. Reflektieren.</Text>
      </Text>

      {/* Modul-Reise 01–05 als vertikale Linie */}
      <View
        style={styles.journey}
        accessibilityLabel="Ihre Modul-Reise: fünf Module von 01 bis 05"
      >
        {PROGRAM_DEFAULTS.modules.map((module, index) => (
          <View key={module.number} style={styles.journeyRow}>
            <View style={styles.journeyRail}>
              <View
                style={[
                  styles.railLine,
                  index === 0 && styles.railLineHiddenTop,
                ]}
              />
              <View style={styles.railDot} />
              <View
                style={[
                  styles.railLine,
                  index === PROGRAM_DEFAULTS.modules.length - 1 &&
                    styles.railLineHiddenBottom,
                ]}
              />
            </View>
            <View style={styles.journeyText}>
              <ModuleNumber
                number={module.number}
                tone={index === 0 ? "green" : "faint"}
                onDark
                size={40}
              />
              <Text variant="h3" color={colors.paper} style={styles.moduleTitle}>
                {module.title}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Button
        label="Los geht's"
        loading={busy}
        onPress={() => void handleContinue()}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  lead: {
    lineHeight: 24,
  },
  journey: {
    marginVertical: spacing.sm,
  },
  journeyRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  journeyRail: {
    width: 16,
    alignItems: "center",
  },
  railLine: {
    flex: 1,
    width: StyleSheet.hairlineWidth * 2,
    backgroundColor: colors.lineDark,
  },
  railLineHiddenTop: {
    backgroundColor: "transparent",
  },
  railLineHiddenBottom: {
    backgroundColor: "transparent",
  },
  railDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
    marginVertical: 4,
  },
  journeyText: {
    flex: 1,
    paddingBottom: spacing.lg,
    gap: 2,
  },
  moduleTitle: {
    marginTop: -4,
  },
});

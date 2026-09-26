/**
 * Push-Erklärung (§37): ERST Nutzen erklären, DANN System-Dialog.
 *
 * - "BENACHRICHTIGUNGEN AKTIVIEREN" ruft registerForPush() auf (dort erst
 *   erscheint der iOS-/Android-Systemdialog).
 * - "SPÄTER" wird respektiert: Die Entscheidung wird persistiert, der
 *   Screen erscheint nicht erneut (Aktivierung später im Profil möglich).
 */
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { colors, radius, spacing } from "@handel-offensiv/config";
import { registerForPush } from "../../src/lib/notifications";
import { Banner, Button, Text } from "../../src/ui";

/**
 * Persistierte Push-Entscheidung (identischer Key in willkommen.tsx und
 * src/features/profil/screen.tsx): "granted" | "later" | "denied".
 */
const PUSH_DECISION_KEY = "handel-offensiv.push-decision";

const BENEFITS: { icon: keyof typeof Feather.glyphMap; text: string }[] = [
  {
    icon: "unlock",
    text: "wenn eine neue Aufgabe oder Lektion für Sie freigeschaltet wurde,",
  },
  {
    icon: "calendar",
    text: "wenn Ihr nächster Offensivtag bevorsteht,",
  },
  {
    icon: "message-square",
    text: "wenn Ihr Trainer Ihnen eine Rückmeldung gegeben hat.",
  },
];

export default function PushErlaubnisScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [deniedHint, setDeniedHint] = useState(false);

  async function persistAndContinue(decision: "granted" | "later" | "denied") {
    try {
      await AsyncStorage.setItem(PUSH_DECISION_KEY, decision);
    } catch {
      // Präferenz-Speicherung ist unkritisch – Navigation nicht blockieren
    }
    router.replace("/(tabs)/heute");
  }

  async function handleActivate() {
    setBusy(true);
    try {
      const result = await registerForPush();
      if (result.ok) {
        await persistAndContinue("granted");
        return;
      }
      if (result.reason === "denied") {
        // System-Dialog abgelehnt: respektieren, Hinweis zeigen, weiter
        setDeniedHint(true);
        await AsyncStorage.setItem(PUSH_DECISION_KEY, "denied").catch(() => undefined);
        return;
      }
      // Simulator/Fehler: nicht blockieren – wie "Später" behandeln
      await persistAndContinue("later");
    } catch {
      await persistAndContinue("later");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text variant="h1" color={colors.paper} accessibilityRole="header">
        Am Ball bleiben
      </Text>
      <Text variant="body" color={colors.paper}>
        Handel Offensiv kann Sie informieren,
      </Text>

      <View style={styles.benefits}>
        {BENEFITS.map((benefit) => (
          <View key={benefit.icon} style={styles.benefitRow}>
            <View style={styles.benefitIcon}>
              <Feather name={benefit.icon} size={18} color={colors.greenBright} />
            </View>
            <Text variant="body" color={colors.paper} style={styles.benefitText}>
              {benefit.text}
            </Text>
          </View>
        ))}
      </View>

      <Text variant="small" color={colors.paper} style={styles.note}>
        Sie können Benachrichtigungen jederzeit im Profil oder in den
        Systemeinstellungen ändern.
      </Text>

      {deniedHint ? (
        <>
          <Banner
            kind="info"
            message="Benachrichtigungen sind derzeit vom System deaktiviert. Sie können sie später in den Einstellungen Ihres Geräts aktivieren."
          />
          <Button label="Weiter" onPress={() => router.replace("/(tabs)/heute")} />
        </>
      ) : (
        <View style={styles.actions}>
          <Button
            label="Benachrichtigungen aktivieren"
            loading={busy}
            onPress={() => void handleActivate()}
          />
          <Button
            label="Später"
            variant="ghost"
            disabled={busy}
            onPress={() => void persistAndContinue("later")}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  benefits: {
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    backgroundColor: colors.dark2,
    borderWidth: 1,
    borderColor: colors.lineDark,
    borderRadius: radius.base,
    padding: spacing.md,
  },
  benefitIcon: {
    width: 24,
    alignItems: "center",
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
  },
  note: {
    opacity: 0.8,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});

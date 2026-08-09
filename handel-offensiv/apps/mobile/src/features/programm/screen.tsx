/**
 * PLATZHALTER – wird vom Feature-Agent "Programm" VOLLSTÄNDIG ERSETZT.
 * Zeigt bis dahin einen ruhigen Ladezustand im Aigner-Licht-Design.
 */
import { View } from "react-native";
import { spacing } from "@handel-offensiv/config";
import { Screen, Kicker, Text, Skeleton } from "../../ui";

export default function ProgrammScreen() {
  return (
    <Screen>
      <View style={{ gap: spacing.md }}>
        <Kicker>Fünf Module</Kicker>
        <Text variant="h1">Programm</Text>
        <Text variant="body" muted accessibilityLiveRegion="polite">
          Inhalte werden geladen …
        </Text>
        <Skeleton height={96} />
        <Skeleton height={96} />
        <Skeleton height={96} />
      </View>
    </Screen>
  );
}

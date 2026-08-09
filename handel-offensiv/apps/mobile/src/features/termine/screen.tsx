/**
 * PLATZHALTER – wird vom Feature-Agent "Termine" VOLLSTÄNDIG ERSETZT.
 * Zeigt bis dahin einen ruhigen Ladezustand im Aigner-Licht-Design.
 */
import { View } from "react-native";
import { spacing } from "@handel-offensiv/config";
import { Screen, Kicker, Text, Skeleton } from "../../ui";

export default function TermineScreen() {
  return (
    <Screen>
      <View style={{ gap: spacing.md }}>
        <Kicker>Präsenztage</Kicker>
        <Text variant="h1">Termine</Text>
        <Text variant="body" muted accessibilityLiveRegion="polite">
          Inhalte werden geladen …
        </Text>
        <Skeleton height={80} />
        <Skeleton height={80} />
      </View>
    </Screen>
  );
}

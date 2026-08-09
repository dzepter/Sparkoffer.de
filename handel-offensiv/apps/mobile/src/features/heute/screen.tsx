/**
 * PLATZHALTER – wird vom Feature-Agent "Heute" (M3) VOLLSTÄNDIG ERSETZT.
 * Zeigt bis dahin einen ruhigen Ladezustand im Aigner-Licht-Design.
 */
import { View } from "react-native";
import { spacing } from "@handel-offensiv/config";
import { Screen, Kicker, Text, Skeleton } from "../../ui";

export default function HeuteScreen() {
  return (
    <Screen>
      <View style={{ gap: spacing.md }}>
        <Kicker>Ihr Tag</Kicker>
        <Text variant="h1">Heute</Text>
        <Text variant="body" muted accessibilityLiveRegion="polite">
          Inhalte werden geladen …
        </Text>
        <Skeleton height={120} />
        <Skeleton height={56} />
        <Skeleton height={56} />
      </View>
    </Screen>
  );
}

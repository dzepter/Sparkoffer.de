/**
 * PLATZHALTER – wird vom Feature-Agent "Offensivplan" VOLLSTÄNDIG ERSETZT.
 * Zeigt bis dahin einen ruhigen Ladezustand im Aigner-Licht-Design.
 */
import { View } from "react-native";
import { spacing } from "@handel-offensiv/config";
import { Screen, Kicker, Text, Skeleton } from "../../ui";

export default function OffensivplanScreen() {
  return (
    <Screen>
      <View style={{ gap: spacing.md }}>
        <Kicker>Ihre Umsetzung</Kicker>
        <Text variant="h1">Offensivplan</Text>
        <Text variant="body" muted accessibilityLiveRegion="polite">
          Inhalte werden geladen …
        </Text>
        <Skeleton height={72} />
        <Skeleton height={72} />
        <Skeleton height={72} />
      </View>
    </Screen>
  );
}

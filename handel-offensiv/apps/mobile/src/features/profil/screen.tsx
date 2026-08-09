/**
 * PLATZHALTER – wird vom Feature-Agent "Profil" VOLLSTÄNDIG ERSETZT.
 * Zeigt bis dahin einen ruhigen Ladezustand im Aigner-Licht-Design.
 */
import { View } from "react-native";
import { spacing } from "@handel-offensiv/config";
import { Screen, Kicker, Text, Skeleton } from "../../ui";

export default function ProfilScreen() {
  return (
    <Screen>
      <View style={{ gap: spacing.md }}>
        <Kicker>Ihr Bereich</Kicker>
        <Text variant="h1">Profil</Text>
        <Text variant="body" muted accessibilityLiveRegion="polite">
          Inhalte werden geladen …
        </Text>
        <Skeleton height={64} />
        <Skeleton height={56} />
        <Skeleton height={56} />
      </View>
    </Screen>
  );
}

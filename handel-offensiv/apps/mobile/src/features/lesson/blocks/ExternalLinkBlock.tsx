/**
 * external_link-Block (§13): klar als externer Inhalt gekennzeichnet
 * (Kennzeichnungspflicht – note aus der Konfiguration), Öffnen im
 * System-Browser. Nur https (erzwingt bereits das Zod-Schema).
 */
import { Linking, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "@handel-offensiv/config";
import type { BlockConfigMap } from "@handel-offensiv/validation";
import { Button, Card, TagPill, Text } from "../../../ui";

export interface ExternalLinkBlockProps {
  config: BlockConfigMap["external_link"];
}

export function ExternalLinkBlock({ config }: ExternalLinkBlockProps) {
  return (
    <Card>
      <View style={styles.stack}>
        <View style={styles.row}>
          <Feather name="external-link" size={20} color={colors.inkSoft} />
          <TagPill label="Externer Link" tone="warning" />
        </View>
        <Text variant="h3">{config.label}</Text>
        <Text variant="small" muted>
          {config.note}
        </Text>
        <Button
          label="Im Browser öffnen"
          variant="secondary"
          onPress={() => {
            void Linking.openURL(config.url);
          }}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});

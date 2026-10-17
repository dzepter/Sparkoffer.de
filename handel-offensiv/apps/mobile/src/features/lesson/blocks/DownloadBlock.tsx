/**
 * download-Block (§13): Datei über signierte URL im System-Browser öffnen –
 * das System übernimmt Anzeige/Speichern (iOS Quick Look / Teilen).
 */
import { useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "@handel-offensiv/config";
import type { BlockConfigMap } from "@handel-offensiv/validation";
import { Banner, Button, Card, TagPill, Text } from "../../../ui";
import { createSignedUrl } from "../storage";

export interface DownloadBlockProps {
  config: BlockConfigMap["download"];
}

export function DownloadBlock({ config }: DownloadBlockProps) {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState(false);

  const open = async (): Promise<void> => {
    setOpening(true);
    setError(false);
    try {
      const url = await createSignedUrl(config.storagePath);
      await Linking.openURL(url);
    } catch {
      setError(true);
    } finally {
      setOpening(false);
    }
  };

  return (
    <Card>
      <View style={styles.stack}>
        <View style={styles.row}>
          <Feather name="download" size={20} color={colors.inkSoft} />
          <TagPill label="Download" />
        </View>
        <Text variant="h3">{config.title}</Text>
        {config.description !== undefined && config.description.length > 0 ? (
          <Text variant="small" muted>
            {config.description}
          </Text>
        ) : null}
        {error ? <Banner kind="error" onRetry={() => void open()} /> : null}
        <Button
          label="Herunterladen"
          variant="secondary"
          loading={opening}
          onPress={() => void open()}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});

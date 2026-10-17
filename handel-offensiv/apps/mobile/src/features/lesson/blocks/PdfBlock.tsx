/**
 * pdf-Block (§13): signierte URL (Supabase Storage) -> System-Browser/-Viewer.
 * Kein eingebetteter PDF-Renderer – schlank und iOS-nativ (Quick Look).
 */
import { useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "@handel-offensiv/config";
import type { BlockConfigMap } from "@handel-offensiv/validation";
import { Banner, Button, Card, TagPill, Text } from "../../../ui";
import { createSignedUrl } from "../storage";

export interface PdfBlockProps {
  config: BlockConfigMap["pdf"];
}

export function PdfBlock({ config }: PdfBlockProps) {
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
          <Feather name="file-text" size={20} color={colors.inkSoft} />
          <TagPill label="PDF" />
        </View>
        <Text variant="h3">{config.title}</Text>
        {error ? <Banner kind="error" onRetry={() => void open()} /> : null}
        <Button
          label="PDF öffnen"
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

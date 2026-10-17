/**
 * image-Block (§13): Bild über signierte URL, alt-Text ist Pflicht
 * (Barrierefreiheit §36), optionale Bildunterschrift.
 */
import { Image, StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "@handel-offensiv/config";
import type { BlockConfigMap } from "@handel-offensiv/validation";
import { Banner, Skeleton, Text } from "../../../ui";
import { useSignedUrl } from "../storage";

export interface ImageBlockProps {
  config: BlockConfigMap["image"];
}

export function ImageBlock({ config }: ImageBlockProps) {
  const urlQuery = useSignedUrl(config.storagePath);

  return (
    <View style={styles.stack}>
      {urlQuery.isLoading ? (
        <Skeleton height={200} />
      ) : urlQuery.data !== undefined ? (
        <Image
          source={{ uri: urlQuery.data }}
          style={styles.image}
          resizeMode="cover"
          accessible
          accessibilityRole="image"
          accessibilityLabel={config.alt}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Banner kind="error" onRetry={() => void urlQuery.refetch()} />
      )}
      {config.caption !== undefined && config.caption.length > 0 ? (
        <Text variant="small" muted>
          {config.caption}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
  image: {
    width: "100%",
    height: 220,
    borderRadius: radius.base,
    backgroundColor: colors.line,
  },
});

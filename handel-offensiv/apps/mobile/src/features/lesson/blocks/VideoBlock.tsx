/**
 * video-Block (§13).
 *
 * ENTSCHEIDUNG (dokumentiert): Für provider "storage" nutzen wir expo-video
 * (~2, die schlanke SDK-52-Lösung) mit signierter URL und nativen Controls –
 * kein eigener Player-Nachbau. Für provider "external" (z. B. Vimeo/YouTube)
 * zeigen wir eine ruhige Poster-Karte und öffnen den System-Browser:
 * eingebettete Fremd-Player laden Drittanbieter-Skripte (DSGVO §30) und
 * brechen die App-Ästhetik.
 */
import { useState } from "react";
import { Image, Linking, StyleSheet, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Feather } from "@expo/vector-icons";
import { colors, radius, spacing } from "@handel-offensiv/config";
import type { BlockConfigMap } from "@handel-offensiv/validation";
import { Banner, Button, Card, Skeleton, TagPill, Text } from "../../../ui";
import { useSignedUrl } from "../storage";

export interface VideoBlockProps {
  config: BlockConfigMap["video"];
}

function formatDuration(seconds: number): string {
  const min = Math.round(seconds / 60);
  return `${Math.max(min, 1)} Min.`;
}

/** Inline-Player – eigener Kompontenten-Scope, damit der Hook erst mit URL läuft */
function StorageVideoPlayer({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
  });
  return (
    <VideoView
      player={player}
      style={styles.video}
      nativeControls
      allowsFullscreen
      contentFit="contain"
      accessibilityLabel="Videoplayer"
    />
  );
}

export function VideoBlock({ config }: VideoBlockProps) {
  const isStorage = config.provider === "storage";
  const videoUrlQuery = useSignedUrl(isStorage ? config.storagePath : undefined);
  const thumbQuery = useSignedUrl(config.thumbnailPath);
  const [started, setStarted] = useState(false);

  return (
    <Card padded={false}>
      {/* Poster / Player */}
      {isStorage && started ? (
        videoUrlQuery.isLoading ? (
          <Skeleton height={200} round={0} />
        ) : videoUrlQuery.data !== undefined ? (
          <StorageVideoPlayer url={videoUrlQuery.data} />
        ) : (
          <View style={styles.pad}>
            <Banner kind="error" onRetry={() => void videoUrlQuery.refetch()} />
          </View>
        )
      ) : (
        <View style={styles.poster}>
          {thumbQuery.data !== undefined ? (
            <Image
              source={{ uri: thumbQuery.data }}
              style={styles.posterImage}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          ) : null}
          <View style={styles.posterOverlay}>
            <Feather name="play-circle" size={40} color={colors.greenBright} />
          </View>
        </View>
      )}

      <View style={styles.pad}>
        <View style={styles.metaRow}>
          <TagPill label="Video" tone="dark" />
          {config.durationSeconds !== undefined ? (
            <Text variant="small" muted>
              {formatDuration(config.durationSeconds)}
            </Text>
          ) : null}
        </View>
        <Text variant="h3">{config.title}</Text>
        {config.description !== undefined && config.description.length > 0 ? (
          <Text variant="small" muted>
            {config.description}
          </Text>
        ) : null}
        {isStorage ? (
          !started ? (
            <Button label="Video abspielen" onPress={() => setStarted(true)} />
          ) : null
        ) : (
          <>
            <Text variant="small" muted>
              Externer Link – wird im Browser geöffnet.
            </Text>
            <Button
              label="Video öffnen"
              onPress={() => {
                void Linking.openURL(config.url);
              }}
            />
          </>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  video: {
    width: "100%",
    height: 210,
    backgroundColor: colors.dark,
    borderTopLeftRadius: radius.base,
    borderTopRightRadius: radius.base,
  },
  poster: {
    height: 170,
    backgroundColor: colors.dark,
    borderTopLeftRadius: radius.base,
    borderTopRightRadius: radius.base,
    overflow: "hidden",
  },
  posterImage: { width: "100%", height: "100%" },
  posterOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  pad: { padding: spacing.md, gap: spacing.sm },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

/**
 * audio-Block (§13): einfacher Player (expo-audio, SDK 52) mit
 * Play/Pause und Fortschrittslinie – ruhig, keine Wellenform-Spielerei.
 */
import { StyleSheet, Pressable, View } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Feather } from "@expo/vector-icons";
import { colors, radius, spacing, touch } from "@handel-offensiv/config";
import type { BlockConfigMap } from "@handel-offensiv/validation";
import { Banner, Card, ProgressLine, Skeleton, TagPill, Text } from "../../../ui";
import { useSignedUrl } from "../storage";

export interface AudioBlockProps {
  config: BlockConfigMap["audio"];
}

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

/** Innerer Player – Hook läuft erst, wenn die signierte URL vorliegt */
function Player({ url, title }: { url: string; title: string }) {
  const player = useAudioPlayer({ uri: url });
  const status = useAudioPlayerStatus(player);

  const duration = status.duration > 0 ? status.duration : null;
  const progress = duration !== null ? status.currentTime / duration : 0;
  const playing = status.playing;

  return (
    <View style={styles.playerRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={playing ? `${title} pausieren` : `${title} abspielen`}
        onPress={() => {
          if (playing) {
            player.pause();
          } else {
            // Am Ende erneut von vorn starten
            if (duration !== null && status.currentTime >= duration - 0.25) {
              player.seekTo(0);
            }
            player.play();
          }
        }}
        style={({ pressed }) => [styles.playButton, { opacity: pressed ? 0.8 : 1 }]}
      >
        <Feather name={playing ? "pause" : "play"} size={22} color={colors.dark} />
      </Pressable>
      <View style={styles.progressCol}>
        <ProgressLine
          value={progress}
          height={3}
          accessibilityLabel={`Audio-Fortschritt ${Math.round(progress * 100)} Prozent`}
        />
        <View style={styles.timeRow}>
          <Text variant="small" muted>
            {formatClock(status.currentTime)}
          </Text>
          <Text variant="small" muted>
            {duration !== null ? formatClock(duration) : "–:––"}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function AudioBlock({ config }: AudioBlockProps) {
  const urlQuery = useSignedUrl(config.storagePath);

  return (
    <Card>
      <View style={styles.stack}>
        <View style={styles.metaRow}>
          <TagPill label="Audio" />
          {config.durationSeconds !== undefined ? (
            <Text variant="small" muted>
              {formatClock(config.durationSeconds)}
            </Text>
          ) : null}
        </View>
        <Text variant="h3">{config.title}</Text>
        {urlQuery.isLoading ? (
          <Skeleton height={44} />
        ) : urlQuery.data !== undefined ? (
          <Player url={urlQuery.data} title={config.title} />
        ) : (
          <Banner kind="error" onRetry={() => void urlQuery.refetch()} />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  playButton: {
    width: Math.max(touch.minTarget, 48),
    height: Math.max(touch.minTarget, 48),
    borderRadius: radius.base,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  progressCol: { flex: 1, gap: spacing.xs },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

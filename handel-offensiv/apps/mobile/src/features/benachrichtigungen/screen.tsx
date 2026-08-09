/**
 * NACHRICHTEN – kleiner In-App-Bereich für notifications (Briefing §37):
 * Liste mit gelesen/ungelesen, Tap folgt dem deep_link (nur interne Routen)
 * und setzt read_at. Erreichbar über die HEUTE-Karte "NEUE NACHRICHT"
 * (Hook useUnreadNotificationCount) – keine Header-Glocke nötig.
 *
 * Rechte: RLS liefert ausschließlich eigene Zeilen; read_at-Updates sind
 * per Policy nur auf eigenen Zeilen erlaubt.
 */
import { useSyncExternalStore } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { onlineManager, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { colors, spacing, touch } from "@handel-offensiv/config";
import type { NotificationKind, NotificationRow } from "@handel-offensiv/types";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/auth-context";
import { Banner, Card, Kicker, Screen, Skeleton, TagPill, Text } from "../../ui";
import { NOTIFICATIONS_QUERY_KEY, UNREAD_COUNT_QUERY_KEY } from "./use-unread";

const KIND_LABELS: Record<NotificationKind, string> = {
  release: "Neue Inhalte",
  session_reminder: "Offensivtag",
  task_due: "Fällige Aufgabe",
  announcement: "Ankündigung",
  feedback: "Trainer-Feedback",
};

const KIND_ICONS: Record<NotificationKind, keyof typeof Feather.glyphMap> = {
  release: "unlock",
  session_reminder: "calendar",
  task_due: "clock",
  announcement: "radio",
  feedback: "message-square",
};

/** Verständliche deutsche Zeitangabe relativ zu jetzt. */
function relativeTime(iso: string, now: Date): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Gerade eben";
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Gestern";
  if (days < 7) return `vor ${days} Tagen`;
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

async function fetchNotifications(): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data as NotificationRow[] | null) ?? [];
}

function useIsOnline(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => onlineManager.subscribe(onStoreChange),
    () => onlineManager.isOnline(),
  );
}

export default function NachrichtenScreen() {
  const router = useRouter();
  const { session } = useSession();
  const profileId = session?.user.id ?? null;
  const isOnline = useIsOnline();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, profileId],
    queryFn: fetchNotifications,
    enabled: profileId !== null,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY, profileId] });
    void queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_QUERY_KEY, profileId] });
  };

  const markRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notificationId)
        .is("read_at", null);
      if (error) throw error;
    },
    onSettled: invalidate,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .is("read_at", null);
      if (error) throw error;
    },
    onSettled: invalidate,
  });

  const onOpen = (notification: NotificationRow) => {
    // Lesen markieren – auch offline anstoßen, Fehler bleiben still
    // (die Liste zeigt den Zustand nach dem nächsten erfolgreichen Laden).
    if (notification.read_at === null) markRead.mutate(notification.id);
    // Nur interne Pfade öffnen ("/..."), niemals fremde URLs
    const link = notification.deep_link;
    if (typeof link === "string" && link.startsWith("/")) {
      router.push(link as never);
    }
  };

  const notifications = query.data ?? [];
  const unreadCount = notifications.filter((n) => n.read_at === null).length;
  const now = new Date();

  return (
    <Screen>
      <View style={styles.stack}>
        {/* Eigene Kopfzeile (Root-Stack läuft ohne Navigations-Header) */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Zurück"
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/heute"))}
          style={({ pressed }) => [styles.back, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="chevron-left" size={22} color={colors.ink} />
          <Text variant="small" style={styles.backLabel}>
            Zurück
          </Text>
        </Pressable>

        <Kicker>Für Sie</Kicker>
        <Text variant="h1">Nachrichten</Text>

        {!isOnline ? <Banner kind="offline" /> : null}

        {profileId === null ? (
          <Banner kind="info" message="Bitte melden Sie sich an, um Ihre Nachrichten zu sehen." />
        ) : query.isPending ? (
          <View style={styles.stack} accessibilityLabel="Nachrichten werden geladen">
            <Skeleton height={72} />
            <Skeleton height={72} />
            <Skeleton height={72} />
          </View>
        ) : query.isError ? (
          <Banner kind="error" onRetry={() => void query.refetch()} />
        ) : notifications.length === 0 ? (
          <Card>
            <Text variant="h3">Keine Nachrichten</Text>
            <Text variant="body" muted style={styles.emptyBody}>
              Hier informieren wir Sie über neue Freischaltungen, Ihre
              Offensivtage, fällige Aufgaben und Feedback Ihres Trainers.
            </Text>
          </Card>
        ) : (
          <>
            {unreadCount > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Alle Nachrichten als gelesen markieren"
                disabled={markAllRead.isPending}
                onPress={() => markAllRead.mutate()}
                style={({ pressed }) => [styles.markAll, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Feather name="check-circle" size={16} color={colors.greenDeep} />
                <Text variant="small" color={colors.greenDeep} style={styles.markAllLabel}>
                  Alle als gelesen markieren
                </Text>
              </Pressable>
            ) : null}

            <Card padded={false} style={styles.listCard}>
              {notifications.map((notification) => (
                <NotificationRowView
                  key={notification.id}
                  notification={notification}
                  now={now}
                  onPress={() => onOpen(notification)}
                />
              ))}
            </Card>
          </>
        )}
      </View>
    </Screen>
  );
}

/* ------------------------------ Bausteine ------------------------------ */

function NotificationRowView({
  notification,
  now,
  onPress,
}: {
  notification: NotificationRow;
  now: Date;
  onPress: () => void;
}) {
  const unread = notification.read_at === null;
  const kindLabel = KIND_LABELS[notification.kind];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${unread ? "Ungelesen. " : ""}${kindLabel}: ${notification.title}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={[styles.iconWrap, unread ? styles.iconWrapUnread : null]}>
        <Feather
          name={KIND_ICONS[notification.kind]}
          size={16}
          color={unread ? colors.dark : colors.inkSoft}
        />
      </View>
      <View style={styles.rowText}>
        <View style={styles.rowHead}>
          <Text variant="small" muted style={styles.kind}>
            {kindLabel}
          </Text>
          {unread ? <TagPill label="Neu" tone="green" /> : null}
        </View>
        <Text variant="h3" muted={!unread} numberOfLines={2}>
          {notification.title}
        </Text>
        {notification.body ? (
          <Text variant="small" muted numberOfLines={2}>
            {notification.body}
          </Text>
        ) : null}
        <Text variant="small" muted>
          {relativeTime(notification.created_at, now)}
        </Text>
      </View>
      {notification.deep_link ? (
        <Feather name="chevron-right" size={18} color={colors.inkSoft} />
      ) : null}
    </Pressable>
  );
}

/* -------------------------------- Styles ------------------------------- */

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  back: {
    minHeight: touch.minTarget,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 2,
    paddingRight: spacing.md,
  },
  backLabel: { textTransform: "uppercase", letterSpacing: 1.2 },
  emptyBody: { marginTop: spacing.xs },
  markAll: {
    minHeight: touch.minTarget,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
  },
  markAllLabel: { textTransform: "uppercase", letterSpacing: 1.2 },
  listCard: { paddingHorizontal: spacing.md },
  row: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  iconWrapUnread: { backgroundColor: colors.green, borderColor: colors.green },
  rowText: { flex: 1, gap: 2 },
  rowHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  kind: { textTransform: "uppercase", letterSpacing: 1.2, fontSize: 11 },
});

/**
 * TERMINE (Briefing §18): NÄCHSTER OFFENSIVTAG prominent mit Countdown,
 * Ort, Raum und Hinweisen; darunter die vollständige Terminliste der
 * Gruppe (vergangene Termine dezent).
 *
 * Kalender: Es wird bewusst KEINE Kalender-Berechtigung angefragt –
 * stattdessen wird ein ICS lokal erzeugt und über das Share-Sheet geteilt.
 * Rechte: Sichtbarkeit der Termine erzwingt die DB via RLS (cohort_sessions).
 */
import { useMemo, useState, useSyncExternalStore } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useQuery, onlineManager } from "@tanstack/react-query";
import { colors, radius, spacing, touch } from "@handel-offensiv/config";
import type { CohortSessionRow, ModuleRow } from "@handel-offensiv/types";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/auth-context";
import {
  Banner,
  Button,
  Card,
  Kicker,
  ListRow,
  ModuleNumber,
  Screen,
  Skeleton,
  TagPill,
  Text,
} from "../../ui";
import { shareSessionIcs, type ShareIcsResult } from "./ics";
import {
  countdownLabel,
  formatSessionDate,
  formatSessionDateShort,
  formatSessionTimeRange,
  isPastSession,
} from "./format";

/** Nested-Select-Form: Termin inkl. Modulbezug (RLS-gefiltert). */
type SessionWithModule = CohortSessionRow & {
  modules: Pick<ModuleRow, "number_label" | "title"> | null;
};

function useIsOnline(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => onlineManager.subscribe(onStoreChange),
    () => onlineManager.isOnline(),
  );
}

async function fetchSessions(cohortId: string): Promise<SessionWithModule[]> {
  const { data, error } = await supabase
    .from("cohort_sessions")
    .select("*, modules(number_label, title)")
    .eq("cohort_id", cohortId)
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return (data as SessionWithModule[] | null) ?? [];
}

export default function TermineScreen() {
  const router = useRouter();
  const { activeCohortId } = useSession();
  const isOnline = useIsOnline();
  const [shareResult, setShareResult] = useState<ShareIcsResult | null>(null);
  const [sharing, setSharing] = useState(false);

  const query = useQuery({
    queryKey: ["termine", activeCohortId],
    queryFn: () => fetchSessions(activeCohortId as string),
    enabled: activeCohortId !== null,
  });

  const now = new Date();
  const sessions = query.data ?? [];
  const upcoming = useMemo(
    () => sessions.filter((s) => !isPastSession(s, now)),
    // now ändert sich je Render minimal – bewusst nur an Daten gekoppelt
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessions],
  );
  const past = useMemo(
    () => sessions.filter((s) => isPastSession(s, now)).reverse(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessions],
  );
  const next = upcoming[0];

  const onShareIcs = async (session: CohortSessionRow) => {
    setSharing(true);
    setShareResult(null);
    const result = await shareSessionIcs(session);
    setSharing(false);
    setShareResult(result === "shared" ? null : result);
  };

  return (
    <Screen>
      <View style={styles.stack}>
        <Kicker>Präsenztage</Kicker>
        <Text variant="h1">Termine</Text>

        {!isOnline ? <Banner kind="offline" /> : null}

        {shareResult === "unavailable" ? (
          <Banner
            kind="info"
            message="Teilen ist auf diesem Gerät gerade nicht verfügbar. Sie finden alle Termindetails weiterhin hier in der App."
          />
        ) : null}
        {shareResult === "error" ? (
          <Banner
            kind="error"
            message="Der Termin konnte gerade nicht geteilt werden. Bitte versuchen Sie es erneut."
          />
        ) : null}

        {activeCohortId === null ? (
          <Banner
            kind="info"
            message="Ihrem Konto ist noch keine Gruppe zugeordnet. Bitte wenden Sie sich an Ihren Ansprechpartner bei Aigner Offensiv."
          />
        ) : query.isPending ? (
          <View style={styles.stack} accessibilityLabel="Termine werden geladen">
            <Skeleton height={220} />
            <Skeleton height={64} />
            <Skeleton height={64} />
          </View>
        ) : query.isError ? (
          <Banner kind="error" onRetry={() => void query.refetch()} />
        ) : sessions.length === 0 ? (
          <Card>
            <Text variant="h3">Noch keine Termine</Text>
            <Text variant="body" muted style={styles.emptyBody}>
              Sobald Ihre Offensivtage geplant sind, sehen Sie hier alle Termine
              Ihrer Gruppe – mit Ort, Zeiten und Anfahrt.
            </Text>
          </Card>
        ) : (
          <>
            {next !== undefined ? (
              <Card tone="dark" style={styles.hero}>
                <Kicker onDark>Nächster Offensivtag</Kicker>
                <Text
                  variant="display"
                  color={colors.greenBright}
                  style={styles.heroCountdown}
                  accessibilityLabel={`Nächster Offensivtag ${countdownLabel(next, now) ?? ""}`}
                >
                  {countdownLabel(next, now) ?? "steht bevor"}
                </Text>
                <Text variant="h2" color={colors.paper}>
                  {next.title}
                </Text>
                {next.modules ? (
                  <Text variant="small" color={colors.greenBright}>
                    Modul {next.modules.number_label} · {next.modules.title}
                  </Text>
                ) : null}

                <View style={styles.heroFacts}>
                  <HeroFact icon="calendar" text={formatSessionDate(next)} />
                  <HeroFact icon="clock" text={formatSessionTimeRange(next)} />
                  {next.venue ? (
                    <HeroFact
                      icon="map-pin"
                      text={next.room ? `${next.venue} · Raum ${next.room}` : next.venue}
                    />
                  ) : null}
                  {next.notes ? <HeroFact icon="info" text={next.notes} /> : null}
                </View>

                <View style={styles.heroActions}>
                  <Button
                    label="In Kalender übernehmen"
                    variant="primary"
                    loading={sharing}
                    onPress={() => void onShareIcs(next)}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Details und Anfahrt zum nächsten Offensivtag ansehen"
                    onPress={() => router.push(`/termin/${next.id}`)}
                    style={({ pressed }) => [styles.heroOutlineButton, { opacity: pressed ? 0.8 : 1 }]}
                  >
                    <Text variant="small" color={colors.paper} style={styles.heroOutlineLabel}>
                      Details & Anfahrt
                    </Text>
                    <Feather name="chevron-right" size={16} color={colors.paper} />
                  </Pressable>
                </View>
              </Card>
            ) : (
              <Card>
                <Text variant="h3">Kein weiterer Termin geplant</Text>
                <Text variant="body" muted style={styles.emptyBody}>
                  Alle Offensivtage Ihrer Gruppe liegen bereits hinter Ihnen.
                  Unten finden Sie die vergangenen Termine.
                </Text>
              </Card>
            )}

            {upcoming.length > 0 ? (
              <View style={styles.section}>
                <Kicker>Alle kommenden Termine</Kicker>
                <Card padded={false} style={styles.listCard}>
                  {upcoming.map((session) => (
                    <SessionRow
                      key={session.id}
                      session={session}
                      now={now}
                      onPress={() => router.push(`/termin/${session.id}`)}
                    />
                  ))}
                </Card>
              </View>
            ) : null}

            {past.length > 0 ? (
              <View style={styles.section}>
                <Kicker>Vergangene Termine</Kicker>
                <Card padded={false} style={[styles.listCard, styles.pastCard]}>
                  {past.map((session) => (
                    <SessionRow
                      key={session.id}
                      session={session}
                      now={now}
                      past
                      onPress={() => router.push(`/termin/${session.id}`)}
                    />
                  ))}
                </Card>
              </View>
            ) : null}
          </>
        )}
      </View>
    </Screen>
  );
}

/* ------------------------------ Bausteine ------------------------------ */

function HeroFact({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  return (
    <View style={styles.heroFactRow}>
      <Feather name={icon} size={16} color={colors.greenBright} style={styles.heroFactIcon} />
      <Text variant="body" color={colors.paper} style={styles.heroFactText}>
        {text}
      </Text>
    </View>
  );
}

function SessionRow({
  session,
  now,
  past = false,
  onPress,
}: {
  session: SessionWithModule;
  now: Date;
  past?: boolean;
  onPress: () => void;
}) {
  const countdown = countdownLabel(session, now);
  const subtitleParts = [
    `${formatSessionDateShort(session)}, ${formatSessionTimeRange(session)}`,
  ];
  if (session.venue) subtitleParts.push(session.venue);

  return (
    <ListRow
      title={session.title}
      subtitle={subtitleParts.join(" · ")}
      leading={
        <ModuleNumber
          number={session.modules?.number_label ?? "—"}
          tone={past ? "faint" : "solid"}
          size={28}
        />
      }
      trailing={
        past ? (
          <TagPill label="Vergangen" tone="neutral" />
        ) : countdown === "heute" ? (
          <TagPill label="Heute" tone="green" />
        ) : undefined
      }
      onPress={onPress}
    />
  );
}

/* -------------------------------- Styles ------------------------------- */

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  section: { gap: spacing.sm, marginTop: spacing.sm },
  emptyBody: { marginTop: spacing.xs },
  hero: { gap: spacing.sm },
  heroCountdown: { fontSize: 44, lineHeight: 48 },
  heroFacts: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.lineDark,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  heroFactRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  heroFactIcon: { marginTop: 3 },
  heroFactText: { flex: 1 },
  heroActions: { marginTop: spacing.md, gap: spacing.sm },
  heroOutlineButton: {
    minHeight: Math.max(touch.minTarget, 48),
    borderWidth: 1,
    borderColor: colors.lineDark,
    borderRadius: radius.base,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  heroOutlineLabel: { textTransform: "uppercase", letterSpacing: 1.2 },
  listCard: { paddingHorizontal: spacing.md },
  pastCard: { opacity: 0.6 },
});

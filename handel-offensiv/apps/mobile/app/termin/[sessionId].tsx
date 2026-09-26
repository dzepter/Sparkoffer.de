/**
 * Termin-Detail (Briefing §18): Datum/Zeit, Ort & Raum, Agenda/Hinweise,
 * Anfahrt, Modulbezug und – falls per RLS lesbar – der Trainer.
 *
 * Rechte: Der Termin ist nur sichtbar, wenn die DB (RLS auf cohort_sessions)
 * den Zugriff erlaubt; ein leeres Ergebnis wird als verständlicher
 * "nicht gefunden"-Zustand angezeigt, nie als technischer Fehlercode.
 * Kalender: ICS lokal erzeugen + teilen, KEINE Kalender-Berechtigung.
 */
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing, touch } from "@handel-offensiv/config";
import type { CohortSessionRow, ModuleRow, ProfileRow } from "@handel-offensiv/types";
import { supabase } from "../../src/lib/supabase";
import {
  Banner,
  Button,
  Card,
  Kicker,
  ModuleNumber,
  Screen,
  Skeleton,
  Text,
} from "../../src/ui";
import { shareSessionIcs, type ShareIcsResult } from "../../src/features/termine/ics";
import {
  countdownLabel,
  formatSessionDate,
  formatSessionTimeRange,
  isPastSession,
} from "../../src/features/termine/format";

type SessionDetail = CohortSessionRow & {
  modules: Pick<ModuleRow, "number_label" | "title" | "claim"> | null;
};

interface SessionDetailData {
  session: SessionDetail | null;
  /** Trainerprofil, falls per RLS lesbar (Teilnehmer sehen es i. d. R. nicht) */
  trainer: Pick<ProfileRow, "first_name" | "last_name"> | null;
}

async function fetchSessionDetail(sessionId: string): Promise<SessionDetailData> {
  const { data, error } = await supabase
    .from("cohort_sessions")
    .select("*, modules(number_label, title, claim)")
    .eq("id", sessionId)
    .maybeSingle();
  if (error) throw error;
  const session = (data as SessionDetail | null) ?? null;

  let trainer: SessionDetailData["trainer"] = null;
  if (session?.trainer_profile_id) {
    // Bewusst fehlertolerant: Wenn RLS den Zugriff verwehrt, bleibt trainer null.
    const trainerRes = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", session.trainer_profile_id)
      .maybeSingle();
    trainer = (trainerRes.data as SessionDetailData["trainer"]) ?? null;
  }
  return { session, trainer };
}

export default function TerminDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId: string }>();
  const sessionId =
    typeof params.sessionId === "string" && params.sessionId.length > 0 ? params.sessionId : null;
  const [shareResult, setShareResult] = useState<ShareIcsResult | null>(null);
  const [sharing, setSharing] = useState(false);

  const query = useQuery({
    queryKey: ["termin", sessionId],
    queryFn: () => fetchSessionDetail(sessionId as string),
    enabled: sessionId !== null,
  });

  const session = query.data?.session ?? null;
  const trainer = query.data?.trainer ?? null;
  const now = new Date();

  const onShareIcs = async () => {
    if (!session) return;
    setSharing(true);
    setShareResult(null);
    const result = await shareSessionIcs(session);
    setSharing(false);
    setShareResult(result === "shared" ? null : result);
  };

  const trainerName =
    trainer && (trainer.first_name || trainer.last_name)
      ? [trainer.first_name, trainer.last_name].filter(Boolean).join(" ")
      : null;

  return (
    <Screen>
      <View style={styles.stack}>
        {/* Eigene Kopfzeile (Root-Stack läuft ohne Navigations-Header) */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Zurück"
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/termine"))}
          style={({ pressed }) => [styles.back, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="chevron-left" size={22} color={colors.ink} />
          <Text variant="small" style={styles.backLabel}>
            Termine
          </Text>
        </Pressable>

        {sessionId === null || (query.isSuccess && session === null) ? (
          <Banner
            kind="info"
            message="Dieser Termin ist nicht mehr verfügbar oder für Sie nicht sichtbar."
          />
        ) : query.isPending ? (
          <View style={styles.stack} accessibilityLabel="Termin wird geladen">
            <Skeleton height={32} width="70%" />
            <Skeleton height={120} />
            <Skeleton height={96} />
          </View>
        ) : query.isError ? (
          <Banner kind="error" onRetry={() => void query.refetch()} />
        ) : session ? (
          <>
            <Kicker>Offensivtag</Kicker>
            <Text variant="h1">{session.title}</Text>
            {!isPastSession(session, now) && countdownLabel(session, now) ? (
              <Text variant="body" color={colors.greenDeep}>
                {countdownLabel(session, now) === "heute"
                  ? "Findet heute statt"
                  : `Beginnt ${countdownLabel(session, now)}`}
              </Text>
            ) : isPastSession(session, now) ? (
              <Text variant="body" muted>
                Dieser Termin liegt in der Vergangenheit.
              </Text>
            ) : null}

            <Card style={styles.card}>
              <DetailRow icon="calendar" label="Datum" value={formatSessionDate(session)} />
              <DetailRow icon="clock" label="Uhrzeit" value={formatSessionTimeRange(session)} />
              {session.venue ? (
                <DetailRow icon="map-pin" label="Ort" value={session.venue} />
              ) : null}
              {session.room ? <DetailRow icon="home" label="Raum" value={session.room} /> : null}
              {session.address ? (
                <DetailRow icon="map" label="Adresse" value={session.address} />
              ) : null}
              {trainerName ? (
                <DetailRow icon="user" label="Trainer" value={trainerName} />
              ) : null}
            </Card>

            {session.modules ? (
              <Card style={styles.moduleCard}>
                <ModuleNumber number={session.modules.number_label} tone="green" size={44} />
                <View style={styles.moduleText}>
                  <Kicker>Modul an diesem Tag</Kicker>
                  <Text variant="h3">{session.modules.title}</Text>
                  {session.modules.claim ? (
                    <Text variant="small" muted>
                      {session.modules.claim}
                    </Text>
                  ) : null}
                </View>
              </Card>
            ) : null}

            {session.notes ? (
              <Card style={styles.card}>
                <Kicker>Agenda & Hinweise</Kicker>
                <Text variant="body">{session.notes}</Text>
              </Card>
            ) : null}

            {session.directions ? (
              <Card style={styles.card}>
                <Kicker>Anfahrt</Kicker>
                <Text variant="body">{session.directions}</Text>
              </Card>
            ) : null}

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

            <Button
              label="In Kalender übernehmen"
              variant="dark"
              loading={sharing}
              onPress={() => void onShareIcs()}
            />
          </>
        ) : null}
      </View>
    </Screen>
  );
}

/* ------------------------------ Bausteine ------------------------------ */

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow} accessibilityLabel={`${label}: ${value}`}>
      <Feather name={icon} size={16} color={colors.greenDeep} style={styles.detailIcon} />
      <View style={styles.detailText}>
        <Text variant="small" muted>
          {label}
        </Text>
        <Text variant="body">{value}</Text>
      </View>
    </View>
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
  card: { gap: spacing.md },
  moduleCard: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  moduleText: { flex: 1, gap: spacing.xs },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  detailIcon: { marginTop: 4 },
  detailText: { flex: 1, gap: 2 },
});

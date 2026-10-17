/**
 * Profil (§39/§40): Persönliche Daten, Profilbild, Passwort, Push,
 * Hilfe sowie Datenschutz & Konto (§31).
 *
 * SICHERHEIT/DSGVO:
 * - Alle Schreibzugriffe laufen über RLS (nur eigene Zeilen); can() wäre
 *   hier nur UX – die DB setzt die Regeln durch.
 * - Datenexport/Kontolöschung: Erklärung -> erneute Passwort-Eingabe
 *   (Reauth via signInWithPassword) -> Bestätigung -> Insert in
 *   account_deletion_requests (Status "requested", Bearbeitung serverseitig).
 * - Profilbild: Upload NUR in den eigenen Pfad avatars/{profileId}/…
 *   (Storage-RLS). expo-image-picker ist optional eingebunden; die
 *   Foto-Permission wird erst im Kontext der Auswahl angefragt.
 */
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
// Optionale Dependency (nur für das freiwillige Profilbild):
// Die Foto-Permission wird ausschließlich im Kontext der Auswahl angefragt.
import * as ImagePicker from "expo-image-picker";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { APP, colors, radius, spacing, touch } from "@handel-offensiv/config";
import { passwordChangeSchema } from "@handel-offensiv/validation";
import {
  NOTIFICATION_KINDS,
  type AccountDeletionRequestInsert,
  type NotificationKind,
} from "@handel-offensiv/types";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/auth-context";
import {
  disablePushForDevice,
  getOrCreateDeviceId,
  registerForPush,
} from "../../lib/notifications";
import { Banner, Button, Field, Kicker, ListRow, Screen, Skeleton, Text } from "../../ui";

/* ----------------------------- Konstanten ------------------------------ */

const PRIVACY_URL = "https://www.aigner-offensiv.de/datenschutz";
const IMPRINT_URL = "https://www.aigner-offensiv.de/impressum";

/** Identischer Key wie in app/(auth)/willkommen.tsx / push-erlaubnis.tsx. */
const PUSH_DECISION_KEY = "handel-offensiv.push-decision";
/** Lokale Kategorie-Präferenzen (unkritisch -> AsyncStorage). */
const PUSH_CATEGORIES_KEY = "handel-offensiv.push-categories";

const CATEGORY_LABELS: Record<NotificationKind, string> = {
  release: "Neue Freischaltungen",
  session_reminder: "Erinnerung an Offensivtage",
  task_due: "Fällige Aufgaben",
  announcement: "Ankündigungen",
  feedback: "Trainer-Feedback",
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "Wann werden neue Inhalte freigeschaltet?",
    a: "Inhalte werden passend zu Ihren Offensivtagen freigeschaltet – zur Vorbereitung vor dem Tag und zur Vertiefung danach. Auf dem Tab HEUTE sehen Sie immer, was gerade ansteht.",
  },
  {
    q: "Wer sieht meine Antworten und Reflexionen?",
    a: "Ihre Einträge sind standardmäßig privat. Nur wenn Sie eine Antwort ausdrücklich für Ihren Trainer freigeben, kann dieser sie sehen. Andere Teilnehmer sehen Ihre Einträge nie.",
  },
  {
    q: "Kann ich die App auch offline nutzen?",
    a: "Bereits geladene Inhalte bleiben offline verfügbar. Ihre Eingaben werden lokal zwischengespeichert und übertragen, sobald Sie wieder online sind.",
  },
  {
    q: "An wen wende ich mich bei Fragen?",
    a: `Schreiben Sie uns an ${APP.supportEmail} – wir melden uns so schnell wie möglich.`,
  },
];

/* ------------------------------ Hilfsfunktionen ------------------------ */

/** Base64 -> Bytes ohne weitere Abhängigkeiten (für den Avatar-Upload). */
function base64ToBytes(base64: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, "");
  const output: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const c0 = alphabet.indexOf(clean[i] ?? "A");
    const c1 = alphabet.indexOf(clean[i + 1] ?? "A");
    const c2 = clean[i + 2] !== undefined ? alphabet.indexOf(clean[i + 2] as string) : -1;
    const c3 = clean[i + 3] !== undefined ? alphabet.indexOf(clean[i + 3] as string) : -1;
    output.push(((c0 << 2) | (c1 >> 4)) & 0xff);
    if (c2 >= 0) output.push(((c1 << 4) | (c2 >> 2)) & 0xff);
    if (c3 >= 0) output.push(((c2 << 6) | c3) & 0xff);
  }
  return Uint8Array.from(output);
}

/* ------------------------------ Bausteine ------------------------------ */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Kicker>{title}</Kicker>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

/* -------------------------------- Screen ------------------------------- */

export default function ProfilScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session, profile, activeCohortId, refreshProfile, signOut } = useSession();
  const profileId = session?.user.id ?? null;
  const email = session?.user.email ?? null;

  /* ------- Organisation & Gruppe (read-only) ------- */
  const cohortQuery = useQuery({
    queryKey: ["profil", "cohort", activeCohortId],
    enabled: Boolean(activeCohortId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cohorts")
        .select("name, organizations(name)")
        .eq("id", activeCohortId as string)
        .maybeSingle();
      if (error) throw error;
      return data as { name: string; organizations: { name: string } | null } | null;
    },
  });

  /* ------- Avatar (privater Bucket -> signierte URL) ------- */
  const avatarQuery = useQuery({
    queryKey: ["profil", "avatar", profile?.avatar_path],
    enabled: Boolean(profile?.avatar_path),
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("avatars")
        .createSignedUrl(profile?.avatar_path as string, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<
    { kind: "error" | "success" | "info"; text: string } | null
  >(null);

  const pickAndUploadAvatar = useCallback(async () => {
    if (!profileId) return;
    setAvatarMessage(null);

    try {
      // Permission NUR im Kontext dieser Aktion anfragen (§36/§37)
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setAvatarMessage({
          kind: "info",
          text: "Ohne Zugriff auf Ihre Fotos kann kein Profilbild gewählt werden. Sie können den Zugriff in den Systemeinstellungen erlauben.",
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      const asset = result.canceled ? null : result.assets[0];
      if (!asset?.base64) return;

      setAvatarBusy(true);
      // RLS: nur der eigene Pfad avatars/{profileId}/… ist beschreibbar
      const path = `${profileId}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, base64ToBytes(asset.base64), {
          contentType: "image/jpeg",
          upsert: true,
        });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_path: path })
        .eq("id", profileId);
      if (updateError) throw updateError;

      await refreshProfile();
      await queryClient.invalidateQueries({ queryKey: ["profil", "avatar"] });
      setAvatarMessage({ kind: "success", text: "Ihr Profilbild wurde aktualisiert." });
    } catch {
      setAvatarMessage({
        kind: "error",
        text: "Das Profilbild konnte gerade nicht gespeichert werden. Bitte versuchen Sie es erneut.",
      });
    } finally {
      setAvatarBusy(false);
    }
  }, [profileId, queryClient, refreshProfile]);

  /* ------- Name bearbeiten ------- */
  const [editingName, setEditingName] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nameBusy, setNameBusy] = useState(false);
  const [nameMessage, setNameMessage] = useState<
    { kind: "error" | "success"; text: string } | null
  >(null);

  useEffect(() => {
    setFirstName(profile?.first_name ?? "");
    setLastName(profile?.last_name ?? "");
  }, [profile?.first_name, profile?.last_name]);

  async function saveName() {
    if (!profileId) return;
    const first = firstName.trim();
    const last = lastName.trim();
    if (!first || !last) {
      setNameMessage({ kind: "error", text: "Bitte geben Sie Vor- und Nachnamen an." });
      return;
    }
    setNameBusy(true);
    setNameMessage(null);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ first_name: first, last_name: last })
        .eq("id", profileId);
      if (error) throw error;
      await refreshProfile();
      setEditingName(false);
      setNameMessage({ kind: "success", text: "Ihr Name wurde gespeichert." });
    } catch {
      setNameMessage({
        kind: "error",
        text: "Ihr Name konnte gerade nicht gespeichert werden. Bitte versuchen Sie es erneut.",
      });
    } finally {
      setNameBusy(false);
    }
  }

  /* ------- Passwort ändern ------- */
  const [pwOpen, setPwOpen] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwErrors, setPwErrors] = useState<Record<string, string | undefined>>({});
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMessage, setPwMessage] = useState<
    { kind: "error" | "success"; text: string } | null
  >(null);

  async function changePassword() {
    if (!email) return;
    setPwMessage(null);
    const parsed = passwordChangeSchema.safeParse({
      currentPassword: pwCurrent,
      newPassword: pwNew,
      newPasswordConfirm: pwConfirm,
    });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setPwErrors({
        currentPassword: flat.currentPassword?.[0],
        newPassword: flat.newPassword?.[0],
        newPasswordConfirm: flat.newPasswordConfirm?.[0],
      });
      return;
    }
    setPwErrors({});
    setPwBusy(true);
    try {
      // Reauth: aktuelles Passwort verifizieren, bevor geändert wird
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email,
        password: parsed.data.currentPassword,
      });
      if (reauthError) {
        setPwErrors({ currentPassword: "Das aktuelle Passwort ist nicht korrekt." });
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({
        password: parsed.data.newPassword,
      });
      if (updateError) throw updateError;
      setPwCurrent("");
      setPwNew("");
      setPwConfirm("");
      setPwOpen(false);
      setPwMessage({ kind: "success", text: "Ihr Passwort wurde geändert." });
    } catch {
      setPwMessage({
        kind: "error",
        text: "Das Passwort konnte gerade nicht geändert werden. Bitte versuchen Sie es erneut.",
      });
    } finally {
      setPwBusy(false);
    }
  }

  /* ------- Push-Einstellungen ------- */
  const pushStateQuery = useQuery({
    queryKey: ["profil", "push-state", profileId],
    enabled: Boolean(profileId),
    queryFn: async () => {
      const deviceId = await getOrCreateDeviceId();
      const { data, error } = await supabase
        .from("push_tokens")
        .select("disabled_at")
        .eq("profile_id", profileId as string)
        .eq("device_id", deviceId)
        .maybeSingle();
      if (error) throw error;
      return { enabled: data !== null && data.disabled_at === null };
    },
  });
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState<string | null>(null);
  const [categories, setCategories] = useState<Record<NotificationKind, boolean>>(
    () =>
      Object.fromEntries(NOTIFICATION_KINDS.map((k) => [k, true])) as Record<
        NotificationKind,
        boolean
      >,
  );

  useEffect(() => {
    void AsyncStorage.getItem(PUSH_CATEGORIES_KEY).then((raw) => {
      if (!raw) return;
      try {
        const stored = JSON.parse(raw) as Partial<Record<NotificationKind, boolean>>;
        setCategories((prev) => ({ ...prev, ...stored }));
      } catch {
        // Defekter Cache-Eintrag: Standardwerte behalten
      }
    });
  }, []);

  async function togglePushMaster(next: boolean) {
    setPushBusy(true);
    setPushMessage(null);
    try {
      if (next) {
        const result = await registerForPush();
        if (!result.ok) {
          setPushMessage(
            result.reason === "denied"
              ? "Benachrichtigungen sind vom System deaktiviert. Bitte erlauben Sie sie in den Einstellungen Ihres Geräts."
              : "Benachrichtigungen konnten gerade nicht aktiviert werden. Bitte versuchen Sie es erneut.",
          );
          return;
        }
        await AsyncStorage.setItem(PUSH_DECISION_KEY, "granted").catch(() => undefined);
      } else {
        await disablePushForDevice();
        await AsyncStorage.setItem(PUSH_DECISION_KEY, "later").catch(() => undefined);
      }
      await queryClient.invalidateQueries({ queryKey: ["profil", "push-state"] });
    } catch {
      setPushMessage(
        "Die Einstellung konnte gerade nicht gespeichert werden. Bitte versuchen Sie es erneut.",
      );
    } finally {
      setPushBusy(false);
    }
  }

  function toggleCategory(kind: NotificationKind, value: boolean) {
    setCategories((prev) => {
      const next = { ...prev, [kind]: value };
      void AsyncStorage.setItem(PUSH_CATEGORIES_KEY, JSON.stringify(next)).catch(
        () => undefined,
      );
      return next;
    });
  }

  /* ------- Hilfe / FAQ ------- */
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const appVersion = Constants.expoConfig?.version ?? "–";

  /* ------- Datenexport / Kontolöschung (§31) ------- */
  const [accountFlow, setAccountFlow] = useState<{
    type: "export" | "deletion";
    step: "explain" | "reauth" | "done";
  } | null>(null);
  const [accountPassword, setAccountPassword] = useState("");
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountBusy, setAccountBusy] = useState(false);

  function startAccountFlow(type: "export" | "deletion") {
    setAccountFlow({ type, step: "explain" });
    setAccountPassword("");
    setAccountError(null);
  }

  async function confirmAccountRequest() {
    if (!accountFlow || !profileId || !email) return;
    setAccountError(null);
    if (!accountPassword) {
      setAccountError("Bitte geben Sie Ihr Passwort ein.");
      return;
    }
    setAccountBusy(true);
    try {
      // Reauth vor der Anfrage (§31)
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email,
        password: accountPassword,
      });
      if (reauthError) {
        setAccountError("Das Passwort ist nicht korrekt.");
        return;
      }
      const insert: AccountDeletionRequestInsert = {
        profile_id: profileId,
        status: "requested",
        reason:
          accountFlow.type === "deletion"
            ? "Kontolöschung angefragt (DSGVO Art. 17)"
            : "Datenexport angefragt (DSGVO Art. 15/20)",
      };
      const { error: insertError } = await supabase
        .from("account_deletion_requests")
        .insert(insert);
      if (insertError) throw insertError;
      setAccountPassword("");
      setAccountFlow({ ...accountFlow, step: "done" });
    } catch {
      setAccountError(
        "Ihre Anfrage konnte gerade nicht übermittelt werden. Bitte versuchen Sie es erneut.",
      );
    } finally {
      setAccountBusy(false);
    }
  }

  /* ------- Abmelden ------- */
  const [signOutBusy, setSignOutBusy] = useState(false);

  async function handleSignOut(scope: "local" | "global") {
    setSignOutBusy(true);
    try {
      if (scope === "global") {
        await supabase.auth.signOut({ scope: "global" });
      } else {
        await signOut();
      }
    } catch {
      // Auch bei Netzfehlern lokal abmelden – Supabase entfernt die Session lokal
    } finally {
      setSignOutBusy(false);
      router.replace("/(auth)/login");
    }
  }

  /* ------------------------------ Render ------------------------------ */

  const fullName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "–";
  const initials =
    [profile?.first_name?.[0], profile?.last_name?.[0]].filter(Boolean).join("") || "?";

  return (
    <Screen>
      <View style={styles.header}>
        <Kicker>Ihr Bereich</Kicker>
        <Text variant="h1" accessibilityRole="header">
          Profil
        </Text>
      </View>

      {/* Kopf: Avatar + Name + Organisation/Gruppe */}
      <View style={styles.profileCard}>
        <View style={styles.avatarBox}>
          {avatarQuery.data ? (
            <Image
              source={{ uri: avatarQuery.data }}
              style={styles.avatarImage}
              accessibilityLabel="Ihr Profilbild"
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text variant="h2" color={colors.paper}>
                {initials}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.profileText}>
          <Text variant="h2">{fullName}</Text>
          {cohortQuery.isLoading ? (
            <Skeleton height={18} />
          ) : cohortQuery.data ? (
            <Text variant="small" muted>
              {cohortQuery.data.organizations?.name ?? "–"}
              {" · "}
              {cohortQuery.data.name}
            </Text>
          ) : (
            <Text variant="small" muted>
              {email ?? ""}
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profilbild ändern"
            onPress={() => void pickAndUploadAvatar()}
            disabled={avatarBusy}
            style={styles.avatarLink}
          >
            <Text variant="small" color={colors.greenDeep}>
              {avatarBusy ? "Wird gespeichert …" : "Profilbild ändern"}
            </Text>
          </Pressable>
        </View>
      </View>
      {avatarMessage ? (
        <Banner kind={avatarMessage.kind} message={avatarMessage.text} />
      ) : null}

      {/* Persönliche Daten */}
      <Section title="Persönliche Daten">
        {nameMessage ? <Banner kind={nameMessage.kind} message={nameMessage.text} /> : null}
        {editingName ? (
          <View style={styles.editBlock}>
            <Field label="Vorname" value={firstName} onChangeText={setFirstName} />
            <Field label="Nachname" value={lastName} onChangeText={setLastName} />
            <View style={styles.buttonRow}>
              <Button
                label="Speichern"
                loading={nameBusy}
                onPress={() => void saveName()}
                style={styles.flexButton}
              />
              <Button
                label="Abbrechen"
                variant="secondary"
                disabled={nameBusy}
                onPress={() => {
                  setEditingName(false);
                  setFirstName(profile?.first_name ?? "");
                  setLastName(profile?.last_name ?? "");
                }}
                style={styles.flexButton}
              />
            </View>
          </View>
        ) : (
          <ListRow
            title="Name"
            subtitle={fullName}
            onPress={() => setEditingName(true)}
          />
        )}
        <ListRow
          title="Unternehmen"
          subtitle={cohortQuery.data?.organizations?.name ?? "–"}
        />
        <ListRow title="Gruppe" subtitle={cohortQuery.data?.name ?? "–"} />

        {pwMessage ? <Banner kind={pwMessage.kind} message={pwMessage.text} /> : null}
        {pwOpen ? (
          <View style={styles.editBlock}>
            <Field
              label="Aktuelles Passwort"
              value={pwCurrent}
              onChangeText={setPwCurrent}
              error={pwErrors.currentPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
            />
            <Field
              label="Neues Passwort"
              value={pwNew}
              onChangeText={setPwNew}
              error={pwErrors.newPassword}
              hint="Mindestens 10 Zeichen."
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
            />
            <Field
              label="Neues Passwort bestätigen"
              value={pwConfirm}
              onChangeText={setPwConfirm}
              error={pwErrors.newPasswordConfirm}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
            />
            <View style={styles.buttonRow}>
              <Button
                label="Passwort ändern"
                loading={pwBusy}
                onPress={() => void changePassword()}
                style={styles.flexButton}
              />
              <Button
                label="Abbrechen"
                variant="secondary"
                disabled={pwBusy}
                onPress={() => setPwOpen(false)}
                style={styles.flexButton}
              />
            </View>
          </View>
        ) : (
          <ListRow title="Passwort ändern" onPress={() => setPwOpen(true)} />
        )}
      </Section>

      {/* Benachrichtigungen */}
      <Section title="Benachrichtigungen">
        {pushMessage ? <Banner kind="info" message={pushMessage} /> : null}
        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text variant="h3">Mitteilungen auf diesem Gerät</Text>
            <Text variant="small" muted>
              Freischaltungen, Termine und Feedback als Push-Mitteilung erhalten.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Mitteilungen auf diesem Gerät"
            value={pushStateQuery.data?.enabled ?? false}
            disabled={pushBusy || pushStateQuery.isLoading}
            onValueChange={(v) => void togglePushMaster(v)}
            trackColor={{ true: colors.green, false: colors.line }}
            thumbColor={colors.white}
          />
        </View>
        {(pushStateQuery.data?.enabled ?? false)
          ? NOTIFICATION_KINDS.map((kind) => (
              <View key={kind} style={styles.switchRow}>
                <View style={styles.switchText}>
                  <Text variant="body">{CATEGORY_LABELS[kind]}</Text>
                </View>
                <Switch
                  accessibilityLabel={CATEGORY_LABELS[kind]}
                  value={categories[kind]}
                  onValueChange={(v) => toggleCategory(kind, v)}
                  trackColor={{ true: colors.green, false: colors.line }}
                  thumbColor={colors.white}
                />
              </View>
            ))
          : null}
      </Section>

      {/* Hilfe */}
      <Section title="Hilfe">
        {FAQ.map((item, index) => (
          <View key={item.q}>
            <ListRow
              title={item.q}
              onPress={() => setOpenFaq(openFaq === index ? null : index)}
              chevron={false}
              trailing={
                <Feather
                  name={openFaq === index ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.inkSoft}
                />
              }
            />
            {openFaq === index ? (
              <Text variant="body" muted style={styles.faqAnswer}>
                {item.a}
              </Text>
            ) : null}
          </View>
        ))}
        <ListRow
          title="Kontakt"
          subtitle={APP.supportEmail}
          onPress={() => void Linking.openURL(`mailto:${APP.supportEmail}`)}
        />
        <ListRow title="App-Version" subtitle={appVersion} />
      </Section>

      {/* Datenschutz & Konto */}
      <Section title="Datenschutz & Konto">
        <ListRow
          title="Datenschutzerklärung"
          subtitle="Öffnet im Browser"
          onPress={() => void Linking.openURL(PRIVACY_URL)}
        />
        <ListRow
          title="Impressum"
          subtitle="Öffnet im Browser"
          onPress={() => void Linking.openURL(IMPRINT_URL)}
        />

        {accountFlow ? (
          <View style={styles.editBlock}>
            <Text variant="h3">
              {accountFlow.type === "deletion"
                ? "Kontolöschung anfragen"
                : "Datenexport anfragen"}
            </Text>
            {accountFlow.step === "done" ? (
              <>
                <Banner
                  kind="success"
                  message={
                    accountFlow.type === "deletion"
                      ? "Ihre Löschanfrage wurde übermittelt. Wir bearbeiten sie innerhalb der gesetzlichen Frist und melden uns per E-Mail bei Ihnen."
                      : "Ihre Anfrage auf Datenexport wurde übermittelt. Sie erhalten Ihre Daten per E-Mail innerhalb der gesetzlichen Frist."
                  }
                />
                <Button
                  label="Schließen"
                  variant="secondary"
                  onPress={() => setAccountFlow(null)}
                />
              </>
            ) : (
              <>
                <Text variant="body" muted>
                  {accountFlow.type === "deletion"
                    ? "Mit dieser Anfrage bitten Sie um die endgültige Löschung Ihres Kontos und Ihrer persönlichen Daten (DSGVO Art. 17). Die Löschung wird von uns geprüft und durchgeführt – Ihre Lernstände und Einträge gehen dabei unwiderruflich verloren."
                    : "Mit dieser Anfrage bitten Sie um eine Kopie Ihrer bei uns gespeicherten persönlichen Daten (DSGVO Art. 15/20). Sie erhalten den Export an Ihre hinterlegte E-Mail-Adresse."}
                </Text>
                <Text variant="body" muted>
                  Bitte bestätigen Sie die Anfrage mit Ihrem Passwort.
                </Text>
                {accountError ? <Banner kind="error" message={accountError} /> : null}
                <Field
                  label="Passwort"
                  value={accountPassword}
                  onChangeText={setAccountPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="current-password"
                />
                <View style={styles.buttonRow}>
                  <Button
                    label={
                      accountFlow.type === "deletion"
                        ? "Löschung anfragen"
                        : "Export anfragen"
                    }
                    loading={accountBusy}
                    onPress={() => void confirmAccountRequest()}
                    style={styles.flexButton}
                  />
                  <Button
                    label="Abbrechen"
                    variant="secondary"
                    disabled={accountBusy}
                    onPress={() => setAccountFlow(null)}
                    style={styles.flexButton}
                  />
                </View>
              </>
            )}
          </View>
        ) : (
          <>
            <ListRow
              title="Datenexport anfragen"
              subtitle="Kopie Ihrer Daten erhalten (DSGVO)"
              onPress={() => startAccountFlow("export")}
            />
            <ListRow
              title="Konto löschen anfragen"
              subtitle="Endgültige Löschung Ihrer Daten (DSGVO)"
              onPress={() => startAccountFlow("deletion")}
            />
          </>
        )}

        <View style={styles.signOutBlock}>
          <Button
            label="Abmelden"
            variant="secondary"
            loading={signOutBusy}
            onPress={() => void handleSignOut("local")}
          />
          <Button
            label="Alle Sitzungen beenden"
            variant="ghost"
            disabled={signOutBusy}
            onPress={() => void handleSignOut("global")}
          />
        </View>
      </Section>
    </Screen>
  );
}

/* -------------------------------- Styles ------------------------------- */

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  profileCard: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.base,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: "center",
  },
  avatarBox: {
    width: 64,
    height: 64,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: radius.base,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: radius.base,
    backgroundColor: colors.dark,
    alignItems: "center",
    justifyContent: "center",
  },
  profileText: {
    flex: 1,
    gap: 2,
  },
  avatarLink: {
    minHeight: touch.minTarget - 12,
    justifyContent: "center",
  },
  section: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  editBlock: {
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 56,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  switchText: {
    flex: 1,
    gap: 2,
  },
  faqAnswer: {
    paddingBottom: spacing.md,
  },
  signOutBlock: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
});

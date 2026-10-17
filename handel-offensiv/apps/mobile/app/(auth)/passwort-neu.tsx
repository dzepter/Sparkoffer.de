/**
 * Neues Passwort setzen (Recovery-Flow, Befund I-3).
 *
 * Einstieg per Deep Link aus der Supabase-Recovery-Mail:
 *   handeloffensiv://passwort-neu#access_token=…&refresh_token=…&type=recovery  (implicit)
 *   handeloffensiv://passwort-neu?code=…                                         (PKCE)
 * Der Screen uebernimmt die Recovery-Session, laesst das neue Passwort setzen
 * (passwordResetSchema: min. 10 Zeichen + Bestaetigung) und meldet danach auf
 * ALLEN Geraeten ab – ein eventuell fremdes Geraet verliert den Zugang.
 */
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { colors, radius, spacing } from "@handel-offensiv/config";
import { passwordResetSchema } from "@handel-offensiv/validation";
import { supabase } from "../../src/lib/supabase";
import { Banner, Button, Field, Text } from "../../src/ui";

type Phase = "checking" | "ready" | "invalid" | "done";

/** Liest Tokens/Code aus Query UND Fragment des Deep Links. */
function parseRecoveryLink(url: string): {
  accessToken?: string;
  refreshToken?: string;
  code?: string;
} {
  const out: { accessToken?: string; refreshToken?: string; code?: string } = {};
  const collect = (raw: string | undefined) => {
    if (!raw) return;
    for (const pair of raw.split("&")) {
      const [k, v] = pair.split("=");
      if (!k || v === undefined) continue;
      const value = decodeURIComponent(v);
      if (k === "access_token") out.accessToken = value;
      if (k === "refresh_token") out.refreshToken = value;
      if (k === "code") out.code = value;
    }
  };
  const hashIndex = url.indexOf("#");
  const queryIndex = url.indexOf("?");
  if (queryIndex >= 0) {
    collect(url.slice(queryIndex + 1, hashIndex >= 0 && hashIndex > queryIndex ? hashIndex : undefined));
  }
  if (hashIndex >= 0) collect(url.slice(hashIndex + 1));
  return out;
}

export default function PasswortNeuScreen() {
  const router = useRouter();
  const url = Linking.useURL();

  const [phase, setPhase] = useState<Phase>("checking");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Recovery-Session aus dem Link uebernehmen
  useEffect(() => {
    let cancelled = false;
    async function adopt() {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          if (!cancelled) setPhase("ready");
          return;
        }
        if (!url) return;
        const parsed = parseRecoveryLink(url);
        if (parsed.code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(parsed.code);
          if (!cancelled) setPhase(exchangeError ? "invalid" : "ready");
          return;
        }
        if (parsed.accessToken && parsed.refreshToken) {
          const { error: setError } = await supabase.auth.setSession({
            access_token: parsed.accessToken,
            refresh_token: parsed.refreshToken,
          });
          if (!cancelled) setPhase(setError ? "invalid" : "ready");
          return;
        }
        if (!cancelled) setPhase("invalid");
      } catch {
        if (!cancelled) setPhase("invalid");
      }
    }
    void adopt();
    return () => {
      cancelled = true;
    };
  }, [url]);

  async function handleSubmit() {
    setError(null);
    const parsed = passwordResetSchema.safeParse({ password, passwordConfirm });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        password: flat.password?.[0],
        passwordConfirm: flat.passwordConfirm?.[0],
      });
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: parsed.data.password });
      if (updateError) {
        const msg = updateError.message.toLowerCase();
        setError(
          msg.includes("same password") || msg.includes("different from the old")
            ? "Das neue Passwort muss sich vom bisherigen unterscheiden."
            : "Das Passwort konnte gerade nicht gespeichert werden. Bitte versuchen Sie es erneut.",
        );
        return;
      }
      await supabase.auth.signOut({ scope: "global" });
      setPhase("done");
    } catch {
      setError(
        "Das Passwort konnte gerade nicht gespeichert werden. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text variant="h1" accessibilityRole="header">
            Neues Passwort
          </Text>

          {phase === "checking" ? (
            <Text variant="body" muted>
              Ihr Link wird geprüft …
            </Text>
          ) : null}

          {phase === "invalid" ? (
            <>
              <Banner
                kind="error"
                message="Dieser Link ist nicht mehr gültig. Bitte fordern Sie über „Passwort vergessen“ einen neuen Link an."
              />
              <Button
                label="Neuen Link anfordern"
                onPress={() => router.replace("/(auth)/passwort-vergessen")}
              />
            </>
          ) : null}

          {phase === "done" ? (
            <>
              <Banner
                kind="success"
                message="Ihr neues Passwort wurde gespeichert. Bitte melden Sie sich damit an."
              />
              <Button label="Zur Anmeldung" onPress={() => router.replace("/(auth)/login")} />
            </>
          ) : null}

          {phase === "ready" ? (
            <>
              <Text variant="body" muted>
                Wählen Sie ein neues Passwort mit mindestens 10 Zeichen. Danach werden Sie auf
                allen Geräten abgemeldet und melden sich neu an.
              </Text>

              {error ? <Banner kind="error" message={error} /> : null}

              <Field
                label="Neues Passwort"
                value={password}
                onChangeText={setPassword}
                error={fieldErrors.password}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
              />
              <Field
                label="Neues Passwort wiederholen"
                value={passwordConfirm}
                onChangeText={setPasswordConfirm}
                error={fieldErrors.passwordConfirm}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="done"
                onSubmitEditing={() => void handleSubmit()}
              />

              <Button
                label="Passwort speichern"
                loading={submitting}
                onPress={() => void handleSubmit()}
              />
            </>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.paper,
    borderRadius: radius.base,
    padding: spacing.lg,
    gap: spacing.md,
  },
});

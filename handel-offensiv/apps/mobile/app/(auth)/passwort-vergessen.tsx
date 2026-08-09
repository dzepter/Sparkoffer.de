/**
 * Passwort vergessen: E-Mail-Eingabe -> resetPasswordForEmail.
 *
 * SICHERHEIT: Es wird IMMER dieselbe Erfolgsmeldung angezeigt – unabhängig
 * davon, ob die E-Mail-Adresse existiert (kein User-Enumeration-Leak).
 * redirectTo zeigt auf den Scheme-Deep-Link der App (handeloffensiv://…).
 */
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { colors, radius, spacing, touch } from "@handel-offensiv/config";
import { loginSchema } from "@handel-offensiv/validation";
import { supabase } from "../../src/lib/supabase";
import { Banner, Button, Field, Text } from "../../src/ui";

// Nur die E-Mail-Regel aus dem Login-Schema wiederverwenden
const emailOnlySchema = loginSchema.pick({ email: true });

export default function PasswortVergessenScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [offlineError, setOfflineError] = useState<string | null>(null);

  async function handleSubmit() {
    setOfflineError(null);
    const parsed = emailOnlySchema.safeParse({ email });
    if (!parsed.success) {
      setFieldError(parsed.error.flatten().fieldErrors.email?.[0]);
      return;
    }
    setFieldError(undefined);
    setSubmitting(true);
    try {
      // Deep-Link zurück in die App; der Screen zum Setzen des neuen
      // Passworts ("passwort-neu") folgt mit dem Auth-Recovery-Flow.
      await supabase.auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo: Linking.createURL("passwort-neu"),
      });
    } catch {
      // Netzfehler nicht verschlucken – hier gibt es nichts zu enumerieren.
      setOfflineError(
        "Die Anfrage konnte gerade nicht gesendet werden. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.",
      );
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    // IMMER Erfolg anzeigen – unabhängig vom Ergebnis (Enumeration-Schutz)
    setDone(true);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text variant="h1" accessibilityRole="header">
            Passwort vergessen
          </Text>

          {done ? (
            <>
              <Banner
                kind="success"
                message="Wenn ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen soeben einen Link zum Zurücksetzen des Passworts gesendet. Bitte prüfen Sie auch Ihren Spam-Ordner."
              />
              <Button
                label="Zurück zur Anmeldung"
                variant="secondary"
                onPress={() => router.back()}
              />
            </>
          ) : (
            <>
              <Text variant="body" muted>
                Geben Sie Ihre E-Mail-Adresse ein. Sie erhalten einen Link, mit
                dem Sie ein neues Passwort festlegen können.
              </Text>

              {offlineError ? <Banner kind="error" message={offlineError} /> : null}

              <Field
                label="E-Mail"
                value={email}
                onChangeText={setEmail}
                error={fieldError}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="done"
                onSubmitEditing={() => void handleSubmit()}
              />

              <Button
                label="Link anfordern"
                loading={submitting}
                onPress={() => void handleSubmit()}
              />

              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Zurück zur Anmeldung"
                onPress={() => router.back()}
                style={styles.linkRow}
              >
                <Text variant="body" color={colors.greenDeep}>
                  Zurück zur Anmeldung
                </Text>
              </Pressable>
            </>
          )}
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
  linkRow: {
    minHeight: touch.minTarget,
    justifyContent: "center",
  },
});

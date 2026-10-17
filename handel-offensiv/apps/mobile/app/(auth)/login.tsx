/**
 * Login (§38): E-Mail + Passwort.
 *
 * - Validierung mit loginSchema (@handel-offensiv/validation).
 * - Fehlermeldung bewusst UNSPEZIFISCH ("E-Mail oder Passwort ist nicht
 *   korrekt.") – kein User-Enumeration-Leak, keine technischen Codes.
 * - Links: "Passwort vergessen?" und "Ich habe einen Einladungscode".
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
import { colors, radius, spacing, touch } from "@handel-offensiv/config";
import { loginSchema } from "@handel-offensiv/validation";
import { supabase } from "../../src/lib/supabase";
import { Banner, Button, Field, Text } from "../../src/ui";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setFormError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({ email: flat.email?.[0], password: flat.password?.[0] });
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (error) {
        // Bewusst unspezifisch – niemals verraten, ob die E-Mail existiert.
        setFormError("E-Mail oder Passwort ist nicht korrekt.");
        return;
      }
      router.replace("/(tabs)/heute");
    } catch {
      setFormError(
        "Die Anmeldung ist gerade nicht möglich. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.",
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
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text variant="h1" accessibilityRole="header">
            Anmelden
          </Text>
          <Text variant="body" muted>
            Willkommen im Mannschaftsraum. Bitte melden Sie sich mit Ihren
            Zugangsdaten an.
          </Text>

          {formError ? <Banner kind="error" message={formError} /> : null}

          <Field
            label="E-Mail"
            value={email}
            onChangeText={setEmail}
            error={fieldErrors.email}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="next"
          />
          <Field
            label="Passwort"
            value={password}
            onChangeText={setPassword}
            error={fieldErrors.password}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="done"
            onSubmitEditing={() => void handleSubmit()}
          />

          <Button
            label="Anmelden"
            loading={submitting}
            onPress={() => void handleSubmit()}
          />

          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Passwort vergessen?"
            onPress={() => router.push("/(auth)/passwort-vergessen")}
            style={styles.linkRow}
          >
            <Text variant="body" color={colors.greenDeep}>
              Passwort vergessen?
            </Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Ich habe einen Einladungscode"
          onPress={() => router.push("/(auth)/einladung")}
          style={styles.inviteRow}
        >
          <Text variant="body" color={colors.greenBright}>
            Ich habe einen Einladungscode
          </Text>
        </Pressable>
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
  inviteRow: {
    minHeight: touch.minTarget,
    justifyContent: "center",
    alignItems: "center",
  },
});

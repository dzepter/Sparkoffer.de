/**
 * Einladung annehmen (§38) – einziger Registrierungsweg.
 *
 * Ablauf:
 * 1. Einladungscode eingeben (oder via Deep Link handeloffensiv://einladung?token=…)
 * 2. Edge Function "accept-invitation" (action "validate") prüft den Code
 *    und liefert E-Mail + Organisation (Anzeige zur Bestätigung).
 * 3. Name + Passwort setzen (invitationAcceptSchema: min. 10 Zeichen,
 *    Bestätigung) + Datenschutz-Zustimmung (Pflicht-Checkbox).
 * 4. Edge Function (action "accept") legt Konto, Mitgliedschaft und
 *    user_consents SERVERSEITIG an – danach automatische Anmeldung.
 *
 * Erwarteter Contract der Edge Function (supabase/functions/accept-invitation):
 *   POST { action: "validate", token } ->
 *     200 { ok: true, invitation: { email, organizationName, cohortName?,
 *           firstName?, lastName? } }
 *     4xx { ok: false, code: "invalid" | "expired" | "revoked" | "accepted" }
 *   POST { action: "accept", token, firstName, lastName, password,
 *          consentPrivacy: true } ->
 *     200 { ok: true, email }  |  4xx { ok: false, code: … }
 */
import { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { Feather } from "@expo/vector-icons";
import { colors, radius, spacing, touch } from "@handel-offensiv/config";
import { invitationAcceptSchema } from "@handel-offensiv/validation";
import { supabase } from "../../src/lib/supabase";
import { Banner, Button, Field, Kicker, Text } from "../../src/ui";

/** Öffentliche Datenschutzerklärung (System-Browser, WebView-frei, §30). */
const PRIVACY_URL = "https://www.aigner-offensiv.de/datenschutz";

interface InvitationInfo {
  email: string;
  organizationName: string;
  cohortName: string | null;
  firstName: string | null;
  lastName: string | null;
}

type Step =
  | { kind: "enterToken" }
  | { kind: "validating" }
  | { kind: "form"; token: string; invitation: InvitationInfo };

/** Fehlercode der Edge Function -> verständlicher deutscher Text. */
function invitationErrorText(code: unknown): string {
  switch (code) {
    case "expired":
      return "Diese Einladung ist abgelaufen. Bitte wenden Sie sich an Ihre Ansprechperson, um eine neue Einladung zu erhalten.";
    case "revoked":
      return "Diese Einladung wurde zurückgezogen. Bitte wenden Sie sich an Ihre Ansprechperson.";
    case "accepted":
      return "Diese Einladung wurde bereits verwendet. Bitte melden Sie sich mit Ihren Zugangsdaten an.";
    default:
      return "Dieser Einladungscode ist nicht gültig. Bitte prüfen Sie Ihre Eingabe.";
  }
}

/** Antwort der Edge Function defensiv lesen (kein Vertrauen in die Form). */
function readFunctionPayload(data: unknown): {
  ok: boolean;
  code?: unknown;
  invitation?: Partial<Record<keyof InvitationInfo, unknown>>;
} {
  if (typeof data !== "object" || data === null) return { ok: false };
  const obj = data as Record<string, unknown>;
  return {
    ok: obj.ok === true,
    code: obj.code,
    invitation:
      typeof obj.invitation === "object" && obj.invitation !== null
        ? (obj.invitation as Partial<Record<keyof InvitationInfo, unknown>>)
        : undefined,
  };
}

function asStringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export default function EinladungScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();

  const [step, setStep] = useState<Step>({ kind: "enterToken" });
  const [tokenInput, setTokenInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Formular-Felder (Schritt 3)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [submitting, setSubmitting] = useState(false);

  const validateToken = useCallback(async (rawToken: string) => {
    const token = rawToken.trim();
    if (!token) {
      setError("Bitte geben Sie Ihren Einladungscode ein.");
      return;
    }
    setError(null);
    setStep({ kind: "validating" });
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "accept-invitation",
        { body: { action: "validate", token } },
      );
      const payload = readFunctionPayload(data);
      if (fnError || !payload.ok || !payload.invitation) {
        setError(invitationErrorText(payload.code));
        setStep({ kind: "enterToken" });
        return;
      }
      const email = asStringOrNull(payload.invitation.email);
      const organizationName = asStringOrNull(payload.invitation.organizationName);
      if (!email || !organizationName) {
        setError(invitationErrorText(undefined));
        setStep({ kind: "enterToken" });
        return;
      }
      const invitation: InvitationInfo = {
        email,
        organizationName,
        cohortName: asStringOrNull(payload.invitation.cohortName),
        firstName: asStringOrNull(payload.invitation.firstName),
        lastName: asStringOrNull(payload.invitation.lastName),
      };
      setFirstName((prev) => prev || (invitation.firstName ?? ""));
      setLastName((prev) => prev || (invitation.lastName ?? ""));
      setStep({ kind: "form", token, invitation });
    } catch {
      setError(
        "Die Einladung konnte gerade nicht geprüft werden. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.",
      );
      setStep({ kind: "enterToken" });
    }
  }, []);

  // Deep Link ?token=… direkt prüfen
  useEffect(() => {
    const deepLinkToken = typeof params.token === "string" ? params.token : undefined;
    if (deepLinkToken) {
      setTokenInput(deepLinkToken);
      void validateToken(deepLinkToken);
    }
    // Nur beim ersten Rendern bzw. bei neuem Deep-Link-Token
  }, [params.token, validateToken]);

  async function handleAccept() {
    if (step.kind !== "form") return;
    setError(null);
    const parsed = invitationAcceptSchema.safeParse({
      token: step.token,
      firstName,
      lastName,
      password,
      passwordConfirm,
      consentPrivacy,
    });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        firstName: flat.firstName?.[0],
        lastName: flat.lastName?.[0],
        password: flat.password?.[0],
        passwordConfirm: flat.passwordConfirm?.[0],
        consentPrivacy: flat.consentPrivacy?.[0],
      });
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "accept-invitation",
        {
          body: {
            action: "accept",
            token: parsed.data.token,
            firstName: parsed.data.firstName,
            lastName: parsed.data.lastName,
            password: parsed.data.password,
            // user_consents schreibt der Server (DSGVO-Nachweis inkl. Version)
            consentPrivacy: parsed.data.consentPrivacy,
          },
        },
      );
      const payload = readFunctionPayload(data);
      if (fnError || !payload.ok) {
        setError(
          payload.code
            ? invitationErrorText(payload.code)
            : "Die Einladung konnte gerade nicht angenommen werden. Bitte versuchen Sie es erneut.",
        );
        return;
      }

      // Automatische Anmeldung mit den soeben gesetzten Zugangsdaten
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: step.invitation.email,
        password: parsed.data.password,
      });
      if (signInError) {
        // Konto existiert – Anmeldung klappte nur gerade nicht: sauber zum Login
        setError(
          "Ihr Zugang wurde angelegt, die automatische Anmeldung war gerade nicht möglich. Bitte melden Sie sich mit Ihrer E-Mail-Adresse und Ihrem neuen Passwort an.",
        );
        return;
      }
      router.replace("/(auth)/willkommen");
    } catch {
      setError(
        "Die Einladung konnte gerade nicht angenommen werden. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.",
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
          <Kicker>Einladung</Kicker>
          <Text variant="h1" accessibilityRole="header">
            {step.kind === "form" ? "Zugang einrichten" : "Einladungscode"}
          </Text>

          {error ? <Banner kind="error" message={error} /> : null}

          {step.kind === "enterToken" || step.kind === "validating" ? (
            <>
              <Text variant="body" muted>
                Sie haben eine Einladung zu Handel Offensiv erhalten? Geben Sie
                hier Ihren Einladungscode ein – Sie finden ihn in Ihrer
                Einladungs-E-Mail.
              </Text>
              <Field
                label="Einladungscode"
                value={tokenInput}
                onChangeText={setTokenInput}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={() => void validateToken(tokenInput)}
              />
              <Button
                label="Einladung prüfen"
                loading={step.kind === "validating"}
                onPress={() => void validateToken(tokenInput)}
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
          ) : (
            <>
              {/* Bestätigung: Wer wird wo eingeladen? */}
              <View style={styles.invitationBox}>
                <Text variant="small" muted>
                  Eingeladen als
                </Text>
                <Text variant="h3">{step.invitation.email}</Text>
                <Text variant="small" muted>
                  {step.invitation.cohortName
                    ? `${step.invitation.organizationName} · ${step.invitation.cohortName}`
                    : step.invitation.organizationName}
                </Text>
              </View>

              <Field
                label="Vorname"
                value={firstName}
                onChangeText={setFirstName}
                error={fieldErrors.firstName}
                autoComplete="given-name"
                textContentType="givenName"
              />
              <Field
                label="Nachname"
                value={lastName}
                onChangeText={setLastName}
                error={fieldErrors.lastName}
                autoComplete="family-name"
                textContentType="familyName"
              />
              <Field
                label="Passwort"
                value={password}
                onChangeText={setPassword}
                error={fieldErrors.password}
                hint="Mindestens 10 Zeichen."
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
              />
              <Field
                label="Passwort bestätigen"
                value={passwordConfirm}
                onChangeText={setPasswordConfirm}
                error={fieldErrors.passwordConfirm}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
              />

              {/* Datenschutz-Zustimmung (Pflicht) */}
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: consentPrivacy }}
                accessibilityLabel="Ich habe die Datenschutzerklärung gelesen und stimme der Verarbeitung meiner Daten zu."
                onPress={() => setConsentPrivacy((v) => !v)}
                style={styles.consentRow}
              >
                <View
                  style={[
                    styles.checkbox,
                    consentPrivacy && styles.checkboxChecked,
                  ]}
                >
                  {consentPrivacy ? (
                    <Feather name="check" size={16} color={colors.dark} />
                  ) : null}
                </View>
                <Text variant="small" style={styles.consentText}>
                  Ich habe die{" "}
                  <Text
                    variant="small"
                    color={colors.greenDeep}
                    onPress={() => void Linking.openURL(PRIVACY_URL)}
                    accessibilityRole="link"
                  >
                    Datenschutzerklärung
                  </Text>{" "}
                  gelesen und stimme der Verarbeitung meiner Daten zu.
                </Text>
              </Pressable>
              {fieldErrors.consentPrivacy ? (
                <Text variant="small" color={colors.danger}>
                  {fieldErrors.consentPrivacy}
                </Text>
              ) : null}

              <Button
                label="Zugang einrichten"
                loading={submitting}
                onPress={() => void handleAccept()}
              />
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
  invitationBox: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.base,
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: 2,
  },
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    minHeight: touch.minTarget,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: colors.ink,
    borderRadius: radius.base,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  consentText: {
    flex: 1,
  },
  linkRow: {
    minHeight: touch.minTarget,
    justifyContent: "center",
  },
});

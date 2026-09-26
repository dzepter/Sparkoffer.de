/**
 * Eingabefeld mit Label und Fehlertext. Fehler werden zusätzlich zur Farbe
 * als Text ausgegeben (keine reine Farbcodierung, §36). Validierung der
 * Werte selbst erfolgt in den Screens mit Zod (@handel-offensiv/validation).
 */
import { forwardRef, useState } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { colors, radius, spacing, touch } from "@handel-offensiv/config";
import { Text, archivoFamily } from "./Text";

export interface FieldProps extends TextInputProps {
  label: string;
  /** Verständlicher deutscher Fehlertext – niemals technische Codes */
  error?: string | null;
  /** Optionaler Hinweistext unterhalb des Feldes */
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Field = forwardRef<TextInput, FieldProps>(function Field(
  { label, error, hint, containerStyle, style, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.ink : colors.line;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text variant="small" style={styles.label} muted>
        {label}
      </Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor={colors.inkSoft}
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[styles.input, { borderColor }, style]}
      />
      {error ? (
        <Text variant="small" color={colors.danger} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="small" muted>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs + 2,
  },
  label: {
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontFamily: archivoFamily("700"),
    fontSize: 11,
  },
  input: {
    minHeight: Math.max(touch.minTarget, 48),
    borderWidth: 1,
    borderRadius: radius.base,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    fontFamily: archivoFamily("400"),
    color: colors.ink,
  },
});

/**
 * Button: kantig (Radius 2), Versal-Label, min. 48 px Höhe (Touch-Target §36).
 * primary: Markengrün mit dunklem Text (Kontrast), secondary: Outline,
 * dark: dunkle Fläche mit hellgrünem Text, ghost: nur Text.
 */
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, radius, touch, typography } from "@handel-offensiv/config";
import { Text, archivoFamily } from "./Text";

export type ButtonVariant = "primary" | "secondary" | "dark" | "ghost";

export interface ButtonProps extends Omit<PressableProps, "style" | "children"> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

const palettes: Record<
  ButtonVariant,
  { bg: string; text: string; border: string }
> = {
  primary: { bg: colors.green, text: colors.dark, border: colors.green },
  secondary: { bg: "transparent", text: colors.ink, border: colors.ink },
  dark: { bg: colors.dark, text: colors.greenBright, border: colors.dark },
  ghost: { bg: "transparent", text: colors.greenDeep, border: "transparent" },
};

export function Button({
  label,
  variant = "primary",
  loading = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const palette = palettes[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      {...rest}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator size="small" color={palette.text} />
        ) : (
          <Text
            variant="body"
            color={palette.text}
            style={{
              fontFamily: archivoFamily("700"),
              fontSize: 15,
              letterSpacing: typography.kicker.letterSpacing,
              textTransform: "uppercase",
              lineHeight: 20,
            }}
          >
            {label}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: Math.max(touch.minTarget, 48),
    borderRadius: radius.base,
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

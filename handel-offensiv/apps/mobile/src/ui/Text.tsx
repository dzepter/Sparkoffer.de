/**
 * Typografie-Baustein: Archivo in klaren Varianten (Briefing §35).
 * React Native braucht je Schnitt eine eigene fontFamily – die Varianten
 * mappen daher Gewicht -> gebündelte Archivo-Datei.
 */
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from "react-native";
import { colors, typography } from "@handel-offensiv/config";

export type TextVariant = "display" | "h1" | "h2" | "h3" | "body" | "small" | "kicker";

/** Gewicht -> gebündelter Archivo-Schnitt (geladen in app/_layout.tsx) */
export function archivoFamily(weight: TextStyle["fontWeight"]): string {
  switch (weight) {
    case "800":
      return "Archivo_800ExtraBold";
    case "700":
      return "Archivo_700Bold";
    case "500":
      return "Archivo_500Medium";
    default:
      return "Archivo_400Regular";
  }
}

const variantStyles: Record<TextVariant, TextStyle> = {
  display: {
    fontSize: typography.display.fontSize,
    letterSpacing: typography.display.letterSpacing,
    fontFamily: archivoFamily(typography.display.fontWeight),
    lineHeight: typography.display.fontSize * 1.02,
  },
  h1: {
    fontSize: typography.h1.fontSize,
    fontFamily: archivoFamily(typography.h1.fontWeight),
    lineHeight: typography.h1.fontSize * 1.15,
  },
  h2: {
    fontSize: typography.h2.fontSize,
    fontFamily: archivoFamily(typography.h2.fontWeight),
    lineHeight: typography.h2.fontSize * 1.2,
  },
  h3: {
    fontSize: typography.h3.fontSize,
    fontFamily: archivoFamily(typography.h3.fontWeight),
    lineHeight: typography.h3.fontSize * 1.3,
  },
  body: {
    fontSize: typography.body.fontSize,
    fontFamily: archivoFamily(typography.body.fontWeight),
    lineHeight: typography.body.lineHeight,
  },
  small: {
    fontSize: typography.small.fontSize,
    fontFamily: archivoFamily(typography.small.fontWeight),
    lineHeight: typography.small.lineHeight,
  },
  kicker: {
    fontSize: typography.kicker.fontSize,
    letterSpacing: typography.kicker.letterSpacing,
    fontFamily: archivoFamily(typography.kicker.fontWeight),
    textTransform: "uppercase",
  },
};

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  /** Textfarbe; Standard ink, "soft" für Sekundärtext */
  color?: string;
  muted?: boolean;
}

export function Text({ variant = "body", color, muted, style, ...rest }: TextProps) {
  return (
    <RNText
      {...rest}
      style={[
        variantStyles[variant],
        { color: color ?? (muted ? colors.inkSoft : colors.ink) },
        style,
      ]}
    />
  );
}

/** Karte auf hellem Grund: Weiß, Hairline, Radius 2 – ruhig und präzise. */
import { View, type ViewProps } from "react-native";
import { colors, radius, spacing } from "@handel-offensiv/config";

export interface CardProps extends ViewProps {
  /** Dunkle Variante (z. B. Hero-Karte "Heute") */
  tone?: "light" | "dark";
  padded?: boolean;
}

export function Card({ tone = "light", padded = true, style, ...rest }: CardProps) {
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: tone === "dark" ? colors.dark : colors.white,
          borderColor: tone === "dark" ? colors.lineDark : colors.line,
          borderWidth: 1,
          borderRadius: radius.base,
          padding: padded ? spacing.md : 0,
        },
        style,
      ]}
    />
  );
}

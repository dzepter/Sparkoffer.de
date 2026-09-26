/** Große Modulnummer "01"–"05" – zentrales Gestaltungselement (Briefing §35). */
import { colors } from "@handel-offensiv/config";
import { Text } from "./Text";

export interface ModuleNumberProps {
  /** Nummer als Label, z. B. "01" */
  number: string;
  /** solid = ink, green = Markengrün, faint = zurückhaltend (Hairline-Grau) */
  tone?: "solid" | "green" | "faint";
  size?: number;
  onDark?: boolean;
}

export function ModuleNumber({
  number,
  tone = "solid",
  size,
  onDark = false,
}: ModuleNumberProps) {
  const color =
    tone === "green"
      ? onDark
        ? colors.greenBright
        : colors.green
      : tone === "faint"
        ? onDark
          ? colors.lineDark
          : colors.line
        : onDark
          ? colors.paper
          : colors.ink;

  return (
    <Text
      variant="display"
      color={color}
      style={size ? { fontSize: size, lineHeight: size * 1.02 } : undefined}
      accessibilityLabel={`Modul ${number}`}
    >
      {number}
    </Text>
  );
}

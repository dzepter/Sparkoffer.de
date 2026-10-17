/** Listenzeile: Titel/Untertitel, optional Chevron, min. 56 px, Hairline unten. */
import { type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "@handel-offensiv/config";
import { Text } from "./Text";

export interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Element links (z. B. ModuleNumber oder Icon) */
  leading?: ReactNode;
  /** Element rechts statt Chevron (z. B. TagPill) */
  trailing?: ReactNode;
  onPress?: () => void;
  /** Chevron anzeigen (Standard: nur wenn onPress gesetzt) */
  chevron?: boolean;
  disabled?: boolean;
}

export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  chevron,
  disabled = false,
}: ListRowProps) {
  const showChevron = chevron ?? Boolean(onPress);
  const content = (
    <>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.textBlock}>
        <Text variant="h3" numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="small" muted numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ? (
        <View style={styles.trailing}>{trailing}</View>
      ) : showChevron ? (
        <Feather name="chevron-right" size={20} color={colors.inkSoft} />
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { opacity: disabled ? 0.5 : pressed ? 0.7 : 1 },
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  leading: {
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  trailing: {
    alignItems: "flex-end",
  },
});

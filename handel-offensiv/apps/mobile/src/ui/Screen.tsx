/**
 * Screen-Rahmen: SafeArea + (optional) ScrollView, Papier-Grund, ruhige Ränder.
 * Expliziter Light Mode – Hintergrund immer paper (Briefing §35).
 */
import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "@handel-offensiv/config";

export interface ScreenProps {
  children: ReactNode;
  /** false z. B. für Screens mit eigener Liste (FlatList) */
  scroll?: boolean;
  /** Zusatzstil für den Inhaltsbereich */
  contentStyle?: StyleProp<ViewStyle>;
  /** SafeArea-Kanten; Tab-Screens brauchen unten keine (Tab-Bar) */
  edges?: ("top" | "bottom" | "left" | "right")[];
}

export function Screen({
  children,
  scroll = true,
  contentStyle,
  edges = ["top", "left", "right"],
}: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.fill, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: { flex: 1 },
  fill: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});

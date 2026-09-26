/** Ruhiger Lade-Platzhalter (sanftes Pulsieren, respektiert Reduce Motion). */
import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, radius } from "@handel-offensiv/config";

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  /** Radius (Standard: kantige 2 px) */
  round?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width = "100%", height = 16, round = radius.base, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.5)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reduceMotion]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height,
          borderRadius: round,
          backgroundColor: colors.line,
          opacity: reduceMotion ? 0.6 : opacity,
        },
        style,
      ]}
    />
  );
}

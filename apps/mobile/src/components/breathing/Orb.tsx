// The breathing orb. Pure presentation: it renders whatever the shared `scale`
// (0 = empty, 1 = full) says, animated on the UI thread by Reanimated. The
// session hook owns the animation; this component never touches timing.
//
// Glow is faked with three concentric translucent layers (react-native-svg is
// not a dependency) — cheap, universal on web + native, and reads as a soft halo.

import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

/** Scale 0 maps to this fraction of full size so the orb stays visible when empty. */
const ORB_MIN = 0.12;

interface OrbProps {
  scale: SharedValue<number>;
  color: string;
  /** Outer diameter in px. */
  size?: number;
}

export function Orb({ scale, color, size = 280 }: OrbProps) {
  const layers = useMemo(
    () => [
      { frac: 1.0, opacity: 0.16 },
      { frac: 0.72, opacity: 0.34 },
      { frac: 0.46, opacity: 0.96 },
    ],
    []
  );

  const animatedStyle = useAnimatedStyle(() => {
    const s = ORB_MIN + scale.value * (1 - ORB_MIN);
    return { transform: [{ scale: s }] };
  });

  return (
    <View
      style={[styles.frame, { width: size, height: size }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        style={[styles.group, { width: size, height: size }, animatedStyle]}
      >
        {layers.map((layer) => {
          const d = size * layer.frac;
          return (
            <View
              key={layer.frac}
              style={{
                position: "absolute",
                width: d,
                height: d,
                top: (size - d) / 2,
                left: (size - d) / 2,
                borderRadius: d / 2,
                backgroundColor: color,
                opacity: layer.opacity,
              }}
            />
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  group: {
    alignItems: "center",
    justifyContent: "center",
  },
});

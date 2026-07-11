// Native bottom sheet listing the 7 shipped breathing modes.
// Pull-up tab at the bottom edge (idle only); tap a row to switch mode.
// No external deps beyond what is already installed: Animated, PanResponder,
// Pressable, react-native-safe-area-context.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ModeName, BREATHING_PATTERNS } from './breathing-web/constants';

// ---------------------------------------------------------------------------
// Catalog — 7 shipped modes, decision-brief order:
//   Box → Relax → Coherent → Sigh → Ujjayi → Belly → Pursed Lip
// ---------------------------------------------------------------------------

interface ModeEntry {
  name: ModeName;
  color: string;
  phaseLabel: string; // human-readable timing
  use: string;        // one-liner from the decision brief
}

const SHIPPED_MODES: ModeEntry[] = [
  {
    name: ModeName.Box,
    color: BREATHING_PATTERNS[ModeName.Box].color,
    phaseLabel: '4-4-4-4',
    use: 'Focus & stress reduction',
  },
  {
    name: ModeName.Relax,
    color: BREATHING_PATTERNS[ModeName.Relax].color,
    phaseLabel: '4-7-8',
    use: 'Sleep & deep relaxation',
  },
  {
    name: ModeName.Coherent,
    color: BREATHING_PATTERNS[ModeName.Coherent].color,
    phaseLabel: '5.5-5.5',
    use: 'HRV & heart-rate balance',
  },
  {
    name: ModeName.Sigh,
    color: BREATHING_PATTERNS[ModeName.Sigh].color,
    phaseLabel: 'Double inhale',
    use: 'Stress reset',
  },
  {
    name: ModeName.Ujjayi,
    color: BREATHING_PATTERNS[ModeName.Ujjayi].color,
    phaseLabel: '4-6',
    use: 'Yoga & ocean breath focus',
  },
  {
    name: ModeName.Belly,
    color: BREATHING_PATTERNS[ModeName.Belly].color,
    phaseLabel: '4-6',
    use: 'Diaphragmatic breathing foundation',
  },
  {
    name: ModeName.PursedLip,
    color: BREATHING_PATTERNS[ModeName.PursedLip].color,
    phaseLabel: '2-4',
    use: 'Gentle longer-exhale practice',
  },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  theme: 'light' | 'dark';
  /** Currently active mode name (from persist stream). Used for the checkmark. */
  activeModeName: string | null;
  /** Called when the user taps a mode row. */
  onSelectMode: (mode: ModeName) => void;
}

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = Math.round(SCREEN_HEIGHT * 0.56); // ~56% of screen
const DRAG_THRESHOLD = 60; // px drag to close
const ANIM_DURATION = 280;
const TAB_HEIGHT = 36; // height of the pull tab area

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ModeLibrarySheet({ theme, activeModeName, onSelectMode }: Props) {
  const insets = useSafeAreaInsets();
  const [sheetOpen, setSheetOpen] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current; // 0 = closed
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const isLight = theme === 'light';
  const bg = isLight ? '#fdf8f2' : '#221711';
  const text = isLight ? '#5c3d1e' : '#e8d5b7';
  const subtle = isLight ? '#a07850' : '#8a6a44';
  const border = isLight ? '#e8d5b7' : '#3a2a1a';
  const rowSep = isLight ? '#e8d5b7cc' : '#3a2a1a99';
  const handleColor = isLight ? '#c4a882' : '#5a4030';

  // Open the sheet: slide up, fade backdrop.
  const openSheet = useCallback(() => {
    setSheetOpen(true);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -SHEET_HEIGHT,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, backdropOpacity]);

  // Close the sheet: slide down, fade backdrop out.
  const closeSheet = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => setSheetOpen(false));
  }, [translateY, backdropOpacity]);

  // PanResponder for drag-to-close.
  const dragStart = useRef(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dy }) => dy > 4,
      onPanResponderGrant: (_, { y0 }) => {
        dragStart.current = y0;
      },
      onPanResponderMove: (_, { dy }) => {
        if (dy > 0) {
          // Only drag downward (closing direction).
          translateY.setValue(-SHEET_HEIGHT + dy);
        }
      },
      onPanResponderRelease: (_, { dy }) => {
        if (dy > DRAG_THRESHOLD) {
          closeSheet();
        } else {
          // Snap back open.
          Animated.spring(translateY, {
            toValue: -SHEET_HEIGHT,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  const handleRowPress = useCallback(
    (mode: ModeName) => {
      onSelectMode(mode);
      closeSheet();
    },
    [onSelectMode, closeSheet]
  );

  return (
    <>
      {/* Dim backdrop — only mounted while sheet is open */}
      {sheetOpen && (
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
          pointerEvents="box-only"
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
        </Animated.View>
      )}

      {/* Sheet + Tab: positioned at the bottom of the screen */}
      <Animated.View
        style={[
          styles.sheetContainer,
          {
            height: SHEET_HEIGHT + TAB_HEIGHT,
            bottom: -(SHEET_HEIGHT), // sheet body starts off-screen; tab peeks up
            paddingBottom: insets.bottom,
            backgroundColor: bg,
            borderColor: border,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Pull tab — tap or drag to open */}
        <Pressable
          onPress={sheetOpen ? closeSheet : openSheet}
          style={styles.tabArea}
          accessibilityRole="button"
          accessibilityLabel={sheetOpen ? 'Close mode library' : 'Open mode library'}
          {...(sheetOpen ? panResponder.panHandlers : {})}
        >
          <View style={[styles.grabber, { backgroundColor: handleColor }]} />
          {!sheetOpen && (
            <Text style={[styles.tabLabel, { color: subtle }]}>Modes</Text>
          )}
        </Pressable>

        {/* Mode rows — only rendered when open (avoid layout cost while closed) */}
        {sheetOpen && (
          <View style={styles.rowList}>
            {SHIPPED_MODES.map((entry, idx) => {
              const isActive =
                activeModeName === entry.name ||
                activeModeName === null && entry.name === ModeName.Box;
              const isLast = idx === SHIPPED_MODES.length - 1;
              return (
                <Pressable
                  key={entry.name}
                  style={({ pressed }) => [
                    styles.row,
                    !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: rowSep },
                    pressed && { opacity: 0.6 },
                  ]}
                  onPress={() => handleRowPress(entry.name)}
                  accessibilityRole="button"
                  accessibilityLabel={`Switch to ${entry.name}`}
                  accessibilityState={{ selected: isActive }}
                >
                  {/* Color dot */}
                  <View style={[styles.dot, { backgroundColor: entry.color }]} />
                  {/* Text block */}
                  <View style={styles.rowText}>
                    <Text style={[styles.modeName, { color: text }]}>{entry.name}</Text>
                    <Text style={[styles.modeDetail, { color: subtle }]}>
                      {entry.phaseLabel} · {entry.use}
                    </Text>
                  </View>
                  {/* Active checkmark */}
                  {isActive && (
                    <Text style={[styles.check, { color: entry.color }]}>✓</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </Animated.View>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 10,
  },
  sheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  tabArea: {
    height: TAB_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    paddingTop: 6,
    gap: 4,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.5,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  rowList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 14,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    flexShrink: 0,
  },
  rowText: {
    flex: 1,
  },
  modeName: {
    fontSize: 15,
    fontWeight: '500',
  },
  modeDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  check: {
    fontSize: 16,
    fontWeight: '600',
  },
});

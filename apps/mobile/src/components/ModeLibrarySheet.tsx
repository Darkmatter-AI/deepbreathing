import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  findNodeHandle,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetHandle,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
  type BottomSheetHandleProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ModeName, BREATHING_PATTERNS } from './breathing-web/constants';

interface ModeEntry {
  name: ModeName;
  color: string;
  phaseLabel: string;
  use: string;
}

const SHIPPED_MODES: ModeEntry[] = [
  { name: ModeName.Box, color: BREATHING_PATTERNS[ModeName.Box].color, phaseLabel: '4-4-4-4', use: 'Focus & stress reduction' },
  { name: ModeName.Relax, color: BREATHING_PATTERNS[ModeName.Relax].color, phaseLabel: '4-7-8', use: 'Sleep & deep relaxation' },
  { name: ModeName.Coherent, color: BREATHING_PATTERNS[ModeName.Coherent].color, phaseLabel: '5.5-5.5', use: 'HRV & heart-rate balance' },
  { name: ModeName.Sigh, color: BREATHING_PATTERNS[ModeName.Sigh].color, phaseLabel: 'Double inhale', use: 'Stress reset' },
  { name: ModeName.Ujjayi, color: BREATHING_PATTERNS[ModeName.Ujjayi].color, phaseLabel: '4-6', use: 'Yoga & ocean breath focus' },
  { name: ModeName.Belly, color: BREATHING_PATTERNS[ModeName.Belly].color, phaseLabel: '4-6', use: 'Diaphragmatic breathing foundation' },
  { name: ModeName.PursedLip, color: BREATHING_PATTERNS[ModeName.PursedLip].color, phaseLabel: '2-4', use: 'Gentle longer-exhale practice' },
];

interface Props {
  theme: 'light' | 'dark';
  /** Slides the sheet off-screen (animated) instead of the host unmounting it. */
  hidden?: boolean;
  activeModeName: string | null;
  onSelectMode: (mode: ModeName) => void;
}

const ROW_HEIGHT = 62;
const VISIBLE_ROWS = 4;
const HANDLE_HEIGHT = 24;
const DRAWER_LABEL_HEIGHT = 44;

function relativeLuminance(hex: string) {
  const channels = hex.slice(1).match(/../g)?.map((value) => Number.parseInt(value, 16) / 255);
  if (!channels || channels.length !== 3) return 0;
  return channels.reduce((sum, channel, index) => {
    const linear = channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    return sum + linear * [0.2126, 0.7152, 0.0722][index];
  }, 0);
}

function contrastRatio(foreground: string, background: string) {
  const light = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const dark = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (light + 0.05) / (dark + 0.05);
}

function accessibleTint(color: string, background: string) {
  // The mode swatches are intentionally saturated, but the lightest swatches
  // do not carry a 3:1 boundary contrast on the warm sheet. A darker fallback
  // keeps the selected checkmark legible without changing the swatch itself.
  if (contrastRatio(color, background) >= 3) return color;
  return relativeLuminance(background) > 0.5 ? '#8a4b1b' : '#e8d5b7';
}

export default function ModeLibrarySheet({ theme, hidden = false, activeModeName, onSelectMode }: Props) {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);
  const drawerLabelRef = useRef<View>(null);
  const [sheetIndex, setSheetIndex] = useState(hidden ? -1 : 0);
  const collapsedHeight = HANDLE_HEIGHT + DRAWER_LABEL_HEIGHT + insets.bottom;
  const expandedHeight = collapsedHeight + ROW_HEIGHT * VISIBLE_ROWS;
  const snapPoints = useMemo(
    () => [collapsedHeight, expandedHeight],
    [collapsedHeight, expandedHeight],
  );

  const light = theme === 'light';
  const bg = light ? '#fdf8f2' : '#221711';
  const text = light ? '#5c3d1e' : '#e8d5b7';
  const subtle = light ? '#79512f' : '#c7a188';
  const border = light ? '#e8d5b7' : '#3a2a1a';
  const rowSep = light ? '#e8d5b7cc' : '#3a2a1a99';
  const handleColor = light ? '#c4a882' : '#5a4030';
  const contentHidden = hidden || sheetIndex < 0;
  const rowsHidden = contentHidden || sheetIndex !== 1;

  const closeSheet = useCallback(() => {
    if (sheetIndex === 1) sheetRef.current?.snapToIndex(0);
    else sheetRef.current?.close();
  }, [sheetIndex]);

  const focusDrawerLabel = useCallback(() => {
    const tag = findNodeHandle(drawerLabelRef.current);
    if (tag != null) AccessibilityInfo.setAccessibilityFocus(tag);
  }, []);

  useEffect(() => {
    if (hidden || sheetIndex !== 1) return;
    const timer = setTimeout(focusDrawerLabel, 260);
    return () => clearTimeout(timer);
  }, [focusDrawerLabel, hidden, sheetIndex]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={1}
        disappearsOnIndex={0}
        opacity={0.45}
        pressBehavior={0}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Collapse mode library"
        accessibilityHint="Double-tap to return to the mode tab"
      />
    ),
    [],
  );
  const renderHandle = useCallback(
    (props: BottomSheetHandleProps) => (
      <BottomSheetHandle
        {...props}
        accessible={!contentHidden}
        accessibilityElementsHidden={contentHidden}
        importantForAccessibility={contentHidden ? 'no-hide-descendants' : 'yes'}
        accessibilityRole="adjustable"
        accessibilityLabel="Mode library handle"
        accessibilityHint="Swipe up to show breathing modes, or swipe down to hide the library"
      />
    ),
    [contentHidden],
  );
  const handleRowPress = useCallback((mode: ModeName) => {
    onSelectMode(mode);
    sheetRef.current?.snapToIndex(0);
  }, [onSelectMode]);
  const openSheet = useCallback(() => {
    sheetRef.current?.snapToIndex(1);
  }, []);

  // Animated hide/show: close() slides the sheet below the screen edge; on
  // return it comes back at the collapsed tab. Replaces the host's previous
  // unmount, which made the drawer pop out with no exit animation.
  useEffect(() => {
    if (hidden) sheetRef.current?.close();
    else sheetRef.current?.snapToIndex(0);
  }, [hidden]);

  // Visible state starts at index={0}; closed state is -1 so assistive
  // technologies never see the sheet during the host's initial hide.
  return (
    <BottomSheet
      ref={sheetRef}
      index={hidden ? -1 : 0}
      snapPoints={snapPoints}
      animateOnMount={false}
      enableDynamicSizing={false}
      enablePanDownToClose={false}
      enableContentPanningGesture
      enableHandlePanningGesture
      backdropComponent={renderBackdrop}
      handleComponent={renderHandle}
      onChange={setSheetIndex}
      accessible={false}
      onAccessibilityEscape={closeSheet}
      backgroundStyle={{ backgroundColor: bg, borderColor: border, borderWidth: StyleSheet.hairlineWidth }}
      handleIndicatorStyle={{ backgroundColor: handleColor, width: 42 }}
      style={styles.sheet}
    >
      <View
        style={styles.accessibilityContainer}
        accessible={false}
        accessibilityElementsHidden={contentHidden}
        importantForAccessibility={contentHidden ? 'no-hide-descendants' : 'yes'}
        accessibilityViewIsModal={sheetIndex === 1 && !hidden}
        onAccessibilityEscape={closeSheet}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.rowList}
          showsVerticalScrollIndicator
          accessible={false}
        >
          <Pressable
            ref={drawerLabelRef}
            onPress={() => {
              if (sheetIndex === 1) sheetRef.current?.snapToIndex(0);
              else openSheet();
            }}
            style={[styles.drawerLabel, { height: DRAWER_LABEL_HEIGHT + insets.bottom }]}
            accessibilityRole="button"
            accessibilityLabel={sheetIndex === 1 ? 'Collapse mode library' : 'Open mode library'}
            accessibilityHint={sheetIndex === 1 ? 'Double-tap to return to the mode tab' : 'Double-tap to choose a breathing mode'}
            accessibilityState={{ expanded: sheetIndex === 1 }}
            onAccessibilityEscape={closeSheet}
          >
            <Text style={[styles.drawerLabelText, { color: subtle }]}>Modes</Text>
          </Pressable>
          <View
            accessible={false}
            accessibilityElementsHidden={rowsHidden}
            importantForAccessibility={rowsHidden ? 'no-hide-descendants' : 'yes'}
          >
            {SHIPPED_MODES.map((entry, index) => {
              const active = activeModeName === entry.name || (activeModeName === null && entry.name === ModeName.Box);
              const checkColor = accessibleTint(entry.color, bg);
              return (
                <Pressable
                  key={entry.name}
                  style={({ pressed }) => [
                    styles.row,
                    index < SHIPPED_MODES.length - 1 && { borderBottomColor: rowSep, borderBottomWidth: StyleSheet.hairlineWidth },
                    pressed && styles.pressed,
                  ]}
                  onPress={() => handleRowPress(entry.name)}
                  accessibilityRole="radio"
                  accessibilityLabel={`${entry.name}, ${entry.phaseLabel}, ${entry.use}`}
                  accessibilityHint="Double-tap to switch breathing mode"
                  accessibilityState={{ selected: active }}
                  accessibilityValue={{ text: active ? 'Selected' : 'Not selected' }}
                >
                  <View style={[styles.dot, { backgroundColor: entry.color }]} accessible={false} />
                  <View style={styles.rowText} accessible={false}>
                    <Text style={[styles.modeName, { color: text }]}>{entry.name}</Text>
                    <Text style={[styles.modeDetail, { color: subtle }]}>{entry.phaseLabel} · {entry.use}</Text>
                  </View>
                  {active ? <Text style={[styles.check, { color: checkColor }]} accessible={false}>✓</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </BottomSheetScrollView>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: { zIndex: 90 },
  accessibilityContainer: { flex: 1 },
  rowList: { paddingHorizontal: 20 },
  drawerLabel: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  drawerLabelText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  row: { minHeight: ROW_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  pressed: { opacity: 0.62 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  rowText: { flex: 1 },
  modeName: { fontSize: 15, fontWeight: '600' },
  modeDetail: { fontSize: 12, marginTop: 2 },
  check: { fontSize: 16, fontWeight: '700' },
});

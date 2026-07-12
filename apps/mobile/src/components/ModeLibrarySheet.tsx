import { useCallback, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
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
  activeModeName: string | null;
  onSelectMode: (mode: ModeName) => void;
}

const ROW_HEIGHT = 62;
const VISIBLE_ROWS = 4;
const HANDLE_HEIGHT = 24;
const DRAWER_LABEL_HEIGHT = 32;

export default function ModeLibrarySheet({ theme, activeModeName, onSelectMode }: Props) {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);
  const collapsedHeight = HANDLE_HEIGHT + DRAWER_LABEL_HEIGHT + insets.bottom;
  const expandedHeight = collapsedHeight + ROW_HEIGHT * VISIBLE_ROWS;
  const snapPoints = useMemo(
    () => [collapsedHeight, expandedHeight],
    [collapsedHeight, expandedHeight],
  );

  const light = theme === 'light';
  const bg = light ? '#fdf8f2' : '#221711';
  const text = light ? '#5c3d1e' : '#e8d5b7';
  const subtle = light ? '#a07850' : '#8a6a44';
  const border = light ? '#e8d5b7' : '#3a2a1a';
  const rowSep = light ? '#e8d5b7cc' : '#3a2a1a99';
  const handleColor = light ? '#c4a882' : '#5a4030';

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={1}
        disappearsOnIndex={0}
        opacity={0.45}
        pressBehavior={0}
      />
    ),
    [],
  );
  const handleRowPress = useCallback((mode: ModeName) => {
    onSelectMode(mode);
    sheetRef.current?.snapToIndex(0);
  }, [onSelectMode]);

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      animateOnMount={false}
      enableDynamicSizing={false}
      enablePanDownToClose={false}
      enableContentPanningGesture
      enableHandlePanningGesture
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: bg, borderColor: border, borderWidth: StyleSheet.hairlineWidth }}
      handleIndicatorStyle={{ backgroundColor: handleColor, width: 42 }}
      style={styles.sheet}
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.rowList}
        showsVerticalScrollIndicator
      >
        <Pressable
          onPress={() => sheetRef.current?.snapToIndex(1)}
          style={[styles.drawerLabel, { height: DRAWER_LABEL_HEIGHT + insets.bottom }]}
          accessibilityRole="button"
          accessibilityLabel="Open mode library"
        >
          <Text style={[styles.drawerLabelText, { color: subtle }]}>Modes</Text>
        </Pressable>
        {SHIPPED_MODES.map((entry, index) => {
          const active = activeModeName === entry.name || (activeModeName === null && entry.name === ModeName.Box);
          return (
            <Pressable
              key={entry.name}
              style={({ pressed }) => [
                styles.row,
                index < SHIPPED_MODES.length - 1 && { borderBottomColor: rowSep, borderBottomWidth: StyleSheet.hairlineWidth },
                pressed && styles.pressed,
              ]}
              onPress={() => handleRowPress(entry.name)}
              accessibilityRole="button"
              accessibilityLabel={`Switch to ${entry.name}`}
              accessibilityState={{ selected: active }}
            >
              <View style={[styles.dot, { backgroundColor: entry.color }]} />
              <View style={styles.rowText}>
                <Text style={[styles.modeName, { color: text }]}>{entry.name}</Text>
                <Text style={[styles.modeDetail, { color: subtle }]}>{entry.phaseLabel} · {entry.use}</Text>
              </View>
              {active ? <Text style={[styles.check, { color: entry.color }]}>✓</Text> : null}
            </Pressable>
          );
        })}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: { zIndex: 90 },
  rowList: { paddingHorizontal: 20 },
  drawerLabel: { alignItems: 'center', justifyContent: 'flex-start' },
  drawerLabelText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  row: { minHeight: ROW_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  pressed: { opacity: 0.62 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  rowText: { flex: 1 },
  modeName: { fontSize: 15, fontWeight: '600' },
  modeDetail: { fontSize: 12, marginTop: 2 },
  check: { fontSize: 16, fontWeight: '700' },
});

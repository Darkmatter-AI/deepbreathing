import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DURATION_OPTIONS, MIN_TOUCH, palette } from './constants';

interface DurationChipsProps {
  selectedSec: number;
  accent: string;
  onSelect: (seconds: number) => void;
}

export function DurationChips({ selectedSec, accent, onSelect }: DurationChipsProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.caption}>Duration (min)</Text>
      <View style={styles.row}>
        {DURATION_OPTIONS.map((opt) => {
          const isActive = opt.seconds === selectedSec;
          return (
            <Pressable
              key={opt.label}
              onPress={() => onSelect(opt.seconds)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={opt.a11y}
              style={[
                styles.chip,
                isActive && { backgroundColor: accent, borderColor: accent },
              ]}
            >
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, alignItems: 'center' },
  caption: { color: palette.textMuted, fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  row: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  chip: {
    minHeight: MIN_TOUCH,
    minWidth: MIN_TOUCH,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  label: { color: palette.textSecondary, fontSize: 15, fontWeight: '600' },
  labelActive: { color: '#fff' },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ModeName } from '@/breathing';
import { MIN_TOUCH, MODE_LABELS, palette } from './constants';

interface ModeSelectorProps {
  modes: ModeName[];
  selected: ModeName;
  accent: string;
  onSelect: (mode: ModeName) => void;
}

export function ModeSelector({ modes, selected, accent, onSelect }: ModeSelectorProps) {
  return (
    <View style={styles.row}>
      {modes.map((mode) => {
        const isActive = mode === selected;
        return (
          <Pressable
            key={mode}
            onPress={() => onSelect(mode)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${MODE_LABELS[mode]} breathing`}
            style={[
              styles.pill,
              isActive && { backgroundColor: accent, borderColor: accent },
            ]}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {MODE_LABELS[mode]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  pill: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  label: { color: palette.textSecondary, fontSize: 15, fontWeight: '600' },
  labelActive: { color: '#fff' },
});

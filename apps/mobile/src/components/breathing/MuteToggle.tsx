import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MIN_TOUCH, palette } from './constants';

interface MuteToggleProps {
  muted: boolean;
  accent: string;
  onToggle: () => void;
}

export function MuteToggle({ muted, accent, onToggle }: MuteToggleProps) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: !muted }}
      accessibilityLabel={muted ? 'Sound off' : 'Sound on'}
      style={styles.row}
    >
      <View
        style={[
          styles.icon,
          { borderColor: muted ? palette.border : accent },
        ]}
      >
        <Text style={[styles.glyph, { color: muted ? palette.textMuted : accent }]}>
          {muted ? '🔇' : '🔊'}
        </Text>
      </View>
      <Text style={styles.label}>{muted ? 'Muted' : 'Sound'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: MIN_TOUCH },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
  },
  glyph: { fontSize: 18 },
  label: { color: palette.textSecondary, fontSize: 15, fontWeight: '600' },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SessionStatus } from '@/breathing/useBreathingSession';
import { MIN_TOUCH, palette } from './constants';

interface ControlsProps {
  status: SessionStatus;
  accent: string;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function Controls({
  status,
  accent,
  onStart,
  onPause,
  onResume,
  onStop,
}: ControlsProps) {
  const primary =
    status === 'running'
      ? { label: 'Pause', onPress: onPause }
      : status === 'paused'
        ? { label: 'Resume', onPress: onResume }
        : { label: 'Start', onPress: onStart };

  return (
    <View style={styles.row}>
      <Pressable
        onPress={primary.onPress}
        accessibilityRole="button"
        accessibilityLabel={primary.label}
        style={[styles.primary, { backgroundColor: accent }]}
      >
        <Text style={styles.primaryText}>{primary.label}</Text>
      </Pressable>

      {status !== 'idle' ? (
        <Pressable
          onPress={onStop}
          accessibilityRole="button"
          accessibilityLabel="Stop session"
          style={styles.secondary}
        >
          <Text style={styles.secondaryText}>Stop</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'center' },
  primary: {
    minHeight: MIN_TOUCH + 8,
    minWidth: 150,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  primaryText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  secondary: {
    minHeight: MIN_TOUCH + 8,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  secondaryText: { color: palette.textPrimary, fontSize: 16, fontWeight: '600' },
});

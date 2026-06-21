import { StyleSheet, Text, View } from 'react-native';

import { BreathingPhase } from '@/breathing';
import { palette } from './constants';

interface PhaseLabelProps {
  phase: BreathingPhase;
  /** Mode tagline shown under the phase when idle (e.g. the pattern description). */
  subtitle?: string;
  isIdle: boolean;
  accent: string;
}

export function PhaseLabel({ phase, subtitle, isIdle, accent }: PhaseLabelProps) {
  return (
    <View style={styles.container} accessibilityRole="header">
      <Text style={[styles.phase, { color: isIdle ? palette.textPrimary : accent }]}>
        {phase}
      </Text>
      {isIdle && subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 6, minHeight: 56 },
  phase: { fontSize: 30, fontWeight: '700', letterSpacing: 0.3 },
  subtitle: { fontSize: 14, color: palette.textSecondary, textAlign: 'center' },
});

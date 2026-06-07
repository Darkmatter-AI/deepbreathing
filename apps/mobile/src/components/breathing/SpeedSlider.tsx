import Slider from '@react-native-community/slider';
import { StyleSheet, Text, View } from 'react-native';

import { MAX_SPEED_MULTIPLIER, MIN_SPEED_MULTIPLIER } from '@/breathing';
import { palette } from './constants';

interface SpeedSliderProps {
  value: number;
  accent: string;
  onChange: (value: number) => void;
}

/** Round to 1 decimal so the label and stored value stay tidy (0.5–2.0, step 0.1). */
const round1 = (n: number) => Math.round(n * 10) / 10;

export function SpeedSlider({ value, accent, onChange }: SpeedSliderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.caption}>Pace</Text>
        <Text style={styles.value}>{value.toFixed(1)}×</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={MIN_SPEED_MULTIPLIER}
        maximumValue={MAX_SPEED_MULTIPLIER}
        step={0.1}
        value={value}
        onValueChange={(v) => onChange(round1(v))}
        minimumTrackTintColor={accent}
        maximumTrackTintColor={palette.border}
        thumbTintColor={accent}
        accessibilityLabel="Breathing pace"
        accessibilityValue={{ text: `${value.toFixed(1)} times speed` }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', gap: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  caption: { color: palette.textMuted, fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  value: { color: palette.textSecondary, fontSize: 14, fontWeight: '600' },
  slider: { width: '100%', height: 40 },
});

import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BREATHING_PATTERNS,
  DEFAULT_SPEED_MULTIPLIER,
  ModeName,
  V1_MODES,
} from '@/breathing';
import { useBreathingSession } from '@/breathing/useBreathingSession';
import { Controls } from '@/components/breathing/Controls';
import { DurationChips } from '@/components/breathing/DurationChips';
import { ModeSelector } from '@/components/breathing/ModeSelector';
import { MuteToggle } from '@/components/breathing/MuteToggle';
import { Orb } from '@/components/breathing/Orb';
import { PhaseLabel } from '@/components/breathing/PhaseLabel';
import { SpeedSlider } from '@/components/breathing/SpeedSlider';
import { palette } from '@/components/breathing/constants';

const formatClock = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const orbSize = Math.max(200, Math.min(300, Math.min(width, height) * 0.62));

  const [mode, setMode] = useState<ModeName>(ModeName.Box);
  const [speed, setSpeed] = useState(DEFAULT_SPEED_MULTIPLIER);
  const [durationSec, setDurationSec] = useState(0);
  const [muted, setMuted] = useState(false);

  const session = useBreathingSession({
    mode,
    speedMultiplier: speed,
    selectedDurationSec: durationSec,
  });

  // Changing mode while a session is live stops it (the hook enforces this too).
  const handleSelectMode = useCallback((next: ModeName) => setMode(next), []);

  const accent = session.themeColor;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.top}>
          <ModeSelector
            modes={V1_MODES}
            selected={mode}
            accent={accent}
            onSelect={handleSelectMode}
          />
        </View>

        <View style={styles.center}>
          <PhaseLabel
            phase={session.phase}
            subtitle={BREATHING_PATTERNS[mode].description}
            isIdle={session.status === 'idle'}
            accent={accent}
          />
          <Orb scale={session.scale} color={accent} size={orbSize} />
          <Text style={styles.clock}>{formatClock(session.sessionSeconds)}</Text>
        </View>

        <View style={styles.bottom}>
          <Controls
            status={session.status}
            accent={accent}
            onStart={session.start}
            onPause={session.pause}
            onResume={session.resume}
            onStop={session.stop}
          />
          <DurationChips selectedSec={durationSec} accent={accent} onSelect={setDurationSec} />
          <View style={styles.sliderRow}>
            <View style={styles.sliderCol}>
              <SpeedSlider value={speed} accent={accent} onChange={setSpeed} />
            </View>
            <MuteToggle muted={muted} accent={accent} onToggle={() => setMuted((m) => !m)} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  safe: {
    flex: 1,
    paddingHorizontal: 20,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  top: { paddingTop: 12, alignItems: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  clock: { color: palette.textSecondary, fontSize: 18, fontVariant: ['tabular-nums'] },
  bottom: { gap: 18, paddingBottom: 8 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  sliderCol: { flex: 1 },
});

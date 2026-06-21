// Calm, native completion summary shown after a session ends.
// Theme-aware, auto-dismisses after 6s, tap anywhere to dismiss instantly.
// No spring, no confetti — fades in gently. Plain RN primitives only.

import { useCallback, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

export interface CompletionSummaryData {
  /** Seconds completed this session. */
  sessionSeconds: number;
  /** Total minutes ever (from resonance_stats mirror). null if not yet received. */
  totalMinutes: number | null;
  /** Sessions completed total (from resonance_stats mirror). null if not yet received. */
  sessionsCompleted: number | null;
}

interface Props {
  data: CompletionSummaryData;
  theme: 'light' | 'dark';
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 6000;
const FADE_IN_MS = 500;

export default function CompletionSummary({ data, theme, onDismiss }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  const dismiss = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onDismiss());
  }, [opacity, onDismiss]);

  useEffect(() => {
    // Fade in.
    Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_IN_MS,
      useNativeDriver: true,
    }).start();

    // Auto-dismiss.
    const timer = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [opacity, dismiss]);

  const isLight = theme === 'light';
  const bg = isLight ? '#fdf8f2' : '#221711';
  const text = isLight ? '#5c3d1e' : '#e8d5b7';
  const subtle = isLight ? '#a07850' : '#8a6a44';
  const border = isLight ? '#e8d5b7' : '#3a2a1a';

  // Sub-minute sessions show seconds (30s is an offered duration); longer
  // ones show whole minutes, floored to match how the stats accrue.
  const sessionMinutes = Math.floor(data.sessionSeconds / 60);
  const sessionLabel = sessionMinutes < 1
    ? `${data.sessionSeconds}s`
    : sessionMinutes === 1 ? '1 min' : `${sessionMinutes} mins`;

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      {/* The Pressable wraps the card (ancestor, not sibling) so taps ON the
          card bubble up and dismiss too — "tap anywhere" includes the card. */}
      <Pressable
        style={styles.fill}
        onPress={dismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss session summary"
      >
        <View style={[styles.card, { backgroundColor: bg, borderColor: border }]}>
          <Text style={[styles.checkmark, { color: subtle }]}>✓</Text>
          <Text style={[styles.heading, { color: text }]}>Session complete</Text>
          <Text style={[styles.session, { color: text }]}>{sessionLabel} this session</Text>
          {(data.totalMinutes != null || data.sessionsCompleted != null) && (
            <View style={[styles.divider, { borderColor: border }]} />
          )}
          {data.totalMinutes != null && (
            <Text style={[styles.stat, { color: subtle }]}>
              {data.totalMinutes} total {data.totalMinutes === 1 ? 'min' : 'mins'}
            </Text>
          )}
          {data.sessionsCompleted != null && (
            <Text style={[styles.stat, { color: subtle }]}>
              {data.sessionsCompleted} {data.sessionsCompleted === 1 ? 'session' : 'sessions'} completed
            </Text>
          )}
          <Text style={[styles.dismiss, { color: subtle }]}>Tap to continue</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  fill: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 240,
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  checkmark: {
    fontSize: 28,
    marginBottom: 8,
  },
  heading: {
    fontSize: 17,
    fontWeight: '500',
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  session: {
    fontSize: 15,
    marginBottom: 2,
  },
  divider: {
    width: '60%',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  stat: {
    fontSize: 13,
    marginBottom: 3,
  },
  dismiss: {
    fontSize: 12,
    marginTop: 16,
    opacity: 0.7,
  },
});

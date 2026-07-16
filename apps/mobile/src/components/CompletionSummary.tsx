import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';

import AuthActions from '../auth/AuthActions';
import { BREATHING_PATTERNS, ModeName } from './breathing-web/constants';

export interface CompletionSummaryData {
  sessionSeconds: number;
  sessionMode: string;
  totalMinutes: number | null;
  sessionsCompleted: number | null;
}

interface Props {
  data: CompletionSummaryData;
  theme: 'light' | 'dark';
  isAuthenticated: boolean;
  safeAreaTop: number;
  onDismiss: () => void;
}

export default function CompletionSummary({
  data,
  theme,
  isAuthenticated,
  safeAreaTop,
  onDismiss,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(isAuthenticated ? -18 : 16)).current;
  const dark = theme === 'dark';
  const bg = dark ? '#2b1b15' : '#fff7ef';
  const text = dark ? '#f5dfcc' : '#452b1d';
  const subtle = dark ? '#bf9b82' : '#8e6b53';
  const border = dark ? '#654638' : '#e5cbb7';
  const modeColor = BREATHING_PATTERNS[data.sessionMode as ModeName]?.color ?? '#e36c4c';

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -30, duration: 180, useNativeDriver: true }),
    ]).start(onDismiss);
  }, [onDismiss, opacity, translateY]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 18,
        stiffness: 180,
        mass: 0.8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          isAuthenticated && gesture.dy < -8,
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy < 0) translateY.setValue(gesture.dy);
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy < -32 || gesture.vy < -0.5) dismiss();
          else Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        },
      }),
    [dismiss, isAuthenticated, translateY],
  );

  const minutes = Math.floor(data.sessionSeconds / 60);
  const sessionLabel = minutes < 1 ? `${data.sessionSeconds}s` : `${minutes} min`;
  const durationLabel = `${Math.floor(data.sessionSeconds / 60)}:${String(data.sessionSeconds % 60).padStart(2, '0')}`;
  const headline =
    data.sessionsCompleted != null && data.sessionsCompleted >= 2
      ? `That's ${data.sessionsCompleted} sessions of calm, keep it?`
      : 'Save your progress?';
  const progressStats = [
    data.totalMinutes != null
      ? `${Math.max(data.totalMinutes, 1)} ${Math.max(data.totalMinutes, 1) === 1 ? 'minute' : 'minutes'} of calm`
      : null,
    data.sessionsCompleted != null && data.sessionsCompleted >= 2
      ? `${data.sessionsCompleted} sessions`
      : null,
  ].filter(Boolean).join(' · ');

  if (isAuthenticated) {
    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.banner,
          {
            top: safeAreaTop + 8,
            backgroundColor: bg,
            borderColor: border,
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={[styles.bannerIcon, { backgroundColor: modeColor }]}><Text style={styles.bannerCheck}>✓</Text></View>
        <View style={styles.bannerCopy}>
          <Text style={[styles.bannerTitle, { color: text }]}>Practice saved</Text>
          <Text style={[styles.bannerSubtitle, { color: subtle }]}>{sessionLabel} synced to your account</Text>
        </View>
        <Pressable onPress={dismiss} accessibilityLabel="Dismiss practice saved banner">
          <Text style={[styles.dismissX, { color: subtle }]}>×</Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <View style={[styles.receipt, { backgroundColor: bg, borderColor: border, transform: [{ translateY }] }]}>
        <Pressable style={styles.receiptClose} onPress={dismiss} accessibilityLabel="Dismiss keep practice prompt">
          <Text style={[styles.dismissX, { color: subtle }]}>×</Text>
        </Pressable>
        <View style={[styles.sessionCard, { borderColor: border }]}>
          <View style={[styles.progressRing, { borderColor: modeColor }]}>
            <SymbolView name="waveform.path.ecg" tintColor={modeColor} size={20} />
          </View>
          <View style={styles.sessionCopy}>
            <Text style={[styles.eyebrow, { color: subtle }]}>✓ SESSION COMPLETE</Text>
            <Text style={[styles.sessionMode, { color: text }]} numberOfLines={1}>{data.sessionMode}</Text>
            <Text style={[styles.sessionMeta, { color: subtle }]}>{durationLabel} · just now</Text>
          </View>
        </View>
        <Text style={[styles.receiptTitle, { color: text }]}>{headline}</Text>
        {progressStats ? <Text style={[styles.progressStats, { color: text }]}>{progressStats}</Text> : null}
        <Text style={[styles.receiptBody, { color: subtle }]}>
          Saved on this device only. A free account keeps it, and every minute after, on any screen you pick up.
        </Text>
        <AuthActions theme={theme} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 110,
    backgroundColor: 'rgba(20,10,5,0.48)',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  receipt: {
    borderRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 24,
    paddingTop: 42,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.24,
    shadowRadius: 30,
  },
  receiptClose: { position: 'absolute', top: 12, right: 16, zIndex: 2 },
  dismissX: { fontSize: 29, lineHeight: 32, paddingHorizontal: 5 },
  sessionCard: { width: '100%', minHeight: 74, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center' },
  progressRing: { width: 46, height: 46, borderRadius: 23, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  sessionCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  eyebrow: { fontSize: 10, letterSpacing: 1.2, fontWeight: '800' },
  sessionMode: { fontSize: 15, lineHeight: 20, fontWeight: '700', marginTop: 2 },
  sessionMeta: { fontSize: 12, marginTop: 2, fontVariant: ['tabular-nums'] },
  receiptTitle: { width: '100%', fontSize: 24, lineHeight: 29, fontWeight: '700', marginTop: 20, letterSpacing: -0.35 },
  progressStats: { width: '100%', fontSize: 13, fontWeight: '700', marginTop: 8 },
  receiptBody: { width: '100%', fontSize: 14, lineHeight: 21, marginTop: 10, marginBottom: 20 },
  banner: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 120,
    minHeight: 72,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
  },
  bannerIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  bannerCheck: { color: '#fff', fontSize: 21, fontWeight: '800' },
  bannerCopy: { flex: 1, marginLeft: 11 },
  bannerTitle: { fontSize: 16, fontWeight: '700' },
  bannerSubtitle: { fontSize: 12, marginTop: 2 },
});

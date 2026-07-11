import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AuthActions from '../auth/AuthActions';

export interface CompletionSummaryData {
  sessionSeconds: number;
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
        <View style={styles.bannerIcon}><Text style={styles.bannerCheck}>✓</Text></View>
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
        <Text style={[styles.eyebrow, { color: subtle }]}>SESSION COMPLETE</Text>
        <View style={[styles.activityRing, { borderColor: '#e36c4c' }]}>
          <View style={[styles.activityRingInner, { borderColor: '#e36c4c55' }]}>
            <Text style={[styles.ringValue, { color: text }]}>{sessionLabel}</Text>
            <Text style={[styles.ringLabel, { color: subtle }]}>just now</Text>
          </View>
        </View>
        <Text style={[styles.receiptTitle, { color: text }]}>Keep your practice</Text>
        <Text style={[styles.receiptBody, { color: subtle }]}>
          Saved on this phone for now. A free account carries every session, streak, and setting to the web and your next device.
        </Text>
        <View style={styles.statsRow}>
          {data.totalMinutes != null && (
            <View style={styles.statCell}>
              <Text style={[styles.statValue, { color: text }]}>{data.totalMinutes}</Text>
              <Text style={[styles.statLabel, { color: subtle }]}>total min</Text>
            </View>
          )}
          {data.sessionsCompleted != null && (
            <View style={styles.statCell}>
              <Text style={[styles.statValue, { color: text }]}>{data.sessionsCompleted}</Text>
              <Text style={[styles.statLabel, { color: subtle }]}>sessions</Text>
            </View>
          )}
        </View>
        <AuthActions theme={theme} />
        <Pressable onPress={dismiss} style={styles.notNow}>
          <Text style={[styles.notNowText, { color: subtle }]}>Not now</Text>
        </Pressable>
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
    paddingTop: 27,
    paddingBottom: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.24,
    shadowRadius: 30,
  },
  receiptClose: { position: 'absolute', top: 12, right: 16, zIndex: 2 },
  dismissX: { fontSize: 29, lineHeight: 32, paddingHorizontal: 5 },
  eyebrow: { fontSize: 10, letterSpacing: 2.4, fontWeight: '800', marginBottom: 14 },
  activityRing: { width: 126, height: 126, borderRadius: 63, borderWidth: 9, padding: 7 },
  activityRingInner: { flex: 1, borderRadius: 52, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  ringValue: { fontSize: 27, fontWeight: '800' },
  ringLabel: { fontSize: 11, marginTop: 1 },
  receiptTitle: { fontSize: 29, fontWeight: '800', marginTop: 17, letterSpacing: -0.5 },
  receiptBody: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8, marginBottom: 14 },
  statsRow: { flexDirection: 'row', gap: 30, marginBottom: 16 },
  statCell: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  notNow: { paddingTop: 13, paddingHorizontal: 22 },
  notNowText: { fontSize: 13, fontWeight: '600' },
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
  bannerIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#dd684a', alignItems: 'center', justifyContent: 'center' },
  bannerCheck: { color: '#fff', fontSize: 21, fontWeight: '800' },
  bannerCopy: { flex: 1, marginLeft: 11 },
  bannerTitle: { fontSize: 16, fontWeight: '700' },
  bannerSubtitle: { fontSize: 12, marginTop: 2 },
});

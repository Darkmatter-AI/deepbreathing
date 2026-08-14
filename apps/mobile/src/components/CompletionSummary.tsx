import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  AccessibilityInfo,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();
  const dark = theme === 'dark';
  const bg = dark ? '#2b1b15' : '#fff7ef';
  const text = dark ? '#f5dfcc' : '#452b1d';
  const subtle = dark ? '#bf9b82' : '#8e6b53';
  const border = dark ? '#654638' : '#e5cbb7';
  const modeColor = BREATHING_PATTERNS[data.sessionMode as ModeName]?.color ?? '#e36c4c';
  const bannerCheckColor = (() => {
    const channels = modeColor.slice(1).match(/../g)?.map((value) => Number.parseInt(value, 16) / 255);
    if (!channels || channels.length !== 3) return '#fff';
    const luminance = channels.reduce((sum, channel, index) => {
      const linear = channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      return sum + linear * [0.2126, 0.7152, 0.0722][index];
    }, 0);
    return luminance > 0.179 ? '#2b1b15' : '#fff';
  })();

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

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      isAuthenticated
        ? `Practice saved. ${sessionLabel} synced to your account.`
        : `Session complete. ${headline}`,
    );
  }, [headline, isAuthenticated, sessionLabel]);

  if (isAuthenticated) {
    return (
      <Animated.View
        {...panResponder.panHandlers}
        accessible={false}
        accessibilityViewIsModal
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
        <View style={[styles.bannerIcon, { backgroundColor: modeColor }]} accessible={false}><Text style={[styles.bannerCheck, { color: bannerCheckColor }]} accessible={false}>✓</Text></View>
        <View style={styles.bannerCopy}>
          <Text style={[styles.bannerTitle, { color: text }]}>Practice saved</Text>
          <Text style={[styles.bannerSubtitle, { color: subtle }]}>{sessionLabel} synced to your account</Text>
        </View>
        <Pressable
          onPress={dismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss practice saved banner"
          accessibilityHint="Double-tap to dismiss"
          onAccessibilityEscape={dismiss}
          style={styles.bannerDismiss}
        >
          <Text style={[styles.dismissX, { color: subtle }]} accessible={false}>×</Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity,
          paddingTop: Math.max(safeAreaTop, insets.top) + 12,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
      accessible={false}
      accessibilityViewIsModal
    >
      <ScrollView
        style={styles.receiptScroll}
        contentContainerStyle={styles.receiptScrollContent}
        showsVerticalScrollIndicator
        bounces
        alwaysBounceVertical
        accessible={false}
      >
        <Animated.View style={[styles.receipt, { backgroundColor: bg, borderColor: border, transform: [{ translateY }] }]}>
          <Pressable
            style={styles.receiptClose}
            onPress={dismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss keep practice prompt"
            accessibilityHint="Double-tap to dismiss"
            onAccessibilityEscape={dismiss}
          >
            <Text style={[styles.dismissX, { color: subtle }]} accessible={false}>×</Text>
          </Pressable>
          <View style={[styles.sessionCard, { borderColor: border }]}>
            <View style={[styles.progressRing, { borderColor: modeColor }]} accessible={false}>
              <SymbolView name="waveform.path.ecg" tintColor={modeColor} size={20} />
            </View>
            <View style={styles.sessionCopy}>
              <Text style={[styles.eyebrow, { color: subtle }]}>✓ SESSION COMPLETE</Text>
              <Text style={[styles.sessionMode, { color: text }]}>{data.sessionMode}</Text>
              <Text style={[styles.sessionMeta, { color: subtle }]}>{durationLabel} · just now</Text>
            </View>
          </View>
          <Text style={[styles.receiptTitle, { color: text }]}>{headline}</Text>
          {progressStats ? <Text style={[styles.progressStats, { color: text }]}>{progressStats}</Text> : null}
          <Text style={[styles.receiptBody, { color: subtle }]}>
            Saved on this device only. A free account keeps it, and every minute after, on any screen you pick up.
          </Text>
          <AuthActions theme={theme} />
        </Animated.View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 110,
    backgroundColor: 'rgba(20,10,5,0.48)',
    paddingHorizontal: 12,
  },
  receiptScroll: { flex: 1, width: '100%' },
  receiptScrollContent: { flexGrow: 1, justifyContent: 'flex-end', width: '100%' },
  receipt: {
    borderRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.24,
    shadowRadius: 30,
  },
  receiptClose: { position: 'absolute', top: 8, right: 8, zIndex: 2, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
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
  bannerCheck: { fontSize: 21, fontWeight: '800' },
  bannerDismiss: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  bannerCopy: { flex: 1, marginLeft: 11 },
  bannerTitle: { fontSize: 16, fontWeight: '700' },
  bannerSubtitle: { fontSize: 12, marginTop: 2 },
});

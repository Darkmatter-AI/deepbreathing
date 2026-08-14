import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  findNodeHandle,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetHandle,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
  type BottomSheetHandleProps,
} from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getOrCreateGuestId,
  prepareStorageOwner,
  type AccountPracticeSummary,
} from '../sync/session-sync-client';
import AuthActions from './AuthActions';
import { accountAvatarUri } from './account-avatar';
import { authClient, signOut } from './auth-client';

const PRIVACY_POLICY_URL = 'https://deepbreathingexercises.com/privacy';

interface AccountUser {
  id?: string | null;
  email: string;
  name?: string | null;
  image?: string | null;
}

interface Props {
  open: boolean;
  theme: 'light' | 'dark';
  user: AccountUser | null;
  practice: AccountPracticeSummary | null;
  onClose: () => void;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function recentDays(count: number) {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (count - 1 - index));
    return dateKey(date);
  });
}

export default function AccountSheet({ open, theme, user, practice, onClose }: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const titleRef = useRef<Text>(null);
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const [sheetIndex, setSheetIndex] = useState(-1);
  const [pendingAction, setPendingAction] = useState<'signOut' | 'delete' | null>(null);
  const dark = theme === 'dark';
  const background = dark ? '#251813' : '#fff9f3';
  const card = dark ? '#302019' : '#fffdf9';
  const text = dark ? '#f2dfce' : '#422a1c';
  const subtle = dark ? '#b9957c' : '#8e6b53';
  const border = dark ? '#5a4134' : '#e2c9b6';
  const accent = dark ? '#0d9488' : '#0b756d';
  const snapPoints = useMemo(() => user ? ['68%', '92%'] : ['58%', '88%'], [user]);
  const days = useMemo(() => recentDays(28), []);
  const activeDays = useMemo(() => new Set(practice?.activeDays ?? []), [practice?.activeDays]);
  const sheetVisible = open && sheetIndex >= 0;

  const closeSheet = useCallback(() => {
    sheetRef.current?.close();
  }, []);

  const focusTitle = useCallback(() => {
    const tag = findNodeHandle(titleRef.current);
    if (tag != null) AccessibilityInfo.setAccessibilityFocus(tag);
  }, []);

  useEffect(() => {
    if (!sheetVisible) return;
    const timer = setTimeout(focusTitle, 260);
    return () => clearTimeout(timer);
  }, [focusTitle, sheetVisible]);

  useEffect(() => {
    if (pendingAction === 'signOut') {
      AccessibilityInfo.announceForAccessibility('Signing out.');
    } else if (pendingAction === 'delete') {
      AccessibilityInfo.announceForAccessibility('Requesting account deletion.');
    } else if (message) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, [message, pendingAction]);

  // Plain BottomSheet (not BottomSheetModal): present() on the modal variant
  // no-ops silently under reanimated 4 / RN new architecture, which left the
  // account button doing nothing. ModeLibrarySheet uses this same pattern.
  useEffect(() => {
    if (open) sheetRef.current?.snapToIndex(0);
    else sheetRef.current?.close();
  }, [open]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.45}
        pressBehavior="close"
        accessible
        accessibilityRole="button"
        accessibilityLabel="Dismiss account sheet"
        accessibilityHint="Double-tap to close"
      />
    ),
    [],
  );

  const renderHandle = useCallback(
    (props: BottomSheetHandleProps) => (
      <BottomSheetHandle
        {...props}
        accessible={sheetVisible}
        accessibilityElementsHidden={!sheetVisible}
        importantForAccessibility={sheetVisible ? 'yes' : 'no-hide-descendants'}
        accessibilityRole="adjustable"
        accessibilityLabel="Account sheet handle"
        accessibilityHint="Swipe down to close the account sheet"
      />
    ),
    [sheetVisible],
  );

  const requestDeletion = useCallback(async () => {
    setPendingAction('delete');
    setMessage(null);
    try {
      const result = await authClient.deleteUser({ callbackURL: '/' });
      setMessage(result.error
        ? result.error.message ?? 'Could not start account deletion.'
        : 'Check your email to confirm permanent deletion.');
    } catch {
      setMessage('Could not start account deletion.');
    } finally {
      setPendingAction(null);
    }
  }, []);

  const confirmDeletion = useCallback(() => {
    Alert.alert(
      'Permanently delete account?',
      'This removes your account and all synced practice data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () => void requestDeletion(),
        },
      ],
    );
  }, [requestDeletion]);

  const signOutAccount = useCallback(async () => {
    setPendingAction('signOut');
    setMessage(null);
    try {
      const result = await signOut();
      if (result && 'error' in result && result.error) {
        throw new Error(result.error.message ?? 'Could not sign out.');
      }
      const guestId = await getOrCreateGuestId();
      await prepareStorageOwner({ kind: 'guest', id: guestId });
      AccessibilityInfo.announceForAccessibility('Signed out.');
      closeSheet();
    } catch {
      setMessage('Could not sign out. Please try again.');
    } finally {
      setPendingAction(null);
    }
  }, [closeSheet]);

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      animateOnMount={false}
      enableDynamicSizing={false}
      enablePanDownToClose
      enableContentPanningGesture
      enableHandlePanningGesture
      backdropComponent={renderBackdrop}
      handleComponent={renderHandle}
      onChange={setSheetIndex}
      onClose={onClose}
      accessible={false}
      onAccessibilityEscape={closeSheet}
      style={styles.sheet}
      backgroundStyle={{ backgroundColor: background, borderColor: border, borderWidth: StyleSheet.hairlineWidth }}
      handleIndicatorStyle={{ backgroundColor: dark ? '#745746' : '#c9aa94', width: 42 }}
    >
      <View
        style={styles.accessibilityContainer}
        accessible={false}
        accessibilityElementsHidden={!sheetVisible}
        importantForAccessibility={sheetVisible ? 'yes' : 'no-hide-descendants'}
        accessibilityViewIsModal={sheetVisible}
        onAccessibilityEscape={closeSheet}
      >
        <BottomSheetScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
          showsVerticalScrollIndicator={false}
          accessible={false}
        >
          <View style={styles.header}>
            <View style={styles.headerCopy} accessible={false}>
              <Text style={[styles.eyebrow, { color: subtle }]}>YOUR PRACTICE</Text>
              <Text
                ref={titleRef}
                style={[styles.title, { color: text }]}
                accessible
                accessibilityRole="header"
                onAccessibilityEscape={closeSheet}
              >
                {user ? 'Your practice' : 'Keep it with you'}
              </Text>
            </View>
            <Pressable
              onPress={closeSheet}
              accessibilityRole="button"
              accessibilityLabel="Close account sheet"
              accessibilityHint="Double-tap to close"
              accessibilityState={{ disabled: false }}
              onAccessibilityEscape={closeSheet}
              style={styles.close}
            >
              <Text style={[styles.closeText, { color: subtle }]} accessible={false}>×</Text>
            </Pressable>
          </View>

          {user ? (
            <View style={styles.accountBody}>
              <View style={[styles.identity, { backgroundColor: card, borderColor: border }]}>
                <Image source={accountAvatarUri(user)} style={styles.avatar} contentFit="cover" alt="Account portrait" />
                <View style={styles.identityCopy}>
                  <Text style={[styles.accountName, { color: text }]} selectable>{user.name || 'Your account'}</Text>
                  <Text style={[styles.email, { color: subtle }]} selectable numberOfLines={1}>{user.email}</Text>
                  <Text style={[styles.syncing, { color: subtle }]}>Synced across web and phone</Text>
                </View>
              </View>

              {practice ? (
                <>
                  <View style={styles.statsRow}>
                    <View style={[styles.stat, { backgroundColor: card, borderColor: border }]}>
                      <Text style={[styles.statValue, { color: text }]} selectable>{practice.totalMinutes}</Text>
                      <Text style={[styles.statLabel, { color: subtle }]}>Minutes</Text>
                    </View>
                    <View style={[styles.stat, { backgroundColor: card, borderColor: border }]}>
                      <Text style={[styles.statValue, { color: text }]} selectable>{practice.sessionsCompleted}</Text>
                      <Text style={[styles.statLabel, { color: subtle }]}>Sessions</Text>
                    </View>
                    <View style={[styles.stat, { backgroundColor: card, borderColor: border }]}>
                      <Text style={[styles.statValue, { color: text }]} selectable>{practice.currentStreak}</Text>
                      <Text style={[styles.statLabel, { color: subtle }]}>Day streak</Text>
                    </View>
                  </View>

                  {practice.sessionsCompleted > 0 ? (
                    <View style={[styles.gardenCard, { backgroundColor: card, borderColor: border }]}>
                      <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: text }]} accessibilityRole="header">Last 28 days</Text>
                        <Text style={[styles.sectionMeta, { color: subtle }]}>Your breath garden</Text>
                      </View>
                      <View style={styles.garden} accessibilityLabel="Practice activity for the last 28 days">
                        {days.map((day) => (
                          <View
                            key={day}
                            accessible
                            accessibilityRole="image"
                            accessibilityLabel={`${day}: ${activeDays.has(day) ? 'practiced' : 'rest'}`}
                            style={[
                              styles.gardenDay,
                              activeDays.has(day)
                                ? { backgroundColor: accent }
                                : { backgroundColor: dark ? '#463329' : '#efe2d6' },
                            ]}
                          />
                        ))}
                      </View>
                      {practice.currentMode ? (
                        <View style={[styles.patternRow, { borderTopColor: border }]}>
                          <Text style={[styles.patternLabel, { color: subtle }]}>Current pattern</Text>
                          <Text style={[styles.patternValue, { color: text }]} numberOfLines={1}>{practice.currentMode}</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : (
                    <View style={[styles.freshStart, { backgroundColor: card, borderColor: border }]}>
                      <View style={[styles.freshOrb, { backgroundColor: accent }]} accessible={false} />
                      <View style={styles.freshCopy}>
                        <Text style={[styles.sectionTitle, { color: text }]}>Fresh start</Text>
                        <Text style={[styles.freshBody, { color: subtle }]}>One completed breath plants your first day here.</Text>
                      </View>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.loadingPractice}>
                  <ActivityIndicator color={accent} accessibilityLabel="Loading your practice" />
                  <Text style={[styles.loadingText, { color: subtle }]} accessibilityLiveRegion="polite">Loading your practice…</Text>
                </View>
              )}

              <Pressable
                style={[styles.action, { borderColor: border }]}
                onPress={() => void signOutAccount()}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel={pendingAction === 'signOut' ? 'Signing out' : 'Sign out'}
                accessibilityState={{ disabled: pendingAction !== null, busy: pendingAction === 'signOut' }}
              >
                {pendingAction === 'signOut' ? <ActivityIndicator color={accent} accessibilityLabel="Signing out" /> : <Text style={[styles.actionText, { color: text }]}>Sign out</Text>}
              </Pressable>
              <Pressable
                style={styles.deleteAction}
                onPress={confirmDeletion}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel="Permanently delete account"
                accessibilityHint="Opens a confirmation dialog"
                accessibilityState={{ disabled: pendingAction !== null, busy: pendingAction === 'delete' }}
              >
                {pendingAction === 'delete' ? <ActivityIndicator color={dark ? '#f0a08c' : '#9f352b'} accessibilityLabel="Requesting account deletion" /> : <Text style={[styles.deleteText, { color: dark ? '#f0a08c' : '#9f352b' }]}>Permanently delete account</Text>}
              </Pressable>
              {pendingAction === 'delete' ? <Text style={[styles.message, { color: subtle }]} accessibilityRole="alert" accessibilityLiveRegion="polite">Requesting account deletion…</Text> : null}
              {message ? <Text style={[styles.message, { color: subtle }]} accessibilityRole="alert" accessibilityLiveRegion="polite" selectable>{message}</Text> : null}
            </View>
          ) : (
            <View style={styles.guestBody}>
              <Text style={[styles.bodyCopy, { color: subtle }]}>Continue to carry sessions, streaks, and settings between this phone and the web.</Text>
              <AuthActions theme={theme} onAuthenticated={closeSheet} />
              <Text style={[styles.privacy, { color: subtle }]}>Breathing always works without an account.</Text>
            </View>
          )}
          <View style={styles.privacyFooter}>
            <Pressable
              style={styles.privacyLinkButton}
              onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}
              accessibilityRole="link"
              accessibilityLabel="Open Privacy Policy"
              accessibilityHint="Opens the privacy policy in your browser"
            >
              <Text style={[styles.privacyLink, { color: accent }]}>Privacy Policy</Text>
            </Pressable>
          </View>
        </BottomSheetScrollView>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: { zIndex: 100 },
  accessibilityContainer: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 11, letterSpacing: 2.2, fontWeight: '700' },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '700', marginTop: 6, letterSpacing: -0.5 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: -6, marginRight: -8 },
  closeText: { fontSize: 32, lineHeight: 34 },
  guestBody: { paddingTop: 28, gap: 22 },
  bodyCopy: { fontSize: 16, lineHeight: 24 },
  privacy: { fontSize: 13, textAlign: 'center', paddingTop: 2 },
  privacyFooter: { alignItems: 'center', paddingTop: 4, paddingBottom: 4 },
  privacyLinkButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  privacyLink: { fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
  accountBody: { paddingTop: 22, gap: 14 },
  identity: { padding: 14, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 13 },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  identityCopy: { flex: 1, minWidth: 0 },
  accountName: { fontSize: 17, fontWeight: '700' },
  email: { fontSize: 13, marginTop: 2 },
  syncing: { fontSize: 12, marginTop: 7 },
  statsRow: { flexDirection: 'row', gap: 9 },
  stat: { flex: 1, minHeight: 82, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 10, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.7 },
  gardenCard: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionMeta: { fontSize: 11 },
  garden: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 16 },
  gardenDay: { width: 14, height: 14, borderRadius: 4 },
  patternRow: { marginTop: 16, paddingTop: 13, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  patternLabel: { fontSize: 12 },
  patternValue: { flex: 1, textAlign: 'right', fontSize: 12, fontWeight: '600' },
  freshStart: { padding: 18, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 14 },
  freshOrb: { width: 42, height: 42, borderRadius: 21, opacity: 0.9 },
  freshCopy: { flex: 1 },
  freshBody: { fontSize: 13, lineHeight: 19, marginTop: 3 },
  loadingPractice: { minHeight: 110, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 13 },
  action: { height: 50, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  actionText: { fontSize: 15, fontWeight: '600' },
  deleteAction: { height: 46, alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: '#bd4c3e', fontSize: 14, fontWeight: '600' },
  message: { textAlign: 'center', fontSize: 12 },
});

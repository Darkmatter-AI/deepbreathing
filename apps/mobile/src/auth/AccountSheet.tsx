import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AuthActions from './AuthActions';
import { authClient, signOut } from './auth-client';

interface Props {
  open: boolean;
  theme: 'light' | 'dark';
  user: { email: string; name?: string | null } | null;
  onClose: () => void;
}

export default function AccountSheet({ open, theme, user, onClose }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const dark = theme === 'dark';
  const background = dark ? '#251813' : '#fff9f3';
  const text = dark ? '#f2dfce' : '#422a1c';
  const subtle = dark ? '#b9957c' : '#8e6b53';
  const border = dark ? '#5a4134' : '#e2c9b6';

  const requestDeletion = () => {
    Alert.alert(
      'Permanently delete account?',
      'This removes your account and all synced practice data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            const result = await authClient.deleteUser({ callbackURL: '/' });
            if (result.error) {
              setMessage(result.error.message ?? 'Could not start account deletion.');
            } else {
              setMessage('Check your email to confirm permanent deletion.');
            }
          },
        },
      ],
    );
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <SafeAreaView style={[styles.sheet, { backgroundColor: background }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: subtle }]}>YOUR PRACTICE</Text>
            <Text style={[styles.title, { color: text }]}>{user ? 'Account' : 'Keep it with you'}</Text>
          </View>
          <Pressable onPress={onClose} accessibilityLabel="Close account sheet" style={styles.close}>
            <Text style={[styles.closeText, { color: subtle }]}>×</Text>
          </Pressable>
        </View>

        {user ? (
          <View style={styles.accountBody}>
            <View style={[styles.identity, { borderColor: border }]}>
              <Text style={[styles.identityLabel, { color: subtle }]}>Signed in as</Text>
              <Text style={[styles.email, { color: text }]}>{user.email}</Text>
              <Text style={[styles.syncing, { color: subtle }]}>Sessions sync across web and phone</Text>
            </View>
            <Pressable
              style={[styles.action, { borderColor: border }]}
              onPress={async () => {
                await signOut();
                onClose();
              }}
            >
              <Text style={[styles.actionText, { color: text }]}>Sign out</Text>
            </Pressable>
            <Pressable style={styles.deleteAction} onPress={requestDeletion}>
              <Text style={styles.deleteText}>Permanently delete account</Text>
            </Pressable>
            {message ? <Text style={[styles.message, { color: subtle }]}>{message}</Text> : null}
          </View>
        ) : (
          <View style={styles.guestBody}>
            <Text style={[styles.bodyCopy, { color: subtle }]}>
              Sign in to carry sessions, streaks, and settings between this phone and the web.
            </Text>
            <AuthActions theme={theme} onAuthenticated={onClose} />
            <Text style={[styles.privacy, { color: subtle }]}>Breathing always works without an account.</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15,8,4,0.45)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingBottom: 20,
    minHeight: 390,
  },
  handle: { width: 42, height: 5, borderRadius: 3, backgroundColor: '#94705c55', alignSelf: 'center', marginTop: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 22 },
  eyebrow: { fontSize: 11, letterSpacing: 2.2, fontWeight: '700' },
  title: { fontSize: 29, fontWeight: '700', marginTop: 4 },
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 32, lineHeight: 34 },
  guestBody: { marginTop: 24, gap: 18 },
  bodyCopy: { fontSize: 15, lineHeight: 22 },
  privacy: { fontSize: 12, textAlign: 'center' },
  accountBody: { marginTop: 24, gap: 12 },
  identity: { padding: 18, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth },
  identityLabel: { fontSize: 12 },
  email: { fontSize: 16, fontWeight: '600', marginTop: 3 },
  syncing: { fontSize: 13, marginTop: 10 },
  action: { height: 50, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 15, fontWeight: '600' },
  deleteAction: { height: 46, alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: '#bd4c3e', fontSize: 14, fontWeight: '600' },
  message: { textAlign: 'center', fontSize: 12 },
});

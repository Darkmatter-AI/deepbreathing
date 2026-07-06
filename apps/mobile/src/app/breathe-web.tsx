import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import * as Localization from 'expo-localization';
import { useColorScheme } from 'react-native';
import { setAudioModeAsync } from 'expo-audio';

import BreathingExperienceDom from '../components/breathing-web/BreathingExperience.dom';

function toBreathingAppState(status: AppStateStatus): 'active' | 'background' {
  return status === 'active' ? 'active' : 'background';
}

export default function BreatheWebScreen() {
  const colorScheme = useColorScheme();
  const theme: 'light' | 'dark' = colorScheme === 'light' ? 'light' : 'dark';
  const locale = Localization.getLocales()[0]?.languageCode ?? 'en';

  const [appState, setAppState] = useState<'active' | 'background'>(
    toBreathingAppState(AppState.currentState),
  );

  // Best-effort audio session setup on mount.
  useEffect(() => {
    (async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          interruptionMode: 'mixWithOthers',
          allowsRecording: false,
          shouldPlayInBackground: false,
          shouldRouteThroughEarpiece: false,
        });
      } catch {
        // Non-fatal — audio cues degrade gracefully.
      }
    })();
  }, []);

  // Track app foreground/background to let the DOM component suspend audio.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      setAppState(toBreathingAppState(next));
    });
    return () => sub.remove();
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <BreathingExperienceDom
          dom={{
            style: { flex: 1 },
            automaticallyAdjustContentInsets: false,
            contentInsetAdjustmentBehavior: 'never',
          }}
          locale={locale}
          forcedTheme={theme}
          appState={appState}
          isNativeApp
          onSessionComplete={async (_seconds) => {}}
          onEvent={async (_name, _params) => {}}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
});

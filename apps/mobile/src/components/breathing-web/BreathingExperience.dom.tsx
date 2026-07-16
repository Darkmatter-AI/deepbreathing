"use dom";
import './breathing-web.css';

import BreathingExperience from './BreathingExperience';
import type { ModeName } from './types';
import type { ResonancePersistedSnapshot } from '../../breathing/resonance-mirror';

interface BreathingExperienceDomProps {
  dom: import('expo/dom').DOMProps;
  locale?: string;
  forcedTheme?: 'light' | 'dark';
  initialMode?: ModeName;
  initialDuration?: number | null;
  appState?: 'active' | 'background';
  isNativeApp?: boolean;
  safeAreaInsets?: { top: number; right: number; bottom: number; left: number };
  initialPersistedSnapshot?: ResonancePersistedSnapshot;
  onSessionComplete?: (
    seconds: number,
    stats: { totalMinutes: number; sessionsCompleted: number; sessionMode: string },
  ) => Promise<void>;
  onEvent?: (name: string, params?: Record<string, any>) => Promise<void>;
}

export default function BreathingExperienceDom({
  locale,
  forcedTheme,
  initialMode,
  initialDuration,
  appState,
  safeAreaInsets,
  initialPersistedSnapshot,
  onSessionComplete,
  onEvent,
}: BreathingExperienceDomProps) {
  return (
    <div style={{ width: '100%', height: '100dvh' }}>
      <BreathingExperience
        locale={locale}
        forcedTheme={forcedTheme}
        initialMode={initialMode}
        initialDuration={initialDuration}
        appState={appState}
        isNativeApp
        safeAreaInsets={safeAreaInsets}
        initialPersistedSnapshot={initialPersistedSnapshot}
        onSessionComplete={onSessionComplete}
        onEvent={onEvent}
      />
    </div>
  );
}

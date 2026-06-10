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
  initialPersistedSnapshot?: ResonancePersistedSnapshot;
  onSessionComplete?: (seconds: number) => Promise<void>;
  onEvent?: (name: string, params?: Record<string, any>) => Promise<void>;
}

export default function BreathingExperienceDom({
  locale,
  forcedTheme,
  initialMode,
  initialDuration,
  appState,
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
        initialPersistedSnapshot={initialPersistedSnapshot}
        onSessionComplete={onSessionComplete}
        onEvent={onEvent}
      />
    </div>
  );
}

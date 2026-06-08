"use dom";
import './breathing-web.css';

import BreathingExperience from './BreathingExperience';
import type { ModeName } from './types';

interface BreathingExperienceDomProps {
  dom: import('expo/dom').DOMProps;
  locale?: string;
  forcedTheme?: 'light' | 'dark';
  initialMode?: ModeName;
  initialDuration?: number | null;
  appState?: 'active' | 'background';
  onSessionComplete?: (seconds: number) => Promise<void>;
  onEvent?: (name: string, params?: Record<string, any>) => Promise<void>;
}

export default function BreathingExperienceDom({
  locale,
  forcedTheme,
  initialMode,
  initialDuration,
  appState,
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
        onSessionComplete={onSessionComplete}
        onEvent={onEvent}
      />
    </div>
  );
}

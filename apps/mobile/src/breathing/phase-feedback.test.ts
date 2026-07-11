import { describe, expect, it } from 'vitest';

import { BreathingPhase } from '../components/breathing-web/types';
import { getPhaseAudioCue } from './phase-feedback';

describe('getPhaseAudioCue', () => {
  it.each([
    [BreathingPhase.Inhale, 'inhale'],
    [BreathingPhase.Inhale2, 'inhale'],
    [BreathingPhase.HoldIn, 'hold'],
    [BreathingPhase.HoldOut, 'hold'],
    [BreathingPhase.Exhale, 'exhale'],
  ] as const)('maps %s to the synchronized %s cue', (phase, cue) => {
    expect(getPhaseAudioCue(phase)).toBe(cue);
  });

  it('does not emit feedback for idle', () => {
    expect(getPhaseAudioCue(BreathingPhase.Idle)).toBeNull();
  });
});

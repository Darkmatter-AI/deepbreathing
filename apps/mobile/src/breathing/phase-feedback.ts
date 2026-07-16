import { BreathingPhase } from '../components/breathing-web/types';

export type PhaseAudioCue = 'inhale' | 'hold' | 'exhale';

export function getPhaseAudioCue(phase: BreathingPhase): PhaseAudioCue | null {
  switch (phase) {
    case BreathingPhase.Inhale:
    case BreathingPhase.Inhale2:
      return 'inhale';
    case BreathingPhase.HoldIn:
    case BreathingPhase.HoldOut:
      return 'hold';
    case BreathingPhase.Exhale:
      return 'exhale';
    default:
      return null;
  }
}

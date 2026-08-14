// Breathing pattern catalog — re-exported from the single canonical copy in
// @resonance/domain (retired native re-implementation, kept in-repo for
// reference only). V1_MODES stays fork-specific.
//
// @see packages/domain/src/patterns.ts

export {
  BREATHING_PATTERNS,
  WIM_HOF_PROTOCOL,
  MIN_SPEED_MULTIPLIER,
  MAX_SPEED_MULTIPLIER,
  DEFAULT_SPEED_MULTIPLIER,
} from '@resonance/domain';
import { ModeName } from '@resonance/domain';

// v1 ships the three core, non-protocol modes from the original plan.
export const V1_MODES: ModeName[] = [
  ModeName.Box,
  ModeName.Relax,
  ModeName.Coherent,
];

import { describe, expect, it } from 'vitest';

import { backgroundAudioRemainingMs } from './background-audio';

describe('backgroundAudioRemainingMs', () => {
  it('keeps open-ended sessions running', () => {
    expect(backgroundAudioRemainingMs(null, 90, 1_000, 20_000)).toBeNull();
  });

  it('subtracts foreground time since the last DOM report', () => {
    expect(backgroundAudioRemainingMs(30, 10, 5_000, 10_000)).toBe(15_000);
  });

  it('clamps completed sessions to zero', () => {
    expect(backgroundAudioRemainingMs(30, 28, 5_000, 10_000)).toBe(0);
  });
});

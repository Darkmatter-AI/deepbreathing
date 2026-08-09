import { describe, expect, it } from 'vitest';
import {
  claimAccountDeletionPrompt,
  parseAccountDeletionDeepLink,
  releaseAccountDeletionPrompt,
} from './account-deletion-deeplink';

const TOKEN = 'a1b2c3d4e5f6a7b8c9d0a1b2c3d4e5f6';

describe('account deletion deep links', () => {
  it('accepts only the exact root scheme and bounded token query', () => {
    expect(
      parseAccountDeletionDeepLink(
        `deepbreathing:///?accountDeletionToken=${TOKEN}`,
      ),
    ).toEqual({ token: TOKEN });
    expect(parseAccountDeletionDeepLink(`deepbreathing:///?token=${TOKEN}`)).toBeNull();
    expect(
      parseAccountDeletionDeepLink(
        `deepbreathing://account-delete?accountDeletionToken=${TOKEN}`,
      ),
    ).toBeNull();
    expect(
      parseAccountDeletionDeepLink(
        `deepbreathing:///?accountDeletionToken=${TOKEN}&extra=1`,
      ),
    ).toBeNull();
    expect(
      parseAccountDeletionDeepLink(
        'https://deepbreathingexercises.com/?accountDeletionToken=' + TOKEN,
      ),
    ).toBeNull();
    expect(
      parseAccountDeletionDeepLink(
        'deepbreathing:///?accountDeletionToken=short',
      ),
    ).toBeNull();
  });

  it('deduplicates prompts while allowing cancel/error retry', () => {
    const pending = new Set<string>();
    const handled = new Set<string>();
    expect(claimAccountDeletionPrompt(TOKEN, pending, handled)).toBe(true);
    expect(claimAccountDeletionPrompt(TOKEN, pending, handled)).toBe(false);

    releaseAccountDeletionPrompt(TOKEN, pending);
    expect(claimAccountDeletionPrompt(TOKEN, pending, handled)).toBe(true);

    releaseAccountDeletionPrompt(TOKEN, pending);
    handled.add(TOKEN);
    expect(claimAccountDeletionPrompt(TOKEN, pending, handled)).toBe(false);
  });
});

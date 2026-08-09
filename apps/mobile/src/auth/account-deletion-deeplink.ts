export const ACCOUNT_DELETION_TOKEN_PATTERN = /^[a-z0-9]{32}$/;
export const ACCOUNT_DELETION_QUERY_KEY = 'accountDeletionToken';

export type AccountDeletionDeepLink = {
  token: string;
};

/**
 * Parse only the root deep link emitted by the server. Keeping the host empty,
 * the path exact, and the query to one bounded token prevents arbitrary URLs
 * from reaching the destructive confirmation flow.
 */
export function parseAccountDeletionDeepLink(
  rawURL: string | null | undefined,
): AccountDeletionDeepLink | null {
  if (!rawURL) return null;
  try {
    const parsed = new URL(rawURL);
    if (
      parsed.protocol !== 'deepbreathing:' ||
      parsed.hostname !== '' ||
      parsed.pathname !== '/' ||
      parsed.hash ||
      parsed.username ||
      parsed.password ||
      parsed.port
    ) {
      return null;
    }
    const keys = [...parsed.searchParams.keys()];
    if (keys.length !== 1 || keys[0] !== ACCOUNT_DELETION_QUERY_KEY) return null;
    const token = parsed.searchParams.get(ACCOUNT_DELETION_QUERY_KEY);
    if (!token || !ACCOUNT_DELETION_TOKEN_PATTERN.test(token)) return null;
    return { token };
  } catch {
    return null;
  }
}

/** Add a token to the prompt set only once while an Alert is visible. */
export function claimAccountDeletionPrompt(
  token: string,
  pendingTokens: Set<string>,
  handledTokens: Set<string>,
): boolean {
  if (pendingTokens.has(token) || handledTokens.has(token)) return false;
  pendingTokens.add(token);
  return true;
}

export function releaseAccountDeletionPrompt(
  token: string,
  pendingTokens: Set<string>,
): void {
  pendingTokens.delete(token);
}

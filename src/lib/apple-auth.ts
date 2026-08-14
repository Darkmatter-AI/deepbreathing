/**
 * Server-side Sign in with Apple helpers.
 *
 * Native Apple sign-in gives us a one-time authorization code in addition to
 * the identity token. The code must be exchanged on the server so the Apple
 * private key never ships in the app bundle. Better Auth's direct id-token
 * route persists only `idToken.accessToken`, so the exchange plugin puts the
 * resulting refresh token in that declared field for later revocation.
 */

import { decodeJwt } from "jose";

export type AppleTokenResponse = {
  access_token?: unknown;
  refresh_token?: unknown;
  expires_in?: unknown;
  id_token?: unknown;
};

export type AppleClientSecretGenerator = (
  clientId: string,
) => Promise<string>;

export type AppleFetch = typeof fetch;

export type AppleNativeTokenExchangeDependencies = {
  nativeClientId: string;
  hasSigningCredentials: boolean;
  generateClientSecret: AppleClientSecretGenerator;
  fetchImpl?: AppleFetch;
};

export type AppleNativeTokenExchangeResult = {
  token: string;
};

export type AppleAccountTokenRow = {
  access_token: string | null;
  refresh_token: string | null;
};

export type AppleAccountQuery = (
  sql: string,
  params: readonly unknown[],
) => Promise<{ rows: AppleAccountTokenRow[] }>;

export type AppleTokenRevocationDependencies = {
  query: AppleAccountQuery;
  clientIds: readonly string[];
  generateClientSecret: AppleClientSecretGenerator;
  decryptToken?: (token: string) => Promise<string | null>;
  fetchImpl?: AppleFetch;
};

export type AppleTokenRevocationResult = {
  attempted: number;
  succeeded: number;
  failed: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getFetch(fetchImpl?: AppleFetch): AppleFetch {
  return fetchImpl ?? globalThis.fetch;
}

function appleSignInErrorResponse() {
  return new Response(
    JSON.stringify({
      error: {
        code: "APPLE_SIGN_IN_FAILED",
        message: "Apple sign-in failed",
      },
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    },
  );
}

/**
 * Exchange Apple's short-lived, one-time authorization code for a refresh
 * token. The caller supplies the client-secret generator so this helper can
 * be tested without importing credentials or making a network request.
 */
export async function exchangeAppleAuthorizationCode(
  authorizationCode: string,
  identityToken: string,
  dependencies: AppleNativeTokenExchangeDependencies,
): Promise<AppleNativeTokenExchangeResult> {
  if (typeof authorizationCode !== "string" || !authorizationCode.trim()) {
    throw new Error("Apple authorization code is required");
  }
  if (typeof identityToken !== "string" || !identityToken.trim()) {
    throw new Error("Apple identity token is required");
  }
  if (!dependencies.hasSigningCredentials) {
    throw new Error("Apple credentials unavailable");
  }

  const clientSecret = await dependencies.generateClientSecret(
    dependencies.nativeClientId,
  );
  const response = await getFetch(dependencies.fetchImpl)(
    "https://appleid.apple.com/auth/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: dependencies.nativeClientId,
        client_secret: clientSecret,
        code: authorizationCode,
        grant_type: "authorization_code",
      }).toString(),
    },
  );

  if (!response.ok) {
    throw new Error("Apple authorization code exchange failed");
  }

  const payload = (await response.json()) as AppleTokenResponse;
  const refreshToken =
    typeof payload.refresh_token === "string" ? payload.refresh_token : null;
  if (!refreshToken) {
    // The access token is short-lived and cannot satisfy account-deletion
    // revocation after a later sign-in. Require Apple's long-lived credential
    // rather than persisting a token that will silently expire.
    throw new Error("Apple did not return a refresh token");
  }

  const exchangedIdentityToken =
    typeof payload.id_token === "string" ? payload.id_token : null;
  if (!exchangedIdentityToken) {
    throw new Error("Apple did not return an identity token");
  }

  // Apple signs both JWTs. Better Auth verifies the original token below, but
  // binding the exchange response here prevents a valid code and a different
  // user's identity token from being combined into one account.
  const originalClaims = decodeJwt(identityToken);
  const exchangedClaims = decodeJwt(exchangedIdentityToken);
  if (
    typeof originalClaims.sub !== "string" ||
    typeof exchangedClaims.sub !== "string" ||
    originalClaims.sub !== exchangedClaims.sub
  ) {
    throw new Error("Apple identity token subject mismatch");
  }
  if (
    originalClaims.aud !== undefined &&
    exchangedClaims.aud !== undefined &&
    !audiencesOverlap(originalClaims.aud, exchangedClaims.aud)
  ) {
    throw new Error("Apple identity token audience mismatch");
  }

  return { token: refreshToken };
}

function audiencesOverlap(
  first: string | string[],
  second: string | string[],
): boolean {
  const firstValues = Array.isArray(first) ? first : [first];
  const secondValues = new Set(Array.isArray(second) ? second : [second]);
  return firstValues.some((value) => secondValues.has(value));
}

/**
 * Rewrite native Apple id-token sign-ins before Better Auth validates the
 * request. Web Apple OAuth requests do not carry an id-token body and pass
 * through unchanged, as do Google and every other provider.
 */
export function createAppleNativeTokenExchangePlugin(
  dependencies: AppleNativeTokenExchangeDependencies,
) {
  return {
    id: "apple-native-token-exchange",
    onRequest: async (request: Request) => {
      if (request.method !== "POST") return;

      const pathname = new URL(request.url).pathname.replace(/\/+$/, "");
      if (!pathname.endsWith("/sign-in/social")) return;

      let body: unknown;
      try {
        body = await request.clone().json();
      } catch {
        return;
      }
      if (!isRecord(body) || body.provider !== "apple") return;

      const idToken = isRecord(body.idToken) ? body.idToken : null;
      if (!idToken) return;
      const identityToken =
        typeof idToken.token === "string" ? idToken.token : null;

      const additionalData = isRecord(body.additionalData)
        ? body.additionalData
        : null;
      const authorizationCode =
        typeof additionalData?.authorizationCode === "string"
          ? additionalData.authorizationCode
          : null;

      // A direct Apple id-token request is the native path. Refuse to let it
      // create an account without a code that can later be revoked. Browser
      // Apple OAuth does not send `idToken`, so it still passes through above.
      if (!identityToken || !authorizationCode?.trim()) {
        return { response: appleSignInErrorResponse() };
      }

      try {
        const exchanged = await exchangeAppleAuthorizationCode(
          authorizationCode,
          identityToken,
          dependencies,
        );
        const nextAdditionalData = { ...(additionalData ?? {}) };
        delete nextAdditionalData.authorizationCode;
        const nextBody: Record<string, unknown> = {
          ...body,
          idToken: {
            ...idToken,
            // Better Auth persists this field as account.access_token. Prefer
            // the refresh token returned by Apple so it remains revocable.
            accessToken: exchanged.token,
          },
        };
        if (Object.keys(nextAdditionalData).length > 0) {
          nextBody.additionalData = nextAdditionalData;
        } else {
          delete nextBody.additionalData;
        }

        const headers = new Headers(request.headers);
        headers.delete("content-length");
        headers.set("content-type", "application/json");
        return {
          request: new Request(request, {
            body: JSON.stringify(nextBody),
            headers,
          }),
        };
      } catch {
        // Do not fall back to an id-token-only account: it would create a user
        // whose Apple authorization cannot be revoked on later deletion.
        return { response: appleSignInErrorResponse() };
      }
    },
  };
}

async function revokeAppleToken(
  token: string,
  hints: readonly ("refresh_token" | "access_token")[],
  dependencies: AppleTokenRevocationDependencies,
): Promise<{ attempted: number; succeeded: boolean }> {
  const clientIds = Array.from(
    new Set(dependencies.clientIds.filter((value): value is string => Boolean(value))),
  );
  const fetchImpl = getFetch(dependencies.fetchImpl);
  let attempted = 0;

  for (const hint of hints) {
    for (const clientId of clientIds) {
      attempted += 1;
      try {
        const clientSecret = await dependencies.generateClientSecret(clientId);
        const response = await fetchImpl(
          "https://appleid.apple.com/auth/revoke",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              token,
              token_type_hint: hint,
            }).toString(),
          },
        );
        if (response.ok) return { attempted, succeeded: true };
      } catch {
        // Apple/network failures must not block account deletion. Continue to
        // the next client id or hint while retaining a generic failure count.
      }
    }
  }
  return { attempted, succeeded: false };
}

/**
 * Revoke every stored Apple token before Better Auth deletes the account.
 * Errors are intentionally swallowed: Apple requires deletion to proceed even
 * when the provider or database is temporarily unavailable.
 */
export async function revokeAppleTokensBeforeDelete(
  userId: string,
  dependencies: AppleTokenRevocationDependencies,
): Promise<AppleTokenRevocationResult> {
  let rows: AppleAccountTokenRow[];
  try {
    const result = await dependencies.query(
      `SELECT "accessToken" AS access_token, "refreshToken" AS refresh_token
       FROM account
       WHERE "userId" = $1 AND "providerId" = 'apple'`,
      [userId],
    );
    rows = result.rows;
  } catch {
    // Keep deletion available when the database is temporarily unavailable.
    return { attempted: 0, succeeded: 0, failed: 1 };
  }

  const seen = new Set<string>();
  const outcome: AppleTokenRevocationResult = {
    attempted: 0,
    succeeded: 0,
    failed: 0,
  };

  for (const row of rows) {
    const candidates: Array<{
      token: string | null;
      hints: Array<"refresh_token" | "access_token">;
    }> = [
      { token: row.refresh_token, hints: ["refresh_token"] },
      // Native exchanges store their refresh token in access_token because the
      // Better Auth id-token endpoint drops idToken.refreshToken. Try both
      // hints so web access tokens remain supported as well.
      { token: row.access_token, hints: ["refresh_token", "access_token"] },
    ];

    for (const candidate of candidates) {
      if (!candidate.token) continue;

      let token = candidate.token;
      if (dependencies.decryptToken) {
        try {
          token = (await dependencies.decryptToken(candidate.token)) ?? "";
        } catch {
          token = "";
        }
      }
      if (!token || seen.has(token)) {
        if (!token) outcome.failed += 1;
        continue;
      }
      seen.add(token);
      const result = await revokeAppleToken(
        token,
        candidate.hints,
        dependencies,
      );
      outcome.attempted += result.attempted;
      if (result.succeeded) outcome.succeeded += 1;
      else outcome.failed += 1;
    }
  }

  return outcome;
}

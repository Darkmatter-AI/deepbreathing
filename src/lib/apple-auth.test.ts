import { describe, expect, it, vi } from "vitest";
import {
  createAppleNativeTokenExchangePlugin,
  exchangeAppleAuthorizationCode,
  revokeAppleTokensBeforeDelete,
  type AppleFetch,
} from "./apple-auth";

function jwtFor(sub: string, aud = "com.deepbreathing.app") {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode({ sub, aud })}.signature`;
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function socialRequest(body: Record<string, unknown>) {
  return new Request("https://origin.example.com/api/auth/sign-in/social", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": "2" },
    body: JSON.stringify(body),
  });
}

function exchangeDependencies(fetchImpl: AppleFetch) {
  return {
    nativeClientId: "com.deepbreathing.app",
    hasSigningCredentials: true,
    generateClientSecret: vi.fn(async (clientId: string) => `test-secret:${clientId}`),
    fetchImpl,
  };
}

describe("native Apple authorization-code exchange", () => {
  it("exchanges the code and rewrites Better Auth's persisted access token", async () => {
    const identityToken = jwtFor("apple-user");
    const fetchImpl = vi.fn<AppleFetch>(async (input, init) => {
      expect(input).toBe("https://appleid.apple.com/auth/token");
      const form = new URLSearchParams(String(init?.body));
      expect(form.get("client_id")).toBe("com.deepbreathing.app");
      expect(form.get("code")).toBe("one-time-code");
      expect(form.get("grant_type")).toBe("authorization_code");
      expect(form.get("client_secret")).toBe("test-secret:com.deepbreathing.app");
      return jsonResponse({
        access_token: "short-lived-access",
        refresh_token: "long-lived-refresh",
        expires_in: 3600,
        id_token: identityToken,
      });
    });
    const plugin = createAppleNativeTokenExchangePlugin(
      exchangeDependencies(fetchImpl),
    );

    const result = await plugin.onRequest(
      socialRequest({
        provider: "apple",
        idToken: { token: identityToken },
        additionalData: { authorizationCode: "one-time-code" },
      }),
    );

    expect(result?.response).toBeUndefined();
    expect(result?.request).toBeInstanceOf(Request);
    const rewritten = await result!.request!.json();
    expect(rewritten.idToken.accessToken).toBe("long-lived-refresh");
    expect(rewritten.idToken.expiresAt).toBeUndefined();
    expect(rewritten.additionalData).toBeUndefined();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("rejects a direct Apple id-token request when the authorization code is missing", async () => {
    const fetchImpl = vi.fn<AppleFetch>(async () => jsonResponse({}));
    const plugin = createAppleNativeTokenExchangePlugin(
      exchangeDependencies(fetchImpl),
    );

    const result = await plugin.onRequest(
      socialRequest({
        provider: "apple",
        idToken: { token: jwtFor("apple-user") },
      }),
    );

    expect(result?.response?.status).toBe(401);
    expect(result?.request).toBeUndefined();
    expect(fetchImpl).not.toHaveBeenCalled();
    await expect(
      exchangeAppleAuthorizationCode(
        "   ",
        jwtFor("apple-user"),
        exchangeDependencies(fetchImpl),
      ),
    ).rejects.toThrow("authorization code is required");
  });

  it("passes browser Apple OAuth and Google requests through untouched", async () => {
    const fetchImpl = vi.fn<AppleFetch>(async () => jsonResponse({}));
    const plugin = createAppleNativeTokenExchangePlugin(
      exchangeDependencies(fetchImpl),
    );

    const webResult = await plugin.onRequest(
      socialRequest({ provider: "apple", callbackURL: "/auth/callback" }),
    );
    const googleResult = await plugin.onRequest(
      socialRequest({
        provider: "google",
        idToken: { token: jwtFor("google-user") },
        additionalData: { authorizationCode: "not-an-Apple-code" },
      }),
    );

    expect(webResult).toBeUndefined();
    expect(googleResult).toBeUndefined();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns an error instead of creating an account when Apple's exchange fails", async () => {
    const fetchImpl = vi.fn<AppleFetch>(async () =>
      jsonResponse({ error: "invalid_grant" }, 400),
    );
    const plugin = createAppleNativeTokenExchangePlugin(
      exchangeDependencies(fetchImpl),
    );

    const result = await plugin.onRequest(
      socialRequest({
        provider: "apple",
        idToken: { token: jwtFor("apple-user") },
        additionalData: { authorizationCode: "expired-code" },
      }),
    );

    expect(result?.response?.status).toBe(401);
    expect(result?.request).toBeUndefined();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("rejects a response that has only a short-lived access token", async () => {
    const fetchImpl = vi.fn<AppleFetch>(async () =>
      jsonResponse({
        access_token: "short-lived-access",
        id_token: jwtFor("apple-user"),
      }),
    );
    const plugin = createAppleNativeTokenExchangePlugin(
      exchangeDependencies(fetchImpl),
    );

    const result = await plugin.onRequest(
      socialRequest({
        provider: "apple",
        idToken: { token: jwtFor("apple-user") },
        additionalData: { authorizationCode: "code-without-refresh-token" },
      }),
    );

    expect(result?.response?.status).toBe(401);
    expect(result?.request).toBeUndefined();
  });

  it("rejects an exchange response bound to a different Apple subject", async () => {
    const fetchImpl = vi.fn<AppleFetch>(async () =>
      jsonResponse({
        refresh_token: "wrong-user-refresh",
        id_token: jwtFor("different-apple-user"),
      }),
    );
    const plugin = createAppleNativeTokenExchangePlugin(
      exchangeDependencies(fetchImpl),
    );

    const result = await plugin.onRequest(
      socialRequest({
        provider: "apple",
        idToken: { token: jwtFor("apple-user") },
        additionalData: { authorizationCode: "code-for-other-user" },
      }),
    );

    expect(result?.response?.status).toBe(401);
    expect(result?.request).toBeUndefined();
  });
});

describe("Apple token revocation before account deletion", () => {
  it("uses refresh-token hints first, then falls back to access-token hints", async () => {
    const calls: Array<{ token: string; hint: string; clientId: string }> = [];
    const fetchImpl = vi.fn<AppleFetch>(async (_input, init) => {
      const form = new URLSearchParams(String(init?.body));
      const call = {
        token: form.get("token")!,
        hint: form.get("token_type_hint")!,
        clientId: form.get("client_id")!,
      };
      calls.push(call);
      const succeeds =
        (call.token === "web-refresh" && call.clientId === "web-client") ||
        (call.token === "native-refresh" &&
          call.hint === "access_token" &&
          call.clientId === "native-client");
      return jsonResponse({}, succeeds ? 200 : 400);
    });
    let queryArgs: { sql: string; params: readonly unknown[] } | undefined;
    const result = await revokeAppleTokensBeforeDelete("user-1", {
      query: async (sql, params) => {
        queryArgs = { sql, params };
        return {
          rows: [
            { refresh_token: "web-refresh", access_token: "native-refresh" },
          ],
        };
      },
      clientIds: ["web-client", "native-client"],
      generateClientSecret: async (clientId) => `test-secret:${clientId}`,
      fetchImpl,
    });

    expect(queryArgs?.params).toEqual(["user-1"]);
    expect(queryArgs?.sql).toContain('"accessToken" AS access_token');
    expect(queryArgs?.sql).toContain('"refreshToken" AS refresh_token');
    expect(queryArgs?.sql).toContain('"providerId" = \'apple\'');
    expect(calls).toEqual([
      { token: "web-refresh", hint: "refresh_token", clientId: "web-client" },
      { token: "native-refresh", hint: "refresh_token", clientId: "web-client" },
      { token: "native-refresh", hint: "refresh_token", clientId: "native-client" },
      { token: "native-refresh", hint: "access_token", clientId: "web-client" },
      { token: "native-refresh", hint: "access_token", clientId: "native-client" },
    ]);
    expect(result).toEqual({ attempted: 5, succeeded: 2, failed: 0 });
  });

  it("does not block deletion when Apple or the token query fails", async () => {
    const fetchImpl = vi.fn<AppleFetch>(async () => {
      throw new Error("Apple unavailable");
    });
    const result = await revokeAppleTokensBeforeDelete("user-1", {
      query: async () => ({
        rows: [{ refresh_token: "refresh", access_token: "access" }],
      }),
      clientIds: ["web-client"],
      generateClientSecret: async () => "test-secret",
      fetchImpl,
    });

    expect(result).toEqual({ attempted: 3, succeeded: 0, failed: 2 });

    await expect(
      revokeAppleTokensBeforeDelete("user-1", {
        query: async () => {
          throw new Error("database unavailable");
        },
        clientIds: ["web-client"],
        generateClientSecret: async () => "test-secret",
        fetchImpl,
      }),
    ).resolves.toEqual({ attempted: 0, succeeded: 0, failed: 1 });
  });
});

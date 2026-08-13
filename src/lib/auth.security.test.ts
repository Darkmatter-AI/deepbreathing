import { afterEach, describe, expect, it, vi } from "vitest";
import { symmetricEncrypt } from "better-auth/crypto";
import { decryptStoredOAuthToken } from "./auth";

const secret = "auth-token-encryption-test-secret-32-chars";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Better Auth OAuth token encryption compatibility", () => {
  it("keeps existing plaintext provider tokens readable", async () => {
    vi.stubEnv("BETTER_AUTH_SECRET", secret);

    await expect(decryptStoredOAuthToken("existing-refresh-token")).resolves.toBe(
      "existing-refresh-token",
    );
  });

  it("decrypts tokens encrypted with the current non-versioned secret", async () => {
    vi.stubEnv("BETTER_AUTH_SECRET", secret);

    const encrypted = await symmetricEncrypt({
      key: secret,
      data: "apple-refresh-token",
    });

    expect(encrypted).toMatch(/^[0-9a-f]+$/);
    await expect(decryptStoredOAuthToken(encrypted)).resolves.toBe(
      "apple-refresh-token",
    );
  });

  it("decrypts newly encrypted tokens with versioned Better Auth secrets", async () => {
    vi.stubEnv("BETTER_AUTH_SECRET", secret);
    vi.stubEnv("BETTER_AUTH_SECRETS", `7:${secret}`);

    const encrypted = await symmetricEncrypt({
      key: {
        keys: new Map([[7, secret]]),
        currentVersion: 7,
      },
      data: "apple-refresh-token",
    });

    expect(encrypted).toMatch(/^\$ba\$7\$/);
    await expect(decryptStoredOAuthToken(encrypted)).resolves.toBe(
      "apple-refresh-token",
    );
  });

  it("fails closed for encrypted rows whose key is unavailable", async () => {
    vi.stubEnv("BETTER_AUTH_SECRET", secret);

    await expect(
      decryptStoredOAuthToken("$ba$99$not-a-valid-ciphertext"),
    ).resolves.toBeNull();
  });
});

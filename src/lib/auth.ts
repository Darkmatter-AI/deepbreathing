import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { expo } from "@better-auth/expo";
// nextCookies removed - causes 500 when behind Cloudflare proxy
import { Pool } from "pg";
import { Resend } from "resend";
import { importPKCS8, SignJWT } from "jose";
import {
  symmetricDecrypt,
  type SecretConfig,
} from "better-auth/crypto";
import {
  createAppleNativeTokenExchangePlugin,
  revokeAppleTokensBeforeDelete,
  type AppleAccountTokenRow,
} from "./apple-auth";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Expo's auth client asks Better Auth to proxy the provider authorization URL
 * through this route so that the native browser session can receive the auth
 * cookies. Better Auth 1.5.5 does not validate the `authorizationURL` query
 * parameter before redirecting, so keep the destination allowlist here at the
 * application boundary. These are the exact authorization endpoints emitted
 * by the providers configured below.
 */
const EXPO_AUTHORIZATION_ENDPOINTS = new Map([
  ["https://accounts.google.com", "/o/oauth2/v2/auth"],
  ["https://appleid.apple.com", "/auth/authorize"],
]);

export function parseAllowedExpoAuthorizationURL(
  value: string | null | undefined,
): URL | null {
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const expectedPath = EXPO_AUTHORIZATION_ENDPOINTS.get(url.origin);
  if (
    !expectedPath ||
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    url.pathname !== expectedPath ||
    url.hash ||
    !url.searchParams.get("state")
  ) {
    return null;
  }

  return url;
}

function oauthTokenDecryptionKey(): string | SecretConfig | null {
  const encodedSecrets = process.env.BETTER_AUTH_SECRETS?.trim();
  if (!encodedSecrets) return process.env.BETTER_AUTH_SECRET || null;

  const entries = encodedSecrets.split(",").map((entry) => {
    const separator = entry.indexOf(":");
    if (separator <= 0) throw new Error("Invalid Better Auth secret version");
    const version = Number(entry.slice(0, separator));
    const value = entry.slice(separator + 1).trim();
    if (!Number.isInteger(version) || version < 0 || !value) {
      throw new Error("Invalid Better Auth secret version");
    }
    return { version, value };
  });
  if (entries.length === 0) return null;

  const keys = new Map<number, string>();
  for (const entry of entries) {
    if (keys.has(entry.version)) {
      throw new Error("Duplicate Better Auth secret version");
    }
    keys.set(entry.version, entry.value);
  }

  return {
    keys,
    currentVersion: entries[0].version,
    legacySecret: process.env.BETTER_AUTH_SECRET || undefined,
  };
}

function looksLikeEncryptedOAuthToken(value: string): boolean {
  return (
    value.startsWith("$ba$") ||
    (value.length % 2 === 0 && /^[0-9a-f]+$/i.test(value))
  );
}

/**
 * Better Auth 1.5.5 leaves existing plaintext OAuth tokens readable when
 * `account.encryptOAuthTokens` is enabled, while encrypting all new writes.
 * Deletion revocation reads the account row directly, so decrypt encrypted
 * rows here before sending them to Apple. A malformed/retired key fails closed
 * for revocation (the account deletion itself remains available).
 */
export async function decryptStoredOAuthToken(
  token: string,
): Promise<string | null> {
  if (!looksLikeEncryptedOAuthToken(token)) return token;

  let key: string | SecretConfig | null;
  try {
    key = oauthTokenDecryptionKey();
  } catch {
    return null;
  }
  if (!key) return null;

  try {
    return await symmetricDecrypt({ key, data: token });
  } catch {
    return null;
  }
}

async function isSuppressed(email: string): Promise<boolean> {
  const { rows } = await pool.query(
    "SELECT 1 FROM email_suppressions WHERE email = $1",
    [email.toLowerCase()]
  );
  return rows.length > 0;
}

const appleCredentials = {
  clientId: process.env.APPLE_CLIENT_ID,
  teamId: process.env.APPLE_TEAM_ID,
  keyId: process.env.APPLE_KEY_ID,
  privateKey: process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

const hasAppleCredentials = Object.values(appleCredentials).every(Boolean);
const appleNativeClientId =
  process.env.APPLE_APP_BUNDLE_IDENTIFIER ?? "com.deepbreathing.app";
const hasAppleSigningCredentials = [
  appleCredentials.teamId,
  appleCredentials.keyId,
  appleCredentials.privateKey,
].every(Boolean);

async function generateAppleClientSecret(clientId = appleCredentials.clientId) {
  const { teamId, keyId, privateKey } = appleCredentials;
  if (!clientId || !teamId || !keyId || !privateKey) {
    throw new Error("Apple sign-in credentials are incomplete");
  }

  const key = await importPKCS8(privateKey, "ES256");
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setSubject(clientId)
    .setAudience("https://appleid.apple.com")
    .setIssuedAt(now)
    .setExpirationTime(now + 180 * 24 * 60 * 60)
    .sign(key);
}

const appleNativeTokenExchangePlugin = createAppleNativeTokenExchangePlugin({
  nativeClientId: appleNativeClientId,
  hasSigningCredentials: hasAppleSigningCredentials,
  generateClientSecret: (clientId) => generateAppleClientSecret(clientId),
});

function isTrustedNativeRequest(request?: Request): boolean {
  const expoOrigin = request?.headers.get("expo-origin");
  if (!expoOrigin) return false;
  try {
    const parsed = new URL(expoOrigin);
    return (
      parsed.protocol === "deepbreathing:" &&
      parsed.hostname === "" &&
      (parsed.pathname === "" || parsed.pathname === "/")
    );
  } catch {
    return expoOrigin === "deepbreathing://";
  }
}

function accountDeletionEmailURL(
  url: string,
  token: string,
  request?: Request,
): string {
  if (!isTrustedNativeRequest(request)) return url;
  return `deepbreathing:///?accountDeletionToken=${encodeURIComponent(token)}`;
}

function escapeEmailHTML(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
}

function createAuth() {
  return betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    basePath: "/api/auth",
    trustedOrigins: [
      "https://deepbreathingexercises.com",
      "https://origin.deepbreathingexercises.com",
      "https://appleid.apple.com",
      "deepbreathing://",
      ...(process.env.NODE_ENV === "development" ? ["exp://"] : []),
    ],
    database: new Pool({
      connectionString: process.env.DATABASE_URL,
    }),
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        prompt: "select_account",
      },
      ...(hasAppleCredentials
        ? {
            apple: async () => ({
              clientId: appleCredentials.clientId!,
              clientSecret: await generateAppleClientSecret(),
              appBundleIdentifier:
                process.env.APPLE_APP_BUNDLE_IDENTIFIER ?? "com.deepbreathing.app",
            }),
          }
        : {}),
    },
    user: {
      deleteUser: {
        enabled: true,
        sendDeleteAccountVerification: async ({ user, url, token }, request) => {
          const confirmationURL = escapeEmailHTML(
            accountDeletionEmailURL(url, token, request),
          );
          const result = await getResend().emails.send({
            from: "Deep Breathing Exercises <noreply@deepbreathingexercises.com>",
            to: user.email,
            subject: "Confirm account deletion",
            html: `<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px; color: #333;">
  <p style="font-size: 16px; line-height: 1.7;">Use this link to permanently delete your Deep Breathing Exercises account and synced practice data:</p>
  <a href="${confirmationURL}" style="display: inline-block; background: #7a2f24; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 12px 0;">Delete my account</a>
  <p style="font-size: 13px; color: #777; margin-top: 20px;">If you used Sign in with Apple, you can also remove Deep Breathing Exercises from your Apple ID settings after deletion.</p>
  <p style="font-size: 13px; color: #777; margin-top: 20px;">If you did not request this, ignore this email and your account will remain intact.</p>
</div>`,
          });
          if (result.error) {
            throw new Error("Failed to send account deletion verification email");
          }
        },
        beforeDelete: async (user) => {
          const revokeResult = await revokeAppleTokensBeforeDelete(user.id, {
            query: (sql, params) =>
              pool.query<AppleAccountTokenRow>(sql, [...params]),
            clientIds: [appleCredentials.clientId, appleNativeClientId].filter(
              (value): value is string => Boolean(value),
            ),
            generateClientSecret: (clientId) =>
              generateAppleClientSecret(clientId),
            decryptToken: decryptStoredOAuthToken,
          });
          if (revokeResult.failed > 0) {
            console.warn("[apple-revocation] deletion cleanup incomplete", {
              attempted: revokeResult.attempted,
              succeeded: revokeResult.succeeded,
              failed: revokeResult.failed,
            });
          }
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24, // refresh once per day
      cookieCache: {
        enabled: true,
        maxAge: 300, // 5 min client-side cache
      },
    },
    account: {
      // Better Auth encrypts access, refresh, and ID tokens on new writes.
      // Existing plaintext rows remain readable, so this does not require a
      // destructive data migration or an all-at-once token rewrite.
      encryptOAuthTokens: true,
    },
    advanced: {
      crossSubDomainCookies: {
        enabled: true,
        domain: ".deepbreathingexercises.com",
      },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            try {
              if (await isSuppressed(user.email)) return;
              await getResend().emails.send({
                from: "Abi from Deep Breathing Exercises <abi@deepbreathingexercises.com>",
                to: user.email,
                subject: "Welcome, glad you're here",
                // deepbreathingexercises.com has no MX record, so replies to
                // abi@ there are undeliverable. Point at a mailbox that receives.
                replyTo: "hi@abiassi.com",
                html: `<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; color: #333;">
  <p style="font-size: 16px; line-height: 1.7;">Hey${user.name ? ` ${user.name.split(" ")[0]}` : ""},</p>
  <p style="font-size: 16px; line-height: 1.7;">Abi here. I made this breathing app a while back because I was dealing with anxiety and needed something simple that actually worked. Somehow it turned into a thing that thousands of people use every month, which still kind of blows my mind.</p>
  <p style="font-size: 16px; line-height: 1.7;">Anyway, your stuff is saved now. Settings, progress, all of it syncs if you use it on another device.</p>
  <p style="font-size: 16px; line-height: 1.7;">One thing I'd genuinely love to know: <strong>is there something you wish this app did that it doesn't?</strong> Hit reply, it goes straight to me.</p>
  <p style="font-size: 16px; line-height: 1.7;">Thanks for being here,<br/>Abi</p>
</div>`,
              });
            } catch (err) {
              // don't block signup if welcome email fails, but leave a trace —
              // a silent catch here hid a broken reply path for months
              console.error("[welcome-email] send failed", err);
            }
          },
        },
      },
    },
    plugins: [
      expo(),
      appleNativeTokenExchangePlugin,
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          if (await isSuppressed(email)) return;
          await getResend().emails.send({
            from: "Deep Breathing Exercises <noreply@deepbreathingexercises.com>",
            to: email,
            subject: "Your sign-in link",
            html: `<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px; color: #333;">
  <p style="font-size: 16px; line-height: 1.7;">Here's your link to sign in:</p>
  <a href="${url}" style="display: inline-block; background: hsl(18, 90%, 60%); color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 12px 0;">Sign in to Deep Breathing Exercises</a>
  <p style="font-size: 13px; color: #999; margin-top: 20px;">This link expires in 5 minutes. If you didn't request it, just ignore this.</p>
</div>`,
          });
        },
        expiresIn: 300,
      }),
    ],
  });
}

/** Derived from createAuth, not betterAuth, to keep the concrete plugin/option types. */
type Auth = ReturnType<typeof createAuth>;

let authInstance: Auth | null = null;

/**
 * Lazily constructed, so merely importing this module never calls betterAuth().
 *
 * betterAuth() throws when BETTER_AUTH_SECRET is absent, and
 * src/app/(site-en)/stats/stats-page.tsx imports `auth` at module scope. Next's
 * static render of /stats therefore evaluated this file at build time, crashing
 * every deployment without the secret -- i.e. every preview branch not explicitly
 * allowlisted in Vercel. Deferring construction keeps the build independent of
 * runtime auth config. Same reason getResend() above is a function.
 *
 * Exposed as a Proxy so the 8 existing `import { auth }` call sites are unchanged.
 */
export const auth: Auth = new Proxy({} as Auth, {
  get(_target, prop) {
    authInstance ??= createAuth();
    const value = (authInstance as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(authInstance) : value;
  },
  has(_target, prop) {
    authInstance ??= createAuth();
    return prop in (authInstance as object);
  },
});

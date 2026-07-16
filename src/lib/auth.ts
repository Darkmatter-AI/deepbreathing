import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { expo } from "@better-auth/expo";
// nextCookies removed - causes 500 when behind Cloudflare proxy
import { Pool } from "pg";
import { Resend } from "resend";
import { importPKCS8, SignJWT } from "jose";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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

async function generateAppleClientSecret() {
  const { clientId, teamId, keyId, privateKey } = appleCredentials;
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

export const auth = betterAuth({
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
      sendDeleteAccountVerification: async ({ user, url }) => {
        if (await isSuppressed(user.email)) return;
        await getResend().emails.send({
          from: "Deep Breathing Exercises <noreply@deepbreathingexercises.com>",
          to: user.email,
          subject: "Confirm account deletion",
          html: `<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px; color: #333;">
  <p style="font-size: 16px; line-height: 1.7;">Use this link to permanently delete your Deep Breathing Exercises account and synced practice data:</p>
  <a href="${url}" style="display: inline-block; background: #7a2f24; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 12px 0;">Delete my account</a>
  <p style="font-size: 13px; color: #777; margin-top: 20px;">If you did not request this, ignore this email and your account will remain intact.</p>
</div>`,
        });
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
              replyTo: "abi@deepbreathingexercises.com",
              html: `<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; color: #333;">
  <p style="font-size: 16px; line-height: 1.7;">Hey${user.name ? ` ${user.name.split(" ")[0]}` : ""},</p>
  <p style="font-size: 16px; line-height: 1.7;">Abi here. I made this breathing app a while back because I was dealing with anxiety and needed something simple that actually worked. Somehow it turned into a thing that thousands of people use every month, which still kind of blows my mind.</p>
  <p style="font-size: 16px; line-height: 1.7;">Anyway, your stuff is saved now. Settings, progress, all of it syncs if you use it on another device.</p>
  <p style="font-size: 16px; line-height: 1.7;">One thing I'd genuinely love to know: <strong>is there something you wish this app did that it doesn't?</strong> Hit reply, it goes straight to me.</p>
  <p style="font-size: 16px; line-height: 1.7;">Thanks for being here,<br/>Abi</p>
</div>`,
            });
          } catch {
            // don't block signup if welcome email fails
          }
        },
      },
    },
  },
  plugins: [
    expo(),
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

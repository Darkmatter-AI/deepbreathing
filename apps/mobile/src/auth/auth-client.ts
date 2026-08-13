import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

export const AUTH_API_ORIGIN = 'https://origin.deepbreathingexercises.com';

// @better-auth/expo 1.6.27's generated declaration omits the optional third
// `options` parameter from getActions. TypeScript 6 rejects that declaration
// when it is assigned to Better Auth's current client-plugin contract even
// though the runtime plugin is compatible (and does not use the parameter).
export const authClient = createAuthClient({
  baseURL: AUTH_API_ORIGIN,
  plugins: [
    // @ts-expect-error Expo's generated plugin type is compatible at runtime;
    // its two-argument getActions declaration is narrower than Better Auth's
    // three-argument client-plugin contract under TypeScript 6.
    expoClient({
      scheme: 'deepbreathing',
      storagePrefix: 'deepbreathing',
      storage: SecureStore,
    }),
  ],
});

export const { signOut, useSession } = authClient;

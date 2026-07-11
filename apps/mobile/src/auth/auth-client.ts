import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

export const AUTH_API_ORIGIN = 'https://origin.deepbreathingexercises.com';

export const authClient = createAuthClient({
  baseURL: AUTH_API_ORIGIN,
  plugins: [
    expoClient({
      scheme: 'deepbreathing',
      storagePrefix: 'deepbreathing',
      storage: SecureStore,
    }),
  ],
});

export const { signOut, useSession } = authClient;

# Deep Breathing mobile app

This is the Expo SDK 56 mobile app for Deep Breathing. It is a member of the repository's pnpm
workspace; dependencies are installed from the root `pnpm-lock.yaml`. The mobile app is not a
standalone npm project and its old generated `package-lock.json` instructions are stale.

## Get started

1. From the repository root, install the locked workspace dependencies

   ```bash
   pnpm install --frozen-lockfile
   ```

2. Start the mobile app

   ```bash
   pnpm --filter mobile start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside `src/app`. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Local checks

Run these from the repository root so workspace links resolve correctly:

```bash
pnpm --filter mobile test
pnpm --filter mobile exec tsc --noEmit
pnpm --filter mobile lint
pnpm --dir apps/mobile dlx expo-doctor@1.20.1
```

The iOS release workflow runs the same checks with pinned Node/pnpm versions. EAS production
builds additionally require a clean Git commit; see `apps/mobile/eas.json` and the App Store
Build 18 checklist.

### Other setup steps

- For linting, run `pnpm --filter mobile lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- Unit tests run with Vitest via `pnpm --filter mobile test`.
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

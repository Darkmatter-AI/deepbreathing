import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

test("native auth actions present Apple before Google", () => {
  const file = path.join(ROOT, "apps/mobile/src/auth/AuthActions.tsx");
  assert.ok(fs.existsSync(file), "missing native auth actions");
  const source = fs.readFileSync(file, "utf8");
  const apple = source.indexOf("AppleAuthenticationButton");
  const google = source.indexOf("Continue with Google");
  assert.ok(apple >= 0, "missing native Apple button");
  assert.ok(google > apple, "Google must be secondary to Apple");
  assert.match(source, /identityToken/);
  assert.match(source, /GOOGLE_G_ICON/);
  assert.doesNotMatch(source, /googleMark/);
});

test("account sheet supports sign out and verified deletion", () => {
  const file = path.join(ROOT, "apps/mobile/src/auth/AccountSheet.tsx");
  assert.ok(fs.existsSync(file), "missing account sheet");
  const source = fs.readFileSync(file, "utf8");
  assert.match(source, /signOut/);
  assert.match(source, /deleteUser/);
  assert.match(source, /Alert\.alert/);
  assert.match(source, /permanently/i);
  assert.match(source, /BottomSheetModal/);
  assert.match(source, /enablePanDownToClose/);
  assert.match(source, /Your breath garden/);
  assert.match(source, /practice\.sessionsCompleted/);
});

test("completion UI branches between guest receipt and registered banner", () => {
  const source = fs.readFileSync(
    path.join(ROOT, "apps/mobile/src/components/CompletionSummary.tsx"),
    "utf8"
  );
  assert.match(source, /isAuthenticated/);
  assert.match(source, /Save your progress\?/);
  assert.match(source, /SESSION COMPLETE/);
  assert.match(source, /sessionMode/);
  assert.doesNotMatch(source, /activityRing/);
  assert.doesNotMatch(source, /Not now/);
  assert.match(source, /PanResponder/);
  assert.doesNotMatch(source, /AUTO_DISMISS_MS/);
});

test("mode drawer is a persistent two-detent sheet that follows the drag", () => {
  const source = fs.readFileSync(
    path.join(ROOT, "apps/mobile/src/components/ModeLibrarySheet.tsx"),
    "utf8"
  );
  assert.match(source, /VISIBLE_ROWS = 4/);
  assert.match(source, /<BottomSheet/);
  assert.match(source, /BottomSheetScrollView/);
  assert.match(source, /snapPoints=\{snapPoints\}/);
  assert.match(source, /index=\{0\}/);
  assert.match(source, /enablePanDownToClose=\{false\}/);
  assert.match(source, /enableContentPanningGesture/);
  assert.match(source, /pressBehavior=\{0\}/);
  assert.match(source, /snapToIndex\(0\)/);
  assert.match(source, /snapToIndex\(1\)/);
  assert.doesNotMatch(source, /BottomSheetModal/);
  assert.doesNotMatch(source, /GestureDetector/);
  assert.doesNotMatch(source, /PanResponder/);
});

test("native overlays follow the in-app light or dark appearance", () => {
  const host = fs.readFileSync(
    path.join(ROOT, "apps/mobile/src/app/index.tsx"),
    "utf8"
  );
  const experience = fs.readFileSync(
    path.join(ROOT, "apps/mobile/src/components/breathing-web/BreathingExperience.tsx"),
    "utf8"
  );

  assert.match(experience, /onEvent\?\.\('theme_change', \{ theme: activeTheme \}\)/);
  assert.match(host, /setExperienceTheme\(params\.theme\)/);
  assert.match(host, /<ModeLibrarySheet[\s\S]*?theme=\{experienceTheme\}/);
  assert.match(host, /<AccountSheet[\s\S]*?theme=\{experienceTheme\}/);
  assert.match(host, /<CompletionSummary[\s\S]*?theme=\{experienceTheme\}/);
});

test("native account sheet exposes the public privacy policy", () => {
  const source = fs.readFileSync(
    path.join(ROOT, "apps/mobile/src/auth/AccountSheet.tsx"),
    "utf8"
  );
  assert.match(source, /https:\/\/deepbreathingexercises\.com\/privacy/);
  assert.match(source, /Linking\.openURL\(PRIVACY_POLICY_URL\)/);
  assert.match(source, /accessibilityRole="link"/);
  assert.match(source, />Privacy Policy<\/Text>/);
});

test("native status bar follows the light loader and in-app theme", () => {
  const source = fs.readFileSync(
    path.join(ROOT, "apps/mobile/src/app/index.tsx"),
    "utf8"
  );
  assert.match(source, /import \{ StatusBar \} from 'expo-status-bar'/);
  assert.match(source, /!experienceReady \|\| experienceTheme === 'light'/);
  assert.match(source, /<StatusBar style=\{statusBarStyle\} animated \/>/);
});

test("native shell owns silent-mode audio, phase cues, edge glow, and account portrait", () => {
  const host = fs.readFileSync(path.join(ROOT, "apps/mobile/src/app/index.tsx"), "utf8");
  const experience = fs.readFileSync(
    path.join(ROOT, "apps/mobile/src/components/breathing-web/BreathingExperience.tsx"),
    "utf8"
  );
  // Audio unification phase 2 (8e71353) deleted use-background-audio.ts and the
  // useNativePhaseAudio hook; the soundscape now runs through native-soundscape.ts
  // via useNativeSoundscape, and playsInSilentMode moved to the breathe-web host.
  const background = fs.readFileSync(
    path.join(ROOT, "apps/mobile/src/breathing/native-soundscape.ts"),
    "utf8"
  );
  const breatheWeb = fs.readFileSync(
    path.join(ROOT, "apps/mobile/src/app/breathe-web.tsx"),
    "utf8"
  );
  assert.match(breatheWeb, /playsInSilentMode: true/);
  assert.match(host, /useNativeSoundscape/);
  assert.match(host, /edgeGlowOpacity/);
  assert.match(host, /accountAvatarUri\(authSession\.user\)/);
  // Same gate, restated for the event-driven engine: audio_state carries
  // {active, muted} and both must be honoured before the recipe runs.
  assert.match(background, /const active = params\.active === true;/);
  assert.match(background, /const muted = params\.muted === true;/);
  assert.match(background, /engine\.toggleMute\(muted\);/);
  assert.match(experience, /if \(!isNativeApp\) getAudioService\(\)\.playCue/);
  assert.match(experience, /soundHintMounted && !isNativeApp/);
  // The header is no longer unmounted while running — it stays mounted and
  // animates out, so assert the hide mechanism rather than the old conditional.
  assert.match(
    experience,
    /isRunning \? 'pointer-events-none -translate-y-2 opacity-0' : 'translate-y-0 opacity-100'/,
    "header must hide (and stop taking taps) while a session is running"
  );
  assert.doesNotMatch(experience, /Turtle/);
  assert.doesNotMatch(experience, /Rabbit/);
});

test("native timed completion uses one quiet bloom after teardown", () => {
  const audio = fs.readFileSync(
    path.join(ROOT, "packages/audio/src/audioService.ts"),
    "utf8"
  );
  const background = fs.readFileSync(
    path.join(ROOT, "apps/mobile/src/breathing/native-soundscape.ts"),
    "utf8"
  );
  const host = fs.readFileSync(path.join(ROOT, "apps/mobile/src/app/index.tsx"), "utf8");

  assert.match(audio, /public playCompletionCue\(/);
  assert.match(audio, /COMPLETION_CUE_DURATION_SECONDS = 0\.78/);
  assert.match(audio, /const fifthHz = rootHz \* 1\.5/);
  assert.match(audio, /osc\.type = 'sine'/);
  assert.match(audio, /if \(this\.isMuted \|\| !this\.ctx \|\| !this\.masterGain\)/);
  assert.match(background, /onSessionComplete\(\)/);
  assert.match(background, /pendingCompletionRef/);
  assert.match(background, /playCompletionCueForGeneration\(\s*pendingCompletion\.generation/);
  assert.match(host, /onSessionComplete\(\);/);
});

test("registered completion banner clears when account controls become the next action", () => {
  const source = fs.readFileSync(
    path.join(ROOT, "apps/mobile/src/app/index.tsx"),
    "utf8"
  );
  assert.match(
    source,
    /const handleOpenAccount = useCallback\(\(\) => \{[\s\S]*?authSession\?\.user\.id[\s\S]*?setSummaryData\(null\)[\s\S]*?setAccountOpen\(true\)/
  );
  assert.match(source, /onPress=\{handleOpenAccount\}/);
});

test("old DOM callbacks stay gated until an idle owner remount commits", () => {
  const source = fs.readFileSync(path.join(ROOT, "apps/mobile/src/app/index.tsx"), "utf8");
  assert.match(source, /Auth can change while the current breathing session is still running\./);
  assert.match(source, /owner preparation, bootstrap, and DOM/);
  assert.match(source, /if \(!eventOwnerGenerationAccepted && !ownerTransitionPending\) return;/);
  assert.match(source, /await enqueueSessionEvent\(event, eventOwner \?\? undefined\);/);
  assert.match(source, /if \(transitionToken !== ownerTransitionTokenRef\.current \|\| isSessionRunningRef\.current\) return;/);
  assert.match(source, /hydratedUserIdRef\.current = userId;/);
  assert.match(source, /setSnapshotVersion\(\(version\) => version \+ 1\);/);
  assert.match(source, /isCommittedOwnerForAuth\(authSession\.user\.id\)/);
  assert.match(source, /if \(userId && ownerReady\)/);
});

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

test("mode drawer uses a four-row gesture sheet with tap-away dismissal", () => {
  const source = fs.readFileSync(
    path.join(ROOT, "apps/mobile/src/components/ModeLibrarySheet.tsx"),
    "utf8"
  );
  assert.match(source, /VISIBLE_ROWS = 4/);
  assert.match(source, /BottomSheetScrollView/);
  assert.match(source, /enablePanDownToClose/);
  assert.match(source, /enableContentPanningGesture/);
  assert.match(source, /pressBehavior="close"/);
  assert.doesNotMatch(source, /PanResponder/);
});

test("native shell owns silent-mode audio, phase cues, edge glow, and account portrait", () => {
  const host = fs.readFileSync(path.join(ROOT, "apps/mobile/src/app/index.tsx"), "utf8");
  const experience = fs.readFileSync(
    path.join(ROOT, "apps/mobile/src/components/breathing-web/BreathingExperience.tsx"),
    "utf8"
  );
  const background = fs.readFileSync(
    path.join(ROOT, "apps/mobile/src/breathing/use-background-audio.ts"),
    "utf8"
  );
  assert.match(host, /playsInSilentMode: true/);
  assert.match(host, /useNativePhaseAudio/);
  assert.match(host, /edgeGlowOpacity/);
  assert.match(host, /accountAvatarUri\(authSession\.user\)/);
  assert.match(background, /audioState\.active && !audioState\.muted/);
  assert.match(experience, /if \(!isNativeApp\) getAudioService\(\)\.playCue/);
  assert.match(experience, /soundHintMounted && !isNativeApp/);
  assert.doesNotMatch(experience, /Turtle/);
  assert.doesNotMatch(experience, /Rabbit/);
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

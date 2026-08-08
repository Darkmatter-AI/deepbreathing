import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Regression contracts for the breathing experience — DESKTOP (src/components/resonance)
// and MOBILE (apps/mobile/src/components/breathing-web). These pin the behaviors we
// shipped: single speed measure, wall-clock session clock, speed affects the animation
// (not the clock), interactive particles that never pile up, the sharp play triangle,
// and the drag/ring-follow mechanics. Each test reads the SOURCE and asserts an
// invariant, so a future refactor that silently breaks behavior fails `pnpm test`.

const ROOT = process.cwd();
const MOBILE = path.join(ROOT, "apps/mobile/src/components/breathing-web");
const DESKTOP = path.join(ROOT, "src/components/resonance");

const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

// Shared pacing source — single source of truth for the slider mapping and
// phase-duration math (used by both mobile and desktop).
const sharedPacing = read("packages/domain/src/pacing.ts");

// ---------------------------------------------------------------------------
// MOBILE — breathing-web (the iOS app's web-parity experience)
// ---------------------------------------------------------------------------

const exp = read("apps/mobile/src/components/breathing-web/BreathingExperience.tsx");
const pb = read("apps/mobile/src/components/breathing-web/components/ParticleBackground.tsx");
const viz = read("apps/mobile/src/components/breathing-web/components/Visualizer.tsx");
const pacing = read("apps/mobile/src/components/breathing-web/pacing.ts");

test("mobile: speed slider — LEFT = slower, RIGHT = faster, default centered", () => {
  // The pacing contract now lives in the shared domain package.
  assert.match(sharedPacing, /multiplierToSlider = /);
  assert.match(sharedPacing, /sliderToMultiplier = /);
  assert.match(sharedPacing, /SLIDER_MID = 1\.25/, "centered default position value");
  // left end -> slowest (2x multiplier), right end -> fastest (0.5x)
  assert.match(sharedPacing, /return m >= 1 \? 2 - 0\.75 \* m : 2\.75 - 1\.5 \* m;/, "left=slow, right=fast map");
  assert.match(sharedPacing, /speedOf = \(multiplier: number\): number => 1 \/ multiplier/, "label reads as speed");
  // Mobile pacing.ts is a thin re-export from the shared source.
  assert.match(pacing, /from '@resonance\/domain'/, "mobile pacing re-exports from domain");
  // the slider input uses the mapping and a 0.05 step so the default centers
  assert.match(exp, /const sliderValue = multiplierToSlider\(value\);/);
  assert.match(exp, /value=\{sliderValue\}/);
  assert.match(resonance, /onChange=\{\(e\) => setSpeedMultiplier\(sliderToMultiplier\(parseFloat\(e\.target\.value\)\)\)/);
  assert.match(exp, /step=\{String\(SLIDER_STEP\)\}/);
});

test("mobile: ONE speed measure — no per-phase sliders, no toggle pill", () => {
  // The floating control is a bare slider, always visible during a session.
  assert.match(exp, /const \[speedMultiplier, setSpeedMultiplier\] = useState/);
  assert.doesNotMatch(exp, /paceOpen/, "pace toggle state must not return");
  assert.doesNotMatch(exp, /Adjust breath pace/, "toggle pill button must not return");
  assert.match(exp, /\(isRunning \|\| sessionId !== null\) &&/, "bare slider is visible while a session exists");
  assert.match(exp, /<PaceSlider\n\s+value=\{speedMultiplier\}/, "pace panel/slider binds the single measure");
  assert.match(exp, /minimal/, "bare (label-less) slider mode exists");
});

test("mobile: speed scales every phase duration (animation + cues)", () => {
  // Phase-duration math lives in the shared domain package.
  assert.match(sharedPacing, /phaseDurationMs/);
  assert.match(sharedPacing, /\(pattern\.inhale \* speed\) \* 1000/);
  assert.match(sharedPacing, /\(pattern\.holdIn \* speed\) \* 1000/);
  assert.match(sharedPacing, /\(pattern\.exhale \* speed\) \* 1000/);
  assert.match(sharedPacing, /\(pattern\.holdOut \* speed\) \* 1000/);
  // component uses the helper for the animation loop
  assert.match(exp, /phaseDurationMs\(BreathingPhase\.Inhale, pattern, speedMultiplier\)/);
});

test("mobile: live speed change mid-phase is progress-preserving (no orb jump)", () => {
  // Remap logic lives in the shared domain package.
  assert.match(sharedPacing, /remapPhaseStartMs/);
  assert.match(sharedPacing, /progressFraction = Math\.min\(elapsed \/ prevPhaseDurationMs, 1\)/);
  assert.match(sharedPacing, /nowMs - progressFraction \* newDuration/);
  assert.match(exp, /phaseStartRef\.current = remapPhaseStartMs\(/);
});

test("mobile: session clock is WALL-CLOCK — duration never scales with speed", () => {
  // Timer derives from Date.now(); the auto-stop compares wall seconds and
  // must NOT multiply by speedMultiplier.
  assert.match(exp, /sessionClockStartRef\.current = Date\.now\(\) - \(sessionSeconds \* 1000\)/);
  assert.match(exp, /Math\.floor\(\(Date\.now\(\) - sessionClockStartRef\.current\) \/ 1000\)/);
  assert.match(exp, /sessionSeconds >= selectedDuration/);
  // The stop condition line must not scale by speed:
  const stopLine = exp.split("\n").find((l) => /sessionSeconds >= selectedDuration/.test(l));
  assert.ok(stopLine, "auto-stop condition exists");
  assert.doesNotMatch(stopLine, /speedMultiplier/, "30s stays 30s regardless of pace");
});

test("mobile: particles idle-float — no outward expulsion, no pile, no center rake", () => {
  // Idle = pure float (radial 0), keep-out only near the ball.
  const idleIdx = pb.indexOf("// Idle: pure float");
  assert.ok(idleIdx >= 0, "idle branch documented");
  const idleBlock = pb.slice(idleIdx, idleIdx + 500);
  assert.match(idleBlock, /targetRadialSpeed = 0/, "idle radial must be 0 (float, not expulsion)");
  // One-time settle re-scatter on session end.
  assert.match(pb, /prevPhaseRef\.current !== BreathingPhase\.Idle && currentPhase === BreathingPhase\.Idle/);
  // Orb wake is finger-gated and has NO attraction term (drags must not rake particles into the center).
  assert.match(pb, /pullingBall/);
  assert.doesNotMatch(pb, /ORB_PULL_ACCEL/, "attraction toward the ball must not return");
  assert.match(pb, /orb\.vx \* ORB_WAKE/, "wake-only drag coupling");
});

test("mobile: particle update() signature and call site stay aligned", () => {
  // Regression for the dt/radial/drift argument swap that froze the field.
  const sigIdx = pb.indexOf("update(");
  const sig = pb.slice(sigIdx, sigIdx + 160);
  assert.match(sig, /radialSpeed: number,/, "first param radialSpeed");
  assert.match(sig, /driftSpeed: number,/, "second param driftSpeed");
  assert.match(sig, /deltaTime: number,/, "third param deltaTime");
  assert.match(pb, /p\.update\(smoothedRadialSpeedRef\.current, smoothedDriftSpeedRef\.current, deltaSeconds/,
    "call site passes (radial, drift, deltaSeconds)");
});

test("mobile: play triangle keeps the sharp-desktop geometry with subtle radius", () => {
  assert.match(viz, /points="6 3 20 12 6 21 6 3"/, "raw polygon, immune to lucide bumps");
  assert.match(viz, /strokeLinejoin="round"/, "subtle ~1-unit corner radius");
  assert.doesNotMatch(viz, /from 'lucide-react'[^;]*Play/, "lucide Play import must not return");
});

test("mobile: outer ring follows the ball slowly and returns slower", () => {
  assert.match(exp, /chaseRing/);
  assert.match(exp, /ringTargetRef\.current = \{ x: dx, y: dy \}/, "ring chases the ball while pulled");
  assert.match(exp, /ringTargetRef\.current = \{ x: 0, y: 0 \}/, "ring returns home on release");
  assert.match(exp, /rate = target\.x === 0 && target\.y === 0 \? 2\.2 : 4\.5/, "slower return than follow");
  assert.match(exp, /ringRef=\{ringLayerRef\}/, "ring layer wired into the visualizer");
});

test("mobile: pace slider emits haptic ticks on position change", () => {
  // The PaceSlider onChange wrapper fires 'pace_haptic' through the onEvent
  // bridge when the slider position changes by at least one step (0.05).
  assert.match(exp, /'pace_haptic'/);
  assert.match(exp, /pace_haptic/, "pace_haptic event name appears in BreathingExperience");
  assert.match(exp, /paceHapticLastPosRef/, "tracks last emitted slider position");
  assert.match(exp, /paceHapticLastTimeRef/, "throttles to ~1 per 35 ms");
  assert.match(exp, /SLIDER_STEP/, "step threshold guard present");
  assert.match(exp, /navigator\.vibrate\?\.\(5\)/, "web vibrate fallback (gentle 5ms)");
});

test("mobile: index.tsx handles pace_haptic with Haptics.selectionAsync", () => {
  const idx = read("apps/mobile/src/app/index.tsx");
  assert.match(idx, /'pace_haptic'/);
  assert.match(idx, /Haptics\.selectionAsync\(\)\.catch/, "dispatches selection haptic for pace ticks");
});

test("mobile: session-progress dot rides the ring with angle math (cos/sin)", () => {
  // Visualizer receives sessionProgress and computes the dot position with trig.
  assert.match(viz, /sessionProgress/, "Visualizer accepts sessionProgress prop");
  assert.match(viz, /Math\.sin\(dotAngle\)/, "dot angle uses sin for x position");
  assert.match(viz, /Math\.cos\(dotAngle\)/, "dot angle uses cos for y position");
  assert.match(viz, /showDot/, "dot visibility gated on showDot");
  // The dot is a span inside the ring-border div.
  assert.match(viz, /Session-progress dot/, "dot element documented inside ring layer");
  // BreathingExperience computes session progress in the animate loop.
  assert.match(exp, /setSessionProgress/, "sessionProgress set in animate loop");
  assert.match(exp, /Date\.now\(\) - sessionClockStartRef\.current/, "wall-clock elapsed time");
  assert.match(exp, /selectedDuration/, "progress fraction uses selectedDuration");
  // progress prop stays at 0 (not rewired for per-phase progress).
  assert.match(exp, /progress=\{0\}/, "progress prop pinned to 0");
});

// ---------------------------------------------------------------------------
// DESKTOP — the website's resonance experience
// ---------------------------------------------------------------------------

const resonance = read("src/components/resonance/Resonance.tsx");
const desktopPb = read("src/components/resonance/components/ParticleBackground.tsx");

test("desktop: single speed slider — LEFT = slower, RIGHT = faster, default centered", () => {
  assert.match(resonance, /const \[speedMultiplier, setSpeedMultiplier\] = useState/);
  assert.match(resonance, /type="range"/);
  // Desktop imports the shared mapping from @resonance/domain — no inline definitions.
  assert.match(resonance, /import \{ multiplierToSlider, sliderToMultiplier \} from '@resonance\/domain'/,
    "desktop imports slider fns from shared domain package");
  // Still uses them at the call site (the contract pins the wiring, not the
  // definition location).
  assert.match(resonance, /value=\{multiplierToSlider\(speedMultiplier\)\}/);
  assert.match(resonance, /onChange=\{\(e\) => setSpeedMultiplier\(sliderToMultiplier\(parseFloat\(e\.target\.value\)\)\)/);
  assert.match(resonance, /step="0\.05"/, "0.05 step keeps the centered default on-grid");
  // Verify the mapping lives in the shared source.
  assert.match(sharedPacing, /multiplierToSlider = /, "shared source defines multiplierToSlider");
  assert.match(sharedPacing, /sliderToMultiplier = /, "shared source defines sliderToMultiplier");
});

test("desktop: speed scales the animation phases", () => {
  assert.match(resonance, /const inhaleDur = pattern\.inhale \* speedMultiplier \* 1000/);
  assert.match(resonance, /const exhaleDur = pattern\.exhale \* speedMultiplier \* 1000/);
});

test("desktop: session clock is wall-clock", () => {
  // The desktop ticks a 1s counter (never speed-scaled) and auto-stops on
  // wall seconds.
  assert.match(resonance, /setSessionSeconds\(s => \{\s*const next = s \+ 1;/,
    "timer increments 1s per tick");
  const stopLine = resonance.split("\n").find((l) => /sessionSeconds >= selectedDuration/.test(l));
  assert.ok(stopLine, "auto-stop condition exists");
  assert.doesNotMatch(stopLine, /speedMultiplier/, "30s stays 30s regardless of pace");
});

test("desktop: particle update() signature and call site stay aligned", () => {
  const sigIdx = desktopPb.indexOf("update(");
  const sig = desktopPb.slice(sigIdx, sigIdx + 160);
  assert.match(sig, /radialSpeed: number,/, "first param radialSpeed");
  assert.match(sig, /driftSpeed: number,/, "second param driftSpeed");
  assert.match(sig, /deltaTime: number,/, "third param deltaTime");
  // Call site spans multiple lines; assert arg order in the call block.
  const callIdx = desktopPb.indexOf("p.update(");
  const call = desktopPb.slice(callIdx, callIdx + 160);
  const first = call.indexOf("smoothedRadialSpeedRef.current");
  const second = call.indexOf("smoothedDriftSpeedRef.current");
  const third = call.indexOf("deltaSeconds");
  assert.ok(first >= 0 && second > first && third > second,
    "call site passes (radial, drift, deltaSeconds) in order");
});

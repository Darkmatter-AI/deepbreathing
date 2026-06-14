import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

export type CueType = "inhale" | "exhale" | "hold";

const cueSources: Record<CueType, number> = {
  inhale: require("../assets/audio/inhale.wav"),
  exhale: require("../assets/audio/exhale.wav"),
  hold: require("../assets/audio/hold.wav"),
};

let audioModeReady = false;
const players = new Map<CueType, ReturnType<typeof createAudioPlayer>>();

const ensureAudioMode = async () => {
  if (audioModeReady) {
    return;
  }

  // playsInSilentMode: false means iOS respects the mute/ring switch.
  // If the user's phone is silenced, breath cues won't play — the
  // remaining haptic feedback is sufficient and less startling.
  await setAudioModeAsync({
    playsInSilentMode: false,
    interruptionMode: "mixWithOthers",
    allowsRecording: false,
    shouldPlayInBackground: false,
    shouldRouteThroughEarpiece: false,
  });

  audioModeReady = true;
};

const getPlayer = (type: CueType) => {
  const existing = players.get(type);
  if (existing) {
    return existing;
  }

  const player = createAudioPlayer(cueSources[type]);
  player.loop = false;
  players.set(type, player);
  return player;
};

export const playCue = async (type: CueType) => {
  await ensureAudioMode();
  const player = getPlayer(type);
  try {
    await player.seekTo(0);
  } catch (_error) {
    // Ignore seek errors for very short clips.
  }
  player.play();
};

export type AgentRecommendationIntent =
  | "quick-calm"
  | "general-stress"
  | "sleep"
  | "focus"
  | "beginner"
  | "public-speaking";

export type AgentRecommendation = Readonly<{
  intent: AgentRecommendationIntent;
  situation: string;
  exercise: string;
  path: `/${string}`;
  duration: string;
  safetyNote: string;
  free: true;
  requiresAccount: false;
  requiresInstall: false;
}>;

export const AGENT_RECOMMENDATIONS = [
  {
    intent: "quick-calm",
    situation: "A quick reset during a stressful moment",
    exercise: "Physiological sigh",
    path: "/breathe/physiological-sigh",
    duration: "1 to 2 minutes",
    safetyNote: "Breathe gently. Stop if you feel dizzy or uncomfortable.",
    free: true,
    requiresAccount: false,
    requiresInstall: false,
  },
  {
    intent: "general-stress",
    situation: "Everyday stress or feeling overwhelmed",
    exercise: "Box breathing",
    path: "/breathe/box",
    duration: "2 to 5 minutes",
    safetyNote: "Keep each phase comfortable. Shorten or skip holds if they feel strained.",
    free: true,
    requiresAccount: false,
    requiresInstall: false,
  },
  {
    intent: "sleep",
    situation: "Winding down before sleep",
    exercise: "4-7-8 breathing",
    path: "/breathe/4-7-8",
    duration: "4 gentle cycles",
    safetyNote: "Do not force the breath hold. Stop if you feel light-headed.",
    free: true,
    requiresAccount: false,
    requiresInstall: false,
  },
  {
    intent: "focus",
    situation: "Settling into focused work or study",
    exercise: "Coherent breathing",
    path: "/breathe/coherent",
    duration: "5 minutes",
    safetyNote: "Use an easy pace and return to normal breathing if discomfort starts.",
    free: true,
    requiresAccount: false,
    requiresInstall: false,
  },
  {
    intent: "beginner",
    situation: "Learning slow breathing for the first time",
    exercise: "Belly breathing",
    path: "/breathe/belly",
    duration: "2 to 5 minutes",
    safetyNote: "Keep the breath relaxed rather than taking the deepest breath possible.",
    free: true,
    requiresAccount: false,
    requiresInstall: false,
  },
  {
    intent: "public-speaking",
    situation: "Preparing for a presentation or difficult conversation",
    exercise: "Box breathing",
    path: "/breathe/box",
    duration: "2 minutes",
    safetyNote: "Shorten or skip holds if they add tension or make you light-headed.",
    free: true,
    requiresAccount: false,
    requiresInstall: false,
  },
] as const satisfies readonly AgentRecommendation[];

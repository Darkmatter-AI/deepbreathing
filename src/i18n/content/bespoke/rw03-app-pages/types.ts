import boxBreathingAppSource from "./source/box-breathing-app.json";
import breathingAppSource from "./source/breathing-app.json";
import coherentBreathingAppSource from "./source/coherent-breathing-app.json";

export const RW03_APP_ROUTES = [
  "box-breathing-app",
  "breathing-app",
  "coherent-breathing-app",
] as const;

export type Rw03AppRoute = (typeof RW03_APP_ROUTES)[number];

export type Rw03AppContentLocale =
  | "de-de"
  | "es-es"
  | "fr-fr"
  | "ja-jp"
  | "pt-br";

type StringContent<T> = Readonly<{ [K in keyof T]: string }>;

export type BoxBreathingAppMessageId = keyof typeof boxBreathingAppSource;
export type BoxBreathingAppContent = StringContent<
  typeof boxBreathingAppSource
>;

export type BreathingAppMessageId = keyof typeof breathingAppSource;
export type BreathingAppContent = StringContent<typeof breathingAppSource>;

export type CoherentBreathingAppMessageId =
  keyof typeof coherentBreathingAppSource;
export type CoherentBreathingAppContent = StringContent<
  typeof coherentBreathingAppSource
>;

export interface Rw03AppContentByRoute {
  readonly "box-breathing-app": BoxBreathingAppContent;
  readonly "breathing-app": BreathingAppContent;
  readonly "coherent-breathing-app": CoherentBreathingAppContent;
}

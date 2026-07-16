import sourceContent from "./source.json";

export type TimerMessageId = keyof typeof sourceContent;

export type TimerPageContent = Readonly<
  Record<TimerMessageId, string>
>;

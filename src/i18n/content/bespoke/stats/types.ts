import sourceContent from "./source.json";

export type StatsMessageId = keyof typeof sourceContent;

export type StatsContent = Readonly<Record<StatsMessageId, string>>;

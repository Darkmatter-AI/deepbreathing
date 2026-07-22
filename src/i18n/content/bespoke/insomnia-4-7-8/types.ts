import sourceContent from "./source.json";

export type InsomniaMessageId = keyof typeof sourceContent;

export type InsomniaPageContent = Readonly<Record<InsomniaMessageId, string>>;

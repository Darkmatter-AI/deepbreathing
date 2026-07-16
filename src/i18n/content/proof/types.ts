export type ProofChromeMessageId = `chrome.${string}`;

export type ProofServerChromeMessages = Readonly<
  Record<ProofChromeMessageId, string>
>;

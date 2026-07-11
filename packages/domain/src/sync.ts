import type { SessionEvent, UserSettings } from "./sessions";

export interface SyncBootstrap {
  settings: UserSettings | null;
  sessionEvents: SessionEvent[];
  nextCursor: string | null;
  serverTime: string;
}

export interface SyncMutationEnvelope<TPayload> {
  idempotencyKey: string;
  clientTimestamp: string;
  payload: TPayload;
}

export interface SyncSessionEventsPayload {
  events: SessionEvent[];
}

export interface SyncSettingsPayload {
  settings: UserSettings;
}

export interface SyncResult {
  accepted: boolean;
  acceptedCount?: number;
  duplicateCount?: number;
  serverTime: string;
}

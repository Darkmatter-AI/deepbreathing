import type {
  EntitlementSnapshot,
  SessionEvent,
  SyncBootstrap,
  SyncMutationEnvelope,
  SyncResult,
  User,
  UserSettings,
} from "@resonance/domain";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INVALID_INPUT"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export interface ApiError {
  code: ApiErrorCode;
  message: string;
}

export interface ApiSuccess<T> {
  data: T;
  error: null;
}

export interface ApiFailure {
  data: null;
  error: ApiError;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface AuthSession {
  user: User;
  accessToken?: string;
  refreshToken?: string;
  expiresAt: string;
}

export interface AuthMagicLinkRequest {
  email: string;
  guestId?: string;
}

export interface AuthVerifyMagicLinkRequest {
  token: string;
  guestId?: string;
}

export interface AuthMergeGuestRequest {
  guestId: string;
}

export interface AuthLogoutRequest {
  allDevices?: boolean;
}

export interface FeatureFlagSnapshot {
  authEnabled: boolean;
  syncEnabled: boolean;
  entitlementsEnabled: boolean;
  premiumGatingEnabled: boolean;
  premiumPaywallEnabled: boolean;
  fetchedAt: string;
  ttlSeconds: number;
}

export type SyncSessionEventsRequest = SyncMutationEnvelope<{
  events: SessionEvent[];
}>;

export type SyncSessionEventsResponse = SyncResult;

export type SyncSettingsRequest = SyncMutationEnvelope<{
  settings: UserSettings;
}>;

export type SyncSettingsResponse = SyncResult;

export type SyncBootstrapResponse = SyncBootstrap;

export type EntitlementsResponse = EntitlementSnapshot;

export interface ApiContractV1 {
  "POST /api/v1/auth/magic-link/request": {
    request: AuthMagicLinkRequest;
    response: ApiResponse<{ accepted: true }>;
  };
  "POST /api/v1/auth/magic-link/verify": {
    request: AuthVerifyMagicLinkRequest;
    response: ApiResponse<AuthSession>;
  };
  "POST /api/v1/auth/merge-guest": {
    request: AuthMergeGuestRequest;
    response: ApiResponse<{ merged: true }>;
  };
  "POST /api/v1/auth/logout": {
    request: AuthLogoutRequest;
    response: ApiResponse<{ loggedOut: true }>;
  };
  "GET /api/v1/me": {
    request: undefined;
    response: ApiResponse<User>;
  };
  "GET /api/v1/entitlements": {
    request: undefined;
    response: ApiResponse<EntitlementsResponse>;
  };
  "GET /api/v1/sync/bootstrap": {
    request: undefined;
    response: ApiResponse<SyncBootstrapResponse>;
  };
  "POST /api/v1/sync/session-events": {
    request: SyncSessionEventsRequest;
    response: ApiResponse<SyncSessionEventsResponse>;
  };
  "PUT /api/v1/sync/settings": {
    request: SyncSettingsRequest;
    response: ApiResponse<SyncSettingsResponse>;
  };
  "GET /api/v1/feature-flags": {
    request: undefined;
    response: ApiResponse<FeatureFlagSnapshot>;
  };
}

export type Platform = "web" | "ios" | "android";

export type UserState = "guest" | "authenticated_free" | "authenticated_pro" | "authenticated_lapsed";

export interface User {
  id: string;
  email: string;
  createdAt: string;
  deletedAt?: string | null;
}

export interface UserIdentity {
  userId: string;
  provider: string;
  providerUserId: string;
  createdAt: string;
}

export interface GuestLink {
  guestId: string;
  userId: string;
  linkedAt: string;
}

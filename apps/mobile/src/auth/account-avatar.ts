import { AUTH_API_ORIGIN } from './auth-client';

interface AvatarUser {
  id?: string | null;
  email: string;
  image?: string | null;
}

export function accountAvatarUri(user: AvatarUser): string {
  if (user.image) return user.image;
  const seed = user.id || user.email.toLowerCase();
  return `${AUTH_API_ORIGIN}/avatar/${encodeURIComponent(seed)}?size=160&v=1`;
}

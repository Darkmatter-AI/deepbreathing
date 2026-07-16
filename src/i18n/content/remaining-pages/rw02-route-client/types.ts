export const RW02_ROUTE_CLIENT_ROUTES = [
  "/box-breathing-before-presentation",
  "/physiological-sigh-panic-attack",
] as const;

export type Rw02RouteClientRoute = (typeof RW02_ROUTE_CLIENT_ROUTES)[number];

export type Rw02RouteClientLocale =
  | "de-de"
  | "es-es"
  | "fr-fr"
  | "ja-jp"
  | "pt-br";

/**
 * Route-owned strings displayed by the post-session client banner.
 *
 * `justNow` is absent from the reviewed panic route contract. Consumers must
 * preserve the existing English value when it is not supplied.
 */
export interface ResonanceRouteClientMessages {
  readonly saveSessionAria: string;
  readonly closeAria: string;
  readonly title: string;
  readonly sessionComplete: string;
  readonly modeName: string;
  readonly justNow?: string;
  readonly continueWithGoogle: string;
  readonly oneTapNoPassword: string;
  readonly emailAddressAria: string;
  readonly emailPlaceholder: string;
  readonly sendLink: string;
  readonly saveWithEmail: string;
}

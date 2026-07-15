import type { LocaleCode } from "./index";
import type { NativeLinkMode, NativeRouteId } from "./route-manifest";
import type { ProofServerChromeMessages } from "./content/proof/types";

/**
 * The small, client-safe routing contract shared by a native localized page.
 * Long-form route content and server chrome remain separate server inputs.
 */
export interface NativeRouteRenderContext {
  readonly canonicalPath: string;
  readonly linkMode: NativeLinkMode;
  readonly locale: LocaleCode;
  readonly localizedRoutePaths: readonly string[];
  readonly routeId: NativeRouteId;
  readonly serverMessages?: ProofServerChromeMessages;
}

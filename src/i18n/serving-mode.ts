import type { NativeLinkMode } from "./route-manifest";

export const NATIVE_I18N_MODES = [
  "proxy",
  "native-preview",
  "native",
] as const;

export type NativeI18nMode = (typeof NATIVE_I18N_MODES)[number];

export function resolveNativeI18nMode(
  value: string | undefined = process.env.NATIVE_I18N_MODE,
): NativeI18nMode {
  const mode = value || "proxy";
  if ((NATIVE_I18N_MODES as readonly string[]).includes(mode)) {
    return mode as NativeI18nMode;
  }

  throw new Error(`Unsupported NATIVE_I18N_MODE: ${mode}`);
}

/** Proxy mode has no native route tree; the other modes map to link policy. */
export function getNativeLinkMode(
  mode: NativeI18nMode,
): NativeLinkMode | null {
  return mode === "proxy" ? null : mode;
}

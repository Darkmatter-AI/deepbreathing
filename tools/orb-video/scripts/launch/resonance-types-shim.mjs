// Runtime shim for `@/components/resonance/types`. The real module declares TS
// `enum`s, which Node's strip-only TS support can't execute. breathing-pages.ts
// only uses these enums for its `mode` field, which the launch generator never
// reads — so a Proxy that echoes the accessed key is a sufficient, install-free
// stand-in (the interfaces are type-only and erase to nothing).
const enumProxy = new Proxy({}, { get: (_t, k) => String(k) });
export const ModeName = enumProxy;
export const BreathingPhase = enumProxy;
export const ProtocolPhase = enumProxy;
export default enumProxy;

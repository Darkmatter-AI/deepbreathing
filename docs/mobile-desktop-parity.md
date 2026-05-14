# Mobile ↔ Desktop Parity (Resonance)

Goal: Keep the mobile app in sync with the desktop experience (excluding AI suggestions).

## In Scope (must match desktop)

### Modes & Protocols
- [x] Add Physiological Sigh mode.
- [x] Add Wim Hof protocol mode (rounds, power breaths, retention, recovery, rest).
- [x] Keep the same timings and labels as desktop.

### Protocol UI (Wim Hof)
- [x] Round + breath counters during power breath.
- [x] Retention timer + “End Hold” action when minimum retention met.
- [x] Recovery breath instruction and round transition cues.

### Audio System
- [ ] Replace stub cues with parity to desktop audio experience:
  - [ ] Continuous drone bed.
  - [ ] Phase cues (inhale/exhale/hold) with per‑mode tone/color profile.
  - [ ] Optional binaural/entrainment behavior (if kept in desktop).

### Settings / Controls
- [x] Session timer in settings.
- [x] Sound on/off.
- [x] Speed control (continuous slider, not discrete chips).
- [x] Duration controls with “Open” and fixed durations.
- [x] Lock/disable duration changes while running (match desktop behavior).

### Theme & Appearance
- [ ] Support theme preference (system/light/dark).
- [ ] Persist theme selection.
- [ ] Background variants (e.g., winter‑blue) if used on desktop.

### Visualizer Parity
- [ ] Match blob scale ranges and morph behavior.
- [x] Match ring behavior and opacity.
- [x] Background particle behavior (in/out + drift) aligned with desktop.
- [x] Session state text behavior (labels/instructions).

### Misc UX
- [ ] Settings access pattern should feel equivalent (sheet/drawer).
- [ ] Persisted settings and stats parity (total minutes, sessions completed).

## Explicitly Out of Scope (by request)
- AI suggestions / AI recommendation panel.

## Open Questions
- Confirm if desktop “snow background” should ship on mobile.
- Confirm whether desktop immersive mode is required on mobile.

## References
- Desktop app: `src/components/resonance/Resonance.tsx`
- Desktop particles: `src/components/resonance/components/ParticleBackground.tsx`
- Desktop visualizer: `src/components/resonance/components/Visualizer.tsx`
- Mobile app: `apps/resonance-mobile-app/app/index.tsx`
- Mobile engine: `packages/engine/src/*`

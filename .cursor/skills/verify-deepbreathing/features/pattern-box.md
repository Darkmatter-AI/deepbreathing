# Pattern page — Box breathing

Users can navigate to the Box breathing pattern page and start a session directly from there. The page presents the same interactive orb with pattern-specific stats and controls.

## Sub-features

- Pattern navigation to `/breathe/box`
- Start/pause from the orb on the pattern page
- Pattern-specific stats panel visible

## How to get to it (user POV)

- Visit `/breathe`, then choose “Box breathing”, or go directly to `/breathe/box`

## Driving it with Playwright

Preconditions:

- Local instance launched via this skill on `http://localhost:4317/`

- Start a Box breathing session and capture evidence:
  - `node .cursor/skills/verify-deepbreathing/bin/drive-visualizer.mjs --path /breathe/box --evidence box`
  - Observable result: role=button name becomes “Pause Session”; `document.body.dataset.resonanceRunning === "true"`

## Gotchas

- If a previous session is running, the orb already shows “Pause Session”; stop or reload before driving a fresh start

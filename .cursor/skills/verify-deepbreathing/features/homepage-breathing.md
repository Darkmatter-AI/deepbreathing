# Homepage breathing session

The user lands on the homepage and can start a breathing session by tapping the orb. The orb grows and the phase label updates; the session can be paused or stopped anytime.

## Sub-features

- Start session from the orb
- Pause session from the orb
- Session state reflected in `body[data-resonance-running]`

## How to get to it (user POV)

- Open `/` (homepage)
- Tap/click the animated orb

## Driving it with Playwright

Preconditions:

- Local instance launched via this skill on `http://localhost:4317/`

- Start session and assert running:
  - `node .cursor/skills/verify-deepbreathing/bin/drive-home-breathing.mjs`
  - Observable result: role=button name changes from “Start Session” to “Pause Session”; `document.body.dataset.resonanceRunning === "true"`

## Gotchas

- Initial client island hydration can take a moment; wait for the button with name “Start Session”
- Audio requires a user gesture in some browsers; the driver simulates a real click

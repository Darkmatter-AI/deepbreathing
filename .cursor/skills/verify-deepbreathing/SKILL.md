---
name: verify-deepbreathing
description: Verify the Deep Breathing Exercises Next.js web app locally — launch a private dev instance, doctor it, drive one breathing session, capture UI evidence, and cleanly tear it down. Use when you need proof the user path works on this checkout.
---

### Launch

- Surface: Next.js 15 web UI (local dev)
- Command:
  - `.cursor/skills/verify-deepbreathing/bin/launch.sh 4317`
  - Exports: `PORT=4317`, `NATIVE_I18N_MODE=proxy` (default), `BETTER_AUTH_URL=http://localhost:4317`
- Ready signal:
  - Script prints `ready http://localhost:4317`
  - `GET http://localhost:4317/` returns < 500
- Teardown: see Cleanup

### Doctor

- Purpose: read-only health check against the instance this skill started
- Command:
  - `node .cursor/skills/verify-deepbreathing/bin/doctor.mjs`
- Checks:
  - `run/dev.pid` exists and PID is alive
  - `/proc/<pid>/cmdline` contains “next ... dev”
  - `GET /` on `localhost:$PORT` returns < 500

### Drive

- Harness: Playwright (Chromium), ARIA-first selectors
- Mapped feature to drive: Homepage breathing session — start from the orb, assert running
- Commands:
  - Drive the homepage:
    - `node .cursor/skills/verify-deepbreathing/bin/drive-home-breathing.mjs`
  - Generic driver for any visualizer route:
    - `node .cursor/skills/verify-deepbreathing/bin/drive-visualizer.mjs --path /breathe/box --evidence box`
- Real selectors and observable state:
  - Start: role=button, name="Start Session"
  - Running: role=button, name="Pause Session" and `body[data-resonance-running="true"]`
  - These are emitted by `src/components/resonance/components/Visualizer.tsx` and `src/components/resonance/Resonance.tsx`

### Evidence

- What to capture:
  - Screenshot after starting the session
  - Full-page ARIA tree snapshot
- Where it goes:
  - Default directory (created on first run): `.cursor/skills/verify-deepbreathing/evidence/<ISO-timestamp>/`
  - Filenames:
    - Homepage: `homepage-start-session.png`, `homepage-start-session.aria.json`
    - Generic: `<stem>-start.png`, `<stem>-start.aria.json` (from `--evidence <stem>`)
- Proof standard:
  - Real user path on the running app (not a build artifact)
  - Action + resulting state (start → running)
  - Only mock at production boundaries (accounts/email/db). Guest breathing is fully local.

### Cleanup

- Never leave servers or ports running
- Command:
  - `.cursor/skills/verify-deepbreathing/bin/cleanup.sh`
- Behavior:
  - Kills only the PID recorded by this skill (verifies it is a Next dev server)
  - Clears `run/` state; preserves all evidence
- After cleanup:
  - Evidence remains under `.cursor/skills/verify-deepbreathing/evidence/`

### Helpers

- Launch: `.cursor/skills/verify-deepbreathing/bin/launch.sh` (executable)
- Doctor: `node .cursor/skills/verify-deepbreathing/bin/doctor.mjs`
- Drive (homepage): `node .cursor/skills/verify-deepbreathing/bin/drive-home-breathing.mjs`
- Drive (generic): `node .cursor/skills/verify-deepbreathing/bin/drive-visualizer.mjs --path /breathe/box --evidence box`
- Cleanup: `.cursor/skills/verify-deepbreathing/bin/cleanup.sh` (executable)

- Isolation:
  - Uses a dedicated dev `PORT` (default 4317)
  - Playwright runs with a unique user-data-dir per run under `.cursor/skills/verify-deepbreathing/profile/`
  - Refuses to double-drive a shared instance; only operates on the PID it started

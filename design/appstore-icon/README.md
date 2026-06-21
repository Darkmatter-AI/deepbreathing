# App icon + splash — brand orb (App Store)

These replace the default Expo placeholder icon. They are **rendered from the
real breathing orb** used for the YouTube content library, so the app icon is
identical to the brand asset people see on YouTube and on the website — same
rose orb, same cream/dark field, same organic morph, glow, ring, and specks.

## Provenance — not hand-drawn

Rendered as Remotion stills from the orb generator at
`../../../deepbreathing-orb-video/tools/orb-video` (the same tool that produces
the YouTube videos). Source of the look: `src/Orb.tsx` + `src/breathing.ts`.

- Orb color: **`#e11d48`** (rose) — the default brand color
- Light field: cream **`#fdf8f2`** with a radial vignette + soft rose glow
- Dark field: rose mixed toward near-black, stronger glow
- Frame: 360 (60fps) = mid-"Hold" of a box cycle → orb at full scale (a
  confident, full blob rather than mid-breath)
- Label text blanked (`labels: {Inhale:"",Hold:"",Exhale:""}`) — Apple icons
  carry no text
- Audio disabled for the still (`audioSrc: null`)

## Files

| File | Use | Notes |
|------|-----|-------|
| `icon-orb-dark.png` | **App icon — recommended** | Tight crop; glowing orb on near-black. Stands out in the icon grid, reads at small sizes. |
| `icon-orb-dark-wide.png` | Icon alt | Same, more glow margin around the orb. |
| `icon-orb-light.png` | Icon alt (cream) | On-brand cream. Risk: reads like a plain red disc at small sizes. |
| `icon-orb-light-wide.png` | Icon alt (cream) | More glow margin. |
| `splash-dark.png` / `splash-light.png` | Launch screen | Portrait 1242×2688, orb centered. |
| `render-props.icon-*.json` | Reproducibility | The exact Remotion props used. |

1024×1024, solid background (no alpha) — App Store ready. Pick one icon; the
others are options.

## Re-render / tweak

```bash
cd ../../../deepbreathing-orb-video/tools/orb-video
npm install   # first time (pulls Remotion + headless chromium)

# icon (square). Edit color/theme/frame in the props file or inline.
npx remotion still src/index.ts Breathing out/icon.png \
  --frame=360 --props=./props.icon-dark.json

# tighter crop (enlarge the orb) — macOS:
sips -c 760 760 out/icon.png --out out/icon-tight.png && sips -z 1024 1024 out/icon-tight.png
```

To shift the icon to a per-mode accent instead of rose, change `"color"` in the
props file (e.g. coherent/relax/sigh accents from the engine's
`BREATHING_PATTERNS`). To pick a different blob shape, change `--frame`.

## Wiring into the app (next step, on the app branch)

Drop the chosen PNG in as `apps/mobile/.../icon.png` (and the Expo icon set);
EAS derives all downstream sizes from the 1024. Splash goes in the
`expo-splash-screen` config. Bundle id for the webview ship target:
`com.deepbreathing.app`.

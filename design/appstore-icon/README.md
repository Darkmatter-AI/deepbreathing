# App Store Icon & Splash Concepts

Three icon concepts + two splash variants for Deep Breathing Exercises.  
**The final concept choice is Abi's call** — see descriptions below.

---

## Icon Concepts (1024 × 1024 SVG, no transparency)

### Concept A — Luminous Orb (`concept-a-luminous-orb.svg`)

A single glowing sphere on a deep-navy-to-soft-blue vertical gradient.  
The orb uses layered radial gradients with an off-center specular highlight for a 3D lit-from-above look, plus a bloom halo that bleeds into the background. This directly mirrors the app's signature visual and reads immediately at every size — the large orb fills the canvas confidently.

**Best for:** strong brand recall, immediately telegraphs "calming orb app".

---

### Concept B — Breathing Rings (`concept-b-breathing-rings.svg`)

Five concentric rings emanating from a lit central orb, on a near-black navy background.  
Ring opacity and stroke weight increase toward the center so the motif resolves clearly even at 60 × 60 px. The rings suggest the expand/contract cycle of a breathing session. The dark background makes the rings glow dramatically.

**Best for:** communicating the *interactive* breathing rhythm at a glance; distinctive silhouette in the App Store grid.

---

### Concept C — Breath Mark (`concept-c-breath-mark.svg`)

Two large opposing arcs (a bold, rounded "breath" swoosh) on a warm sky-blue gradient.  
The arcs form an abstract pair-of-lungs or inhale/exhale wave shape. A small dot sits at the midpoint — the still-point between breaths. The mark is thick and bold (62 px stroke) so it reads clearly at thumbnail size. The blue-gradient background is lighter and friendlier than A/B, which may help in the App Store against a sea of dark wellness icons.

**Best for:** standing out with a warmer, more distinctive silhouette; approachable / mindfulness-adjacent aesthetic.

---

## Splash Screens

| File | Background | Notes |
|------|-----------|-------|
| `splash-light.svg` | Cream `#fdf8f2` → `#f4ede2` | Matches app's light-mode canvas |
| `splash-dark.svg`  | Near-black navy `#07101f` → `#102840` | Matches app's dark-mode canvas; orb glow is more dramatic |

Both are 1242 × 2688 (iPhone 14 Pro Max logical resolution). Centered orb mark with a compact breathing ring and a light wordmark below.

---

## Export to PNG (1024 × 1024, no alpha)

Apple requires a **1024 × 1024 PNG with no transparency** for the App Store icon.

### Option 1 — rsvg-convert (Linux/macOS via Homebrew)

```bash
brew install librsvg   # one-time

# Convert each icon concept
for concept in concept-a-luminous-orb concept-b-breathing-rings concept-c-breath-mark; do
  rsvg-convert -w 1024 -h 1024 \
    "design/appstore-icon/${concept}.svg" \
    -o "design/appstore-icon/${concept}.png"
done
```

### Option 2 — ImageMagick (Homebrew)

```bash
brew install imagemagick   # one-time

for concept in concept-a-luminous-orb concept-b-breathing-rings concept-c-breath-mark; do
  magick -background white -density 300 \
    "design/appstore-icon/${concept}.svg" \
    -resize 1024x1024 \
    -flatten \
    "design/appstore-icon/${concept}.png"
done
```

### Option 3 — Node (sharp)

```bash
npm install -D sharp   # project-level, or global

node -e "
const sharp = require('sharp');
const concepts = [
  'concept-a-luminous-orb',
  'concept-b-breathing-rings',
  'concept-c-breath-mark',
];
const dir = 'design/appstore-icon';
Promise.all(concepts.map(c =>
  sharp(\`\${dir}/\${c}.svg\`)
    .resize(1024, 1024)
    .flatten({ background: '#ffffff' })
    .png()
    .toFile(\`\${dir}/\${c}.png\`)
)).then(() => console.log('Done'));
"
```

### Option 4 — Browser / Inkscape (no CLI tools)

Open each SVG in a browser, right-click → "Save as..." or use Inkscape:

```bash
inkscape --export-type=png \
  --export-filename="design/appstore-icon/concept-a-luminous-orb.png" \
  --export-width=1024 --export-height=1024 \
  "design/appstore-icon/concept-a-luminous-orb.svg"
```

---

## Generate the full iOS icon set from the chosen 1024 PNG

Once you have a chosen 1024 PNG, use one of these tools to generate all required sizes:

### `expo-community/expo-yarn-workspaces` or `react-native-community/react-native-asset`

Expo already reads `assets/images/icon.png` (1024 × 1024). Just replace that file:

```bash
cp design/appstore-icon/concept-a-luminous-orb.png assets/images/icon.png
```

Then `eas build` will automatically generate every required App Store icon size.

### Manually with ImageMagick

```bash
CHOSEN=design/appstore-icon/concept-a-luminous-orb.png
OUT=design/appstore-icon/ios-icon-set

mkdir -p "$OUT"

for SIZE in 20 29 40 58 60 76 80 87 120 152 167 180 1024; do
  magick "$CHOSEN" -resize "${SIZE}x${SIZE}" -flatten \
    "${OUT}/icon-${SIZE}.png"
done

echo "Generated icons in $OUT"
```

Required sizes for iOS (Universal): 20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024.

---

## Apple icon checklist

- [ ] 1024 × 1024 px, RGB colour space
- [ ] PNG, no alpha / transparency channel (`-flatten` or equivalent flattens to opaque)
- [ ] No rounded corners in the source (iOS applies the mask itself)
- [ ] No text required by Apple (all three concepts are text-free)
- [ ] No thin lines that vanish at small sizes (all concepts use thick strokes or large forms)

---

*Concept choice is Abi's call. All SVGs are hand-authored and editable — tweak colors, stroke weights, or gradient stops directly in the SVG before exporting.*

type Rgb = { r: number; g: number; b: number };

const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

const hexToRgb = (hex: string): Rgb => {
  const sanitized = hex.replace("#", "");
  const bigint = parseInt(sanitized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

const rgbToHex = ({ r, g, b }: Rgb) =>
  `#${[r, g, b]
    .map((value) => clamp(value).toString(16).padStart(2, "0"))
    .join("")}`;

const mix = (base: string, tint: string, amount: number) => {
  const a = hexToRgb(base);
  const b = hexToRgb(tint);
  return rgbToHex({
    r: a.r + (b.r - a.r) * amount,
    g: a.g + (b.g - a.g) * amount,
    b: a.b + (b.b - a.b) * amount,
  });
};

export type ModeTheme = {
  accent: string;
  backgroundFrom: string;
  backgroundTo: string;
  surface: string;
  surfaceAlt: string;
  surfaceBorder: string;
  text: string;
  muted: string;
  subtle: string;
  onAccent: string;
  particle: string;
};

export const createModeTheme = (accent: string): ModeTheme => {
  const cream = "#fbf6f2";
  const creamDeep = "#f4e9e2";
  return {
    accent,
    backgroundFrom: mix(cream, accent, 0.06),
    backgroundTo: mix(creamDeep, accent, 0.08),
    surface: mix("#ffffff", accent, 0.05),
    surfaceAlt: mix("#f7efe9", accent, 0.08),
    surfaceBorder: mix("#efe4dc", accent, 0.14),
    text: "#2a1d17",
    muted: "#7b6d65",
    subtle: "#a08f86",
    onAccent: "#fff8f4",
    particle: mix(accent, "#ffffff", 0.55),
  };
};

// OLED-friendly dark theme — true black background saves power and is gentler in a dark room.
export const createNightModeTheme = (accent: string): ModeTheme => {
  return {
    accent,
    backgroundFrom: "#000000",
    backgroundTo: "#060403",
    surface: "#0f0c0a",
    surfaceAlt: "#161210",
    surfaceBorder: "#2c2220",
    text: "#e0d8d4",
    muted: "#6b6260",
    subtle: "#4a4240",
    onAccent: "#fff8f4",
    particle: mix(accent, "#000000", 0.35),
  };
};

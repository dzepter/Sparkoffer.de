import type { Config } from "tailwindcss";

// Palette v2 (Navy / Off-White / Gold-Ocker) und Typografie kommen zentral
// aus dem Preset in @handel-offensiv/config (QUELLE: packages/config/src/tokens.ts).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const preset = require("@handel-offensiv/config/tailwind-preset.js") as Partial<Config>;

/** Expliziter LIGHT MODE (Briefing §56) – kein darkMode-Setup. */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [preset],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;

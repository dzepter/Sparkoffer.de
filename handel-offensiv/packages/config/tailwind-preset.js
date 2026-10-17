/**
 * Tailwind-Preset – Palette v2 (Navy / Off-White / Gold-Ocker).
 * QUELLE der Werte: src/tokens.ts (bewusst als JS gespiegelt, damit der
 * Tailwind-Loader keine Workspace-TS-Quellen aufloesen muss).
 * Verwendung: `presets: [require("@handel-offensiv/config/tailwind-preset")]`
 *
 * Kompatibilitaets-Aliasse (green*, dark*) bleiben, bis alle Klassen in
 * apps/admin auf navy/gold umbenannt sind (packages/ui, Phase 2).
 */
const colors = {
  navy: { DEFAULT: "#0F2340", deep: "#0A182E", soft: "#1B3A66" },
  paper: { DEFAULT: "#F6F4EE", deep: "#ECE9E1" },
  ink: { DEFAULT: "#141B26", soft: "#4F5866" },
  line: { DEFAULT: "#E2DFD6", dark: "#24395C" },
  gold: { DEFAULT: "#AD8027", deep: "#8A6414", bright: "#D9AE45" },
  success: "#2E7D4F",
  warning: "#985A07",
  danger: "#B03A2E",
  // Aliasse Palette v1
  // green.DEFAULT = goldBright: bestehende "bg-green text-dark"-Buttons behalten >= 4.5:1
  green: { DEFAULT: "#D9AE45", bright: "#D9AE45", deep: "#8A6414" },
  dark: { DEFAULT: "#0F2340", 2: "#1B3A66" },
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors,
      fontFamily: {
        sans: [
          "Archivo",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        DEFAULT: "2px",
        sm: "2px",
        pill: "999px",
      },
      letterSpacing: {
        kicker: "0.18em",
      },
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },
    },
  },
};

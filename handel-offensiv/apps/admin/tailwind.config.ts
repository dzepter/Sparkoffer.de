import type { Config } from "tailwindcss";

/**
 * Farb- und Typografie-Werte sind aus den zentralen Design Tokens gespiegelt:
 * QUELLE: packages/config/src/tokens.ts (@handel-offensiv/config).
 * Bei Aenderungen dort bitte hier nachziehen (bewusst gespiegelt statt
 * importiert, damit der Tailwind-Config-Loader keine Workspace-TS-Quellen
 * aufloesen muss).
 *
 * Expliziter LIGHT MODE (Briefing §56) – kein darkMode-Setup.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        green: {
          DEFAULT: "#A8C62B", // tokens.colors.green
          bright: "#C5E33C", // tokens.colors.greenBright
          deep: "#5F7A10", // tokens.colors.greenDeep – Text auf hellem Grund
        },
        dark: {
          DEFAULT: "#12160E", // tokens.colors.dark
          2: "#181D13", // tokens.colors.dark2
        },
        paper: "#F7F6F1", // tokens.colors.paper
        ink: {
          DEFAULT: "#131711", // tokens.colors.ink
          soft: "#454B42", // tokens.colors.inkSoft
        },
        line: {
          DEFAULT: "#E3E3D8", // tokens.colors.line
          dark: "#2A2F26", // tokens.colors.lineDark
        },
        success: "#3E7A34", // tokens.colors.success
        warning: "#B07C10", // tokens.colors.warning
        danger: "#B03A2E", // tokens.colors.danger
      },
      fontFamily: {
        // Archivo lokal gebuendelt (public/fonts, DSGVO) mit System-Fallback
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
        DEFAULT: "2px", // tokens.radius.base – bewusst kantig
        sm: "2px",
        pill: "999px",
      },
      letterSpacing: {
        kicker: "0.18em", // tokens.typography.kicker.letterSpacing
      },
      minHeight: {
        touch: "44px", // tokens.touch.minTarget
      },
      minWidth: {
        touch: "44px",
      },
    },
  },
  plugins: [],
};

export default config;

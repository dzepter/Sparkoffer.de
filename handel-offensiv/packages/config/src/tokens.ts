/**
 * Handel Offensiv Design Tokens.
 * Quelle: Aigner-Offensiv-Website (aigner-offensiv/assets/css/style.css).
 * Die App verwendet bewusst einen expliziten Light Mode (Briefing §56):
 * hochwertig, erwachsen, ruhig – kein halbherziger System-Dark-Mode.
 */

export const colors = {
  /** Markengrün – Flächen, primäre Aktionen (Text darauf: dark) */
  green: "#A8C62B",
  /** Helles Grün – Akzente auf dunklem Grund */
  greenBright: "#C5E33C",
  /** Nahezu-Schwarz mit Grünstich – dunkle Flächen, Header */
  dark: "#12160E",
  /** Aufgehellte dunkle Fläche – Karten auf dunklem Grund */
  dark2: "#181D13",
  /** Warmes Off-White – Seitengrund */
  paper: "#F7F6F1",
  /** Reines Weiß – Karten auf hellem Grund */
  white: "#FFFFFF",
  /** Primäre Textfarbe */
  ink: "#131711",
  /** Sekundäre Textfarbe */
  inkSoft: "#454B42",
  /** Hairlines und Rahmen auf hellem Grund */
  line: "#E3E3D8",
  /** Hairlines auf dunklem Grund */
  lineDark: "#2A2F26",
  /** Grün mit ausreichendem Kontrast für Text auf hellem Grund */
  greenDeep: "#5F7A10",
  /** Semantik – unabhängig vom Markenakzent */
  success: "#3E7A34",
  warning: "#B07C10",
  danger: "#B03A2E",
} as const;

export const typography = {
  /** Archivo wird lokal gebündelt (kein Google-Fonts-CDN, DSGVO). */
  family: "Archivo",
  familyFallback: "System",
  /** Modulnummern 01–05, Hero-Zahlen */
  display: { fontSize: 56, fontWeight: "800" as const, letterSpacing: -0.5 },
  h1: { fontSize: 28, fontWeight: "800" as const },
  h2: { fontSize: 22, fontWeight: "700" as const },
  h3: { fontSize: 17, fontWeight: "700" as const },
  body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 24 },
  small: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  /** Eyebrow-Label, VERSAL mit Letterspacing */
  kicker: { fontSize: 12, fontWeight: "700" as const, letterSpacing: 1.8 },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  /** Bewusst kantig – 2px wie auf der Website */
  base: 2,
  pill: 999,
} as const;

export const motion = {
  /** Reduzierte, ruhige Bewegungen; prefers-reduced-motion respektieren */
  fast: 150,
  base: 250,
  slow: 400,
} as const;

export const touch = {
  /** Mindestgröße für Touch-Targets (Accessibility §36) */
  minTarget: 44,
} as const;
